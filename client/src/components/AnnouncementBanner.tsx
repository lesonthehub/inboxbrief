import { useState } from "react";
import { X, Info, AlertTriangle, CheckCircle, Tag } from "lucide-react";
import { trpc } from "@/lib/trpc";

type AnnouncementType = "info" | "warning" | "success" | "promo";

const TYPE_STYLES: Record<AnnouncementType, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  info: {
    bg: "bg-blue-950/80",
    border: "border-blue-500/40",
    text: "text-blue-100",
    icon: <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />,
  },
  warning: {
    bg: "bg-yellow-950/80",
    border: "border-yellow-500/40",
    text: "text-yellow-100",
    icon: <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />,
  },
  success: {
    bg: "bg-emerald-950/80",
    border: "border-emerald-500/40",
    text: "text-emerald-100",
    icon: <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />,
  },
  promo: {
    bg: "bg-purple-950/80",
    border: "border-purple-500/40",
    text: "text-purple-100",
    icon: <Tag className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />,
  },
};

export function AnnouncementBanner() {
  const { data: announcements } = trpc.announcements.getActive.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000, // refresh every 5 minutes
    staleTime: 2 * 60 * 1000,
  });

  // Track which banners have been dismissed this session
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  if (!announcements || announcements.length === 0) return null;

  const visible = announcements.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="w-full z-40 flex flex-col">
      {visible.map((announcement) => {
        const style = TYPE_STYLES[announcement.type as AnnouncementType] ?? TYPE_STYLES.info;
        return (
          <div
            key={announcement.id}
            className={`w-full border-b ${style.bg} ${style.border} backdrop-blur-sm`}
          >
            <div className="relative flex items-center justify-center py-2.5 px-10 sm:px-12">
              {/* Centered content */}
              <div className="flex items-start gap-2 max-w-2xl w-full justify-center">
                <span className="flex-shrink-0 mt-0.5">{style.icon}</span>
                <p className={`text-sm leading-relaxed text-center ${style.text}`}>
                  {announcement.message}
                </p>
              </div>
              {/* Dismiss button — absolutely positioned right so it doesn't affect centering */}
              <button
                onClick={() => setDismissed((prev) => { const next = new Set(Array.from(prev)); next.add(announcement.id); return next; })}
                className={`absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex-shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity ${style.text}`}
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
