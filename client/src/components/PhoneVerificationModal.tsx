/**
 * PhoneVerificationModal
 *
 * Shown when a user has not yet verified their phone number.
 * Sends a 6-digit OTP via SMS and verifies it before allowing briefings.
 * Also shown when the user changes their phone number in Settings.
 */
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Phone, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface PhoneVerificationModalProps {
  open: boolean;
  phone: string;
  onVerified: () => void;
  onClose?: () => void;
}

type Step = "send" | "verify" | "success";

export function PhoneVerificationModal({ open, phone, onVerified, onClose }: PhoneVerificationModalProps) {
  const [step, setStep] = useState<Step>("send");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sendOtp = trpc.phoneVerification.sendCode.useMutation({
    onSuccess: () => {
      setStep("verify");
      setError(null);
      toast.success("Verification code sent! Check your phone.");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const verifyOtp = trpc.phoneVerification.verifyCode.useMutation({
    onSuccess: () => {
      setStep("success");
      setError(null);
      setTimeout(() => {
        onVerified();
      }, 1500);
    },
    onError: (err) => {
      setError(err.message);
      setCode("");
    },
  });

  const handleSend = () => {
    setError(null);
    sendOtp.mutate({ phone });
  };

  const handleVerify = () => {
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setError(null);
    verifyOtp.mutate({ phone, code });
  };

  const handleCodeChange = (val: string) => {
    // Only allow digits, max 6
    const digits = val.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && onClose) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-[#0f172a] border border-indigo-500/30 text-white">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <DialogTitle className="text-white text-lg">Verify Your Phone</DialogTitle>
              <DialogDescription className="text-slate-400 text-sm">
                Required before sending briefings
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === "send" && (
          <div className="space-y-5">
            <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg p-4">
              <p className="text-sm text-slate-300 leading-relaxed">
                To protect your privacy, we verify your phone number before sending any briefings.
                A 6-digit code will be sent to:
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Phone className="w-4 h-4 text-indigo-400" />
                <span className="font-mono text-indigo-300 font-semibold">{phone}</span>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-950/40 border border-red-500/30 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <Button
              onClick={handleSend}
              disabled={sendOtp.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-11"
            >
              {sendOtp.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending Code...</>
              ) : (
                <><Phone className="w-4 h-4 mr-2" /> Send Verification Code</>
              )}
            </Button>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-5">
            <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg p-4">
              <p className="text-sm text-slate-300 leading-relaxed">
                Enter the 6-digit code sent to <span className="font-mono text-indigo-300">{phone}</span>.
                The code expires in 10 minutes.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Verification Code</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="000000"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleVerify(); }}
                maxLength={6}
                className="text-center text-2xl font-mono tracking-[0.5em] h-14 bg-slate-800/60 border-slate-600 text-white placeholder:text-slate-600 focus:border-indigo-500"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-950/40 border border-red-500/30 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => { setStep("send"); setCode(""); setError(null); }}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Resend Code
              </Button>
              <Button
                onClick={handleVerify}
                disabled={verifyOtp.isPending || code.length !== 6}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
              >
                {verifyOtp.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                ) : (
                  "Verify Code"
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <div className="text-center">
              <h3 className="text-white font-semibold text-lg">Phone Verified!</h3>
              <p className="text-slate-400 text-sm mt-1">
                Your number is confirmed. You're all set to receive briefings.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
