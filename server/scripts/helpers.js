const bcrypt = require("bcryptjs");

const ROOM_TYPES = ["standard", "deluxe", "suite", "family", "executive"];

const ROOM_TYPE_META = {
  standard: { price: 450000, maxPeople: 2, label: "Phòng Standard" },
  deluxe: { price: 750000, maxPeople: 2, label: "Phòng Deluxe" },
  suite: { price: 1200000, maxPeople: 3, label: "Phòng Suite" },
  family: { price: 950000, maxPeople: 4, label: "Phòng Family" },
  executive: { price: 1500000, maxPeople: 2, label: "Phòng Executive" },
};

const VIETNAMESE_FIRST_NAMES = [
  "An", "Bình", "Chi", "Dung", "Giang", "Hà", "Hùng", "Khánh", "Lan", "Minh",
  "Nam", "Ngọc", "Phúc", "Quân", "Thảo", "Trang", "Tuấn", "Uyên", "Vân", "Yến",
];

const VIETNAMESE_LAST_NAMES = [
  "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng",
  "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý", "Đinh", "Trương", "Cao", "Mai",
];

const CITIES = [
  { city: "Hà Nội", streets: ["Phố Huế", "Lê Duẩn", "Trần Hưng Đạo", "Nguyễn Trãi"] },
  { city: "TP. Hồ Chí Minh", streets: ["Nguyễn Huệ", "Lê Lợi", "Pasteur", "Cách Mạng Tháng 8"] },
  { city: "Đà Nẵng", streets: ["Bạch Đằng", "Trần Phú", "Nguyễn Văn Linh", "Lê Duẩn"] },
  { city: "Nha Trang", streets: ["Trần Phú", "Yersin", "Lê Thánh Tôn", "Biệt Thự"] },
  { city: "Huế", streets: ["Lê Lợi", "Phạm Ngũ Lão", "Võ Văn Kiệt", "Nguyễn Huệ"] },
  { city: "Đà Lạt", streets: ["Trần Hưng Đạo", "Phan Đình Phùng", "3 Tháng 2", "Hoàng Văn Thụ"] },
  { city: "Phú Quốc", streets: ["Trần Hưng Đạo", "30/4", "Nguyễn Trung Trực", "Đường Bãi Trường"] },
  { city: "Hội An", streets: ["Cửa Đại", "Lý Thường Kiệt", "Trần Hưng Đạo", "Nguyễn Thái Học"] },
  { city: "Vũng Tàu", streets: ["Thùy Vân", "Trần Phú", "Hoàng Hoa Thám", "Lê Hồng Phong"] },
  { city: "Cần Thơ", streets: ["3/2", "Mậu Thân", "Nguyễn Văn Cừ", "Hai Bà Trưng"] },
];

const HOTEL_PREFIXES = [
  "StayJourney", "Sunrise", "Golden", "Royal", "Saigon", "Heritage", "Ocean", "Mountain",
  "Paradise", "Luxury", "Green", "Blue", "Silver", "Diamond", "Pearl", "Star",
];

const HOTEL_SUFFIXES = [
  "Hotel", "Resort", "Inn", "Suites", "Boutique", "Plaza", "Grand", "Palace",
];

const FACILITIES = [
  "WiFi", "Điều hòa", "TV", "Minibar", "Ban công", "Bồn tắm", "Tủ lạnh", "Két sắt",
  "Bàn làm việc", "Ấm siêu tốc",
];

const REVIEW_COMMENTS = [
  "Phòng sạch sẽ, nhân viên thân thiện. Sẽ quay lại lần sau.",
  "Vị trí thuận tiện, view đẹp. Bữa sáng khá đa dạng.",
  "Giá hợp lý so với chất lượng. Check-in nhanh gọn.",
  "Giường êm, không gian yên tĩnh. Hơi ồn vào buổi tối.",
  "Dịch vụ tốt nhở mức trung bình khá. Cần cải thiện wifi.",
  "Rất hài lòng với trải nghiệm lần này. Cảm ơn đội ngũ khách sạn!",
  "Phòng rộng rãi, phù hợp đi cùng gia đình.",
  "Nhân viên hỗ trợ nhiệt tình khi cần thêm khăn và gối.",
  "Khách sạn mới, thiết kế hiện đại. Parking hơi chật.",
  "Trải nghiệm tuyệt vời, đặc biệt là khu hồ bơi.",
];

function vnDateKey(d = new Date()) {
  return new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function ymdToDate(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function pickMany(arr, count) {
  const copy = [...arr];
  const result = [];
  for (let i = 0; i < count && copy.length > 0; i += 1) {
    const idx = randomInt(0, copy.length - 1);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

function randomVnName() {
  const last = pickOne(VIETNAMESE_LAST_NAMES);
  const first = pickOne(VIETNAMESE_FIRST_NAMES);
  const middle = pickOne(VIETNAMESE_FIRST_NAMES);
  return `${last} ${middle} ${first}`;
}

function uniquePhone(index) {
  const suffix = String(1000000 + index).slice(-7);
  return `09${suffix}`;
}

function uniqueEmail(role, index) {
  return `${role}${index}@stayjourney-seed.test`;
}

function randomHotelName(city) {
  return `${pickOne(HOTEL_PREFIXES)} ${pickOne(HOTEL_SUFFIXES)} ${city.split(" ").pop()}`;
}

function randomAddress() {
  const loc = pickOne(CITIES);
  return {
    number: String(randomInt(1, 999)),
    street: pickOne(loc.streets),
    city: loc.city,
  };
}

function generateTransactionRef(bookingId, index) {
  const suffix = String(bookingId).slice(-6);
  const timePart = String(Date.now() + index).slice(-10);
  const randomPart = String(randomInt(0, 9999)).padStart(4, "0");
  return `${suffix}${timePart}${randomPart}`.slice(0, 20);
}

function datesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function formatYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

module.exports = {
  ROOM_TYPES,
  ROOM_TYPE_META,
  FACILITIES,
  REVIEW_COMMENTS,
  CITIES,
  vnDateKey,
  addDays,
  ymdToDate,
  randomInt,
  pickOne,
  pickMany,
  shuffle,
  hashPassword,
  randomVnName,
  uniquePhone,
  uniqueEmail,
  randomHotelName,
  randomAddress,
  generateTransactionRef,
  datesOverlap,
  formatYmd,
};
