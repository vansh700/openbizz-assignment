"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, Copy, FileText, Database, RotateCcw } from "lucide-react";

interface SuccessStepProps {
  data: {
    id: string;
    entrepreneurName: string;
    aadhaarMasked: string;
    pan: string;
    panType: string;
    pinCode?: string;
    city?: string;
    state?: string;
    createdAt: string;
  };
  dbSaved: boolean;
  onReset: () => void;
}

export default function SuccessStep({ data, dbSaved, onReset }: SuccessStepProps) {
  useEffect(() => {
    // Fire confetti on load
    const duration = 2 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#2563eb", "#f97316", "#10b981"],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#2563eb", "#f97316", "#10b981"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  const handleCopyId = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(data.id);
      alert("Reference ID copied to clipboard!");
    }
  };

  // Generate a mock Udyam registration ID
  const udyamRefNumber = `UDYAM-${data.state ? data.state.slice(0, 2).toUpperCase() : "IN"}-${data.city ? data.city.slice(0, 3).toUpperCase() : "REG"}-${Math.floor(1000000 + Math.random() * 9000000)}`;

  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-500 animate-bounce">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Registration Initialized!
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Udyam verification steps 1 & 2 completed successfully.
          </p>
        </div>
      </div>

      {/* Database Status badge */}
      <div className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-3.5 py-1 text-xs text-muted-foreground justify-center">
        <Database className="h-3.5 w-3.5" />
        <span>Persistence Status: </span>
        <strong className={dbSaved ? "text-emerald-500" : "text-saffron"}>
          {dbSaved ? "Saved to PostgreSQL" : "Saved in Local Memory Cache"}
        </strong>
      </div>

      {/* Receipt card */}
      <div className="rounded-xl border border-border bg-card p-6 text-left shadow-sm divide-y divide-border/60 max-w-md mx-auto relative overflow-hidden tricolor-border">
        {/* Header receipt info */}
        <div className="pb-4">
          <div className="flex justify-between items-start gap-2">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Verification Reference Number</p>
              <h3 className="text-sm font-extrabold text-foreground font-mono mt-0.5 uppercase tracking-wide">
                {udyamRefNumber}
              </h3>
            </div>
            <button
              onClick={handleCopyId}
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded hover:bg-accent border border-border bg-card shadow-sm cursor-pointer"
              title="Copy Reference ID"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Form fields summary list */}
        <div className="py-4 space-y-3.5 text-xs">
          <div className="flex justify-between items-center gap-2">
            <span className="text-muted-foreground font-medium">Entrepreneur Name</span>
            <span className="font-bold text-foreground text-right">{data.entrepreneurName}</span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-muted-foreground font-medium">Aadhaar (Verified)</span>
            <span className="font-mono text-foreground">{data.aadhaarMasked}</span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-muted-foreground font-medium">PAN Number</span>
            <span className="font-mono font-bold text-foreground">{data.pan}</span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-muted-foreground font-medium">Organisation Type</span>
            <span className="font-semibold text-foreground text-right uppercase tracking-wider text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded">
              {data.panType.replace("_", " ")}
            </span>
          </div>
          {data.pinCode && (
            <div className="flex justify-between items-center gap-2">
              <span className="text-muted-foreground font-medium">Location Details</span>
              <span className="font-semibold text-foreground text-right">
                {data.city}, {data.state} ({data.pinCode})
              </span>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-4 flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3 text-primary" />
            Status: Active Draft
          </span>
          <span>Verified on {new Date(data.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="pt-2">
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-3 px-6 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all cursor-pointer w-full sm:w-auto"
        >
          <RotateCcw className="h-4 w-4" />
          Register Another Enterprise
        </button>
      </div>
    </div>
  );
}
