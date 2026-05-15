/** YYYY-MM-DD theo múi VN — khớp server saleShared */
export function vnTodayYmd() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}

/** Trạng thái hiển thị: Mở / Đóng (ưu tiên isOpen từ API). */
export function saleStatusDisplay(sale) {
  const open = sale.isOpen ?? (sale.isActive && sale.endDate >= vnTodayYmd());
  return open
    ? { label: 'Mở', pillClass: 'status-pill--open' }
    : { label: 'Đóng', pillClass: 'status-pill--closed' };
}

export function countOpenSales(sales) {
  return sales.filter((s) => s.isOpen).length;
}
