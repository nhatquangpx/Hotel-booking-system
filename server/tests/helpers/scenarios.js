const { attachPaymentProof } = require("./upload");

async function createGuestBooking(
  guestAgent,
  { hotelId, roomId, checkInDate, checkOutDate, paymentMethod = "qr_code", specialRequests }
) {
  return guestAgent.post("/api/guest/bookings").send({
    hotel: hotelId,
    room: roomId,
    checkInDate,
    checkOutDate,
    paymentMethod,
    specialRequests,
  });
}

async function reportQrPayment(guestAgent, bookingId) {
  const req = guestAgent
    .post("/api/payment/qr/confirm-payment")
    .field("bookingId", bookingId);
  return attachPaymentProof(req);
}

async function ownerConfirmPaid(ownerAgent, bookingId) {
  return ownerAgent
    .put(`/api/owner/bookings/${bookingId}/status`)
    .send({ status: "paid" });
}

async function createPaidQrBooking(guestAgent, ownerAgent, data, options = {}) {
  const {
    checkInOffset = 7,
    nights = 2,
    roomId = data.roomIdDeluxe,
    paymentMethod = "qr_code",
  } = options;
  const dates = data.futureStayDates({ checkInOffset, nights });

  const createRes = await createGuestBooking(guestAgent, {
    hotelId: data.hotelId,
    roomId,
    checkInDate: dates.checkInDate,
    checkOutDate: dates.checkOutDate,
    paymentMethod,
  });
  expect(createRes.status).toBe(201);

  const bookingId = createRes.body._id;
  const qrRes = await reportQrPayment(guestAgent, bookingId);
  expect(qrRes.status).toBe(200);

  const paidRes = await ownerConfirmPaid(ownerAgent, bookingId);
  expect(paidRes.status).toBe(200);

  return bookingId;
}

module.exports = {
  createGuestBooking,
  reportQrPayment,
  ownerConfirmPaid,
  createPaidQrBooking,
};
