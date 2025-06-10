const {check, validationResult} = require('express-validator');
const Room = require('../models/Room');

exports.roomValidation = [
    check('hotelId', 'ID khách sạn không hợp lệ').isMongoId(),
    check('name', 'Tên phòng không được để trống').notEmpty(),
    check('roomNumber', 'Số phòng không được để trống').notEmpty(),
    check('description', 'Mô tả không được để trống').notEmpty(),
    check('type', 'Loại phòng không hợp lệ').isIn(['standard', 'deluxe', 'suite', 'family', 'executive']),
    check('price', 'Giá phòng phải là số dương').isFloat({ min: 0 }),
    check('maxPeople', 'Số người tối đa phải là số dương').isInt({ min: 1 }),
    check('quantity', 'Số lượng phòng phải là số dương').isInt({ min: 1 }),
    check('facilities', 'Tiện nghi phòng không hợp lệ').optional().isArray(),
    check('status', 'Trạng thái không hợp lệ').optional().isIn(['available', 'booked', 'maintenance'])
];

exports.roomStatusValidation = [
    check('status', 'Trạng thái không hợp lệ').isIn(['available', 'booked', 'maintenance'])
];

exports.roomPriceValidation = [
    check('price', 'Giá phòng phải là số dương').isFloat({ min: 0 })
];

exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    next();
};
