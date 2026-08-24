import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getDashboardData } from "@/lib/data/dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getDashboardData();
  return <DashboardShell data={data} />;
}
