import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { CloudBackdrop } from "@/components/CloudBackdrop";
import { SceneSlideshow } from "@/components/SceneSlideshow";
import { BorrowerView } from "@/components/borrower/BorrowerView";
import { LenderView } from "@/components/lender/LenderView";
import { AuditorView } from "@/components/auditor/AuditorView";
import { useRole } from "@/lib/role-context";


export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "ClearLend Dashboards — Borrower, Lender & Auditor" },
      {
        name: "description",
        content:
          "Switch between ClearLend's borrower, lender, and auditor views to see zero-knowledge loan approvals and selective disclosure in action.",
      },
      { property: "og:title", content: "ClearLend Dashboards — Borrower, Lender & Auditor" },
      {
        property: "og:description",
        content:
          "Submit shielded loan requests, verify proofs as a lender, and run a single authorized compliance disclosure as an auditor.",
      },
    ],
  }),
  component: AppDashboard,
});

const subtitles: Record<string, string> = {
  Borrower: "Prove eligibility with a zero-knowledge proof — keep your financials shielded.",
  Lender: "Verify proofs and approve loans without ever receiving borrower financials.",
  Auditor: "Request a single, borrower-authorized disclosure for compliance review.",
};

function AppDashboard() {
  const { role } = useRole();

  return (
    <div className="min-h-screen">
      <CloudBackdrop />
      <SiteHeader />
      <section className="relative overflow-hidden border-b border-border/60">
        <SceneSlideshow opacity="opacity-25" />
        <div className="relative mx-auto max-w-6xl px-6 py-12">
          <p className="text-xs uppercase tracking-wide text-accent">{role} view</p>
          <h1 className="mt-2 text-3xl font-semibold">ClearLend</h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">{subtitles[role]}</p>
        </div>
      </section>
      <main className="mx-auto max-w-6xl px-6 py-10">
        {role === "Borrower" && <BorrowerView />}
        {role === "Lender" && <LenderView />}
        {role === "Auditor" && <AuditorView />}
      </main>
    </div>
  );
}

