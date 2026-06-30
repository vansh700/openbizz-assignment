/**
 * @jest-environment node
 */
import { POST as sendOtpHandler } from "@/app/api/otp/send/route";
import { POST as verifyOtpHandler } from "@/app/api/otp/verify/route";
import { POST as validatePanHandler } from "@/app/api/pan/validate/route";
import { POST as submitHandler } from "@/app/api/submit/route";
import { otpStore, submissionsStore } from "@/services/mockStore";

// Mock prisma and dbConnected
jest.mock("@/lib/prisma", () => ({
  prisma: {
    submission: {
      create: jest.fn().mockImplementation((args) => Promise.resolve({ id: "mock-uuid", ...args.data, createdAt: new Date() })),
      findFirst: jest.fn().mockResolvedValue(null),
    },
  },
  dbConnected: false, // Force mock mode for test reproducibility
}));

describe("API Route Integration Tests", () => {
  beforeEach(() => {
    otpStore.clear();
    submissionsStore.length = 0;
  });

  describe("POST /api/otp/send", () => {
    it("should generate and store OTP for valid Aadhaar and Name", async () => {
      const request = new Request("http://localhost/api/otp/send", {
        method: "POST",
        body: JSON.stringify({
          aadhaarNumber: "123456789012",
          entrepreneurName: "John Doe",
        }),
      });

      const response = await sendOtpHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.otp).toBeDefined();
      expect(otpStore.has("123456789012")).toBe(true);
    });

    it("should fail validation for invalid Aadhaar number", async () => {
      const request = new Request("http://localhost/api/otp/send", {
        method: "POST",
        body: JSON.stringify({
          aadhaarNumber: "1234",
          entrepreneurName: "John Doe",
        }),
      });

      const response = await sendOtpHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors.aadhaarNumber).toBeDefined();
    });
  });

  describe("POST /api/otp/verify", () => {
    it("should successfully verify a valid OTP", async () => {
      // Pre-populate OTP store
      otpStore.set("123456789012", {
        otp: "123456",
        expiresAt: Date.now() + 60000,
        verified: false,
        entrepreneurName: "John Doe",
      });

      const request = new Request("http://localhost/api/otp/verify", {
        method: "POST",
        body: JSON.stringify({
          aadhaarNumber: "123456789012",
          otp: "123456",
        }),
      });

      const response = await verifyOtpHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(otpStore.get("123456789012")?.verified).toBe(true);
    });

    it("should fail validation for incorrect OTP", async () => {
      otpStore.set("123456789012", {
        otp: "123456",
        expiresAt: Date.now() + 60000,
        verified: false,
        entrepreneurName: "John Doe",
      });

      const request = new Request("http://localhost/api/otp/verify", {
        method: "POST",
        body: JSON.stringify({
          aadhaarNumber: "123456789012",
          otp: "654321",
        }),
      });

      const response = await verifyOtpHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid OTP. Please enter the correct OTP.");
    });
  });

  describe("POST /api/pan/validate", () => {
    it("should validate valid PAN when Aadhaar is verified", async () => {
      // Pre-set Aadhaar as verified
      otpStore.set("123456789012", {
        otp: "123456",
        expiresAt: Date.now() + 60000,
        verified: true,
        entrepreneurName: "John Doe",
      });

      const request = new Request("http://localhost/api/pan/validate", {
        method: "POST",
        body: JSON.stringify({
          aadhaarNumber: "123456789012",
          panNumber: "ABCDE1234F",
          panType: "PROPRIETORSHIP",
        }),
      });

      const response = await validatePanHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should block validation if Aadhaar is not verified yet", async () => {
      const request = new Request("http://localhost/api/pan/validate", {
        method: "POST",
        body: JSON.stringify({
          aadhaarNumber: "123456789012",
          panNumber: "ABCDE1234F",
          panType: "PROPRIETORSHIP",
        }),
      });

      const response = await validatePanHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("verify Aadhaar OTP first");
    });
  });

  describe("POST /api/submit", () => {
    it("should submit the full registration and save to mock store", async () => {
      otpStore.set("123456789012", {
        otp: "123456",
        expiresAt: Date.now() + 60000,
        verified: true,
        entrepreneurName: "John Doe",
      });

      const request = new Request("http://localhost/api/submit", {
        method: "POST",
        body: JSON.stringify({
          aadhaarNumber: "123456789012",
          entrepreneurName: "John Doe",
          panNumber: "ABCDE1234F",
          panType: "PROPRIETORSHIP",
          pinCode: "110001",
          city: "New Delhi",
          state: "Delhi",
        }),
      });

      const response = await submitHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
      expect(submissionsStore.length).toBe(1);
    });
  });
});
