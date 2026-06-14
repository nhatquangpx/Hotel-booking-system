function getDefaultQrConfig() {
  return {
    accountName: String(process.env.DEFAULT_QR_ACCOUNT_NAME || "").trim(),
    accountNumber: String(process.env.DEFAULT_QR_ACCOUNT_NUMBER || "").trim(),
    bankName: String(process.env.DEFAULT_QR_BANK_NAME || "").trim(),
    qrImageUrl: String(process.env.DEFAULT_QR_IMAGE_URL || "/assets/qr-code.png").trim(),
  };
}

function resolveEffectiveQrConfig(qr = {}) {
  const fallback = getDefaultQrConfig();
  const hasFullHotelQr =
    String(qr?.accountName || "").trim() &&
    String(qr?.accountNumber || "").trim() &&
    String(qr?.bankName || "").trim();

  const qrPayload = hasFullHotelQr
    ? {
        accountName: String(qr.accountName || "").trim(),
        accountNumber: String(qr.accountNumber || "").trim(),
        bankName: String(qr.bankName || "").trim(),
        qrImageUrl: String(qr.qrImageUrl || "").trim(),
        isFallback: false,
      }
    : {
        accountName: fallback.accountName,
        accountNumber: fallback.accountNumber,
        bankName: fallback.bankName,
        qrImageUrl: String(qr?.qrImageUrl || "").trim() || fallback.qrImageUrl,
        isFallback: true,
      };

  return {
    ...qrPayload,
    isConfigured: Boolean(
      String(qrPayload.accountName || "").trim() &&
        String(qrPayload.accountNumber || "").trim() &&
        String(qrPayload.bankName || "").trim()
    ),
  };
}

module.exports = { getDefaultQrConfig, resolveEffectiveQrConfig };
