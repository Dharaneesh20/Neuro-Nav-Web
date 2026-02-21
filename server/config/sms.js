const twilio = require('twilio');

// Initialize Twilio client with proper error handling
let client = null;

try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('✅ Twilio SMS client initialized');
  } else {
    console.warn('⚠️  Twilio credentials not found - SMS functionality disabled');
  }
} catch (error) {
  console.warn('⚠️  Twilio initialization failed:', error.message);
}

const sendSMS = async (to, message) => {
  try {
    if (!client) {
      console.warn('SMS client not initialized. Skipping SMS send.');
      return false;
    }

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    console.log(`SMS sent to ${to}`);
    return true;
  } catch (error) {
    console.error('SMS sending error:', error.message);
    return false;
  }
};

module.exports = { sendSMS };
