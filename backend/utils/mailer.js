const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendBookingConfirmation = async (booking) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: booking.email,
      subject: '✅ Your Booking Request Received - EventPro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #e91e63, #c2185b); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; color: white;">
            <h1 style="margin: 0;">EventPro</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">Booking Confirmation</p>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #1a1a2e;">Hi ${booking.name},</h2>
            <p>Thank you for booking with EventPro! We've received your request and our team will contact you within 30 minutes.</p>
            <h3 style="color: #1a1a2e; margin-top: 25px;">Booking Summary:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Event Type:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${booking.eventType}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Event Date:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${new Date(booking.date).toLocaleDateString()}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Guests:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${booking.guests}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Budget:</strong></td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${booking.budget || 'Not specified'}</td></tr>
            </table>
            <p style="margin-top: 30px;">For immediate assistance, call us at <strong>+91 98765 43210</strong>.</p>
            <p style="margin-top: 30px;">Best regards,<br><strong>Team EventPro</strong></p>
          </div>
        </div>
      `
    });
    console.log('📧 Confirmation email sent to', booking.email);
  } catch (error) {
    console.error('❌ Email error:', error.message);
  }
};

const sendAdminNotification = async (booking) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.ADMIN_NOTIFY_EMAIL,
      subject: `🔔 New Booking: ${booking.eventType} - ${booking.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #e91e63;">New Booking Received!</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr><td style="padding: 10px; background: #f9fafb;"><strong>Name:</strong></td><td style="padding: 10px;">${booking.name}</td></tr>
            <tr><td style="padding: 10px; background: #f9fafb;"><strong>Phone:</strong></td><td style="padding: 10px;">${booking.phone}</td></tr>
            <tr><td style="padding: 10px; background: #f9fafb;"><strong>Email:</strong></td><td style="padding: 10px;">${booking.email}</td></tr>
            <tr><td style="padding: 10px; background: #f9fafb;"><strong>Event Type:</strong></td><td style="padding: 10px;">${booking.eventType}</td></tr>
            <tr><td style="padding: 10px; background: #f9fafb;"><strong>Date:</strong></td><td style="padding: 10px;">${new Date(booking.date).toLocaleDateString()}</td></tr>
            <tr><td style="padding: 10px; background: #f9fafb;"><strong>Guests:</strong></td><td style="padding: 10px;">${booking.guests}</td></tr>
            <tr><td style="padding: 10px; background: #f9fafb;"><strong>Budget:</strong></td><td style="padding: 10px;">${booking.budget || 'Not specified'}</td></tr>
            <tr><td style="padding: 10px; background: #f9fafb; vertical-align: top;"><strong>Message:</strong></td><td style="padding: 10px;">${booking.message || 'No message'}</td></tr>
          </table>
          <p style="margin-top: 20px;"><a href="${process.env.FRONTEND_URL}/admin.html" style="background: #e91e63; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">View in Dashboard</a></p>
        </div>
      `
    });
    console.log('📧 Admin notification sent');
  } catch (error) {
    console.error('❌ Admin email error:', error.message);
  }
};

const verifyEmail = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email server ready');
  } catch (error) {
    console.error('❌ Email config error:', error.message);
  }
};

module.exports = { sendBookingConfirmation, sendAdminNotification, verifyEmail };
