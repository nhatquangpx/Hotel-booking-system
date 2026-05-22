const mongoose = require('mongoose');
const User = require('../models/User.js');
const Hotel = require('../models/Hotel.js');
const bcrypt = require('bcryptjs');
const { isValidObjectId } = require('../utils/mongooseIds');
const {
    syncStaffHotelAssignment,
    removeStaffFromAllHotels,
    enrichUserWithStaffHotel,
    enrichUsersWithStaffHotels,
    findHotelByStaffId,
    assertHotelExists,
    assertStaffNotInOtherHotel,
    assignStaffToHotel,
} = require('../utils/staffHotel');
const selfProfileService = require('../services/users');
const { profileIdsMatch } = require('../utils/selfProfile');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        const enriched = await enrichUsersWithStaffHotels(users);
        res.status(200).json(enriched);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách người dùng!', error: err.message });
    }
}

exports.getUserById = async (req, res) => {
    try {
        const userId = req.params.id || req.user?.id;
        const profile = await selfProfileService.getProfileById(userId);
        res.status(200).json(profile);
    } catch (err) {
        const status = err.status || 500;
        res.status(status).json({
            message: err.message || 'Lỗi khi lấy thông tin người dùng!',
            ...(status === 500 && { error: err.message }),
        });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { name, email, password, phone, role, status, assignedHotelId } = req.body;
        if (!name || !email || !password || !phone) {
            return res.status(400).json({ message: 'Không được để trống các trường bắt buộc!' });
        }

        // Kiểm tra email và phone trùng lặp
        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ message: 'Email đã được sử dụng!' });
            }
            if (existingUser.phone === phone) {
                return res.status(400).json({ message: 'Số điện thoại đã được sử dụng!' });
            }
        }

        // Validate role
        const validRoles = ['guest', 'admin', 'owner', 'staff'];
        const userRole = role || 'guest';
        if (!validRoles.includes(userRole)) {
            return res.status(400).json({ message: 'Role không hợp lệ!' });
        }

        if (userRole === 'staff' && !assignedHotelId) {
            return res.status(400).json({ message: 'Nhân viên phải được gán một khách sạn' });
        }

        if (userRole === 'staff') {
            try {
                await assertHotelExists(assignedHotelId);
            } catch (e) {
                const status = e.status || 400;
                return res.status(status).json({ message: e.message || 'Khách sạn không hợp lệ' });
            }
        }

        const saltRound = 10; // Số lần băm mật khẩu
        const hashedPassword = await bcrypt.hash(password, saltRound); 

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            role: userRole,
            status: status || "active",
        });
        await newUser.save();

        try {
            await syncStaffHotelAssignment({
                userId: newUser._id,
                nextRole: userRole,
                hotelId: assignedHotelId,
                currentRole: null,
            });
        } catch (syncErr) {
            await User.findByIdAndDelete(newUser._id);
            const status = syncErr.status || 500;
            return res.status(status).json({
                message: syncErr.message || 'Không thể gán nhân viên vào khách sạn',
                error: syncErr.message,
            });
        }

        const saved = await enrichUserWithStaffHotel(
            await User.findById(newUser._id).select('-password')
        );
        console.log(`Đã tạo user thành công: ${newUser._id} (${newUser.email}) với role ${newUser.role}`);
        res.status(201).json({ message: 'Người dùng đã được tạo thành công!', user: saved });
    }
    catch (err) {
        const status = err.status || 500;
        res.status(status).json({
            message: err.message || 'Lỗi khi tạo người dùng!',
            error: err.message,
        });
    }
}
exports.updateUser = async (req, res) => {
    try {
        // Lấy userId từ params hoặc từ req.user (khi là owner/admin update profile của chính mình)
        const userId = req.params.id || req.user?.id;
        
        if (!userId) {
            return res.status(400).json({ message: 'ID người dùng không được cung cấp!' });
        }
        
        if (!isValidObjectId(userId)) {
            return res.status(400).json({ message: 'ID người dùng không hợp lệ!' });
        }

        if (req.body.status && !['active', 'inactive'].includes(req.body.status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ!' });
        }

        delete req.body.wishlist;

        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(404).json({ message: 'Người dùng không tồn tại!' });
        }

        const nextRole = req.body.role ?? existingUser.role;
        if (req.body.role && !['guest', 'admin', 'owner', 'staff'].includes(req.body.role)) {
            return res.status(400).json({ message: 'Role không hợp lệ!' });
        }

        const staffHotelId = req.body.assignedHotelId;
        const updatePayload = { ...req.body };
        delete updatePayload.assignedHotelId;

        if (Object.prototype.hasOwnProperty.call(updatePayload, 'password')) {
            const raw = updatePayload.password;
            if (raw === undefined || raw === null || String(raw).trim() === '') {
                delete updatePayload.password;
            } else {
                const plain = String(raw);
                if (plain.length < 6) {
                    return res.status(400).json({
                        message: 'Mật khẩu phải có ít nhất 6 ký tự',
                    });
                }
                updatePayload.password = await bcrypt.hash(plain, 10);
            }
        }

        let currentStaffHotelId = null;
        if (existingUser.role === 'staff') {
            const h = await findHotelByStaffId(existingUser._id);
            currentStaffHotelId = h?._id;
        }

        const hotelIdForStaff = staffHotelId ?? currentStaffHotelId;
        const previousStaffHotelId = currentStaffHotelId;

        if (nextRole === 'staff') {
            if (!hotelIdForStaff) {
                return res.status(400).json({ message: 'Nhân viên phải được gán một khách sạn' });
            }
            try {
                await assertHotelExists(hotelIdForStaff);
                await assertStaffNotInOtherHotel(userId, hotelIdForStaff);
                await syncStaffHotelAssignment({
                    userId,
                    nextRole: 'staff',
                    hotelId: hotelIdForStaff,
                    currentRole: existingUser.role,
                });
            } catch (e) {
                const status = e.status || 400;
                return res.status(status).json({
                    message: e.message || 'Không thể gán nhân viên vào khách sạn',
                    error: e.message,
                });
            }
        }

        let updatedUser;
        try {
            updatedUser = await User.findByIdAndUpdate(userId, updatePayload, { new: true })
                .select('-password');
        } catch (updateErr) {
            if (nextRole === 'staff') {
                if (existingUser.role !== 'staff') {
                    await removeStaffFromAllHotels(userId);
                } else if (previousStaffHotelId) {
                    await assignStaffToHotel(userId, previousStaffHotelId);
                } else {
                    await removeStaffFromAllHotels(userId);
                }
            }
            throw updateErr;
        }

        if (!updatedUser) {
            if (nextRole === 'staff') {
                if (existingUser.role !== 'staff') {
                    await removeStaffFromAllHotels(userId);
                } else if (previousStaffHotelId) {
                    await assignStaffToHotel(userId, previousStaffHotelId);
                } else {
                    await removeStaffFromAllHotels(userId);
                }
            }
            return res.status(404).json({ message: 'Người dùng không tồn tại!' });
        }

        if (nextRole !== 'staff' && existingUser.role === 'staff') {
            try {
                await syncStaffHotelAssignment({
                    userId: updatedUser._id,
                    nextRole,
                    hotelId: null,
                    currentRole: 'staff',
                });
            } catch (demoteErr) {
                await removeStaffFromAllHotels(userId);
                throw demoteErr;
            }
        }

        const enriched = await enrichUserWithStaffHotel(updatedUser);

        console.log(`Đã cập nhật user thành công: ${userId}`);
        res.status(200).json(enriched);
    } catch (err) {
        const status = err.status || 500;
        res.status(status).json({
            message: err.message || 'Lỗi khi cập nhật thông tin người dùng!',
            error: err.message,
        });
    }
}

exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!isValidObjectId(userId)) {
            return res.status(400).json({ message: 'ID người dùng không hợp lệ!' });
        }

        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).json({ message: 'Người dùng không tồn tại!' });
        }

        if (deletedUser.role === 'staff') {
            await removeStaffFromAllHotels(deletedUser._id);
        }

        console.log(`Đã xóa user thành công: ${userId}`);
        res.status(200).json({ message: 'Người dùng đã được xóa thành công!' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi xóa người dùng!', error: err.message });
    }
}

function assertSelfProfileRole(req, role) {
  return req.user?.role === role;
}

function assertGuestProfileTarget(req) {
  return profileIdsMatch(req.params?.id, req.user?.id || req.user?._id);
}

async function respondSelfProfileUpdate(req, res) {
  try {
    const profile = await selfProfileService.updateSelfProfile(req.user.id, req.body);
    return res.status(200).json(profile);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      message: err.message || 'Lỗi khi cập nhật thông tin người dùng!',
      ...(status === 500 && { error: err.message }),
    });
  }
}

async function respondSelfPasswordChange(req, res, userId) {
  try {
    const result = await selfProfileService.changeUserPassword(userId, {
      currentPassword: req.body?.currentPassword,
      newPassword: req.body?.newPassword,
    });
    console.log(`Đã đổi mật khẩu thành công cho user ${userId}`);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Error in self profile changePassword:', err);
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Có lỗi xảy ra khi thay đổi mật khẩu',
    });
  }
}

