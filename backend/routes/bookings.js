const express = require('express');
const { validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const { sendBookingConfirmation, sendAdminNotification } = require('../utils/mailer');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Convert date to proper format if needed
if (req.body.date && typeof req.body.date === 'string' && req.body.date.includes('/')) {
  const parts = req.body.date.split('/');
  if (parts.length === 3) {
    req.body.date = `${parts[2]}-${parts[1]}-${parts[0]}`;
    console.log('Date converted in backend:', req.body.date);
  }
}

// Convert date to proper format
let bookingDate = req.body.date;
if (typeof bookingDate === 'string' && bookingDate.includes('/')) {
  const parts = bookingDate.split('/');
  if (parts.length === 3) {
    bookingDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
}
req.body.date = bookingDate;

if (existingBooking) {
  return res.status(400).json({
    success: false,
    message: 'This date is already booked by another customer. Please choose a different date.',
    bookedDate: existingBooking.date
  });
}

// Check if date is already booked
const existingBooking = await Booking.findOne({
  date: new Date(req.body.date),
  status: { $in: ['new', 'contacted', 'confirmed'] }
});

if (existingBooking) {
  return res.status(400).json({
    success: false,
    message: 'This date is already booked by another customer. Please choose a different date.'
  });
}

const booking = await Booking.create({
        ...req.body,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || ''
      });

      // Send emails (Wait for them to finish)
      await sendBookingConfirmation(booking).catch(err => console.error('Customer email error:', err));
      await sendAdminNotification(booking).catch(err => console.error('Admin email error:', err));

      res.status(201).json({
        success: true,
        message: 'Booking confirmed! Check your email for details.',
        data: { id: booking._id, name: booking.name }
      });
    } catch (error) {
      console.error('Booking error:', error);
      res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
  }
);

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

router.put('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;










