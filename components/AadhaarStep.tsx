/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShieldAlert, KeyRound, Timer, RefreshCw, ArrowRight, UserCheck } from "lucide-react";

interface FieldSchema {
  name: string;
  label: string;
  type: string;
  placeholder: string;
  required: boolean;
  description?: string;
  validation: {
    pattern?: string;
    message: string;
    minLength?: number;
    maxLength?: number;
    requiredValue?: boolean;
  };
}

interface StepSchema {
  id: string;
  title: string;
  description: string;
  fields: FieldSchema[];
  actionButton: {
    label: string;
    submittingLabel: string;
  };
}

interface AadhaarStepProps {
  aadhaarSchema: StepSchema;
  otpSchema: StepSchema;
  onSuccess: (aadhaar: string, name: string) => void;
  savedData: { aadhaarNumber: string; entrepreneurName: string; declarationConsent: boolean };
  setSavedData: (data: any) => void;
}

export default function AadhaarStep({
  aadhaarSchema,
  otpSchema,
  onSuccess,
  savedData,
  setSavedData,
}: AadhaarStepProps) {
  const [showOtp, setShowOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [otpSentCode, setOtpSentCode] = useState<string | null>(null); // Visual aid for developer/tester
  const [timerSeconds, setTimerSeconds] = useState(180);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Zod schema for Step 1
  const step1Schema = z.object({
    aadhaarNumber: z
      .string()
      .regex(/^\d{12}$/, "Aadhaar Number must be exactly 12 numeric digits."),
    entrepreneurName: z
      .string()
      .min(3, "Entrepreneur Name must be at least 3 characters.")
      .max(100, "Entrepreneur Name is too long."),
    declarationConsent: z
      .boolean()
      .refine((val) => val === true, "You must check the box to declare consent before proceeding."),
  });

  type Step1FormValues = z.infer<typeof step1Schema>;

  // Zod schema for OTP Step
  const otpFormSchema = z.object({
    otp: z
      .string()
      .regex(/^\d{6}$/, "OTP must be exactly 6 numeric digits."),
  });

  type OtpFormValues = z.infer<typeof otpFormSchema>;

  const {
    register: register1,
    handleSubmit: handleSubmit1,
    formState: { errors: errors1 },
    getValues: getValues1,
  } = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      aadhaarNumber: savedData.aadhaarNumber || "",
      entrepreneurName: savedData.entrepreneurName || "",
      declarationConsent: savedData.declarationConsent || false,
    },
  });

  const {
    register: registerOtp,
    handleSubmit: handleSubmitOtp,
    formState: { errors: errorsOtp },
    reset: resetOtp,
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpFormSchema),
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timerSeconds]);

  // Format timer into MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const onSendOtp = async (data: Step1FormValues) => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to generate OTP. Please try again.");
      }

      // Persist step 1 data
      setSavedData({
        ...savedData,
        aadhaarNumber: data.aadhaarNumber,
        entrepreneurName: data.entrepreneurName,
        declarationConsent: data.declarationConsent,
      });

      // Show developer OTP indicator
      if (resData.otp) {
        setOtpSentCode(resData.otp);
      }

      setShowOtp(true);
      setTimerSeconds(180);
      setIsTimerActive(true);
    } catch (err: any) {
      setApiError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onVerifyOtp = async (data: OtpFormValues) => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      const { aadhaarNumber } = getValues1();
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aadhaarNumber,
          otp: data.otp,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Invalid OTP. Please try again.");
      }

      const { entrepreneurName } = getValues1();
      onSuccess(aadhaarNumber, entrepreneurName);
    } catch (err: any) {
      setApiError(err.message || "Invalid OTP verification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (isTimerActive) return;
    const values = getValues1();
    await onSendOtp(values);
  };

  const handleBackToAadhaar = () => {
    setShowOtp(false);
    setOtpSentCode(null);
    setApiError(null);
    resetOtp();
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border/80 pb-4 text-center sm:text-left">
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {showOtp ? otpSchema.title : aadhaarSchema.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {showOtp ? otpSchema.description : aadhaarSchema.description}
        </p>
      </div>

      {apiError && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive animate-in fade-in slide-in-from-top-1">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Verification Alert</p>
            <p className="mt-0.5 opacity-90">{apiError}</p>
          </div>
        </div>
      )}

      {/* Developer Assistant OTP Overlay */}
      {/* {showOtp && otpSentCode && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-600 dark:text-emerald-400">
          <p className="font-bold flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Simulated SMS Gate (Testing Utility)
          </p>
          <p className="mt-1 font-mono text-xs">
            OTP generated for verification: <strong className="text-base tracking-wider">{otpSentCode}</strong>
          </p>
        </div>
      )} */}

      {!showOtp ? (
        <form onSubmit={handleSubmit1(onSendOtp)} className="space-y-5">
          {aadhaarSchema.fields.map((field) => {
            if (field.type === "checkbox") {
              return (
                <div key={field.name} className="space-y-2">
                  <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 hover:border-border/100 transition-colors">
                    <input
                      type="checkbox"
                      id={field.name}
                      {...register1("declarationConsent")}
                      className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                    />
                    <label
                      htmlFor={field.name}
                      className="text-xs leading-normal text-muted-foreground select-none cursor-pointer"
                    >
                      {field.description}
                    </label>
                  </div>
                  {errors1.declarationConsent && (
                    <p className="text-xs font-semibold text-destructive">{errors1.declarationConsent.message}</p>
                  )}
                </div>
              );
            }

            return (
              <div key={field.name} className="space-y-1.5">
                <label htmlFor={field.name} className="text-sm font-bold text-foreground">
                  {field.label} <span className="text-destructive">*</span>
                </label>
                <input
                  type={field.type}
                  id={field.name}
                  placeholder={field.placeholder}
                  {...register1(field.name as "aadhaarNumber" | "entrepreneurName")}
                  className={`w-full rounded-lg border bg-card px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all ${
                    errors1[field.name as keyof Step1FormValues] ? "border-destructive focus:ring-destructive/20" : "border-border"
                  }`}
                />
                {errors1[field.name as keyof Step1FormValues] && (
                  <p className="text-xs font-semibold text-destructive">
                    {errors1[field.name as keyof Step1FormValues]?.message}
                  </p>
                )}
              </div>
            );
          })}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 px-4 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                {aadhaarSchema.actionButton.submittingLabel}
              </>
            ) : (
              <>
                {aadhaarSchema.actionButton.label}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmitOtp(onVerifyOtp)} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="otp" className="text-sm font-bold text-foreground">
              {otpSchema.fields[0].label} <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                id="otp"
                maxLength={6}
                placeholder={otpSchema.fields[0].placeholder}
                {...registerOtp("otp")}
                className={`w-full rounded-lg border bg-card pl-11 pr-4 py-2.5 text-base tracking-widest font-mono text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all ${
                  errorsOtp.otp ? "border-destructive focus:ring-destructive/20" : "border-border"
                }`}
              />
            </div>
            {errorsOtp.otp && (
              <p className="text-xs font-semibold text-destructive">{errorsOtp.otp.message}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg bg-muted/50 p-4 border border-border text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Timer className="h-4 w-4 text-primary" />
              <span>Time Remaining:</span>
              <span className={`font-mono font-bold ${timerSeconds < 30 ? "text-destructive" : "text-foreground"}`}>
                {formatTime(timerSeconds)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isTimerActive || isSubmitting}
              className={`flex items-center gap-1.5 font-bold ${
                isTimerActive ? "text-muted-foreground cursor-not-allowed" : "text-primary hover:underline cursor-pointer"
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSubmitting ? "animate-spin" : ""}`} />
              Resend OTP
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleBackToAadhaar}
              className="w-full sm:w-1/3 rounded-lg border border-border bg-card py-2.5 px-4 text-sm font-bold text-foreground hover:bg-accent transition-all cursor-pointer"
            >
              Change Details
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full sm:w-2/3 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 px-4 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {otpSchema.actionButton.submittingLabel}
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  {otpSchema.actionButton.label}
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
