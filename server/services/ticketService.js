import QRCode from 'qrcode';
import crypto from 'crypto';

function generateTicketToken(eventId, email) {
  const raw = `${eventId}::${email}::${Date.now()}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

export const ticketService = {
  async generateTicket({ eventId, eventName, dateText, location, fullName, email }) {
    const token = generateTicketToken(eventId, email);
    const ticketData = { eventId, eventName, dateText, location, fullName, email, token };
    const qrData = JSON.stringify({ t: token, e: eventId, m: email });
    const qrDataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: { dark: '#000', light: '#fff' },
    });
    return { token, qrDataUrl, ticketData };
  },

  generateTicketToken,
};
