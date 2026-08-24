import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import {
  ADMIN_SESSION_COOKIE,
  isValidAdminSessionToken,
} from "@/lib/admin/auth";

export default async function AdminLoginPage() {
  const session = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (isValidAdminSessionToken(session)) {
    redirect("/admin");
  }

  return (
    <div className="flex h-full items-center justify-center p-4">
      <AdminLoginForm />
    </div>
  );
}
