export type RiskTier = "Critical" | "High" | "Medium" | "Low";
export type VendorStatus = "Active" | "Under Review" | "Suspended";

export interface Vendor {
  id: string;
  name: string;
  category: string;
  country: string;
  tier: RiskTier;
  riskScore: number; // 0-100
  spendUSD: number;
  status: VendorStatus;
  contractEnd: string; // ISO date
  certifications: string[];
  lastReview: string;
  findings: string[];
}

export interface RemediationTask {
  id: string;
  vendorId: string;
  title: string;
  severity: RiskTier;
  due: string;
  resolved: boolean;
}

export const seedVendors: Vendor[] = [
  {
    id: "v-1001",
    name: "Helios Cloud Systems",
    category: "Infrastructure / IaaS",
    country: "USA",
    tier: "Critical",
    riskScore: 84,
    spendUSD: 4_250_000,
    status: "Under Review",
    contractEnd: "2026-09-12",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    lastReview: "2026-05-02",
    findings: [
      "Sub-processor in non-adequacy jurisdiction (Vietnam)",
      "Pen-test report older than 18 months",
    ],
  },
  {
    id: "v-1002",
    name: "Northwind Payroll EU",
    category: "HR / Payroll",
    country: "Germany",
    tier: "High",
    riskScore: 68,
    spendUSD: 980_000,
    status: "Active",
    contractEnd: "2027-01-31",
    certifications: ["ISO 27001", "GDPR DPA"],
    lastReview: "2026-04-19",
    findings: ["DPA missing Schrems II addendum"],
  },
  {
    id: "v-1003",
    name: "Aetna Components Ltd",
    category: "Manufacturing / Parts",
    country: "Taiwan",
    tier: "Critical",
    riskScore: 91,
    spendUSD: 7_120_000,
    status: "Active",
    contractEnd: "2026-07-04",
    certifications: ["ISO 9001"],
    lastReview: "2026-03-11",
    findings: [
      "Single-source for chassis SKU #A-220 (78% of supply)",
      "Geopolitical exposure flagged Q1 2026",
    ],
  },
  {
    id: "v-1004",
    name: "Brightline Legal Services",
    category: "Professional Services",
    country: "UK",
    tier: "Low",
    riskScore: 22,
    spendUSD: 310_000,
    status: "Active",
    contractEnd: "2026-12-01",
    certifications: ["ISO 27001"],
    lastReview: "2026-05-28",
    findings: [],
  },
  {
    id: "v-1005",
    name: "Quartz Analytics",
    category: "SaaS / BI",
    country: "Canada",
    tier: "Medium",
    riskScore: 47,
    spendUSD: 540_000,
    status: "Active",
    contractEnd: "2026-08-22",
    certifications: ["SOC 2 Type II"],
    lastReview: "2026-04-02",
    findings: ["No business continuity plan on file"],
  },
  {
    id: "v-1006",
    name: "Vela Logistics Group",
    category: "Logistics / Freight",
    country: "Netherlands",
    tier: "High",
    riskScore: 72,
    spendUSD: 1_840_000,
    status: "Active",
    contractEnd: "2026-06-30",
    certifications: ["ISO 14001"],
    lastReview: "2026-02-17",
    findings: ["Contract auto-renew in 18 days, no renegotiation lever"],
  },
  {
    id: "v-1007",
    name: "Orion Edge Security",
    category: "Cybersecurity",
    country: "Israel",
    tier: "Medium",
    riskScore: 51,
    spendUSD: 620_000,
    status: "Active",
    contractEnd: "2027-03-15",
    certifications: ["SOC 2 Type II", "ISO 27001", "ISO 27018"],
    lastReview: "2026-05-10",
    findings: [],
  },
];

export const seedTasks: RemediationTask[] = [
  {
    id: "t-1",
    vendorId: "v-1001",
    title: "Request updated penetration-test report",
    severity: "High",
    due: "2026-06-25",
    resolved: false,
  },
  {
    id: "t-2",
    vendorId: "v-1003",
    title: "Qualify secondary supplier for chassis SKU #A-220",
    severity: "Critical",
    due: "2026-07-01",
    resolved: false,
  },
  {
    id: "t-3",
    vendorId: "v-1006",
    title: "Trigger contract renegotiation before auto-renew window",
    severity: "High",
    due: "2026-06-20",
    resolved: false,
  },
  {
    id: "t-4",
    vendorId: "v-1002",
    title: "Append Schrems II clause to data-processing agreement",
    severity: "Medium",
    due: "2026-07-10",
    resolved: false,
  },
];

export const tierColor: Record<RiskTier, string> = {
  Critical: "bg-red-500/15 text-red-400 border-red-500/30",
  High: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Medium: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  Low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export function scoreToTier(score: number): RiskTier {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

export function exportCsv(vendors: Vendor[]): string {
  const headers = [
    "id",
    "name",
    "category",
    "country",
    "tier",
    "riskScore",
    "spendUSD",
    "status",
    "contractEnd",
    "certifications",
    "findings",
  ];
  const rows = vendors.map((v) =>
    [
      v.id,
      v.name,
      v.category,
      v.country,
      v.tier,
      v.riskScore,
      v.spendUSD,
      v.status,
      v.contractEnd,
      `"${v.certifications.join("; ")}"`,
      `"${v.findings.join(" | ").replace(/"/g, "'")}"`,
    ].join(","),
  );
  return [headers.join(","), ...rows].join("\n");
}

// Simulated AI extraction — represents the OpenAI parsing call result
export interface ExtractedVendor {
  name: string;
  category: string;
  country: string;
  riskScore: number;
  findings: string[];
  certifications: string[];
  spendUSD: number;
}

const mockExtractions: ExtractedVendor[] = [
  {
    name: "Sentinel Datacore",
    category: "Infrastructure / Colocation",
    country: "Singapore",
    riskScore: 88,
    findings: [
      "DR site located in same seismic zone as primary",
      "Encryption key custody held by vendor, not customer",
      "Concentration risk: 4 other portfolio vendors depend on this provider",
    ],
    certifications: ["ISO 27001"],
    spendUSD: 2_300_000,
  },
  {
    name: "Marigold Bio Labs",
    category: "R&D / Lab Services",
    country: "Switzerland",
    riskScore: 63,
    findings: [
      "IP transfer clause favors vendor on co-developed assays",
      "No SLA penalty for >72h sample turnaround delays",
    ],
    certifications: ["ISO 17025"],
    spendUSD: 870_000,
  },
  {
    name: "Pinecrest Fulfillment",
    category: "Logistics / 3PL",
    country: "Mexico",
    riskScore: 76,
    findings: [
      "Cross-border tariff exposure not hedged in contract",
      "Subcontracts last-mile to 11 unvetted carriers",
    ],
    certifications: [],
    spendUSD: 1_410_000,
  },
];

export function simulateExtraction(filename: string): Promise<ExtractedVendor> {
  return new Promise((resolve) => {
    const pick = mockExtractions[Math.floor(Math.random() * mockExtractions.length)];
    setTimeout(() => resolve({ ...pick, name: `${pick.name}` }), 1400);
  });
}
