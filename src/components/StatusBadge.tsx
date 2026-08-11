import type { LoanStatus, ProofStatus } from "@/lib/clearlend-api";
import { cn } from "@/lib/utils";

const statusStyles: Record<LoanStatus, string> = {
  Approved: "bg-success/12 text-success border-success/25",
  Pending: "bg-warning/12 text-warning border-warning/25",
  Rejected: "bg-destructive/12 text-destructive border-destructive/25",
};

export function StatusBadge({ status }: { status: LoanStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  );
}

export function ProofBadge({ status }: { status: ProofStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        status === "Verified"
          ? "border-accent/30 bg-accent/12 text-accent"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}
