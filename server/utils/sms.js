const twilio = require('twilio');

const smsConfigured = () => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM;
    return Boolean(sid && token && from);
};

const formatToE164 = (phone) => {
    if (!phone) return phone;
    const trimmed = String(phone).trim();
    if (trimmed.startsWith('+')) return trimmed;
    // Assume India numbers if 10 digits
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length === 10) return `+91${digits}`;
    return `+${digits}`;
};

const sendOTP = async (to, otp) => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM; // Phone number or Messaging Service SID (starts with 'MG')
    const canSend = Boolean(sid && token && from);

    if (canSend) {
        const client = twilio(sid, token);
        const body = `Your CLGFest OTP is ${otp}. Valid for 5 minutes.`;
        const toE164 = formatToE164(to);
        const payload = { body, to: toE164 };
        if (from.startsWith('MG')) {
            payload.messagingServiceSid = from;
        } else {
            payload.from = from;
        }
        await client.messages.create(payload);
        return true;
    } else {
        console.log(`OTP (DEV) for ${to}: ${otp}`);
        // Return true in development to allow the flow to continue
        return true;
    }
};

module.exports = { sendOTP, smsConfigured };
