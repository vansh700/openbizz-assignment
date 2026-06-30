interface OtpData {
  otp: string;
  expiresAt: number;
  verified: boolean;
  entrepreneurName: string;
}

interface SubmissionData {
  id: string;
  aadhaar: string;
  entrepreneurName: string;
  pan: string;
  panType: string;
  otpVerified: boolean;
  pinCode?: string | null;
  city?: string | null;
  state?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const globalForStore = globalThis as unknown as {
  otpStore?: Map<string, OtpData>;
  submissionsStore?: SubmissionData[];
};

if (!globalForStore.otpStore) {
  globalForStore.otpStore = new Map();
}

if (!globalForStore.submissionsStore) {
  globalForStore.submissionsStore = [];
}

export const otpStore = globalForStore.otpStore;
export const submissionsStore = globalForStore.submissionsStore;

// Clean up expired OTPs periodically
if (typeof setInterval !== "undefined") {
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of otpStore.entries()) {
      if (now > value.expiresAt) {
        otpStore.delete(key);
      }
    }
  }, 60000); // Check every minute
  if (interval && typeof interval.unref === "function") {
    interval.unref();
  }
}
