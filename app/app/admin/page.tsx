import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import {
  ADMIN_SESSION_COOKIE,
  isValidAdminSessionToken,
} from "@/lib/admin/auth";

export default async function AdminPage() {
  const session = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidAdminSessionToken(session)) {
    redirect("/admin/login");
  }

  return <AdminDashboard />;
}
