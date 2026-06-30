import { NextResponse } from "next/server";
import { z } from "zod";
import { otpStore } from "@/services/mockStore";

const verifyOtpSchema = z.object({
  aadhaarNumber: z
    .string()
    .regex(/^\d{12}$/, "Aadhaar Number must be exactly 12 numeric digits."),
  otp: z
    .string()
    .regex(/^\d{6}$/, "OTP must be exactly 6 numeric digits."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { aadhaarNumber, otp } = parsed.data;
    const stored = otpStore.get(aadhaarNumber);

    if (!stored) {
      return NextResponse.json(
        { success: false, error: "No OTP request found for this Aadhaar. Please request OTP first." },
        { status: 400 }
      );
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(aadhaarNumber);
      return NextResponse.json(
        { success: false, error: "OTP has expired. Please generate a new OTP." },
        { status: 400 }
      );
    }

    if (stored.otp !== otp) {
      return NextResponse.json(
        { success: false, error: "Invalid OTP. Please enter the correct OTP." },
        { status: 400 }
      );
    }

    // Set verified flag to true
    stored.verified = true;
    otpStore.set(aadhaarNumber, stored);

    console.log(`[OTP Verified] Aadhaar: ${aadhaarNumber} successfully authenticated.`);

    return NextResponse.json({
      success: true,
      message: "Aadhaar verified successfully.",
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
