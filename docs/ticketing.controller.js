import { TicketingService } from '../services/ticketing.service.js';
import { purchaseTicketSchema, checkInSchema } from '../validators/ticketing.validator.js';

export const purchaseTickets = async (req, res) => {
  try {
    const validatedData = purchaseTicketSchema.parse(req.body);
    const { eventId, items, discountCode } = validatedData;

    let totalAmount = 0;
    // Logic to calculate total price...
    for (const item of items) {
      const price = await TicketingService.calculateCurrentPrice(
        item.ticketTypeId,
        item.quantity,
        req.db
      );
      totalAmount += price * item.quantity;
    }

    // Create Payment Intent
    const paymentIntent = await TicketingService.createStripePaymentIntent(totalAmount);

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      totalAmount,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const checkInAttendee = async (req, res) => {
  try {
    const { qrCodeData, eventId } = checkInSchema.parse(req.body);
    const validation = await TicketingService.validateCheckIn(qrCodeData, eventId, req.db);

    if (!validation.valid) {
      return res.status(400).json({ status: 'error', message: validation.message });
    }

    // Mark as checked in
    await req.db.query('UPDATE tickets SET status = $1, check_in_time = NOW() WHERE id = $2', [
      'checked_in',
      validation.ticketId,
    ]);

    res.status(200).json({ status: 'success', message: 'Checked in successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getEventRevenue = async (req, res) => {
  const { eventId } = req.params;
  try {
    const stats = await TicketingService.getRevenueStats(eventId, req.db);
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
