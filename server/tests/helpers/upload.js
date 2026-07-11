const fs = require("fs");
const path = require("path");

const PROOF_IMAGE = path.join(__dirname, "../fixtures/proof.jpg");

function ensureProofJpeg() {
  if (!fs.existsSync(PROOF_IMAGE)) {
    const jpeg = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
      0x00, 0xff, 0xd9,
    ]);
    fs.writeFileSync(PROOF_IMAGE, jpeg);
  }
  return PROOF_IMAGE;
}

function attachPaymentProof(req) {
  return req.attach("proofImage", ensureProofJpeg());
}

function attachGuestIdImages(req) {
  const file = ensureProofJpeg();
  return req.attach("idImageFront", file).attach("idImageBack", file);
}

module.exports = { attachPaymentProof, attachGuestIdImages };
