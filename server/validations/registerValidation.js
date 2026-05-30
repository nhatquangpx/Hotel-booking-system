const {check, validationResult} = require('express-validator');

exports.registerValidation = [
    check('name','Tên không được để trống').notEmpty(),
    check('email','Email không hợp lệ').isEmail(),
    check('password','Mật khẩu phải có ít nhất 6 ký tự').isLength({min: 6}),
    check('phone','Số điện thoại không hợp lệ').isMobilePhone(),
]

exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
}

