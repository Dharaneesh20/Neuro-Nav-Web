const twilio = require('twilio');

// Initialize Twilio client with proper error handling
let client = null;

try {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  // Validate Twilio credentials format before initializing
  if (accountSid && authToken && accountSid.startsWith('AC') && accountSid.length >= 32) {
    client = twilio(accountSid, authToken);
    console.log('✅ Twilio SMS client initialized');
  } else if (accountSid && !accountSid.startsWith('AC')) {
    console.warn('⚠️  Invalid Twilio Account SID format - must start with "AC"');
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
