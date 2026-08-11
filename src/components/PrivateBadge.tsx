import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function PrivateBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md bg-shield/10 px-2 py-1 text-xs font-medium text-shield",
        className,
      )}
    >
      <Lock className="size-3" />
      Private
    </span>
  );
}
