require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/db');
const Admin = require('./models/Admin');
const { verifyEmail } = require('./utils/mailer');

const bookingRoutes = require('./routes/bookings');
const contactRoutes = require('./routes/contact');
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payment');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [process.env.FRONTEND_URL || '*', 'http://localhost:3000', 'http://127.0.0.1:5500'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many booking attempts.' }
});

app.use('/api/', apiLimiter);
app.use('/api/bookings', bookingLimiter);

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/bookings', bookingRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const adminCount = await Admin.countDocuments();
    if (adminCount === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      await Admin.create({
        name: 'Super Admin',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: 'superadmin'
      });
      console.log('✅ Default admin created:', process.env.ADMIN_EMAIL);
    }

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your_app_password') {
      verifyEmail();
    }

    app.listen(PORT, () => {
      console.log('\n🚀 ========================================');
      console.log(`🚀 EventPro Server running on port ${PORT}`);
      console.log(`🌐 Frontend:  http://localhost:${PORT}`);
      console.log(`📡 API:       http://localhost:${PORT}/api`);
      console.log(`❤️  Health:    http://localhost:${PORT}/api/health`);
      console.log(`🔐 Admin:     http://localhost:${PORT}/login.html`);
      console.log('🚀 ========================================\n');
    });
  } catch (error) {
    console.error('❌ Startup error:', error);
    process.exit(1);
  }
};

startServer();

