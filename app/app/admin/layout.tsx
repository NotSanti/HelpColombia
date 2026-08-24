import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Help Colombia",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <main className="h-dvh overflow-hidden bg-background text-foreground">
      {children}
    </main>
  );
}
