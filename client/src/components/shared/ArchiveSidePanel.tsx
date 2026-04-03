/**
 * ArchiveSidePanel — slides in from the right to show archived/done items
 * Design: Modern SaaS — Clean Slate with Warm Accents
 */
import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArchiveSidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  count: number;
  accentColor?: "slate" | "green";
  children: React.ReactNode;
}

export function ArchiveSidePanel({
  open,
  onClose,
  title,
  count,
  accentColor = "slate",
  children,
}: ArchiveSidePanelProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const accentBg = accentColor === "green" ? "bg-green-500" : "bg-slate-500";
  const accentText = accentColor === "green" ? "text-green-600" : "text-slate-600";
  const accentBadge = accentColor === "green"
    ? "bg-green-100 text-green-700"
    : "bg-slate-100 text-slate-600";

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/30 z-40 transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className={cn("flex items-center justify-between px-5 py-4 border-b border-border")}>
          <div className="flex items-center gap-3">
            <div className={cn("w-1 h-8 rounded-full", accentBg)} />
            <div>
              <h2 className={cn("font-bold text-base", accentText)}>{title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className={cn("font-semibold px-1.5 py-0.5 rounded-full text-xs", accentBadge)}>
                  {count} รายการ
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {children}
        </div>
      </div>
    </>
  );
}
