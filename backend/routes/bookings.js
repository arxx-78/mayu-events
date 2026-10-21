const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const { sendBookingConfirmation, sendAdminNotification, sendBookingSMS, sendWhatsAppConfirmation, sendBookingConfirmedEmail, sendBookingCancelledEmail } = require('../utils/mailer');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ============ PUBLIC: Create booking ============
router.post('/',
  [
    body('name').trim().notEmpty().withMessage('Name required').isLength({ max: 100 }),
    body('phone').trim().notEmpty().withMessage('Phone required').matches(/^[\d\s+\-()]{7,20}$/),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('eventType').trim().notEmpty().withMessage('Event type required'),
    body('date').notEmpty().withMessage('Date required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Convert date to proper format (DD/MM/YYYY to YYYY-MM-DD)
      let bookingDate = req.body.date;
      if (typeof bookingDate === 'string' && bookingDate.includes('/')) {
        const parts = bookingDate.split('/');
        if (parts.length === 3) {
          bookingDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
      req.body.date = bookingDate;

      // Check if date is already booked
      const existingBooking = await Booking.findOne({
        date: new Date(bookingDate),
        status: { $in: ['new', 'contacted', 'confirmed'] }
      });

      if (existingBooking) {
        return res.status(400).json({
          success: false,
          message: 'This date is already booked by another customer. Please choose a different date.'
        });
      }

      // 1. Save booking to database first
      const booking = await Booking.create({
        ...req.body,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || ''
      });

      // 2. Only send notifications if booking saved successfully
      if (booking && booking._id) {
        // Send notifications in background (non-blocking)
        // This ensures email is only sent AFTER database save
        
        
        
        
      }

      // 3. Send success response
      res.status(201).json({
        success: true,
        message: 'Booking received! We will contact you within 30 minutes.',
        data: { id: booking._id, name: booking.name }
      });
    } catch (error) {
      console.error('Booking error:', error);
      res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
  }
);

// ============ ADMIN: Get all bookings ============
router.get('/', protect, async (req, res) => {
  try {
    const { status, eventType, search, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (eventType) query.eventType = eventType;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') }
      ];
    }

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({ success: true, data: bookings, total, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ ADMIN: Get stats ============
router.get('/stats', protect, async (req, res) => {
  try {
    const total = await Booking.countDocuments();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayCount = await Booking.countDocuments({ createdAt: { $gte: today } });
    const confirmed = await Booking.countDocuments({ status: 'confirmed' });
    const pending = await Booking.countDocuments({ status: 'new' });

    const byType = await Booking.aggregate([
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const byMonth = await Booking.aggregate([
      { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 }
      }},
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: { total, todayCount, confirmed, pending, byType, byMonth }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ ADMIN: Update booking ============
router.put('/:id', protect, async (req, res) => {
  try {
    const oldBooking = await Booking.findById(req.params.id);
    if (!oldBooking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const wasConfirmed = oldBooking.status === 'confirmed';
    const wasCancelled = oldBooking.status === 'cancelled';
    const isNowConfirmed = req.body.status === 'confirmed';
    const isNowCancelled = req.body.status === 'cancelled';

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // If status changed to "confirmed", send confirmation email
    if (!wasConfirmed && isNowConfirmed) {
      console.log('✅ Admin confirmed booking. Sending email to client...');
      sendBookingConfirmedEmail(booking).catch(console.error);
    }

    // If status changed to "cancelled", send cancellation email
    if (!wasCancelled && isNowCancelled) {
      console.log('❌ Admin cancelled booking. Sending email to client...');
      sendBookingCancelledEmail(booking).catch(console.error);
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ ADMIN: Delete booking ============
router.delete('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// ============ PUBLIC: Get booked dates ============
router.get('/booked-dates', async (req, res) => {
  try {
    const bookings = await Booking.find({
      status: { $in: ['new', 'contacted', 'confirmed'] }
    }).select('date');

    const bookedDates = bookings.map(b => new Date(b.date).toISOString().split('T')[0]);

    res.json({ success: true, data: bookedDates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;







