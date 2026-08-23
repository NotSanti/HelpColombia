import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { dashboardFixture } from "@/lib/fixtures/dashboard";

export default function Home() {
  return <DashboardShell data={dashboardFixture} />;
}
