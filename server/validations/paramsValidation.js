const { param } = require("express-validator");
const { validate, mongoIdParam } = require("./common");

const idParamValidation = [mongoIdParam("id"), validate];

const userIdParamValidation = [mongoIdParam("id", "ID người dùng"), validate];

const userIdRouteParamValidation = [mongoIdParam("userId", "ID người dùng"), validate];

const hotelIdParamValidation = [mongoIdParam("hotelId", "hotelId"), validate];

const roomIdParamValidation = [mongoIdParam("id", "ID phòng"), validate];

const roomIdParamAltValidation = [mongoIdParam("roomId", "roomId"), validate];

const bookingIdParamValidation = [mongoIdParam("id", "ID đặt phòng"), validate];

const equipmentIdParamValidation = [
  mongoIdParam("roomId", "roomId"),
  mongoIdParam("equipmentId", "equipmentId"),
  validate,
];

module.exports = {
  validate,
  idParamValidation,
  userIdParamValidation,
  userIdRouteParamValidation,
  hotelIdParamValidation,
  roomIdParamValidation,
  roomIdParamAltValidation,
  bookingIdParamValidation,
  equipmentIdParamValidation,
};
