/**
 * Rate Limiter & Brute-Force Protection Utility
 * Mencegah serangan Credential Stuffing & Brute-Force Password
 */

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

// In-memory store for login attempts (IP + Email key)
const attemptsMap = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 menit
const LOCKOUT_MS = 15 * 60 * 1000; // 15 menit penalti

/**
 * Bersihkan data lama setiap 10 menit agar memori tidak membengkak
 */
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of attemptsMap.entries()) {
      if (record.lockedUntil && record.lockedUntil < now) {
        attemptsMap.delete(key);
      } else if (now - record.firstAttemptAt > WINDOW_MS && !record.lockedUntil) {
        attemptsMap.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  lockedUntil: number | null;
  retryAfterSeconds?: number;
}

/**
 * Cek apakah percobaan login diizinkan
 */
export function checkLoginRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const record = attemptsMap.get(identifier);

  if (!record) {
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS,
      lockedUntil: null,
    };
  }

  // Jika sedang terkunci
  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: record.lockedUntil,
      retryAfterSeconds,
    };
  }

  // Jika window waktu telah lewat, reset otomatis
  if (now - record.firstAttemptAt > WINDOW_MS) {
    attemptsMap.delete(identifier);
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS,
      lockedUntil: null,
    };
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - record.count);
  return {
    allowed: record.count < MAX_ATTEMPTS,
    remainingAttempts: remaining,
    lockedUntil: null,
  };
}

/**
 * Catat percobaan login yang gagal
 */
export function recordFailedLogin(identifier: string): RateLimitResult {
  const now = Date.now();
  const record = attemptsMap.get(identifier);

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    const newRecord: AttemptRecord = {
      count: 1,
      firstAttemptAt: now,
      lockedUntil: null,
    };
    attemptsMap.set(identifier, newRecord);
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS - 1,
      lockedUntil: null,
    };
  }

  record.count += 1;

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    const retryAfterSeconds = Math.ceil(LOCKOUT_MS / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: record.lockedUntil,
      retryAfterSeconds,
    };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - record.count,
    lockedUntil: null,
  };
}

/**
 * Reset catatan percobaan saat pengguna berhasil login
 */
export function resetLoginRateLimit(identifier: string): void {
  attemptsMap.delete(identifier);
}
