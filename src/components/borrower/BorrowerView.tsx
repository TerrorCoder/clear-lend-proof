import { useState } from "react";
import { Loader2, Lock, ShieldCheck, Wallet, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge, ProofBadge } from "@/components/StatusBadge";
import {
  MOCK_LOANS,
  BORROWER_WALLET,
  connectLaceWallet,
  submitLoanProof,
  formatCurrency,
  truncateAddress,
  type Loan,
} from "@/lib/clearlend-api";

export function BorrowerView() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const [amount, setAmount] = useState("15000");
  const [income, setIncome] = useState("120000");
  const [debt, setDebt] = useState("40000");

  const [proving, setProving] = useState(false);
  const [result, setResult] = useState<Loan | null>(null);
  const [loans, setLoans] = useState<Loan[]>(
    MOCK_LOANS.filter((l) => l.wallet === BORROWER_WALLET),
  );

  const handleConnect = async () => {
    setConnecting(true);
    const session = await connectLaceWallet();
    setConnecting(false);
    setWallet(session.address);
    setWalletOpen(false);
    toast.success(`Connected to ${session.network}`);
  };

  const handleSubmit = async () => {
    setResult(null);
    setProving(true);
    const loan = await submitLoanProof({
      amount: Number(amount),
      income: Number(income),
      debt: Number(debt),
    });
    setProving(false);
    setResult(loan);
    setLoans((prev) => [loan, ...prev]);
  };

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/70 bg-card p-5">
        <div>
          <h2 className="font-display text-lg font-semibold">Borrower dashboard</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {wallet
              ? `Wallet connected · ${truncateAddress(wallet)}`
              : "Connect a wallet to submit shielded loan requests."}
          </p>
        </div>
        {wallet ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/12 px-3.5 py-1.5 text-xs font-medium text-success">
            <CheckCircle2 className="size-3.5" /> Lace Wallet connected
          </span>
        ) : (
          <Button variant="accent" onClick={() => setWalletOpen(true)}>
            <Wallet className="size-4" /> Connect Lace Wallet
          </Button>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-xl border border-border/70 bg-card p-6 lg:col-span-3">
          <h3 className="font-display text-base font-semibold">Request a loan</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Public inputs are recorded on-chain. Shielded inputs are used only to build your
            proof.
          </p>

          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="amount">Loan amount requested (public)</Label>
              <Input
                id="amount"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-4 rounded-lg border border-shield/25 bg-shield/[0.06] p-4">
              <p className="flex items-center gap-2 text-xs font-medium text-shield">
                <Lock className="size-3.5" /> Shielded inputs
              </p>
              <div className="space-y-2">
                <Label htmlFor="income" className="flex items-center gap-1.5">
                  <Lock className="size-3" /> Annual income
                </Label>
                <Input
                  id="income"
                  inputMode="numeric"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="debt" className="flex items-center gap-1.5">
                  <Lock className="size-3" /> Existing debt
                </Label>
                <Input
                  id="debt"
                  inputMode="numeric"
                  value={debt}
                  onChange={(e) => setDebt(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                These values never leave your device unencrypted.
              </p>
            </div>

            <Button
              variant="accent"
              className="w-full"
              disabled={proving || !wallet}
              onClick={handleSubmit}
            >
              {proving ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Generating zero-knowledge proof...
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4" /> Generate Proof &amp; Submit
                </>
              )}
            </Button>
            {!wallet && (
              <p className="text-center text-xs text-muted-foreground">
                Connect your wallet to submit a request.
              </p>
            )}

            {result && (
              <div
                className={
                  result.status === "Approved"
                    ? "rounded-lg border border-success/30 bg-success/10 p-4"
                    : "rounded-lg border border-destructive/30 bg-destructive/10 p-4"
                }
              >
                <p
                  className={
                    result.status === "Approved"
                      ? "text-sm font-medium text-success"
                      : "text-sm font-medium text-destructive"
                  }
                >
                  {result.status === "Approved"
                    ? "Loan approved — eligibility proven without revealing your financials"
                    : "Loan rejected — the threshold proof did not hold"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Loan {result.id} · proof verified on Midnight · income and debt remain shielded.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-6 lg:col-span-2">
          <h3 className="font-display text-base font-semibold">Your loan requests</h3>
          <ul className="mt-4 space-y-3">
            {loans.map((loan) => (
              <li
                key={loan.id}
                className="rounded-lg border border-border/60 bg-background/40 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm">{loan.id}</span>
                  <StatusBadge status={loan.status} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(loan.amount)}
                  </span>
                  <ProofBadge status={loan.proofStatus} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <Dialog open={walletOpen} onOpenChange={setWalletOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Lace Wallet</DialogTitle>
            <DialogDescription>
              ClearLend requests view access to your shielded balance to build proofs locally. No
              private data is shared with lenders.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="accent" onClick={handleConnect} disabled={connecting}>
              {connecting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Connecting...
                </>
              ) : (
                "Authorize connection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