exports.getOwnerProfile = async (req, res) => {
  if (!assertSelfProfileRole(req, 'owner')) {
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  }
  return exports.getUserById(req, res);
};

exports.updateOwnerProfile = async (req, res) => {
  if (!assertSelfProfileRole(req, 'owner')) {
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  }
  return respondSelfProfileUpdate(req, res);
};

exports.changeOwnerPassword = async (req, res) => {
  if (!assertSelfProfileRole(req, 'owner')) {
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  }
  return respondSelfPasswordChange(req, res, req.user.id);
};

exports.getAdminProfile = async (req, res) => {
  if (!assertSelfProfileRole(req, 'admin')) {
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  }
  return exports.getUserById(req, res);
};

exports.updateAdminProfile = async (req, res) => {
  if (!assertSelfProfileRole(req, 'admin')) {
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  }
  return respondSelfProfileUpdate(req, res);
};

exports.changeAdminPassword = async (req, res) => {
  if (!assertSelfProfileRole(req, 'admin')) {
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  }
  return respondSelfPasswordChange(req, res, req.user.id);
};

exports.getGuestProfile = async (req, res) => {
  if (!assertGuestProfileTarget(req)) {
    return res.status(403).json({ message: 'Không có quyền truy cập hồ sơ này' });
  }
  if (!assertSelfProfileRole(req, 'guest')) {
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  }
  return exports.getUserById(req, res);
};

exports.updateGuestProfile = async (req, res) => {
  if (!assertGuestProfileTarget(req)) {
    return res.status(403).json({ message: 'Không có quyền cập nhật hồ sơ này' });
  }
  if (!assertSelfProfileRole(req, 'guest')) {
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  }
  return respondSelfProfileUpdate(req, res);
};

exports.changeGuestPassword = async (req, res) => {
  if (!assertGuestProfileTarget(req)) {
    return res.status(403).json({ message: 'Không có quyền đổi mật khẩu hồ sơ này' });
  }
  if (!assertSelfProfileRole(req, 'guest')) {
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  }
  return respondSelfPasswordChange(req, res, req.params.id);
};

exports.getStaffProfile = async (req, res) => {
  if (!assertSelfProfileRole(req, 'staff')) {
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  }
  return exports.getUserById(req, res);
};

exports.updateStaffProfile = async (req, res) => {
  if (!assertSelfProfileRole(req, 'staff')) {
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  }
  return respondSelfProfileUpdate(req, res);
};

exports.changeStaffPassword = async (req, res) => {
  if (!assertSelfProfileRole(req, 'staff')) {
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  }
  return respondSelfPasswordChange(req, res, req.user.id);
};

exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('wishlist');
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại!' });
    }
    const hotels = (user.wishlist || []).filter((h) => h && h._id);
    res.status(200).json({ hotels });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách yêu thích!', error: err.message });
  }
};

exports.toggleWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { hotelId } = req.params;

    if (!isValidObjectId(hotelId)) {
      return res.status(400).json({ message: 'ID khách sạn không hợp lệ!' });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Khách sạn không tồn tại!' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại!' });
    }

    if (!Array.isArray(user.wishlist)) {
      user.wishlist = [];
    }

    const hid = new mongoose.Types.ObjectId(hotelId);
    const wasIn = user.wishlist.some((id) => id.equals(hid));

    if (wasIn) {
      user.wishlist = user.wishlist.filter((id) => !id.equals(hid));
    } else {
      user.wishlist.push(hid);
    }
    await user.save();

    res.status(200).json({ wishlisted: !wasIn });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi cập nhật danh sách yêu thích!', error: err.message });
  }
};