import { NextResponse } from "next/server";
import { z } from "zod";
import { otpStore, submissionsStore } from "@/services/mockStore";
import { prisma, dbConnected } from "@/lib/prisma";
import { cookies } from "next/headers";

const submitSchema = z.object({
  aadhaarNumber: z
    .string()
    .regex(/^\d{12}$/, "Aadhaar Number must be exactly 12 numeric digits."),
  entrepreneurName: z
    .string()
    .min(3, "Entrepreneur Name must be at least 3 characters."),
  panNumber: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "PAN must match format [A-Z]{5}[0-9]{4}[A-Z]{1}."),
  panType: z.string(),
  pinCode: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

interface SubmissionResultData {
  id: string;
  aadhaar: string;
  entrepreneurName: string;
  pan: string;
  panType: string;
  otpVerified: boolean;
  pinCode: string | null;
  city: string | null;
  state: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = submitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { aadhaarNumber, entrepreneurName, panNumber, panType, pinCode, city, state } = parsed.data;

    // 1. Confirm Aadhaar verification
    const storedOtp = otpStore.get(aadhaarNumber);

    // Cookie fallback for serverless environments (e.g. Vercel)
    let sessionData: { aadhaarNumber: string; entrepreneurName: string } | null = null;
    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get("aadhaar_session")?.value;
      if (sessionCookie) {
        sessionData = JSON.parse(sessionCookie);
      }
    } catch (e) {
      console.warn("Failed to parse aadhaar_session cookie:", e);
    }

    const isVerified = (storedOtp && storedOtp.verified) || (sessionData && sessionData.aadhaarNumber === aadhaarNumber);

    if (!isVerified) {
      return NextResponse.json(
        { success: false, error: "Aadhaar OTP verification is required to submit this registration." },
        { status: 400 }
      );
    }

    const submissionData = {
      aadhaar: aadhaarNumber,
      entrepreneurName,
      pan: panNumber,
      panType,
      otpVerified: true,
      pinCode: pinCode || null,
      city: city || null,
      state: state || null,
    };

    let finalSubmission: SubmissionResultData = {} as SubmissionResultData;
    let savedInDb = false;

    // 2. Persist to DB or fallback memory
    if (dbConnected) {
      try {
        finalSubmission = await prisma.submission.create({
          data: submissionData,
        });
        savedInDb = true;
      } catch (err) {
        console.warn("Prisma write failed. Falling back to memory store. Error:", err);
      }
    }

    if (!savedInDb) {
      // Memory Store Fallback
      const record = {
        id: crypto.randomUUID(),
        ...submissionData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      submissionsStore.push(record);
      finalSubmission = record;
    }

    // 3. Clear OTP verification cache to avoid replay
    otpStore.delete(aadhaarNumber);
    try {
      const cookieStore = await cookies();
      cookieStore.delete("aadhaar_session");
    } catch (e) {
      console.warn("Failed to clear aadhaar_session cookie:", e);
    }

    console.log(`[Submission Success] ID: ${finalSubmission.id}, DB Saved: ${savedInDb}`);

    return NextResponse.json({
      success: true,
      message: "Udyam Registration Step 1 & 2 completed successfully.",
      dbSaved: savedInDb,
      data: {
        id: finalSubmission.id,
        entrepreneurName: finalSubmission.entrepreneurName,
        aadhaarMasked: `XXXXXXXX${aadhaarNumber.slice(-4)}`,
        pan: finalSubmission.pan,
        panType: finalSubmission.panType,
        pinCode: finalSubmission.pinCode,
        city: finalSubmission.city,
        state: finalSubmission.state,
        createdAt: finalSubmission.createdAt,
      },
    });
  } catch (error) {
    console.error("Error finalizing submission:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
