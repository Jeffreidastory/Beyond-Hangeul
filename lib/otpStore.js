const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const globalStore = globalThis;

if (!globalStore.__beyondHangeulOtpStore) {
  globalStore.__beyondHangeulOtpStore = new Map();
}

const otpStore = globalStore.__beyondHangeulOtpStore;

export function setOtpForEmail(email, code) {
  otpStore.set(email, {
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });
}

export function verifyOtpForEmail(email, code) {
  const entry = otpStore.get(email);

  if (!entry) {
    return { ok: false, message: "OTP not found. Request a new code." };
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email);
    return { ok: false, message: "OTP expired. Request a new code." };
  }

  if (entry.code !== code) {
    entry.attempts += 1;

    if (entry.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(email);
      return { ok: false, message: "Too many attempts. Request a new code." };
    }

    otpStore.set(email, entry);
    return { ok: false, message: "Invalid OTP code." };
  }

  otpStore.delete(email);
  return { ok: true };
}
