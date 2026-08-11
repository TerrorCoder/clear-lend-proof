import { cn } from "@/lib/utils";

const items = [
  "Zero-knowledge proofs verified in 3.4s",
  "128 loans issued",
  "$4.62M total value",
  "Borrower financials never transmitted",
  "Selective disclosure, borrower-authorized",
  "Built on Midnight Network",
];

export function TickerBanner({ className }: { className?: string }) {
  const track = [...items, ...items];

  return (
    <div
      className={cn(
        "relative overflow-hidden border-y border-border/70 bg-secondary/60 py-2.5",
        className,
      )}
    >
      <div className="animate-marquee-fast flex w-max items-center gap-8 px-4">
        {track.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="flex shrink-0 items-center gap-8 text-xs uppercase tracking-[0.18em] text-muted-foreground"
          >
            {t}
            <span aria-hidden className="size-1 rounded-full bg-accent/60" />
          </span>
        ))}
      </div>
    </div>
  );
}
