import { createFileRoute } from "@tanstack/react-router";
import { VendorDashboard } from "@/components/vendor-dashboard";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SentinelVRM — AI Vendor Risk & Procurement Intelligence" },
      {
        name: "description",
        content:
          "Enterprise-grade AI-powered vendor risk monitoring, contract intelligence, and procurement remediation.",
      },
      {
        property: "og:title",
        content: "SentinelVRM — AI Vendor Risk & Procurement Intelligence",
      },
      {
        property: "og:description",
        content:
          "Enterprise-grade AI-powered vendor risk monitoring, contract intelligence, and procurement remediation.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <VendorDashboard />
      <Toaster richColors position="top-right" />
    </>
  );
}
