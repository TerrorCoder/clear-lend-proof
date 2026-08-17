import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PrivateBadge } from "@/components/PrivateBadge";
import { ProofBadge, StatusBadge } from "@/components/StatusBadge";
import {
  approveLoan,
  listLoans,
  formatCurrency,
  truncateAddress,
  type Loan,
} from "@/lib/clearlend-api";

const stats = [
  { label: "Total loans issued", value: "128" },
  { label: "Total value", value: "$4.62M" },
  { label: "Average approval time", value: "3.4s" },
];

export function LenderView() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    listLoans()
      .then(setLoans)
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Could not load loans"),
      );
  }, []);

  const handleApprove = async (loanId: string) => {
    setPendingId(loanId);
    try {
      const res = await approveLoan(loanId);
      setLoans((prev) => prev.map((l) => (l.id === res.loanId ? { ...l, status: res.status } : l)));
      toast.success(`Loan ${res.loanId} approved`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Approval failed");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border/70 bg-card p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-border/70 bg-card">
        <div className="border-b border-border/70 p-5">
          <h2 className="font-display text-lg font-semibold">Incoming loan requests</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Borrower financials are never transmitted — you verify proofs, not raw data.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Requester</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Income</th>
                <th className="px-5 py-3 font-medium">Existing debt</th>
                <th className="px-5 py-3 font-medium">Proof</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id} className="border-b border-border/40 last:border-0">
                  <td className="px-5 py-4 font-mono text-xs">{truncateAddress(loan.wallet)}</td>
                  <td className="px-5 py-4">{formatCurrency(loan.amount)}</td>
                  <td className="px-5 py-4">
                    <PrivateBadge />
                  </td>
                  <td className="px-5 py-4">
                    <PrivateBadge />
                  </td>
                  <td className="px-5 py-4">
                    <ProofBadge status={loan.proofStatus} />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={loan.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      size="sm"
                      variant="accent"
                      disabled={
                        loan.proofStatus !== "Verified" ||
                        loan.status === "Approved" ||
                        pendingId === loan.id
                      }
                      onClick={() => handleApprove(loan.id)}
                    >
                      {pendingId === loan.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : loan.status === "Approved" ? (
                        "Approved"
                      ) : (
                        "Approve"
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
