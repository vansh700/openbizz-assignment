/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import formSchema from "@/scraped/schema.json";
import ProgressIndicator from "@/components/ProgressIndicator";
import AadhaarStep from "@/components/AadhaarStep";
import PanStep from "@/components/PanStep";
import SuccessStep from "@/components/SuccessStep";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ShieldCheck, Info } from "lucide-react";

export default function RegisterPage() {
  const [isClient, setIsClient] = useState(false);

  // Dynamic step persistence
  const [currentStep, setCurrentStep] = useLocalStorage<number>("udyam_current_step", 1);
  
  // Persisted state values
  const [aadhaarData, setAadhaarData] = useLocalStorage("udyam_aadhaar_data", {
    aadhaarNumber: "",
    entrepreneurName: "",
    declarationConsent: false,
  });

  const [panData, setPanData] = useLocalStorage("udyam_pan_data", {
    panNumber: "",
    panType: "",
    pinCode: "",
    district: "",
    state: "",
  });

  const [submissionResult, setSubmissionResult] = useLocalStorage<any>("udyam_submission_result", null);

  // Wait until mounted on client to prevent hydration mismatch since we rely on localStorage
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Show a sleek skeleton spinner during hydration
    return (
      <div className="flex-1 flex items-center justify-center bg-background py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-medium text-muted-foreground">Loading Portal...</p>
        </div>
      </div>
    );
  }

  // Schema mappings
  const aadhaarSchema = formSchema.steps[0];
  const otpSchema = formSchema.steps[1];
  const panSchema = formSchema.steps[2];

  const handleAadhaarVerified = (aadhaar: string, name: string) => {
    setAadhaarData((prev) => ({
      ...prev,
      aadhaarNumber: aadhaar,
      entrepreneurName: name,
    }));
    setCurrentStep(2);
  };

  const handlePanValidated = (result: any) => {
    setSubmissionResult(result);
    setCurrentStep(3);
  };

  const handleReset = () => {
    // Clear state
    setAadhaarData({
      aadhaarNumber: "",
      entrepreneurName: "",
      declarationConsent: false,
    });
    setPanData({
      panNumber: "",
      panType: "",
      pinCode: "",
      district: "",
      state: "",
    });
    setSubmissionResult(null);
    setCurrentStep(1);
    
    // Clear localStorage explicitly
    window.localStorage.removeItem("udyam_current_step");
    window.localStorage.removeItem("udyam_aadhaar_data");
    window.localStorage.removeItem("udyam_pan_data");
    window.localStorage.removeItem("udyam_submission_result");
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-background via-secondary/10 to-background py-8 px-4 sm:px-6 transition-colors duration-300">
      <div className="mx-auto max-w-xl">
        
        {/* Government Portal Header Alert Banner */}
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-saffron/20 bg-saffron/5 p-3.5 text-xs text-foreground/90">
          <Info className="h-4.5 w-4.5 text-saffron shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-saffron">Udyam Verification Portal Replica</p>
            <p className="mt-0.5 text-muted-foreground leading-normal">
              This is a development sandbox demonstrating digital identity verification workflows. Never enter actual password credentials or sensitive government details.
            </p>
          </div>
        </div>

        {/* Wizard Panel Container */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xl dark:shadow-2xl transition-all duration-300 relative overflow-hidden">
          
          {/* Saffron, White, Emerald Header stripe */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-saffron via-border to-emerald" />

          {/* Steps Progress Bar */}
          <div className="mb-6">
            <ProgressIndicator currentStep={currentStep} />
          </div>

          {/* Step Render Area */}
          <div className="mt-4">
            {currentStep === 1 && (
              <AadhaarStep
                aadhaarSchema={aadhaarSchema as any}
                otpSchema={otpSchema as any}
                onSuccess={handleAadhaarVerified}
                savedData={aadhaarData}
                setSavedData={setAadhaarData}
              />
            )}

            {currentStep === 2 && (
              <PanStep
                panSchema={panSchema as any}
                aadhaarNumber={aadhaarData.aadhaarNumber}
                entrepreneurName={aadhaarData.entrepreneurName}
                onSuccess={handlePanValidated}
                onBack={() => setCurrentStep(1)}
                savedData={panData}
                setSavedData={setPanData}
              />
            )}

            {currentStep === 3 && submissionResult && (
              <SuccessStep
                data={submissionResult.data}
                dbSaved={submissionResult.dbSaved}
                onReset={handleReset}
              />
            )}
          </div>
        </div>

        {/* Security Trust Indicator */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-semibold">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald" />
          <span>Secured with standard 256-bit encryption mock checks</span>
        </div>
      </div>
    </div>
  );
}
