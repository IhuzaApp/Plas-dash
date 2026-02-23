export type OTPData = {
  otp: string;
  email?: string;
  fullName?: string;
  gender?: string;
  expiresAt: number;
};

// Simple in-memory store for OTPs
// In a production environment, this should ideally be backed by Redis or a database
export const otpStore = new Map<string, OTPData>();
