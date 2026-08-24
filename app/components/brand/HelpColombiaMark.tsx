"use client";

import Image from "next/image";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

export function HelpColombiaMark({ className }: { className?: string }) {
  const { theme } = useTheme();

  return (
    <Image
      src={
        theme === "light"
          ? "/help-colombia-mark-light.svg"
          : "/help-colombia-mark.svg"
      }
      alt=""
      width={52}
      height={48}
      className={cn("h-11 w-auto shrink-0", className)}
      priority
    />
  );
}
