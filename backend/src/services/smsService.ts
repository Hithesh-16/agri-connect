import { env } from '../config/env';
import { createChildLogger } from '../config/logger';

const log = createChildLogger('sms-service');

const MSG91_AUTH_KEY = env.msg91AuthKey;
const MSG91_SENDER_ID = env.msg91SenderId;

// ─── OTP ────────────────────────────────────────────────

export async function sendOTP(phone: string): Promise<void> {
  if (!MSG91_AUTH_KEY) {
    log.info({ phone }, 'OTP send (stub — MSG91 not configured)');
    return;
  }

  const response = await fetch('https://control.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: {
      authkey: MSG91_AUTH_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template_id: env.msg91OtpTemplateId,
      mobile: `91${phone}`,
      otp_length: 6,
      otp_expiry: 10,
    }),
  });

  if (!response.ok) {
    log.error({ phone, status: response.status }, 'OTP send failed');
    throw new Error('OTP send failed');
  }

  log.info({ phone }, 'OTP sent via MSG91');
}

export async function verifyOTP(phone: string, otp: string): Promise<boolean> {
  if (!MSG91_AUTH_KEY) {
    log.info({ phone }, 'OTP verify (stub)');
    return otp === '123456'; // Dev fallback
  }

  const response = await fetch(
    `https://control.msg91.com/api/v5/otp/verify?mobile=91${phone}&otp=${otp}`,
    { headers: { authkey: MSG91_AUTH_KEY } },
  );
  const data = (await response.json()) as { type: string };
  return data.type === 'success';
}

// ─── TRANSACTIONAL SMS ──────────────────────────────────

export async function sendTransactionalSMS(
  phone: string,
  templateId: string,
  variables: Record<string, string>,
): Promise<void> {
  if (!MSG91_AUTH_KEY) {
    log.info({ phone, templateId, variables }, 'Transactional SMS (stub — MSG91 not configured)');
    return;
  }

  const response = await fetch('https://control.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: {
      authkey: MSG91_AUTH_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template_id: templateId,
      sender: MSG91_SENDER_ID,
      short_url: '0',
      mobiles: `91${phone}`,
      ...variables,
    }),
  });

  if (!response.ok) {
    log.error({ phone, templateId, status: response.status }, 'Transactional SMS failed');
  } else {
    log.info({ phone, templateId }, 'Transactional SMS sent');
  }
}

// ─── SMS TEMPLATE IDS ───────────────────────────────────
// Register these on MSG91 DLT portal
export const SMS_TEMPLATES = {
  BOOKING_CONFIRMED: env.msg91TplBookingConfirmed,
  BOOKING_CANCELLED: env.msg91TplBookingCancelled,
  PROVIDER_ARRIVING: env.msg91TplProviderArriving,
  PAYMENT_RECEIVED: env.msg91TplPaymentReceived,
} as const;
