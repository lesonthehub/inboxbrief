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
            <div className="container flex items-start gap-3 py-2.5 px-4 sm:px-6">
              {style.icon}
              <p className={`flex-1 text-sm leading-relaxed ${style.text}`}>
                {announcement.message}
              </p>
              <button
                onClick={() => setDismissed((prev) => new Set([...prev, announcement.id]))}
                className={`flex-shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity ${style.text}`}
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
