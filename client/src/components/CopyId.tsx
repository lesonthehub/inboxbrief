import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

interface CopyIdProps {
  id: number | string;
  className?: string;
}

/**
 * A monospace ID badge that copies the numeric ID to the clipboard on click.
 * Shows a brief checkmark confirmation after copying.
 */
export function CopyId({ id, className = "" }: CopyIdProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(String(id));
      setCopied(true);
      toast.success(`ID #${id} copied`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <button
      onClick={handleCopy}
      title={`Copy ID #${id}`}
      className={`inline-flex items-center gap-1 font-mono text-xs text-muted-foreground bg-muted/40 hover:bg-muted/70 active:bg-muted px-1.5 py-0.5 rounded transition-colors cursor-pointer select-none ${className}`}
    >
      <span>#{id}</span>
      {copied ? (
        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
      ) : (
        <Copy className="w-3 h-3 opacity-40 hover:opacity-80 shrink-0" />
      )}
    </button>
  );
}
