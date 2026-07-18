import { Shield, Box, Globe, Cpu, Wrench, ArrowDown, Lock, Network } from "lucide-react";

/**
 * Visualizes how the system is isolated in concentric trust boundaries:
 *   Harness (trusted host) → Sandbox (tool runtime) → Proxy (outbound web/search).
 * Purely presentational.
 */
export function IsolationView() {
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Shield className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Isolation
        </h3>
      </div>
      <p className="text-[11px] text-muted-foreground px-1 leading-relaxed">
        Trust decreases outward. Each boundary mediates what the layer inside can
        see or reach.
      </p>

      {/* Layer 1: Harness */}
      <Layer
        tone="primary"
        icon={<Cpu className="w-3.5 h-3.5" />}
        title="Harness"
        subtitle="Trusted host process"
        badges={["your machine", "secrets", "config"]}
        notes={[
          "Owns conversation state and API keys",
          "Speaks to LLM providers directly",
          "Decides which tools may run",
        ]}
      >
        {/* Layer 2: Sandbox */}
        <Connector label="spawn / stdio" />
        <Layer
          tone="warning"
          icon={<Box className="w-3.5 h-3.5" />}
          title="Sandbox"
          subtitle="Tool runtime"
          badges={["fs jail", "cpu / mem cap", "no host env"]}
          notes={[
            "Executes tool code and shell commands",
            "Sees only whitelisted paths",
            "No direct network — routes through proxy",
          ]}
          inner
        >
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-background/60 border border-dashed">
            <Wrench className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              tools: shell · fs · db_query · code_exec
            </span>
          </div>

          {/* Layer 3: Proxy */}
          <Connector label="egress only" />
          <Layer
            tone="destructive"
            icon={<Network className="w-3.5 h-3.5" />}
            title="Web / Search Proxy"
            subtitle="Outbound gateway"
            badges={["allowlist", "rate limit", "audit log"]}
            notes={[
              "Only path to the public internet",
              "Strips cookies and auth headers",
              "Logs every request for review",
            ]}
            inner
          >
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-background/60 border border-dashed">
              <Globe className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                web_search · fetch_url · scrape
              </span>
            </div>
          </Layer>
        </Layer>
      </Layer>

      <div className="px-1 pt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Lock className="w-3 h-3" />
        Requests cross boundaries only through the arrows above.
      </div>
    </div>
  );
}

type Tone = "primary" | "warning" | "destructive";

function toneClasses(tone: Tone) {
  switch (tone) {
    case "primary":
      return {
        ring: "border-primary/40 bg-primary/5",
        chip: "bg-primary/15 text-primary",
        dot: "bg-primary",
      };
    case "warning":
      return {
        ring: "border-warning/40 bg-warning/5",
        chip: "bg-warning/15 text-warning",
        dot: "bg-warning",
      };
    case "destructive":
      return {
        ring: "border-destructive/40 bg-destructive/5",
        chip: "bg-destructive/15 text-destructive",
        dot: "bg-destructive",
      };
  }
}

function Layer({
  tone,
  icon,
  title,
  subtitle,
  badges,
  notes,
  children,
  inner,
}: {
  tone: Tone;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badges: string[];
  notes: string[];
  children?: React.ReactNode;
  inner?: boolean;
}) {
  const c = toneClasses(tone);
  return (
    <div
      className={`rounded-lg border ${c.ring} ${inner ? "p-2.5" : "p-3"} space-y-2`}
    >
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${c.chip} text-[10px] font-medium`}>
          {icon}
          {title}
        </span>
        <span className="text-[10px] text-muted-foreground">{subtitle}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {badges.map((b) => (
          <span
            key={b}
            className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground/80"
          >
            {b}
          </span>
        ))}
      </div>
      <ul className="space-y-0.5">
        {notes.map((n) => (
          <li key={n} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
            <span className={`w-1 h-1 rounded-full mt-1.5 ${c.dot}`} />
            <span className="leading-snug">{n}</span>
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}

function Connector({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 justify-center py-1">
      <ArrowDown className="w-3 h-3 text-muted-foreground" />
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
