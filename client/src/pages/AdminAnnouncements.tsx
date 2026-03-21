import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Pencil, Trash2, Info, AlertTriangle, CheckCircle, Tag, Power } from "lucide-react";
import { toast } from "sonner";

type AnnouncementType = "info" | "warning" | "success" | "promo";

const TYPE_LABELS: Record<AnnouncementType, { label: string; color: string; icon: React.ReactNode }> = {
  info: { label: "Info", color: "bg-blue-500/20 text-blue-300 border-blue-500/30", icon: <Info className="w-3 h-3" /> },
  warning: { label: "Warning", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", icon: <AlertTriangle className="w-3 h-3" /> },
  success: { label: "Success", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: <CheckCircle className="w-3 h-3" /> },
  promo: { label: "Promo", color: "bg-purple-500/20 text-purple-300 border-purple-500/30", icon: <Tag className="w-3 h-3" /> },
};

interface AnnouncementForm {
  message: string;
  type: AnnouncementType;
  expiresAt: string;
}

const EMPTY_FORM: AnnouncementForm = { message: "", type: "info", expiresAt: "" };

export default function AdminAnnouncements() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<AnnouncementForm>(EMPTY_FORM);

  const { data: announcements, isLoading } = trpc.announcements.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const createMutation = trpc.announcements.create.useMutation({
    onSuccess: () => {
      toast.success("Announcement created");
      utils.announcements.list.invalidate();
      utils.announcements.getActive.invalidate();
      setShowForm(false);
      setForm(EMPTY_FORM);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.announcements.update.useMutation({
    onSuccess: () => {
      toast.success("Announcement updated");
      utils.announcements.list.invalidate();
      utils.announcements.getActive.invalidate();
      setShowForm(false);
      setEditId(null);
      setForm(EMPTY_FORM);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.announcements.delete.useMutation({
    onSuccess: () => {
      toast.success("Announcement deleted");
      utils.announcements.list.invalidate();
      utils.announcements.getActive.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // Redirect non-admins
  if (isAuthenticated && user?.role !== "admin") {
    navigate("/dashboard");
    return null;
  }

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(a: { id: number; message: string; type: string; expiresAt: Date | null }) {
    setEditId(a.id);
    setForm({
      message: a.message,
      type: a.type as AnnouncementType,
      expiresAt: a.expiresAt ? new Date(a.expiresAt).toISOString().slice(0, 16) : "",
    });
    setShowForm(true);
  }

  function handleSubmit() {
    if (!form.message.trim()) return toast.error("Message is required");
    const payload = {
      message: form.message.trim(),
      type: form.type,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
    };
    if (editId !== null) {
      updateMutation.mutate({ id: editId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function toggleActive(a: { id: number; isActive: boolean }) {
    updateMutation.mutate({ id: a.id, isActive: !a.isActive });
  }

  const now = new Date();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-14">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="font-bold text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              InboxBrief
            </span>
          </button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Button>
        </div>
      </nav>

      <div className="container max-w-3xl mx-auto py-10 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Announcements
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Post site-wide banners visible to all visitors. Banners auto-expire at the set time.
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white border-0">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Banner</span>
          </Button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-card/50 animate-pulse" />
            ))}
          </div>
        ) : !announcements || announcements.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No announcements yet. Create one to post a banner on the site.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => {
              const typeInfo = TYPE_LABELS[a.type as AnnouncementType] ?? TYPE_LABELS.info;
              const isExpired = a.expiresAt && new Date(a.expiresAt) <= now;
              const isLive = a.isActive && !isExpired;

              return (
                <div
                  key={a.id}
                  className={`rounded-xl border p-4 transition-opacity ${
                    isLive ? "border-border/50 bg-card" : "border-border/20 bg-card/40 opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${typeInfo.color}`}>
                          {typeInfo.icon}
                          {typeInfo.label}
                        </span>
                        {isLive && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-medium">
                            Live
                          </span>
                        )}
                        {!a.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full border bg-muted/30 text-muted-foreground border-border/20">
                            Paused
                          </span>
                        )}
                        {isExpired && (
                          <span className="text-xs px-2 py-0.5 rounded-full border bg-red-500/10 text-red-400 border-red-500/20">
                            Expired
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed">{a.message}</p>
                      {a.expiresAt && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Expires: {new Date(a.expiresAt).toLocaleString()}
                        </p>
                      )}
                      {!a.expiresAt && (
                        <p className="text-xs text-muted-foreground mt-1.5">No expiry set</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title={a.isActive ? "Pause" : "Activate"}
                        onClick={() => toggleActive(a)}
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(a)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400"
                        onClick={() => deleteMutation.mutate({ id: a.id })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId !== null ? "Edit Announcement" : "New Announcement"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">Message</label>
              <Textarea
                placeholder="e.g. InboxBrief will be down at 10:00 AM CST for maintenance."
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                rows={3}
                maxLength={500}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{form.message.length}/500</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">Banner Type</label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as AnnouncementType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">ℹ️ Info — General notices (maintenance, updates)</SelectItem>
                  <SelectItem value="warning">⚠️ Warning — Issues or disruptions</SelectItem>
                  <SelectItem value="success">✅ Success — Good news or resolved issues</SelectItem>
                  <SelectItem value="promo">🏷️ Promo — Sales, discounts, special offers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">
                Expires At <span className="text-muted-foreground font-normal">(leave blank = never expires)</span>
              </label>
              <Input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
              />
              {form.expiresAt && (
                <p className="text-xs text-muted-foreground">
                  Banner will auto-hide on {new Date(form.expiresAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending || !form.message.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white border-0"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : editId !== null
                ? "Save Changes"
                : "Post Banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
