/**
 * Chuẩn hóa parse query phân trang và metadata response.
 */
function parsePaginationQuery(
  { page, limit, all } = {},
  { defaultLimit = 20, maxLimit = 100 } = {}
) {
  const isAll = all === true || all === 'true';
  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || defaultLimit, 1), maxLimit);
  const skip = (parsedPage - 1) * parsedLimit;

  return {
    all: isAll,
    page: parsedPage,
    limit: parsedLimit,
    skip,
  };
}

function buildPaginationMeta({ page, limit, total }) {
  const safeTotal = Math.max(Number(total) || 0, 0);
  return {
    page,
    limit,
    total: safeTotal,
    totalPages: Math.max(1, Math.ceil(safeTotal / limit) || 1),
  };
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function paginatedBody(items, pagination, itemsKey = 'items') {
  return {
    [itemsKey]: items,
    pagination,
  };
}

module.exports = {
  parsePaginationQuery,
  buildPaginationMeta,
  escapeRegex,
  paginatedBody,
};
