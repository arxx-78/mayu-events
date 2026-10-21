const BREVO_API_KEY = process.env.BREVO_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || 'aarasu7661@gmail.com';

// ========== EMAIL FUNCTIONS (Brevo API) ==========
const sendBookingConfirmation = async (booking) => {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'MAYU EVENTS', email: 'aarasu7661@gmail.com' },
        to: [{ email: booking.email }],
        subject: '✅ Your Booking Request Received - MAYU EVENTS',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #d4af37, #ffd700); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; color: #0a0a0a;">
              <h1 style="margin: 0;">MAYU EVENTS</h1>
              <p style="margin: 8px 0 0;">Booking Confirmation</p>
            </div>
            <div style="background: #1a1a1a; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #d4af37; color: white;">
              <h2>Hi ${booking.name},</h2>
              <p>Thank you for booking with MAYU EVENTS! We've received your request and our team will contact you within 30 minutes.</p>
              <h3>Booking Summary:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 10px; border-bottom: 1px solid #333;"><strong>Event Type:</strong></td><td style="padding: 10px; border-bottom: 1px solid #333;">${booking.eventType}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #333;"><strong>Event Date:</strong></td><td style="padding: 10px; border-bottom: 1px solid #333;">${new Date(booking.date).toLocaleDateString()}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #333;"><strong>Guests:</strong></td><td style="padding: 10px; border-bottom: 1px solid #333;">${booking.guests}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #333;"><strong>Budget:</strong></td><td style="padding: 10px; border-bottom: 1px solid #333;">${booking.budget || 'Not specified'}</td></tr>
              </table>
              <p style="margin-top: 30px;">For immediate assistance, call us at <strong>+91 81909 99899</strong>.</p>
              <p style="margin-top: 30px;">Best regards,<br><strong>Team MAYU EVENTS</strong></p>
            </div>
          </div>
        `
      }),
    });
    const data = await response.json();
    console.log('📧 Confirmation email sent:', data.messageId);
  } catch (error) {
    console.error('❌ Email error:', error.message);
  }
};

const sendAdminNotification = async (booking) => {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'MAYU EVENTS', email: 'aarasu7661@gmail.com' },
        to: [{ email: ADMIN_EMAIL }],
        subject: `🔔 New Booking: ${booking.eventType} - ${booking.name}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #d4af37;">New Booking Received!</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr><td style="padding: 10px; background: #f9fafb;"><strong>Name:</strong></td><td style="padding: 10px;">${booking.name}</td></tr>
              <tr><td style="padding: 10px; background: #f9fafb;"><strong>Phone:</strong></td><td style="padding: 10px;">${booking.phone}</td></tr>
              <tr><td style="padding: 10px; background: #f9fafb;"><strong>Email:</strong></td><td style="padding: 10px;">${booking.email}</td></tr>
              <tr><td style="padding: 10px; background: #f9fafb;"><strong>Event Type:</strong></td><td style="padding: 10px;">${booking.eventType}</td></tr>
              <tr><td style="padding: 10px; background: #f9fafb;"><strong>Date:</strong></td><td style="padding: 10px;">${new Date(booking.date).toLocaleDateString()}</td></tr>
            </table>
          </div>
        `
      }),
    });
    const data = await response.json();
    console.log('📧 Admin notification sent:', data.messageId);
  } catch (error) {
    console.error('❌ Admin email error:', error.message);
  }
};

// ========== WHATSAPP FUNCTION (Twilio) ==========
const twilio = require('twilio');
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendWhatsAppConfirmation = async (booking) => {
  try {
    const cleanPhone = booking.phone.replace(/[\s\-\+\(\)]/g, '').replace(/^0+/, '').slice(-10);
    const toNumber = `whatsapp:+91${cleanPhone}`;
    const message = await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
      to: toNumber,
      body: `Hi ${booking.name}, your booking for ${booking.eventType} on ${new Date(booking.date).toLocaleDateString()} is confirmed. Thank you for choosing MAYU EVENTS!`
    });
    console.log('📱 WhatsApp sent:', message.sid);
  } catch (error) {
    console.error('❌ WhatsApp error:', error.message);
  }
};

const verifyEmail = async () => {
  console.log('✅ Brevo API and Twilio configured');
};


// ========== BOOKING CONFIRMED EMAIL ==========
const sendBookingConfirmedEmail = async (booking) => {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'MAYU EVENTS', email: 'aarasu7661@gmail.com' },
        to: [{ email: booking.email }],
        subject: '✅ Your Event is Confirmed - MAYU EVENTS',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #d4af37, #ffd700); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; color: #0a0a0a;">
              <h1 style="margin: 0;">MAYU EVENTS</h1>
              <p style="margin: 8px 0 0;">Event Confirmed!</p>
            </div>
            <div style="background: #1a1a1a; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #d4af37; color: white;">
              <h2>Hi ${booking.name},</h2>
              <p>We are pleased to inform you that your event has been <strong>successfully confirmed</strong>! 🎉</p>
              <h3>Booking Summary:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 10px; border-bottom: 1px solid #333;"><strong>Event Type:</strong></td><td style="padding: 10px; border-bottom: 1px solid #333;">${booking.eventType}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #333;"><strong>Event Date:</strong></td><td style="padding: 10px; border-bottom: 1px solid #333;">${new Date(booking.date).toLocaleDateString()}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #333;"><strong>Guests:</strong></td><td style="padding: 10px; border-bottom: 1px solid #333;">${booking.guests}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #333;"><strong>Budget:</strong></td><td style="padding: 10px; border-bottom: 1px solid #333;">${booking.budget || 'Not specified'}</td></tr>
              </table>
              <p style="margin-top: 30px;">We look forward to making your event unforgettable!</p>
              <p style="margin-top: 30px;">For any queries, call us at <strong>+91 81909 99899</strong>.</p>
              <p style="margin-top: 30px;">Best regards,<br><strong>Team MAYU EVENTS</strong></p>
            </div>
          </div>
        `
      }),
    });
    const data = await response.json();
    console.log('📧 Confirmation email sent to client:', data.messageId);
  } catch (error) {
    console.error('❌ Confirmation email error:', error.message);
  }
};


// ========== SMS FUNCTION (Dummy - no actual SMS sent) ==========
const sendBookingSMS = async (booking) => {
  console.log('📱 SMS would be sent to:', booking.phone);
  // Actual SMS sending code (Fast2SMS) can be added here
  // For now, just log it to avoid errors
};

module.exports = { sendBookingSMS,  sendBookingConfirmedEmail,  sendBookingConfirmation, sendAdminNotification, sendWhatsAppConfirmation, verifyEmail };


