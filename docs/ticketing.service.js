import QRCode from 'qrcode';
import crypto from 'crypto';
import { Stripe } from 'stripe';

// Initialize Stripe only if the secret key is provided to avoid startup crashes in dev
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

/**
 * Ticketing Service handles core logic for the event ticketing system.
 */
export class TicketingService {
  /**
   * Generates a unique, secure identifier for a ticket QR code.
   */
  static generateTicketIdentifier(orderId, userId) {
    const salt = crypto.randomBytes(16).toString('hex');
    return crypto
      .createHash('sha256')
      .update(`${orderId}:${userId}:${salt}:${Date.now()}`)
      .digest('hex');
  }

  /**
   * Calculates the final price for a ticket selection, considering dynamic tiers.
   */
  static async calculateCurrentPrice(ticketTypeId, quantity, db) {
    const now = new Date().toISOString();

    // Check for active pricing tiers (Time-based or Early Bird)
    const { rows: tiers } = await db.query(
      `SELECT price FROM ticket_pricing_tiers 
       WHERE ticket_type_id = $1 
       AND (start_date IS NULL OR start_date <= $2) 
       AND (end_date IS NULL OR end_date >= $2)
       AND (min_quantity IS NULL OR $3 >= min_quantity)
       ORDER BY price ASC, min_quantity DESC LIMIT 1`,
      [ticketTypeId, now, quantity]
    );

    if (tiers.length > 0) return tiers[0].price;

    // Fallback to base price
    const { rows: base } = await db.query('SELECT base_price FROM ticket_types WHERE id = $1', [
      ticketTypeId,
    ]);

    return base[0]?.base_price || 0;
  }

  /**
   * Processes a checkout session with Stripe.
   */
  static async createStripePaymentIntent(amount, currency = 'usd') {
    if (!stripe) {
      throw new Error('Stripe is not configured on this server.');
    }

    return await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: { integration_check: 'ticketing_system' },
    });
  }

  /**
   * Generates a QR code image as a Data URL.
   */
  static async generateQRCode(data) {
    try {
      return await QRCode.toDataURL(data);
    } catch (err) {
      console.error('QR Code Generation Error:', err);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Validates a ticket for check-in.
   */
  static async validateCheckIn(qrCodeData, eventId, db) {
    const { rows } = await db.query(
      `SELECT t.*, tt.event_id 
       FROM tickets t 
       JOIN ticket_types tt ON t.ticket_type_id = tt.id
       WHERE t.qr_code_data = $1 AND tt.event_id = $2`,
      [qrCodeData, eventId]
    );

    if (rows.length === 0) return { valid: false, message: 'Invalid ticket' };

    const ticket = rows[0];
    if (ticket.status === 'checked_in') return { valid: false, message: 'Already checked in' };
    if (ticket.status !== 'valid') return { valid: false, message: 'Ticket is no longer valid' };

    return { valid: true, ticketId: ticket.id };
  }

  /**
   * Fetches revenue statistics for an event organizer.
   */
  static async getRevenueStats(eventId, db) {
    // This query calculates revenue per ticket type by proportionally
    // dividing the order total among the tickets issued in that order.
    const query = `
      SELECT 
        tt.name as ticket_type,
        COUNT(t.id) as sold_count,
        SUM(
          o.total_amount / (
            SELECT COUNT(*) FROM tickets WHERE order_id = o.id
          )
        ) as revenue
      FROM ticket_types tt
      JOIN tickets t ON t.ticket_type_id = tt.id
      JOIN orders o ON t.order_id = o.id
      WHERE tt.event_id = $1 AND o.status = 'completed'
      GROUP BY tt.name
    `;

    const { rows } = await db.query(query, [eventId]);

    const totalRevenue = rows.reduce((acc, row) => acc + parseFloat(row.revenue), 0);
    const totalSold = rows.reduce((acc, row) => acc + parseInt(row.sold_count), 0);

    return { breakdown: rows, totalRevenue, totalSold };
  }
}
