/** MongoDB standalone không hỗ trợ transaction; replica set / Atlas thường hỗ trợ. */
function isTransactionUnsupportedError(err) {
  if (!err) return false;
  const code = err.code;
  const msg = String(err.message || "");
  const name = String(err.codeName || "");
  return (
    code === 20 ||
    code === 303 ||
    name === "IllegalOperation" ||
    /replica set|mongos|Transaction numbers|multi-document transactions|not supported/i.test(msg)
  );
}

/** Lỗi tạm thời có thể retry (WriteConflict, TransientTransactionError). */
function isTransientTransactionError(err) {
  if (!err) return false;
  const labels = err.errorLabels || err.errorLabelSet || [];
  if (Array.isArray(labels) && labels.includes("TransientTransactionError")) {
    return true;
  }
  if (err.code === 112 || err.codeName === "WriteConflict") {
    return true;
  }
  return /WriteConflict|TransientTransactionError/i.test(String(err.message || ""));
}

module.exports = {
  isTransactionUnsupportedError,
  isTransientTransactionError,
};
