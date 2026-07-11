const ExcelJS = require('exceljs');

const COLORS = {
  title: 'FF1F4E79',
  headerBg: 'FF2E75B6',
  sectionBg: 'FFD9E2F3',
  border: 'FFB4C6E7',
  altRow: 'FFF8FAFC',
  noteBg: 'FFFFF8E7',
};

const thinBorder = {
  top: { style: 'thin', color: { argb: COLORS.border } },
  left: { style: 'thin', color: { argb: COLORS.border } },
  bottom: { style: 'thin', color: { argb: COLORS.border } },
  right: { style: 'thin', color: { argb: COLORS.border } },
};

function styleHeaderRow(row, headers) {
  headers.forEach((text, i) => {
    const cell = row.getCell(i + 1);
    cell.value = text;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.headerBg },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = thinBorder;
  });
  row.height = 42;
}

function styleSectionTitle(ws, rowNum, colSpan, text) {
  ws.mergeCells(rowNum, 1, rowNum, colSpan);
  const cell = ws.getCell(rowNum, 1);
  cell.value = text;
  cell.font = { bold: true, size: 12, color: { argb: COLORS.title } };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.sectionBg },
  };
  cell.border = thinBorder;
}

function applyAltFill(cell, idx) {
  if (idx % 2 === 1) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.altRow },
    };
  }
}

function writeNotesBlock(ws, startRow, colSpan, title, notes) {
  let row = startRow;
  styleSectionTitle(ws, row, colSpan, title);
  row += 1;

  for (const line of notes) {
    ws.mergeCells(row, 1, row, colSpan);
    const cell = ws.getCell(row, 1);
    cell.value = line;
    cell.font = { size: 10, color: { argb: 'FF333333' } };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.noteBg },
    };
    cell.border = thinBorder;
    ws.getRow(row).height = 28;
    row += 1;
  }
  return row;
}

const OVERVIEW_NOTES = [
  '• Cách tính doanh thu: mỗi đơn đã thanh toán được chia đều theo số đêm lưu trú. Ví dụ đơn 4 đêm / 4.000.000đ → mỗi đêm cộng 1.000.000đ vào đúng ngày khách ở.',
  '• Doanh thu kỳ: tổng tiền các đêm khách ở trong khoảng ngày báo cáo (không tính theo ngày tạo đơn).',
  '• Số đơn có khách ở: số đơn đã thanh toán mà có ít nhất 1 đêm nằm trong kỳ báo cáo.',
  '• Số đêm đã bán: tổng số đêm phòng có khách trong kỳ (1 phòng × 1 đêm = 1 đêm đã bán).',
  '• Tỷ lệ phòng có khách (%): số đêm đã bán ÷ (số phòng đang mở × số ngày trong kỳ) × 100. Càng cao = phòng càng đầy.',
  '• Giá TB mỗi đêm đã bán: doanh thu ÷ số đêm đã bán — cho biết trung bình khách trả bao nhiêu cho 1 đêm.',
  '• Doanh thu TB mỗi phòng/ngày: doanh thu ÷ (số phòng đang mở × số ngày) — gồm cả đêm phòng trống; dùng để xem hiệu quả kinh doanh tổng thể.',
  '• Đơn đặt mới trong ngày: số đơn khách tạo vào ngày đó (theo dõi xu hướng đặt phòng). Cột “đã thanh toán / đã hủy” là trạng thái hiện tại của các đơn đó.',
];

const ROOM_TYPE_NOTES = [
  '• Bảng này giúp so sánh từng loại phòng: loại nào bán được nhiều đêm, mang lại nhiều tiền, và đóng góp bao nhiêu % tổng doanh thu.',
  '• Tỷ lệ phòng có khách: tính riêng cho loại phòng đó (chỉ tính các phòng thuộc loại đang xem).',
  '• Giá TB mỗi đêm đã bán: doanh thu loại phòng ÷ số đêm đã bán của loại đó.',
  '• Doanh thu TB mỗi phòng/ngày: doanh thu loại phòng ÷ (số phòng đang mở của loại × số ngày kỳ).',
  '• Tỷ lệ đóng góp doanh thu (%): doanh thu loại phòng ÷ tổng doanh thu tất cả loại × 100.',
];

