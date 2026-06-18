/**
 * Chuẩn hóa response phân trang từ API.
 * Hỗ trợ legacy array khi gọi với all=true.
 */
export function unwrapPaginated(response, itemsKey = 'items') {
  if (Array.isArray(response)) {
    const total = response.length;
    return {
      items: response,
      pagination: {
        page: 1,
        limit: total,
        total,
        totalPages: 1,
      },
    };
  }

  const items = response?.[itemsKey] ?? response?.items ?? [];
  const pagination = response?.pagination ?? {
    page: 1,
    limit: items.length,
    total: items.length,
    totalPages: 1,
  };

  return { items, pagination };
}
