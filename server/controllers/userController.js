const mongoose = require('mongoose');
const User = require('../models/User.js');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách người dùng!', error: err.message });
    }
}

exports.getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'ID người dùng không hợp lệ!' });
        }

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại!' });
        }

        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi lấy thông tin người dùng!', error: err.message });
    }
}

exports.createUser = async (req, res) => {
    try {
        const { name, email, password, phone, role, status} = req.body;
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
        const validRoles = ['guest', 'admin', 'owner'];
        const userRole = role || 'guest';
        if (!validRoles.includes(userRole)) {
            return res.status(400).json({ message: 'Role không hợp lệ!' });
        }

        const saltRound = 10; // Số lần băm mật khẩu
        const hashedPassword = await bcrypt.hash(password, saltRound); 

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            role: userRole,
            status: status || "active"
        });
        await newUser.save();
        console.log(`Đã tạo user thành công: ${newUser._id} (${newUser.email}) với role ${newUser.role}`);
        res.status(201).json({ message: 'Người dùng đã được tạo thành công!', user: newUser });
    }
    catch (err) {
        res.status(500).json({ message: 'Lỗi khi tạo người dùng!', error: err.message });
    }
}
exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'ID người dùng không hợp lệ!' });
        }

        if (req.body.status && !['active', 'inactive'].includes(req.body.status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ!' });
        }

        const updatedUser = await User.findByIdAndUpdate(userId, req.body, { new: true }).select('-password');
        if (!updatedUser) {
            return res.status(404).json({ message: 'Người dùng không tồn tại!' });
        }

        console.log(`Đã cập nhật user thành công: ${userId}`);
        res.status(200).json(updatedUser);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi cập nhật thông tin người dùng!', error: err.message });
    }
}

exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'ID người dùng không hợp lệ!' });
        }

        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).json({ message: 'Người dùng không tồn tại!' });
        }

        console.log(`Đã xóa user thành công: ${userId}`);
        res.status(200).json({ message: 'Người dùng đã được xóa thành công!' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi xóa người dùng!', error: err.message });
    }
}

exports.changePassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới'
      });
    }

    // Kiểm tra độ dài mật khẩu mới
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    // Tìm user trong database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra mật khẩu hiện tại
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác'
      });
    }

    // Kiểm tra mật khẩu mới không được trùng với mật khẩu cũ
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới không được trùng với mật khẩu cũ'
      });
    }

    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu mới
    user.password = hashedPassword;
    await user.save();

    console.log(`Đã đổi mật khẩu thành công cho user ${userId}`);
    // Trả về thông báo thành công
    return res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });

  } catch (error) {
    console.error('Error in changePassword:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi thay đổi mật khẩu'
    });
  }
};