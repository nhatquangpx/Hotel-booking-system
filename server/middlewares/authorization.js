const ROLE_LABELS = {
    guest: "Khách hàng",
    admin: "Quản trị viên",
    owner: "Chủ khách sạn",
    staff: "Nhân viên khách sạn",
};

const getRoleLabel = (role) => ROLE_LABELS[role] || role || "Không xác định";

const denyWrongRole = (res, requiredRole, req) => {
    const currentRole = req.user?.role;
    const message = currentRole
        ? `Bạn đang đăng nhập với vai trò "${getRoleLabel(currentRole)}". Trang này chỉ dành cho "${getRoleLabel(requiredRole)}".`
        : `Trang này chỉ dành cho "${getRoleLabel(requiredRole)}". Vui lòng đăng nhập đúng loại tài khoản.`;

    return res.status(403).json({
        message,
        code: "WRONG_ROLE",
        currentRole: currentRole || null,
        requiredRole,
    });
};

const requireRole = (requiredRole) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            message: "Vui lòng đăng nhập để tiếp tục.",
            code: "UNAUTHENTICATED",
        });
    }
    if (req.user.role !== requiredRole) {
        return denyWrongRole(res, requiredRole, req);
    }
    next();
};

const isAdmin = requireRole("admin");
const isOwner = requireRole("owner");
const isGuest = requireRole("guest");
const isStaff = requireRole("staff");

module.exports = {
    isAdmin,
    isOwner,
    isGuest,
    isStaff,
};
