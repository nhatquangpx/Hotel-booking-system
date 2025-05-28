const {check, validationResult} = require('express-validator');
const Hotel = require('../models/Hotel');

exports.hotelValidation = [

    check('name', 'Tên khách sạn không được để trống').notEmpty(),
    check('owner', 'ID chủ sở hữu không hợp lệ').isMongoId(),
    check('description', 'Mô tả không được để trống').notEmpty(),
    check('address.number', 'Số nhà không được để trống').notEmpty(),
    check('address.street', 'Tên đường không được để trống').notEmpty(),
    check('address.city', 'Tên thành phố không được để trống').notEmpty(),
    check('contactInfo.phone', 'Số điện thoại không hợp lệ').notEmpty(),
    check('contactInfo.email', 'Email không hợp lệ').isEmail(),
    check('starRating', 'Đánh giá sao phải là số từ 1-5').isInt({ min: 1, max: 5 }),
    check('policies.cancellationPolicy', 'Chính sách hủy phòng không được để trống').notEmpty(),
    check('images', 'Phải có ít nhất một hình ảnh').optional().isArray({ min: 1 }),
    check('status', 'Trạng thái không hợp lệ').optional().isIn(['active', 'inactive', 'maintenance'])
];

exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    next();
};
