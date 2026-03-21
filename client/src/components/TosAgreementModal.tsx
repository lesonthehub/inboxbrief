import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const TOS_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663030996517/XbAFtDntDvaW6nENwp7sVJ/inboxbrief_tos_v3_1bd41576.pdf";
const PRIVACY_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663030996517/XbAFtDntDvaW6nENwp7sVJ/inboxbrief_privacy_v3_9fa80d21.pdf";

interface TosAgreementModalProps {
  open: boolean;
  onClose: () => void;
  onAccepted: () => void;
  planName: string;
  priceLabel: string;
}

export function TosAgreementModal({
  open,
  onClose,
  onAccepted,
  planName,
  priceLabel,
}: TosAgreementModalProps) {
  const [checked, setChecked] = useState(false);

  const acceptTosMutation = trpc.legal.acceptTos.useMutation({
    onSuccess: () => {
      onAccepted();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to record agreement. Please try again.");
    },
  });

  const handleAccept = () => {
    if (!checked) {
      toast.error("Please confirm the agreement before proceeding.");
      return;
    }
    acceptTosMutation.mutate({ tosVersion: "1.0" });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-card border border-border/60 max-w-sm w-full p-0">
        <DialogHeader className="p-5 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                {planName} Plan
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {priceLabel} · Confirm to continue
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* Single minimal checkbox */}
          <label
            className="flex items-start gap-3 cursor-pointer"
            htmlFor="tos-modal-check"
            onClick={() => setChecked((c) => !c)}
          >
            <div
              className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                checked ? "bg-primary border-primary" : "border-border/60 bg-muted/20"
              }`}
            >
              {checked && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-xs text-muted-foreground leading-relaxed select-none">
              I agree to the{" "}
              <a
                href={TOS_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-primary hover:underline"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href={PRIVACY_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-primary hover:underline"
              >
                Privacy Policy
              </a>
              .
            </span>
          </label>

          <div className="flex gap-2">
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 text-white border-0 h-10"
              disabled={!checked || acceptTosMutation.isPending}
              onClick={handleAccept}
            >
              {acceptTosMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                "Continue to Payment"
              )}
            </Button>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground h-10"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
