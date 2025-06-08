const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Chỉ admin mới có quyền thực hiện!" });
    }
    next();
};

const isOwner = (req, res, next) => {
    if (!req.user || req.user.role !== 'owner') {
        return res.status(403).json({ message: "Chỉ chủ sở hữu mới có quyền thực hiện!" });
    }
    next();
};

const isGuest = (req, res, next) => {
    if (!req.user || req.user.role !== 'guest') {
        return res.status(403).json({ message: "Chỉ khách hàng mới có quyền thực hiện!" });
    }
    next();
};

module.exports = { 
    isAdmin,
    isOwner,
    isGuest
}; 