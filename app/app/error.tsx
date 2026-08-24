"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <h1 className="text-lg font-semibold text-foreground">
        Something went wrong
      </h1>
      <p className="max-w-md text-sm text-text-secondary">
        We could not load the dashboard. Please try again. Verified donation
        links remain disabled until the page loads successfully.
      </p>
      <Button type="button" onClick={() => reset()}>
        Try again
      </Button>
    </main>
  );
}
