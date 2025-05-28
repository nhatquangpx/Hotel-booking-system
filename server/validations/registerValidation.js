const {check, validationResult} = require('express-validator');

exports.registerValidation = [
    check('username', 'Tên đăng nhập phải có ít nhất 5 ký tự').isLength({ min: 5 }),
    check('username', 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới').matches(/^[a-zA-Z0-9_]+$/),
    check('email', 'Email không hợp lệ').isEmail(),
    check('password', 'Mật khẩu phải có ít nhất 8 ký tự').isLength({ min: 8 }),
    check('password', 'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
    check('fullName', 'Họ tên không được để trống').notEmpty(),
    check('phone', 'Số điện thoại không hợp lệ').isMobilePhone('vi-VN'),
    check('role', 'Vai trò không hợp lệ').optional().isIn(['user', 'admin', 'staff']),
    check('address.number', 'Số nhà không được để trống').optional().notEmpty(),
    check('address.street', 'Tên đường không được để trống').optional().notEmpty(),
    check('address.city', 'Tên thành phố không được để trống').optional().notEmpty()
];

exports.loginValidation = [
    check('username', 'Tên đăng nhập không được để trống').notEmpty(),
    check('password', 'Mật khẩu không được để trống').notEmpty()
];

exports.changePasswordValidation = [
    check('currentPassword', 'Mật khẩu hiện tại không được để trống').notEmpty(),
    check('newPassword', 'Mật khẩu mới phải có ít nhất 8 ký tự').isLength({ min: 8 }),
    check('newPassword', 'Mật khẩu mới phải chứa ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
];

exports.updateProfileValidation = [
    check('fullName', 'Họ tên không được để trống').optional().notEmpty(),
    check('phone', 'Số điện thoại không hợp lệ').optional().isMobilePhone('vi-VN'),
    check('address.number', 'Số nhà không được để trống').optional().notEmpty(),
    check('address.street', 'Tên đường không được để trống').optional().notEmpty(),
    check('address.city', 'Tên thành phố không được để trống').optional().notEmpty()
];

exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Lỗi validation đăng ký/đăng nhập:', errors.array());
      return res.status(422).json({ errors: errors.array() });
    }
    next();
};
  