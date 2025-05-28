const {check, validationResult} = require('express-validator');
const Room = require('../models/Room');

exports.roomValidation = [

    check('hotel', 'ID khách sạn không hợp lệ').isMongoId(),
    check('name', 'Tên phòng không được để trống').notEmpty(),
    check('description', 'Mô tả không được để trống').notEmpty(),
    check('type', 'Loại phòng không hợp lệ').isIn(['single', 'double', 'family', 'vip']),
    check('price.regular', 'Giá phòng phải là số dương').isFloat({ min: 0 }),
    check('price.discount', 'Giá giảm phải là số dương hoặc bằng 0').optional().isFloat({ min: 0 }),
    check('images', 'Phải có ít nhất một hình ảnh').optional().isArray({ min: 1 }),
    check('status', 'Trạng thái không hợp lệ').optional().isIn(['available', 'booked', 'maintenance'])
];

exports.roomStatusValidation = [
    check('status', 'Trạng thái không hợp lệ').isIn(['available', 'booked', 'maintenance'])
];

exports.roomPriceValidation = [
    check('price.regular', 'Giá phòng phải là số dương').isFloat({ min: 0 }),
    check('price.discount', 'Giá giảm phải là số dương hoặc bằng 0').optional().isFloat({ min: 0 })
];

exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    next();
};
