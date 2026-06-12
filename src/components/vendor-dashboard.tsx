import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Download,
  FileUp,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  exportCsv,
  scoreToTier,
  seedTasks,
  seedVendors,
  simulateExtraction,
  tierColor,
  type RemediationTask,
  type Vendor,
} from "@/lib/vendors";

function formatUSD(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export function VendorDashboard() {
  const [vendors, setVendors] = useState<Vendor[]>(seedVendors);
  const [tasks, setTasks] = useState<RemediationTask[]>(seedTasks);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const kpis = useMemo(() => {
    const critical = vendors.filter((v) => v.tier === "Critical").length;
    const totalSpend = vendors.reduce((s, v) => s + v.spendUSD, 0);
    const avgRisk = Math.round(
      vendors.reduce((s, v) => s + v.riskScore, 0) / Math.max(vendors.length, 1),
    );
    const openTasks = tasks.filter((t) => !t.resolved).length;
    return { critical, totalSpend, avgRisk, openTasks, count: vendors.length };
  }, [vendors, tasks]);

  const tierBreakdown = useMemo(() => {
    const groups: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    vendors.forEach((v) => (groups[v.tier] += 1));
    return groups;
  }, [vendors]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleTask(id: string) {
    // Optimistic update — flip immediately, "sync" toast follows
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, resolved: !t.resolved } : t)),
    );
    toast.success("Remediation status synced");
  }

  function exportSelectedCsv() {
    const target = selected.size > 0
      ? vendors.filter((v) => selected.has(v.id))
      : vendors;
    const csv = exportCsv(target);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendor-risk-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${target.length} vendor record(s)`);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    toast.info(`Uploading "${file.name}" to secure storage…`);
    await new Promise((r) => setTimeout(r, 700));
    toast.info("Routing to AI extraction engine…");
    const extracted = await simulateExtraction(file.name);
    const newVendor: Vendor = {
      id: `v-${Date.now()}`,
      name: extracted.name,
      category: extracted.category,
      country: extracted.country,
      tier: scoreToTier(extracted.riskScore),
      riskScore: extracted.riskScore,
      spendUSD: extracted.spendUSD,
      status: "Under Review",
      contractEnd: "2027-01-01",
      certifications: extracted.certifications,
      lastReview: new Date().toISOString().slice(0, 10),
      findings: extracted.findings,
    };
    setVendors((prev) => [newVendor, ...prev]);
    if (extracted.findings.length > 0) {
      const critFinding = extracted.findings[0];
      setTasks((prev) => [
        {
          id: `t-${Date.now()}`,
          vendorId: newVendor.id,
          title: `Address: ${critFinding}`,
          severity: scoreToTier(extracted.riskScore),
          due: "2026-07-15",
          resolved: false,
        },
        ...prev,
      ]);
    }
    setUploading(false);
    toast.success(
      `AI extracted ${extracted.findings.length} finding(s) — risk score ${extracted.riskScore}`,
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/30 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">
                Sentinel<span className="text-primary">VRM</span>
              </h1>
              <p className="text-xs text-muted-foreground">
                AI Vendor Risk &amp; Procurement Intelligence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Tenant: Acme Holdings
            </Badge>
            <Button size="sm" variant="outline" onClick={exportSelectedCsv}>
              <Download className="mr-1.5 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {/* KPIs */}
        <section className="grid gap-4 md:grid-cols-4">
          <KpiCard
            label="Active Vendors"
            value={kpis.count.toString()}
            icon={<TrendingUp className="h-4 w-4" />}
            hint={`${kpis.critical} flagged critical`}
          />
          <KpiCard
            label="Portfolio Spend"
            value={formatUSD(kpis.totalSpend)}
            icon={<TrendingUp className="h-4 w-4" />}
            hint="Across all tiers"
          />
          <KpiCard
            label="Average Risk Score"
            value={`${kpis.avgRisk}/100`}
            icon={<ShieldAlert className="h-4 w-4" />}
            hint={scoreToTier(kpis.avgRisk)}
            accent={kpis.avgRisk >= 60 ? "warn" : "ok"}
          />
          <KpiCard
            label="Open Remediations"
            value={kpis.openTasks.toString()}
            icon={<AlertTriangle className="h-4 w-4" />}
            hint="Assigned to procurement"
            accent={kpis.openTasks > 0 ? "warn" : "ok"}
          />
        </section>

        {/* Tier Distribution + Upload */}
        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Global Risk Tier Distribution</CardTitle>
              <CardDescription>
                Concentration view across the active vendor portfolio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(["Critical", "High", "Medium", "Low"] as const).map((tier) => {
                const count = tierBreakdown[tier];
                const pct = (count / Math.max(kpis.count, 1)) * 100;
                return (
                  <div key={tier} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Badge variant="outline" className={tierColor[tier]}>
                          {tier}
                        </Badge>
                        <span className="text-muted-foreground">{count} vendor(s)</span>
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Document Intelligence
              </CardTitle>
              <CardDescription>
                Upload a vendor contract or audit report. AI extracts entities, risks, and
                certifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.docx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                  e.target.value = "";
                }}
              />
              <Button
                className="w-full"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Parsing…
                  </>
                ) : (
                  <>
                    <FileUp className="mr-2 h-4 w-4" />
                    Upload vendor document
                  </>
                )}
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                Demo mode: file is processed locally; AI extraction is simulated to mirror
                the production OpenAI pipeline.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Vendor Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Vendor Intelligence Registry</CardTitle>
              <CardDescription>
                Select rows to compile a high-risk procurement report
              </CardDescription>
            </div>
            <Badge variant="outline">{selected.size} selected</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Vendor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead className="text-right">Spend</TableHead>
                    <TableHead>Contract End</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((v) => (
                    <TableRow key={v.id} className="hover:bg-muted/30">
                      <TableCell>
                        <Checkbox
                          checked={selected.has(v.id)}
                          onCheckedChange={() => toggleSelect(v.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{v.name}</div>
                        {v.findings.length > 0 && (
                          <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                            ⚠ {v.findings[0]}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {v.category}
                      </TableCell>
                      <TableCell className="text-sm">{v.country}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={tierColor[v.tier]}>
                          {v.tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={v.riskScore} className="h-1.5 w-16" />
                          <span className="font-mono text-xs">{v.riskScore}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatUSD(v.spendUSD)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {v.contractEnd}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Remediation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Closed-Loop Remediation Queue</CardTitle>
            <CardDescription>
              Tasks auto-generated from AI findings and compliance triggers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.length === 0 && (
              <p className="text-sm text-muted-foreground">No outstanding tasks.</p>
            )}
            {tasks.map((t) => {
              const vendor = vendors.find((v) => v.id === t.vendorId);
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-md border border-border/60 bg-card/30 p-3"
                >
                  <Checkbox
                    checked={t.resolved}
                    onCheckedChange={() => toggleTask(t.id)}
                  />
                  <div className="flex-1">
                    <div
                      className={`text-sm font-medium ${
                        t.resolved ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {t.title}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {vendor?.name ?? "Unknown vendor"} · due {t.due}
                    </div>
                  </div>
                  <Badge variant="outline" className={tierColor[t.severity]}>
                    {t.severity}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <footer className="pt-2 text-center text-xs text-muted-foreground">
          SentinelVRM demo · multi-tenant isolation, AI extraction, and remediation workflows
        </footer>
      </main>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  accent?: "ok" | "warn";
}) {
  const accentClass =
    accent === "warn"
      ? "text-orange-400"
      : accent === "ok"
        ? "text-emerald-400"
        : "text-muted-foreground";
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span className={accentClass}>{icon}</span>
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
        {hint && <div className={`mt-1 text-xs ${accentClass}`}>{hint}</div>}
      </CardContent>
    </Card>
  );
}
