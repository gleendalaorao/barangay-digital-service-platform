import QRCode from "qrcode";

export function getCertificateVerificationUrl(certificateId: string) {
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${appUrl.replace(/\/$/, "")}/verify/${certificateId}`;
}

export async function generateQrDataUrl(value: string) {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 180,
  });
}

export async function generateQrBuffer(value: string) {
  return QRCode.toBuffer(value, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 180,
    type: "png",
  });
}

export function dataUrlToBuffer(dataUrl: string) {
  const [, base64] = dataUrl.split(",");
  return Buffer.from(base64, "base64");
}
