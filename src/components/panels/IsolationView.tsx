import { Shield, Container, Globe, Cpu, Wrench, Lock, ArrowRight, ArrowDown } from "lucide-react";

/**
 * Visualizes the actual deployment topology:
 *   - Harness runs in a Docker container
 *   - Tool host runs in a nested Docker container (docker-in-docker)
 *   - Web/search proxy runs in its own sibling container
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
        Each component runs in its own Docker container. The tool host is nested
        inside the harness container; the web proxy is a sibling.
      </p>

      {/* Host machine */}
      <div className="rounded-lg border border-dashed p-2.5 space-y-2 bg-muted/20">
        <HostLabel label="host machine" hint="your server" />

        {/* Harness container */}
        <Container_
          tone="primary"
          icon={<Cpu className="w-3.5 h-3.5" />}
          title="harness"
          image="agentos/harness:latest"
          notes={["Owns state & API keys", "Talks to LLM providers"]}
        >
          {/* Nested tool container inside harness */}
          <div className="pl-3 border-l-2 border-warning/40 space-y-1.5">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <ArrowDown className="w-2.5 h-2.5" />
              docker-in-docker
            </div>
            <Container_
              tone="warning"
              icon={<Wrench className="w-3.5 h-3.5" />}
              title="tool-host"
              image="agentos/sandbox:latest"
              notes={["Executes shell / fs / code", "No host network"]}
              nested
            />
          </div>
        </Container_>

        {/* Sibling: proxy */}
        <SiblingConnector />
        <Container_
          tone="destructive"
          icon={<Globe className="w-3.5 h-3.5" />}
          title="web-proxy"
          image="agentos/proxy:latest"
          notes={["Only egress to internet", "Allowlist + audit log"]}
        />
      </div>

      {/* Flow legend */}
      <div className="rounded-md border p-2 space-y-1.5 bg-card/50">
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
          traffic
        </div>
        <FlowRow from="harness" to="tool-host" note="spawn / stdio" />
        <FlowRow from="tool-host" to="web-proxy" note="http egress" />
        <FlowRow from="web-proxy" to="internet" note="allowlisted" dashed />
      </div>

      <div className="px-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Lock className="w-3 h-3" />
        Containers communicate only over the arrows above.
      </div>
    </div>
  );
}

type Tone = "primary" | "warning" | "destructive";

function toneClasses(tone: Tone) {
  switch (tone) {
    case "primary":
      return { ring: "border-primary/50 bg-primary/5", chip: "bg-primary/15 text-primary", dot: "bg-primary" };
    case "warning":
      return { ring: "border-warning/50 bg-warning/5", chip: "bg-warning/15 text-warning", dot: "bg-warning" };
    case "destructive":
      return { ring: "border-destructive/50 bg-destructive/5", chip: "bg-destructive/15 text-destructive", dot: "bg-destructive" };
  }
}

function HostLabel({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </span>
      <span className="text-[9px] text-muted-foreground/70">{hint}</span>
    </div>
  );
}

function Container_({
  tone,
  icon,
  title,
  image,
  notes,
  children,
  nested,
}: {
  tone: Tone;
  icon: React.ReactNode;
  title: string;
  image: string;
  notes: string[];
  children?: React.ReactNode;
  nested?: boolean;
}) {
  const c = toneClasses(tone);
  return (
    <div className={`rounded-md border ${c.ring} ${nested ? "p-2" : "p-2.5"} space-y-1.5`}>
      <div className="flex items-center gap-2">
        <Container className={`w-3 h-3 ${tone === "primary" ? "text-primary" : tone === "warning" ? "text-warning" : "text-destructive"}`} />
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${c.chip} text-[10px] font-mono`}>
          {icon}
          {title}
        </span>
        <span className="text-[9px] font-mono text-muted-foreground/70 truncate">
          {image}
        </span>
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

function SiblingConnector() {
  return (
    <div className="flex items-center gap-1.5 pl-2 py-0.5">
      <div className="w-3 border-t border-dashed" />
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">sibling</span>
      <div className="flex-1 border-t border-dashed" />
    </div>
  );
}

function FlowRow({ from, to, note, dashed }: { from: string; to: string; note: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px]">
      <code className={`px-1 py-0.5 rounded bg-secondary text-secondary-foreground/80 ${dashed ? "opacity-60" : ""}`}>
        {from}
      </code>
      <ArrowRight className="w-3 h-3 text-muted-foreground" />
      <code className={`px-1 py-0.5 rounded bg-secondary text-secondary-foreground/80 ${dashed ? "opacity-60" : ""}`}>
        {to}
      </code>
      <span className="text-[9px] text-muted-foreground ml-auto">{note}</span>
    </div>
  );
}
