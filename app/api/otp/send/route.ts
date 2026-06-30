import { NextResponse } from "next/server";
import { z } from "zod";
import { otpStore } from "@/services/mockStore";

const sendOtpSchema = z.object({
  aadhaarNumber: z
    .string()
    .regex(/^\d{12}$/, "Aadhaar Number must be exactly 12 numeric digits."),
  entrepreneurName: z
    .string()
    .min(3, "Entrepreneur Name must be at least 3 characters.")
    .max(100, "Entrepreneur Name is too long."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = sendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { aadhaarNumber, entrepreneurName } = parsed.data;

    // Generate a random 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in global store with 3-minute expiry
    const expiresAt = Date.now() + 3 * 60 * 1000;
    otpStore.set(aadhaarNumber, {
      otp: generatedOtp,
      expiresAt,
      verified: false,
      entrepreneurName,
    });

    console.log(`[OTP Sent] Aadhaar: ${aadhaarNumber}, Name: ${entrepreneurName}, OTP: ${generatedOtp}`);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully to registered mobile number.",
      // Include the generated OTP in development/test response so the user can easily see it
      otp: generatedOtp,
      expiresInSeconds: 180,
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
