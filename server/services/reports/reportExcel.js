const ExcelJS = require('exceljs');

const COLORS = {
  title: 'FF1F4E79',
  headerBg: 'FF2E75B6',
  sectionBg: 'FFD9E2F3',
  border: 'FFB4C6E7',
  altRow: 'FFF8FAFC'
};

const thinBorder = {
  top: { style: 'thin', color: { argb: COLORS.border } },
  left: { style: 'thin', color: { argb: COLORS.border } },
  bottom: { style: 'thin', color: { argb: COLORS.border } },
  right: { style: 'thin', color: { argb: COLORS.border } }
};

/**
 * @param {object} payload — kết quả buildReportPayload
 * @param {{ title: string, fromStr: string, toStr: string }} meta
 */
async function buildReportExcelBuffer(payload, meta) {
  const wb = new ExcelJS.Workbook();
  wb.created = new Date();
  wb.creator = 'Hotel Booking System';

  const ws = wb.addWorksheet('Báo cáo', {
    properties: { defaultRowHeight: 19 },
    views: [{ showGridLines: true }]
  });

  ws.columns = [{ width: 18 }, { width: 28 }, { width: 22 }, { width: 22 }];

  let row = 1;

  ws.mergeCells(`A${row}:D${row}`);
  const title = ws.getCell(`A${row}`);
  title.value = 'Báo cáo kinh doanh';
  title.font = { bold: true, size: 16, color: { argb: COLORS.title } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(row).height = 32;
  row += 1;

  ws.mergeCells(`A${row}:D${row}`);
  const sub = ws.getCell(`A${row}`);
  sub.value = `Phạm vi: ${meta.title}  ·  Kỳ báo cáo`;
  sub.font = { italic: true, size: 11, color: { argb: 'FF5A5A5A' } };
  sub.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(row).height = 22;
  row += 1;

  const metaRows = [
    ['Từ ngày', meta.fromStr, 'Đến ngày', meta.toStr],
    ['Khách sạn', payload.hotelLabel, '', '']
  ];
  for (const line of metaRows) {
    for (let c = 0; c < 4; c += 1) {
      const cell = ws.getCell(row, c + 1);
      cell.value = line[c] || '';
      cell.border = thinBorder;
      if (line[0] === 'Khách sạn') {
        if (c === 0) {
          cell.font = { bold: true, color: { argb: 'FF333333' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: COLORS.sectionBg }
          };
        }
      } else if (c === 0 || c === 2) {
        cell.font = { bold: true, color: { argb: 'FF333333' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: COLORS.sectionBg }
        };
      }
    }
    if (line[0] === 'Khách sạn') {
      ws.mergeCells(`B${row}:D${row}`);
      ws.getCell(`B${row}`).alignment = { vertical: 'middle', wrapText: true };
    }
    row += 1;
  }

  row += 1;

  ws.mergeCells(`A${row}:D${row}`);
  const sec1 = ws.getCell(`A${row}`);
  sec1.value = 'Tổng hợp kỳ';
  sec1.font = { bold: true, size: 12, color: { argb: COLORS.title } };
  sec1.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.sectionBg }
  };
  sec1.border = thinBorder;
  row += 1;

  const summaryHeaders = [
    'Tổng phòng',
    'Doanh thu (VNĐ)\n(đơn đã TT, tạo trong kỳ)',
    'Số đơn\n(tạo trong kỳ)',
    'Đêm phòng bán'
  ];
  const hRow = ws.getRow(row);
  summaryHeaders.forEach((text, i) => {
    const cell = hRow.getCell(i + 1);
    cell.value = text;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.headerBg }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = thinBorder;
  });
  hRow.height = 36;
  row += 1;

  const dRow = ws.getRow(row);
  const summaryVals = [
    payload.totalRooms,
    payload.totalRevenue,
    payload.bookingCount,
    payload.totalRoomNightsSold
  ];
  summaryVals.forEach((val, i) => {
    const cell = dRow.getCell(i + 1);
    cell.border = thinBorder;
    cell.alignment = {
      vertical: 'middle',
      horizontal: i === 0 || i === 2 || i === 3 ? 'center' : 'right'
    };
    if (i === 1) {
      cell.value = val;
      cell.numFmt = '#,##0';
    } else {
      cell.value = val;
    }
  });
  row += 1;

  row += 1;

  ws.mergeCells(`A${row}:D${row}`);
  const sec2 = ws.getCell(`A${row}`);
  sec2.value = 'Chi tiết theo ngày';
  sec2.font = { bold: true, size: 12, color: { argb: COLORS.title } };
  sec2.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.sectionBg }
  };
  sec2.border = thinBorder;
  const freezeRow = row;
  row += 1;

  const dailyHeaders = [
    'Ngày',
    'Doanh thu (VNĐ)',
    'Số đơn (trong ngày)',
    'Đêm phòng bán'
  ];
  const dhRow = ws.getRow(row);
  dailyHeaders.forEach((text, i) => {
    const cell = dhRow.getCell(i + 1);
    cell.value = text;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.headerBg }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = thinBorder;
  });
  dhRow.height = 30;
  row += 1;

  payload.daily.forEach((d, idx) => {
    const dr = ws.getRow(row);
    const fill =
      idx % 2 === 1
        ? {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: COLORS.altRow }
          }
        : undefined;

    const cells = [d.dateLabel, d.revenue, d.bookingsCreated, d.roomNights];
    cells.forEach((val, i) => {
      const cell = dr.getCell(i + 1);
      cell.border = thinBorder;
      if (fill) cell.fill = fill;
      if (i === 1) {
        cell.value = val;
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right' };
      } else {
        cell.value = val;
        cell.alignment = { horizontal: 'center' };
      }
    });
    row += 1;
  });

  const dailyHeaderRowNum = freezeRow + 1;
  ws.views = [
    {
      state: 'frozen',
      ySplit: dailyHeaderRowNum,
      activeCell: `A${dailyHeaderRowNum + 1}`,
      showGridLines: true
    }
  ];

  return wb.xlsx.writeBuffer();
}

module.exports = {
  buildReportExcelBuffer
};
