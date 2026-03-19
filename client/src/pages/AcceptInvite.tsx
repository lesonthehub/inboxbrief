import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, CheckCircle, XCircle, Loader2, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function AcceptInvite() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [phone, setPhone] = useState("");
  const [accepted, setAccepted] = useState(false);

  // Validate the invite token
  const { data: invite, isLoading: inviteLoading, error: inviteError } = trpc.team.validateInvite.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const acceptMutation = trpc.team.acceptInvite.useMutation({
    onSuccess: () => {
      setAccepted(true);
      toast.success("You've joined the team!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to accept invite.");
    },
  });

  const handleAccept = () => {
    if (!phone.trim()) {
      toast.error("Please enter your phone number for SMS briefings.");
      return;
    }
    acceptMutation.mutate({ token, phone: phone.trim() });
  };

  if (authLoading || inviteLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Token invalid or expired
  if (inviteError || !invite) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Invite not found
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            This invite link is invalid or has expired. Ask your team owner to send a new invite.
          </p>
          <Button
            className="bg-primary hover:bg-primary/90 text-white border-0"
            onClick={() => navigate("/")}
          >
            Go to InboxBrief
          </Button>
        </div>
      </div>
    );
  }

  // Already accepted
  if (accepted) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            You're on the team!
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            You'll receive SMS briefings at the number you provided. Head to your dashboard to set your schedule.
          </p>
          <Button
            className="bg-primary hover:bg-primary/90 text-white border-0"
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Wordmark */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="font-bold text-xl" style={{ fontFamily: "Space Grotesk, sans-serif" }}>InboxBrief</span>
        </div>

        <div className="bg-card border border-border/40 rounded-2xl p-6 sm:p-8">
          {/* Invite header */}
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border/40">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Team invitation from</p>
              <p className="font-bold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                {invite.ownerName || "Your team owner"}
              </p>
              <p className="text-xs text-muted-foreground">{invite.inviteEmail}</p>
            </div>
          </div>

          <h2 className="text-lg font-bold mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Join their InboxBrief team
          </h2>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            You'll receive personalized SMS briefings from your shared inbox. Enter your phone number to get started.
          </p>

          {!isAuthenticated ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground bg-primary/5 border border-primary/20 rounded-lg p-3">
                You'll need to sign in or create an account first. Your invite will be waiting when you return.
              </p>
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white border-0 h-11"
                onClick={() => {
                  window.location.href = getLoginUrl(`/invite/${token}`);
                }}
              >
                Sign in to Accept Invite
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="invite-phone" className="text-xs text-muted-foreground">
                  Your phone number for SMS briefings
                </Label>
                <Input
                  id="invite-phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="bg-background border-border/60 h-11"
                />
                <p className="text-xs text-muted-foreground">Include country code (e.g. +1 for US/Canada)</p>
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white border-0 h-11"
                onClick={handleAccept}
                disabled={acceptMutation.isPending}
              >
                {acceptMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Joining team...</>
                ) : (
                  "Accept Invite & Join Team"
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By accepting, you agree to receive automated SMS messages from InboxBrief.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
