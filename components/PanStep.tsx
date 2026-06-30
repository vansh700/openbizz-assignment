/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShieldCheck, ShieldAlert, RefreshCw, Landmark, ArrowLeft, Send } from "lucide-react";

interface FieldSchema {
  name: string;
  label: string;
  type: string;
  placeholder: string;
  required: boolean;
  options?: { label: string; value: string }[];
  validation: {
    pattern?: string;
    message: string;
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

interface PanStepProps {
  panSchema: StepSchema;
  aadhaarNumber: string;
  entrepreneurName: string;
  onSuccess: (submissionResult: any) => void;
  onBack: () => void;
  savedData: { panNumber: string; panType: string; pinCode: string; district: string; state: string };
  setSavedData: (data: any) => void;
}

export default function PanStep({
  panSchema,
  aadhaarNumber,
  entrepreneurName,
  onSuccess,
  onBack,
  savedData,
  setSavedData,
}: PanStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [panValidated, setPanValidated] = useState(false);
  const [isValidatingPan, setIsValidatingPan] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  const selectOptions = panSchema.fields.find((f) => f.name === "panType")?.options || [];

  // Zod schema for Step 2
  const step2Schema = z.object({
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
    panNumber: z
      .string()
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "PAN must be a valid 10-character code matching format [A-Z]{5}[0-9]{4}[A-Z]{1}."),
    pinCode: z
      .string()
      .regex(/^\d{6}$/, "Pin Code must be exactly 6 numeric digits."),
    district: z.string().min(1, "District is required."),
    state: z.string().min(1, "State is required."),
  });

  type Step2FormValues = z.infer<typeof step2Schema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Step2FormValues>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      panType: (savedData.panType as any) || "",
      panNumber: savedData.panNumber || "",
      pinCode: savedData.pinCode || "",
      district: savedData.district || "",
      state: savedData.state || "",
    },
  });

  const pinCodeValue = watch("pinCode");
  const panValue = watch("panNumber");
  const panTypeValue = watch("panType");

  // Effect to lookup PIN Code details
  useEffect(() => {
    if (pinCodeValue && /^\d{6}$/.test(pinCodeValue)) {
      const fetchPinDetails = async () => {
        setPinLoading(true);
        setApiError(null);
        try {
          const response = await fetch(`https://api.postalpincode.in/pincode/${pinCodeValue}`);
          const data = await response.json();
          
          if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice) {
            const postOffice = data[0].PostOffice[0];
            const dist = postOffice.District || postOffice.Name;
            const st = postOffice.State;
            
            setValue("district", dist, { shouldValidate: true });
            setValue("state", st, { shouldValidate: true });

            // Temporarily store progress
            setSavedData((prev: any) => ({
              ...prev,
              pinCode: pinCodeValue,
              district: dist,
              state: st,
            }));
          } else {
            throw new Error("Invalid or unrecognized Area PIN Code.");
          }
        } catch (err: any) {
          console.warn("Postal PIN Code lookup failed:", err.message);
          setValue("district", "", { shouldValidate: true });
          setValue("state", "", { shouldValidate: true });
          setApiError("Unable to auto-fill location from PIN. Please check Pin Code value or type manually.");
        } finally {
          setPinLoading(false);
        }
      };

      fetchPinDetails();
    }
  }, [pinCodeValue, setValue, setSavedData]);

  // Handle local state tracking of values changed by user
  useEffect(() => {
    setSavedData((prev: any) => ({
      ...prev,
      panNumber: panValue,
      panType: panTypeValue,
    }));
    // If user changes PAN after validation, reset validated status
    if (panValidated) {
      setPanValidated(false);
      setApiSuccess(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panValue, panTypeValue, setSavedData]);

  const onValidatePan = async () => {
    // Validate formatting before API call
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panValue)) {
      setApiError("Please enter a correctly formatted 10-digit PAN first (e.g. ABCDE1234F).");
      return;
    }
    if (!panTypeValue) {
      setApiError("Please select the Type of Organisation before validating the PAN.");
      return;
    }

    setIsValidatingPan(true);
    setApiError(null);
    setApiSuccess(null);

    try {
      const response = await fetch("/api/pan/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aadhaarNumber,
          panNumber: panValue,
          panType: panTypeValue,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "PAN validation failed against Income Tax DB.");
      }

      setPanValidated(true);
      setApiSuccess(`PAN verified successfully. Registered to ${resData.details.taxPayerName}.`);
    } catch (err: any) {
      setApiError(err.message || "PAN verification service unavailable.");
    } finally {
      setIsValidatingPan(false);
    }
  };

  const onSubmitForm = async (data: Step2FormValues) => {
    if (!panValidated) {
      setApiError("Please validate the PAN number against Income Tax records before submitting.");
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aadhaarNumber,
          entrepreneurName,
          panNumber: data.panNumber,
          panType: data.panType,
          pinCode: data.pinCode,
          city: data.district,
          state: data.state,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Submission failed.");
      }

      onSuccess(resData);
    } catch (err: any) {
      setApiError(err.message || "An unexpected error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border/80 pb-4 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {panSchema.title}
            </h2>
            <p className="text-sm text-muted-foreground">{panSchema.description}</p>
          </div>
          <div className="inline-flex self-center sm:self-auto items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            Aadhaar Verified
          </div>
        </div>
      </div>

      {(apiError || apiSuccess) && (
        <div className="space-y-3">
          {apiError && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive animate-in fade-in slide-in-from-top-1">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Validation Alert</p>
                <p className="mt-0.5 opacity-90">{apiError}</p>
              </div>
            </div>
          )}
          {apiSuccess && (
            <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-600 dark:text-emerald-400 animate-in fade-in slide-in-from-top-1">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Income Tax DB Match</p>
                <p className="mt-0.5 opacity-90">{apiSuccess}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tester Utility Tip */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 text-xs text-primary leading-normal">
        <p className="font-bold flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary/40"></span>
          Testing Tip
        </p>
        <p className="mt-1">
          Pincode auto-fill triggers automatically when a 6-digit PIN code (e.g. <strong>110001</strong> for Delhi or <strong>400001</strong> for Mumbai) is completed. PAN validation simulates an official check (PANs beginning with <strong>&apos;Z&apos;</strong> will simulate database mismatch errors).
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5">
        {/* Dropdown Select for Organisation Type */}
        <div className="space-y-1.5">
          <label htmlFor="panType" className="text-sm font-bold text-foreground">
            Type of Organisation / संगठन का प्रकार <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Landmark className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <select
              id="panType"
              {...register("panType")}
              className={`w-full rounded-lg border bg-card pl-11 pr-4 py-2.5 text-sm text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer ${
                errors.panType ? "border-destructive focus:ring-destructive/20" : "border-border"
              }`}
            >
              <option value="">Select Organisation Type</option>
              {selectOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {errors.panType && (
            <p className="text-xs font-semibold text-destructive">{errors.panType.message}</p>
          )}
        </div>

        {/* PAN Number Input & Verification Row */}
        <div className="space-y-1.5">
          <label htmlFor="panNumber" className="text-sm font-bold text-foreground">
            Permanent Account Number (PAN) / स्थायी खाता संख्या <span className="text-destructive">*</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              id="panNumber"
              placeholder="e.g. ABCDE1234F"
              maxLength={10}
              {...register("panNumber")}
              className={`w-full rounded-lg border bg-card px-4 py-2.5 text-sm font-semibold tracking-wider font-mono text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all uppercase ${
                errors.panNumber ? "border-destructive focus:ring-destructive/20" : "border-border"
              }`}
            />
            <button
              type="button"
              onClick={onValidatePan}
              disabled={isValidatingPan || !panValue || panValidated}
              className={`rounded-lg px-6 py-2.5 text-sm font-bold shadow-sm transition-all border shrink-0 flex items-center justify-center gap-1.5 cursor-pointer ${
                panValidated
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                  : "bg-primary text-primary-foreground hover:bg-primary/95 hover:shadow disabled:opacity-50"
              }`}
            >
              {isValidatingPan ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : panValidated ? (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Validated
                </>
              ) : (
                "Validate PAN"
              )}
            </button>
          </div>
          {errors.panNumber && (
            <p className="text-xs font-semibold text-destructive">{errors.panNumber.message}</p>
          )}
        </div>

        {/* PIN Code & Auto-fill Location Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="pinCode" className="text-sm font-bold text-foreground">
              PIN Code <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="pinCode"
                placeholder="e.g. 110001"
                maxLength={6}
                {...register("pinCode")}
                className={`w-full rounded-lg border bg-card px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all ${
                  errors.pinCode ? "border-destructive focus:ring-destructive/20" : "border-border"
                }`}
              />
              {pinLoading && (
                <RefreshCw className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
            {errors.pinCode && (
              <p className="text-xs font-semibold text-destructive">{errors.pinCode.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="district" className="text-sm font-bold text-foreground">
              District / City
            </label>
            <input
              type="text"
              id="district"
              placeholder="District"
              {...register("district")}
              className={`w-full rounded-lg border bg-card px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all border-border ${
                watch("district") ? "bg-muted/30 cursor-not-allowed opacity-90" : ""
              }`}
            />
            {errors.district && (
              <p className="text-xs font-semibold text-destructive">{errors.district.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="state" className="text-sm font-bold text-foreground">
              State
            </label>
            <input
              type="text"
              id="state"
              placeholder="State"
              {...register("state")}
              className={`w-full rounded-lg border bg-card px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all border-border ${
                watch("state") ? "bg-muted/30 cursor-not-allowed opacity-90" : ""
              }`}
            />
            {errors.state && (
              <p className="text-xs font-semibold text-destructive">{errors.state.message}</p>
            )}
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/60">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-1/3 rounded-lg border border-border bg-card py-2.5 px-4 text-sm font-bold text-foreground hover:bg-accent transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Aadhaar
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !panValidated}
            className="flex w-full sm:w-2/3 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 px-4 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                {panSchema.actionButton.submittingLabel}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {panSchema.actionButton.label}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
