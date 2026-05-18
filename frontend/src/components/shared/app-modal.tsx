import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type AppModalProps = {
  open: boolean;
  title: string;
  onClose?: () => void;
  children: React.ReactNode;
};

export function AppModal({ open, title, onClose, children }: AppModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
      <div className={cn("w-full max-w-lg rounded-xl bg-white p-6 shadow-xl")}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
