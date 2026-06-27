const mongoose = require("mongoose");
const Booking = require("../../models/Booking");
const Room = require("../../models/Room");
const {
  isTransactionUnsupportedError,
  isTransientTransactionError,
} = require("../../lib/db/mongoTransaction");
const { buildBookingConflictQuery } = require("./core");

const roomLockChains = new Map();
const MAX_TRANSACTION_RETRIES = 3;

/**
 * Serialize booking creation per room trong cùng tiến trình Node
 * (fallback khi MongoDB không hỗ trợ transaction).
 */
function withRoomBookingLock(roomId, fn) {
  const key = String(roomId);
  const previous = roomLockChains.get(key) || Promise.resolve();

  const current = previous
    .catch(() => {})
    .then(() => fn())
    .finally(() => {
      if (roomLockChains.get(key) === current) {
        roomLockChains.delete(key);
      }
    });

  roomLockChains.set(key, current);
  return current;
}

function createUnavailableError() {
  const err = new Error("Phòng không khả dụng cho đặt chỗ");
  err.statusCode = 400;
  return err;
}

/**
 * Kiểm tra xung đột và lưu đơn trong cùng một critical section.
 * Ghi vào document Room để transaction đồng thời phải serialize theo phòng.
 */
async function reserveOnce({ roomId, bookingDoc, session = null }) {
  const room = await Room.findOneAndUpdate(
    { _id: roomId, roomStatus: "active" },
    { $inc: { bookingReservationSeq: 1 } },
    { session, new: true }
  );

  if (!room) {
    throw createUnavailableError();
  }

  const conflictQuery = buildBookingConflictQuery(
    roomId,
    bookingDoc.checkInDate,
    bookingDoc.checkOutDate
  );
  let conflictLookup = Booking.findOne(conflictQuery);
  if (session) {
    conflictLookup = conflictLookup.session(session);
  }
  const conflict = await conflictLookup;
  if (conflict) {
    throw createUnavailableError();
  }

  const booking = new Booking(bookingDoc);
  await booking.save({ session: session || undefined });
  return booking;
}

function createTransactionContentionError(cause) {
  const err = new Error("TRANSACTION_CONTENTION");
  err.isTransactionContention = true;
  err.cause = cause;
  return err;
}

async function reserveWithTransaction({ roomId, bookingDoc }) {
  let lastError;

  for (let attempt = 0; attempt < MAX_TRANSACTION_RETRIES; attempt += 1) {
    const session = await mongoose.startSession();
    try {
      let saved;
      await session.withTransaction(async () => {
        saved = await reserveOnce({ roomId, bookingDoc, session });
      });
      return saved;
    } catch (err) {
      lastError = err;
      if (isTransientTransactionError(err) && attempt < MAX_TRANSACTION_RETRIES - 1) {
        continue;
      }
      if (isTransientTransactionError(err)) {
        throw createTransactionContentionError(err);
      }
      throw err;
    } finally {
      session.endSession();
    }
  }

  throw createTransactionContentionError(lastError);
}

/**
 * Tạo đơn đặt phòng an toàn trước race condition khi nhiều khách đặt cùng phòng.
 * Production: ưu tiên MongoDB transaction (replica set / Atlas).
 * Test / standalone: khóa theo phòng trong process + reserveOnce.
 */
function reserveSerialized({ roomId, bookingDoc }) {
  return withRoomBookingLock(roomId, () =>
    reserveOnce({ roomId, bookingDoc, session: null })
  );
}

async function reserveRoomBooking({ roomId, bookingDoc }) {
  if (process.env.MONGODB_DISABLE_TRANSACTIONS === "1") {
    return reserveSerialized({ roomId, bookingDoc });
  }

  try {
    return await reserveWithTransaction({ roomId, bookingDoc });
  } catch (err) {
    if (isTransactionUnsupportedError(err) || err.isTransactionContention) {
      return reserveSerialized({ roomId, bookingDoc });
    }
    throw err;
  }
}

module.exports = {
  reserveRoomBooking,
  withRoomBookingLock,
};
