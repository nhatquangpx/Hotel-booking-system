const roomApi = require("../services/rooms/roomApiService");
const { runService } = require("../lib/http/controllerHelper");

exports.getRoomsByHotel = (req, res) =>
  runService(res, () => roomApi.getRoomsByHotel({ req, hotelId: req.params.hotelId }));

exports.getRoomById = (req, res) =>
  runService(res, () => roomApi.getRoomById({ req, id: req.params.id }));

exports.createRoom = (req, res) => runService(res, () => roomApi.createRoom({ req }));

exports.updateRoom = (req, res) =>
  runService(res, () => roomApi.updateRoom({ req, id: req.params.id }));

exports.deleteRoom = (req, res) =>
  runService(res, () => roomApi.deleteRoom({ req, id: req.params.id }));

exports.getOwnerRoomEquipment = (req, res) =>
  runService(res, () =>
    roomApi.roomEquipmentService.getOwnerRoomEquipmentForHotel(req.params.hotelId, req.user.id).then(
      (body) => ({ status: 200, body })
    )
  );

exports.postOwnerRoomEquipment = (req, res) =>
  runService(res, () =>
    roomApi.roomEquipmentService
      .postOwnerRoomEquipment(req.params.roomId, req.user.id, req.body)
      .then((body) => ({ status: 201, body }))
  );

exports.patchOwnerRoomEquipment = (req, res) =>
  runService(res, () =>
    roomApi.roomEquipmentService
      .patchOwnerRoomEquipment(req.params.roomId, req.params.equipmentId, req.user.id, req.body)
      .then((body) => ({ status: 200, body }))
  );

exports.deleteOwnerRoomEquipment = (req, res) =>
  runService(res, () =>
    roomApi.roomEquipmentService
      .deleteOwnerRoomEquipment(req.params.roomId, req.params.equipmentId, req.user.id)
      .then((body) => ({ status: 200, body }))
  );

exports.getStaffRoomEquipment = (req, res) =>
  runService(res, () =>
    roomApi.roomEquipmentService.getStaffRoomEquipmentForHotel(req.user.id).then((body) => ({
      status: 200,
      body,
    }))
  );

exports.postStaffRoomEquipment = (req, res) =>
  runService(res, () =>
    roomApi.roomEquipmentService
      .postStaffRoomEquipment(req.params.roomId, req.user.id, req.body)
      .then((body) => ({ status: 201, body }))
  );

exports.patchStaffRoomEquipment = (req, res) =>
  runService(res, () =>
    roomApi.roomEquipmentService
      .patchStaffRoomEquipment(req.params.roomId, req.params.equipmentId, req.user.id, req.body)
      .then((body) => ({ status: 200, body }))
  );

exports.deleteStaffRoomEquipment = (req, res) =>
  runService(res, () =>
    roomApi.roomEquipmentService
      .deleteStaffRoomEquipment(req.params.roomId, req.params.equipmentId, req.user.id)
      .then((body) => ({ status: 200, body }))
  );

exports.postStaffEquipmentRepairRequest = (req, res) =>
  runService(res, () => roomApi.postStaffEquipmentRepairRequest({ req }));

exports.getOwnerRoomBookings = (req, res) =>
  runService(res, () =>
    roomApi.bookingService
      .getBookingsByRoomForOwner(req.user.id, req.params.id)
      .then((body) => ({ status: 200, body }))
  );

exports.getStaffRooms = (req, res) => runService(res, () => roomApi.getStaffRooms({ req }));

exports.updateStaffRoomStatus = (req, res) =>
  runService(res, () =>
    roomApi.updateStaffRoomStatus({ req, id: req.params.id, roomStatus: req.body?.roomStatus })
  );

exports.postOwnerEquipmentRepairRequest = (req, res) =>
  runService(res, () =>
    roomApi.postOwnerEquipmentRepairRequest({ req, hotelId: req.params.hotelId })
  );
