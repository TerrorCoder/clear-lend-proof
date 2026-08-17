import { useEffect, useState } from "react";
import { Loader2, Search, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatCurrency,
  listDisclosures,
  requestDisclosure,
  truncateAddress,
  type DisclosureRecord,
  type Loan,
} from "@/lib/clearlend-api";

export function AuditorView() {
  const [loanId, setLoanId] = useState("LN-1000");
  const [loading, setLoading] = useState(false);
  const [disclosed, setDisclosed] = useState<Loan | null>(null);
  const [log, setLog] = useState<DisclosureRecord[]>([]);

  useEffect(() => {
    listDisclosures()
      .then(setLog)
      .catch(() => {
        /* log stays empty until the contract is reachable */
      });
  }, []);

  const handleRequest = async () => {
    setLoading(true);
    setDisclosed(null);
    try {
      const { loan, record } = await requestDisclosure(loanId);
      setDisclosed(loan);
      setLog((prev) => [record, ...prev]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Disclosure failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border/70 bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Compliance lookup</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Disclosure is scoped to a single loan and authorized by the borrower's proof.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Input
            value={loanId}
            onChange={(e) => setLoanId(e.target.value)}
            placeholder="Loan ID (e.g. LN-1000)"
            className="sm:max-w-xs"
          />
          <Button variant="accent" onClick={handleRequest} disabled={loading || !loanId.trim()}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Requesting selective disclosure from
                borrower's proof...
              </>
            ) : (
              <>
                <Search className="size-4" /> Request Disclosure
              </>
            )}
          </Button>
        </div>
      </section>

      {disclosed && (
        <section className="overflow-hidden rounded-xl border border-accent/30 bg-card">
          <div className="flex items-start gap-3 border-b border-accent/25 bg-accent/10 p-4">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-accent" />
            <p className="text-sm text-accent">
              This is a single, borrower-authorized disclosure. All other loan data on the platform
              remains private.
            </p>
          </div>
          <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Loan ID" value={disclosed.id} mono />
            <Field label="Borrower wallet" value={truncateAddress(disclosed.wallet)} mono />
            <Field label="Amount requested" value={formatCurrency(disclosed.amount)} />
            <Field
              label="Disclosed annual income"
              value={formatCurrency(disclosed.privateIncome)}
            />
            <Field label="Disclosed existing debt" value={formatCurrency(disclosed.privateDebt)} />
            <Field label="Collateral ratio" value={`${disclosed.collateralRatio}×`} />
          </div>
        </section>
      )}

      <section className="rounded-xl border border-border/70 bg-card">
        <div className="border-b border-border/70 p-5">
          <h3 className="font-display text-base font-semibold">Disclosure request log</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The log records that a disclosure occurred — never the disclosed values.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Request</th>
                <th className="px-5 py-3 font-medium">Loan ID</th>
                <th className="px-5 py-3 font-medium">Auditor</th>
                <th className="px-5 py-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {log.map((r) => (
                <tr key={r.id} className="border-b border-border/40 last:border-0">
                  <td className="px-5 py-4 font-mono text-xs">{r.id}</td>
                  <td className="px-5 py-4 font-mono text-xs">{r.loanId}</td>
                  <td className="px-5 py-4 text-muted-foreground">{r.auditor}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {new Date(r.timestamp).toLocaleString()}
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

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={mono ? "mt-1.5 font-mono text-sm" : "mt-1.5 text-lg font-semibold"}>{value}</p>
    </div>
  );
}
