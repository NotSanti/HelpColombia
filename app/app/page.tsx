import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getDashboardData } from "@/lib/data/dashboard";
import { isOnePage } from "@/lib/flags/is-one-page";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getDashboardData();
  return <DashboardShell data={data} isOnePage={isOnePage()} />;
}
