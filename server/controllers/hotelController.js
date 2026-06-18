const hotelService = require("../services/hotels");
const { runService } = require("../lib/http/controllerHelper");

exports.getAllHotels = (req, res) =>
  runService(res, () =>
    hotelService.getAllHotels({
      req,
      city: req.query.city,
      starRating: req.query.starRating,
      page: req.query.page,
      limit: req.query.limit,
      all: req.query.all,
      searchName: req.query.searchName,
      searchAddress: req.query.searchAddress,
      searchPhone: req.query.searchPhone,
    })
  );

exports.getGuestHotelCities = (req, res) =>
  runService(res, () => hotelService.getGuestHotelCities());

exports.getHotelById = (req, res) =>
  runService(res, () => hotelService.getHotelById({ req, id: req.params.id }));

exports.getHotelsByOwner = (req, res) =>
  runService(res, () => hotelService.getHotelsByOwner({ ownerId: req.user.id }));

exports.createHotel = (req, res) =>
  runService(res, () => hotelService.createHotel({ req }));

exports.updateHotel = (req, res) =>
  runService(res, () => hotelService.updateHotel({ req, id: req.params.id }));

exports.deleteHotel = (req, res) =>
  runService(res, () => hotelService.deleteHotel({ id: req.params.id }));

exports.getAllOwners = (req, res) =>
  runService(res, () => hotelService.getAllOwners({ userRole: req.user.role }));

exports.getFeaturedHotels = (req, res) =>
  runService(res, () => hotelService.getFeaturedHotels({ req }));

exports.getHotelByFilter = (req, res) =>
  runService(res, () => hotelService.getHotelByFilter({ req, filters: req.query }));

exports.getOwnerHotelMaintenanceContact = (req, res) =>
  runService(res, () =>
    hotelService.getOwnerHotelMaintenanceContact({
      hotelId: req.params.hotelId,
      ownerId: req.user.id,
    })
  );

exports.updateOwnerHotelMaintenanceContact = (req, res) =>
  runService(res, () =>
    hotelService.updateOwnerHotelMaintenanceContact({
      hotelId: req.params.hotelId,
      ownerId: req.user.id,
      maintenanceContactEmail: req.body?.maintenanceContactEmail,
    })
  );

exports.getStaffHotelMaintenanceContact = (req, res) =>
  runService(res, () => hotelService.getStaffHotelMaintenanceContact({ hotel: req.hotel }));
