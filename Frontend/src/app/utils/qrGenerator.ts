import QRCode from 'qrcode';

export async function generateQRCode(url: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: {
        dark: '#0C0D12',
        light: '#FFFFFF'
      }
    });

    return qrDataUrl;
  } catch (error) {
    console.error('QR Code generation failed:', error);
    return '';
  }
}

export async function generateReplayQRCode(sessionId: string): Promise<string> {
  const replayUrl = `https://devoffice.ai/replay/${sessionId}`;
  return generateQRCode(replayUrl);
}
