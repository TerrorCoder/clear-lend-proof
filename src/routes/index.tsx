import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { CloudBackdrop } from "@/components/CloudBackdrop";
import { SceneSlideshow } from "@/components/SceneSlideshow";
import { Button } from "@/components/ui/button";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClearLend — Private Lending with Provable Compliance" },
      {
        name: "description",
        content:
          "ClearLend lets borrowers prove loan eligibility with zero-knowledge proofs — lenders verify without ever seeing income or debt.",
      },
      { property: "og:title", content: "ClearLend — Private Lending with Provable Compliance" },
      {
        property: "og:description",
        content:
          "Prove eligibility, not paperwork. Zero-knowledge lending with borrower-authorized selective disclosure for auditors.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: ShieldCheck,
    title: "Zero-Knowledge Proofs",
    body: "Borrowers prove their collateral ratio clears the required threshold. The underlying numbers never leave their device.",
  },
  {
    icon: Eye,
    title: "Selective Disclosure",
    body: "An auditor can unlock exactly one loan's figures with borrower authorization — every other loan stays sealed.",
  },
  {
    icon: Zap,
    title: "Instant Verification",
    body: "Proofs verify in seconds on-chain, so approvals happen while the borrower is still on the page.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <CloudBackdrop />
      <SiteHeader />

      <main>
        <section className="hero-glow relative overflow-hidden border-b border-border/60">
          <SceneSlideshow opacity="opacity-40" />
          <div className="relative mx-auto max-w-3xl px-6 py-28 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-card/70 px-3.5 py-1.5 text-xs font-medium text-accent backdrop-blur">
              Built on Midnight Network
            </span>
            <h1 className="mt-7 text-4xl font-semibold leading-tight sm:text-5xl">
              Prove compliance without sacrificing privacy
            </h1>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
              ClearLend approves loans from cryptographic proof of eligibility — not from
              spreadsheets of your financial life. Lenders get certainty, borrowers keep their
              data, and auditors get a narrow, authorized window when compliance requires one.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button variant="accent" size="lg" asChild>
                <Link to="/app">
                  Launch demo <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#how">How it works</a>
              </Button>
            </div>
          </div>
        </section>

        <TickerBanner />

        <ImageMarquee className="py-10" />

        <section id="how" className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-5 md:grid-cols-3">
            {features.map((f) => (
              <article
                key={f.title}
                className="rounded-xl border border-border/70 bg-card/80 p-6 backdrop-blur transition-shadow hover:shadow-[var(--shadow-soft)]"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent/12 text-accent">
                  <f.icon className="size-5" />
                </span>
                <h2 className="mt-5 text-lg font-semibold">{f.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        <ImageMarquee fast className="pb-14" />

        <section className="border-t border-border/60">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-6 py-14">
            <div>
              <h2 className="text-xl font-semibold">Three roles, one private ledger</h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Switch between the Borrower, Lender, and Auditor views to see exactly how much each
                participant can — and cannot — see.
              </p>
            </div>
            <Button variant="accent" asChild>
              <Link to="/app">Open the dashboards</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-8 text-xs text-muted-foreground">
          ClearLend demo · all blockchain and proof operations are mocked in this build.
        </div>
      </footer>
    </div>
  );
}

