import { Link, useRouter } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { ROLES, useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { role, setRole } = useRole();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <ShieldCheck className="size-4.5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">ClearLend</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-1 rounded-full border border-border/70 bg-card p-1 sm:flex">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRole(r);
                  if (router.state.location.pathname !== "/app") {
                    void router.navigate({ to: "/app" });
                  }
                }}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                  role === r
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <Link
            to="/app"
            className="rounded-full border border-accent/40 px-4 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
          >
            Open app
          </Link>
        </div>
      </div>
    </header>
  );
}
