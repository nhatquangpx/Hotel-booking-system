const HOTEL_STATUSES = ["active", "inactive", "maintenance"];

const HOTEL_STATUS_LABELS = {
  active: "Hoạt động",
  inactive: "Dừng hoạt động",
  maintenance: "Bảo trì",
};

function getHotelStatusLabel(status) {
  return HOTEL_STATUS_LABELS[status] || status || "Không xác định";
}

/** Khách có thể tìm phòng / đặt phòng khi KS đang hoạt động. */
function isGuestBookableHotelStatus(status) {
  return status === "active" || !status;
}

module.exports = {
  HOTEL_STATUSES,
  HOTEL_STATUS_LABELS,
  getHotelStatusLabel,
  isGuestBookableHotelStatus,
};
