import * as z from "zod";

// Schemas matching the application logic
const aadhaarSchema = z
  .string()
  .regex(/^\d{12}$/, "Aadhaar Number must be exactly 12 numeric digits.");

const panSchema = z
  .string()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "PAN must match format [A-Z]{5}[0-9]{4}[A-Z]{1}.");

const otpSchema = z
  .string()
  .regex(/^\d{6}$/, "OTP must be exactly 6 numeric digits.");

describe("Validation Logic Unit Tests", () => {
  describe("Aadhaar Number Validation", () => {
    it("should accept valid 12-digit numeric strings", () => {
      expect(aadhaarSchema.safeParse("123456789012").success).toBe(true);
      expect(aadhaarSchema.safeParse("987654321098").success).toBe(true);
    });

    it("should reject inputs with letters or symbols", () => {
      expect(aadhaarSchema.safeParse("12345678901A").success).toBe(false);
      expect(aadhaarSchema.safeParse("1234-5678-901").success).toBe(false);
    });

    it("should reject inputs with incorrect lengths", () => {
      expect(aadhaarSchema.safeParse("12345678901").success).toBe(false);
      expect(aadhaarSchema.safeParse("1234567890123").success).toBe(false);
    });
  });

  describe("PAN Number Validation", () => {
    it("should accept valid PAN numbers", () => {
      expect(panSchema.safeParse("ABCDE1234F").success).toBe(true);
      expect(panSchema.safeParse("XYZAB9876Q").success).toBe(true);
    });

    it("should reject incorrect PAN formats", () => {
      // 4 letters instead of 5
      expect(panSchema.safeParse("ABCD1234F").success).toBe(false);
      // 3 digits instead of 4
      expect(panSchema.safeParse("ABCDE123F").success).toBe(false);
      // No final letter
      expect(panSchema.safeParse("ABCDE12345").success).toBe(false);
      // Lowercase (before manual standard transformation)
      expect(panSchema.safeParse("abcde1234f").success).toBe(false);
    });
  });

  describe("OTP Validation", () => {
    it("should accept valid 6-digit numeric OTPs", () => {
      expect(otpSchema.safeParse("123456").success).toBe(true);
      expect(otpSchema.safeParse("000000").success).toBe(true);
    });

    it("should reject non-numeric or malformed OTPs", () => {
      expect(otpSchema.safeParse("12345").success).toBe(false);
      expect(otpSchema.safeParse("1234567").success).toBe(false);
      expect(otpSchema.safeParse("12345a").success).toBe(false);
    });
  });
});
