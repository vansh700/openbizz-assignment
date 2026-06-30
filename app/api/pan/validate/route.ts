import { NextResponse } from "next/server";
import { z } from "zod";
import { otpStore, submissionsStore } from "@/services/mockStore";
import { prisma, dbConnected } from "@/lib/prisma";

const panValidateSchema = z.object({
  aadhaarNumber: z
    .string()
    .regex(/^\d{12}$/, "Aadhaar Number must be exactly 12 numeric digits."),
  panNumber: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "PAN must match format [A-Z]{5}[0-9]{4}[A-Z]{1}."),
  panType: z.enum([
    "PROPRIETORSHIP",
    "PARTNERSHIP",
    "HUF",
    "PRIVATE_LIMITED",
    "PUBLIC_LIMITED",
    "COOPERATIVE",
    "LLP",
    "TRUST",
  ]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = panValidateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { aadhaarNumber, panNumber, panType } = parsed.data;

    // 1. Verify Aadhaar OTP check was passed
    const storedOtp = otpStore.get(aadhaarNumber);
    if (!storedOtp || !storedOtp.verified) {
      return NextResponse.json(
        { success: false, error: "Aadhaar validation has not been completed. Please verify Aadhaar OTP first." },
        { status: 400 }
      );
    }

    // 2. Perform duplicate check (Ensure PAN isn't registered yet)
    let isDuplicate = false;
    if (dbConnected) {
      try {
        const existing = await prisma.submission.findFirst({
          where: { pan: panNumber },
        });
        if (existing) isDuplicate = true;
      } catch (err) {
        console.warn("DB check failed, using fallback duplicate check:", err);
        isDuplicate = submissionsStore.some((sub) => sub.pan === panNumber);
      }
    } else {
      isDuplicate = submissionsStore.some((sub) => sub.pan === panNumber);
    }

    if (isDuplicate) {
      return NextResponse.json(
        { success: false, error: `PAN ${panNumber} is already registered on this portal. Only one Udyam registration is allowed per PAN.` },
        { status: 400 }
      );
    }

    // 3. Simulate IT Department validation
    // For demonstration, PANs starting with 'Z' will fail verification (simulating an IT Dept mismatch)
    if (panNumber.startsWith("Z")) {
      return NextResponse.json(
        { success: false, error: "PAN validation failed. Name or details do not match the Income Tax Department database records." },
        { status: 400 }
      );
    }

    console.log(`[PAN Validated] PAN: ${panNumber}, Type: ${panType} associated with Aadhaar ${aadhaarNumber}.`);

    return NextResponse.json({
      success: true,
      message: "PAN validated successfully against Income Tax Department records.",
      details: {
        pan: panNumber,
        panType,
        taxPayerName: storedOtp.entrepreneurName.toUpperCase(),
      },
    });
  } catch (error) {
    console.error("Error validating PAN:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
