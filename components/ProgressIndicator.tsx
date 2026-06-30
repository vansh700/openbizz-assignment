import { Check, User, CreditCard, Award } from "lucide-react";

interface ProgressIndicatorProps {
  currentStep: number; // 1, 2, or 3 (Success)
}

export default function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const steps = [
    {
      id: 1,
      label: "Aadhaar & OTP",
      subLabel: "Verification",
      icon: User,
    },
    {
      id: 2,
      label: "PAN & Org Type",
      subLabel: "Validation",
      icon: CreditCard,
    },
    {
      id: 3,
      label: "Finish",
      subLabel: "Udyam ID",
      icon: Award,
    },
  ];

  return (
    <div className="w-full py-4 px-2">
      <div className="relative flex items-center justify-between">
        {/* Progress bar background line */}
        <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-muted transition-all duration-500" />
        
        {/* Animated active progress bar line */}
        <div
          className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-primary transition-all duration-500 ease-in-out"
          style={{
            width: `${((Math.min(currentStep, 3) - 1) / (steps.length - 1)) * 100}%`,
          }}
        />

        {steps.map((step) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 bg-card text-xs font-semibold shadow-sm transition-all duration-500 ${
                  isCompleted
                    ? "border-primary bg-primary text-primary-foreground"
                    : isActive
                    ? "border-primary text-primary active-pulse scale-110"
                    : "border-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 stroke-[2.5]" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              
              <div className="mt-2 text-center">
                <p
                  className={`text-xs font-bold transition-colors duration-300 ${
                    isActive ? "text-primary" : "text-foreground/80"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[10px] text-muted-foreground">{step.subLabel}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
