import { useState } from "react";
import { useLocation } from "wouter";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface TosAgreementModalProps {
  open: boolean;
  onClose: () => void;
  onAccepted: () => void;
  planName: string;
  priceLabel: string;
}

export function TosAgreementModal({ open, onClose, onAccepted, planName, priceLabel }: TosAgreementModalProps) {
  const [, navigate] = useLocation();
  const [checkedTos, setCheckedTos] = useState(false);
  const [checkedLiability, setCheckedLiability] = useState(false);
  const [checkedArbitration, setCheckedArbitration] = useState(false);
  const [checkedRefund, setCheckedRefund] = useState(false);

  const acceptTosMutation = trpc.legal.acceptTos.useMutation({
    onSuccess: () => {
      onAccepted();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to record agreement. Please try again.");
    },
  });

  const allChecked = checkedTos && checkedLiability && checkedArbitration && checkedRefund;

  const handleAccept = () => {
    if (!allChecked) {
      toast.error("Please confirm all agreements before proceeding.");
      return;
    }
    acceptTosMutation.mutate({ tosVersion: "1.0" });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-card border border-border/60 max-w-lg w-full max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Before you subscribe
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {planName} · {priceLabel}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4 max-h-[50vh]">
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-200/80">
                Please read and confirm each statement below. These agreements are legally binding and govern your use of InboxBrief.
              </p>
            </div>

            <div className="space-y-3">
              {/* ToS */}
              <div className="flex gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
                <Checkbox
                  id="tos-check"
                  checked={checkedTos}
                  onCheckedChange={(v) => setCheckedTos(!!v)}
                  className="mt-0.5 flex-shrink-0"
                />
                <Label htmlFor="tos-check" className="text-xs text-foreground/80 leading-relaxed cursor-pointer">
                  I have read and agree to the{" "}
                  <button
                    type="button"
                    onClick={() => { window.open("/terms", "_blank"); }}
                    className="text-primary hover:underline"
                  >
                    Terms of Service
                  </button>
                  {" "}(Version 1.0), including all subscription, cancellation, and acceptable use policies.
                </Label>
              </div>

              {/* Liability */}
              <div className="flex gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
                <Checkbox
                  id="liability-check"
                  checked={checkedLiability}
                  onCheckedChange={(v) => setCheckedLiability(!!v)}
                  className="mt-0.5 flex-shrink-0"
                />
                <Label htmlFor="liability-check" className="text-xs text-foreground/80 leading-relaxed cursor-pointer">
                  I understand that InboxBrief is provided "as-is" without warranties. 16 Star Collective LLC's total liability is limited to the amount paid in the prior 3 months, and they are not liable for missed emails, missed leads, or business losses.
                </Label>
              </div>

              {/* Arbitration */}
              <div className="flex gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
                <Checkbox
                  id="arbitration-check"
                  checked={checkedArbitration}
                  onCheckedChange={(v) => setCheckedArbitration(!!v)}
                  className="mt-0.5 flex-shrink-0"
                />
                <Label htmlFor="arbitration-check" className="text-xs text-foreground/80 leading-relaxed cursor-pointer">
                  I agree that any disputes will be resolved through binding individual arbitration, not class action lawsuits. I waive my right to a jury trial for disputes related to this service.
                </Label>
              </div>

              {/* Refund */}
              <div className="flex gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
                <Checkbox
                  id="refund-check"
                  checked={checkedRefund}
                  onCheckedChange={(v) => setCheckedRefund(!!v)}
                  className="mt-0.5 flex-shrink-0"
                />
                <Label htmlFor="refund-check" className="text-xs text-foreground/80 leading-relaxed cursor-pointer">
                  I understand that all subscription fees are non-refundable. If I have an issue, I will contact lesterantoine@16starcollective.com for one-on-one resolution before pursuing any other action.
                </Label>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-6 pt-4 border-t border-border/40 flex flex-col gap-3">
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-white border-0 h-11 disabled:opacity-40"
            disabled={!allChecked || acceptTosMutation.isPending}
            onClick={handleAccept}
          >
            {acceptTosMutation.isPending ? "Recording agreement..." : "I Agree — Continue to Payment"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            Cancel
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Your agreement is recorded with a timestamp and IP address for legal compliance.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
