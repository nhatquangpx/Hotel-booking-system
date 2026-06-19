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
    roomApi.getOwnerRoomEquipment({ hotelId: req.params.hotelId, ownerId: req.user.id })
  );

exports.postOwnerRoomEquipment = (req, res) =>
  runService(res, () =>
    roomApi.postOwnerRoomEquipment({
      roomId: req.params.roomId,
      ownerId: req.user.id,
      body: req.body,
    })
  );

exports.patchOwnerRoomEquipment = (req, res) =>
  runService(res, () =>
    roomApi.patchOwnerRoomEquipment({
      roomId: req.params.roomId,
      equipmentId: req.params.equipmentId,
      ownerId: req.user.id,
      body: req.body,
    })
  );

exports.deleteOwnerRoomEquipment = (req, res) =>
  runService(res, () =>
    roomApi.deleteOwnerRoomEquipment({
      roomId: req.params.roomId,
      equipmentId: req.params.equipmentId,
      ownerId: req.user.id,
    })
  );

exports.getStaffRoomEquipment = (req, res) =>
  runService(res, () => roomApi.getStaffRoomEquipment({ staffId: req.user.id }));

exports.postStaffRoomEquipment = (req, res) =>
  runService(res, () =>
    roomApi.postStaffRoomEquipment({
      roomId: req.params.roomId,
      staffId: req.user.id,
      body: req.body,
    })
  );

exports.patchStaffRoomEquipment = (req, res) =>
  runService(res, () =>
    roomApi.patchStaffRoomEquipment({
      roomId: req.params.roomId,
      equipmentId: req.params.equipmentId,
      staffId: req.user.id,
      body: req.body,
    })
  );

exports.deleteStaffRoomEquipment = (req, res) =>
  runService(res, () =>
    roomApi.deleteStaffRoomEquipment({
      roomId: req.params.roomId,
      equipmentId: req.params.equipmentId,
      staffId: req.user.id,
    })
  );

exports.postStaffEquipmentRepairRequest = (req, res) =>
  runService(res, () => roomApi.postStaffEquipmentRepairRequest({ req }));

exports.getOwnerRoomBookings = (req, res) =>
  runService(res, () =>
    roomApi.getOwnerRoomBookings({ ownerId: req.user.id, roomId: req.params.id })
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
