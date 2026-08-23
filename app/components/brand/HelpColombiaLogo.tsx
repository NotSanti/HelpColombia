import Image from "next/image";
import { cn } from "@/lib/utils";

type HelpColombiaLogoProps = {
  className?: string;
  showTagline?: boolean;
};

export function HelpColombiaLogo({
  className,
  showTagline = true,
}: HelpColombiaLogoProps) {
  return (
    <a
      href="#overview"
      className={cn(
        "inline-flex items-center gap-3 rounded-md focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      aria-label="Help Colombia home"
    >
      <Image
        src="/help-colombia-mark.svg"
        alt=""
        width={52}
        height={48}
        className="h-11 w-auto shrink-0"
        priority
      />
      <span className="flex min-w-0 flex-col leading-none">
        <span className="text-base font-bold tracking-tight sm:text-lg">
          <span className="text-foreground">Help </span>
          <span className="text-[#E51C2E]">Colombia</span>
        </span>
        {showTagline ? (
          <span className="mt-1.5 text-xs font-normal text-text-secondary">
            United support. Real impact.
          </span>
        ) : null}
      </span>
    </a>
  );
}