/**
 * @param {object} payload — kết quả buildReportPayload
 * @param {{ title: string, fromStr: string, toStr: string }} meta
 */
async function buildReportExcelBuffer(payload, meta) {
  const wb = new ExcelJS.Workbook();
  wb.created = new Date();
  wb.creator = 'Hotel Booking System';

  const ws = wb.addWorksheet('Tổng quan', {
    properties: { defaultRowHeight: 19 },
    views: [{ showGridLines: true }],
  });

  ws.columns = [
    { width: 14 },
    { width: 18 },
    { width: 16 },
    { width: 16 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
  ];

  let row = 1;

  ws.mergeCells(`A${row}:H${row}`);
  const title = ws.getCell(`A${row}`);
  title.value = 'Báo cáo kinh doanh khách sạn';
  title.font = { bold: true, size: 16, color: { argb: COLORS.title } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(row).height = 32;
  row += 1;

  ws.mergeCells(`A${row}:H${row}`);
  const sub = ws.getCell(`A${row}`);
  sub.value =
    'Doanh thu tính theo từng đêm khách ở (đơn đã thanh toán) — dễ theo dõi hiệu quả bán phòng';
  sub.font = { italic: true, size: 11, color: { argb: 'FF5A5A5A' } };
  sub.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  ws.getRow(row).height = 24;
  row += 1;

  const metaRows = [
    ['Từ ngày', meta.fromStr, 'Đến ngày', meta.toStr],
    ['Khách sạn', payload.hotelLabel, 'Số ngày trong kỳ', payload.daysInRange],
  ];
  for (const line of metaRows) {
    for (let c = 0; c < 4; c += 1) {
      const cell = ws.getCell(row, c + 1);
      cell.value = line[c] ?? '';
      cell.border = thinBorder;
      if (c === 0 || c === 2) {
        cell.font = { bold: true, color: { argb: 'FF333333' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: COLORS.sectionBg },
        };
      }
    }
    row += 1;
  }

  row += 1;
  styleSectionTitle(ws, row, 8, '1. Tổng hợp trong kỳ');
  row += 1;

  const kpiHeaders = [
    'Tổng số phòng',
    'Phòng đang mở',
    'Doanh thu (VNĐ)',
    'Số đơn có khách ở',
    'Số đêm đã bán',
    'Tỷ lệ phòng có khách (%)',
    'Giá TB mỗi đêm đã bán (VNĐ)',
    'Doanh thu TB mỗi phòng/ngày (VNĐ)',
  ];
  styleHeaderRow(ws.getRow(row), kpiHeaders);
  row += 1;

  const kpiVals = [
    payload.totalRooms,
    payload.activeRooms,
    payload.totalRevenue,
    payload.bookingCount,
    payload.totalRoomNightsSold,
    payload.occupancyRate,
    payload.adr,
    payload.revpar,
  ];
  const kpiRow = ws.getRow(row);
  kpiVals.forEach((val, i) => {
    const cell = kpiRow.getCell(i + 1);
    cell.border = thinBorder;
    cell.alignment = {
      vertical: 'middle',
      horizontal: i <= 1 || i === 3 || i === 4 ? 'center' : 'right',
    };
    cell.value = val;
    if (i === 2 || i === 6 || i === 7) cell.numFmt = '#,##0';
    if (i === 5) cell.numFmt = '0.0';
  });
  row += 2;

  styleSectionTitle(
    ws,
    row,
    8,
    '2. Chi tiết từng ngày — doanh thu theo đêm khách ở & xu hướng đặt phòng'
  );
  row += 1;

  const dailyHeaders = [
    'Ngày',
    'Doanh thu trong ngày (VNĐ)',
    'Số đơn có khách ở',
    'Số đêm đã bán',
    'Giá TB mỗi đêm (VNĐ)',
    'Đơn đặt mới',
    'Trong đó đã thanh toán',
    'Trong đó đã hủy',
  ];
  const freezeRow = row;
  styleHeaderRow(ws.getRow(row), dailyHeaders);
  row += 1;

  (payload.daily || []).forEach((d, idx) => {
    const dr = ws.getRow(row);
    const cells = [
      d.dateLabel,
      d.revenue,
      d.bookingsCreated,
      d.roomNights,
      d.adr,
      d.newBookings,
      d.newPaidBookings,
      d.newCancelledBookings,
    ];
    cells.forEach((val, i) => {
      const cell = dr.getCell(i + 1);
      cell.border = thinBorder;
      applyAltFill(cell, idx);
      cell.value = val;
      if (i === 1 || i === 4) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right' };
      } else {
        cell.alignment = { horizontal: 'center' };
      }
    });
    row += 1;
  });

  row += 1;
  writeNotesBlock(ws, row, 8, 'Chú thích — cách đọc các cột', OVERVIEW_NOTES);

  ws.views = [
    {
      state: 'frozen',
      ySplit: freezeRow,
      activeCell: `A${freezeRow + 1}`,
      showGridLines: true,
    },
  ];

  // Sheet 2: theo loại phòng
  const wsType = wb.addWorksheet('Theo loại phòng', {
    properties: { defaultRowHeight: 19 },
  });
  wsType.columns = [
    { width: 22 },
    { width: 12 },
    { width: 14 },
    { width: 12 },
    { width: 14 },
    { width: 18 },
    { width: 18 },
    { width: 20 },
    { width: 22 },
    { width: 18 },
  ];

  let tr = 1;
  wsType.mergeCells(`A${tr}:J${tr}`);
  const tTitle = wsType.getCell(`A${tr}`);
  tTitle.value = 'So sánh hiệu quả theo loại phòng';
  tTitle.font = { bold: true, size: 14, color: { argb: COLORS.title } };
  tTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  wsType.getRow(tr).height = 28;
  tr += 1;

  wsType.mergeCells(`A${tr}:J${tr}`);
  wsType.getCell(`A${tr}`).value =
    `Kỳ ${meta.fromStr} → ${meta.toStr} · ${payload.hotelLabel} · Doanh thu tính theo đêm khách ở`;
  wsType.getCell(`A${tr}`).font = { italic: true, size: 10, color: { argb: 'FF5A5A5A' } };
  tr += 2;

  const typeHeaders = [
    'Loại phòng',
    'Số phòng',
    'Phòng đang mở',
    'Số đơn',
    'Số đêm đã bán',
    'Doanh thu (VNĐ)',
    'Tỷ lệ phòng có khách (%)',
    'Giá TB mỗi đêm đã bán (VNĐ)',
    'Doanh thu TB mỗi phòng/ngày (VNĐ)',
    'Tỷ lệ đóng góp doanh thu (%)',
  ];
  styleHeaderRow(wsType.getRow(tr), typeHeaders);
  tr += 1;

  (payload.byRoomType || []).forEach((r, idx) => {
    const dr = wsType.getRow(tr);
    const vals = [
      r.roomTypeLabel,
      r.roomCount,
      r.activeRooms,
      r.bookingCount,
      r.roomNights,
      r.revenue,
      r.occupancyRate,
      r.adr,
      r.revpar,
      r.revenueShare,
    ];
    vals.forEach((val, i) => {
      const cell = dr.getCell(i + 1);
      cell.border = thinBorder;
      applyAltFill(cell, idx);
      cell.value = val;
      if (i === 5 || i === 7 || i === 8) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right' };
      } else if (i === 6 || i === 9) {
        cell.numFmt = '0.0';
        cell.alignment = { horizontal: 'right' };
      } else {
        cell.alignment = { horizontal: i === 0 ? 'left' : 'center' };
      }
    });
    tr += 1;
  });

  if (!(payload.byRoomType || []).length) {
    wsType.getCell(`A${tr}`).value = 'Không có dữ liệu loại phòng trong kỳ.';
    tr += 1;
  }

  tr += 1;
  writeNotesBlock(wsType, tr, 10, 'Chú thích — cách đọc bảng loại phòng', ROOM_TYPE_NOTES);

  return wb.xlsx.writeBuffer();
}

module.exports = {
  buildReportExcelBuffer,
};
