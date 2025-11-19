import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // core: inline, uppercase, SHARP corners
  "inline-flex items-center justify-center border px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase rounded-none",
  {
    variants: {
      variant: {
        // Default black badge, white text + border
        default: "bg-black text-white border-white",

        // Outline: transparent background, white text, white border
        outline: "bg-transparent text-white border-white",

        // Subtle: inverted (white chip, black text)
        subtle: "bg-white text-black border-black",

        // Secondary: same as outline for compatibility
        secondary: "bg-transparent text-white border-white",

        // Destructive/error: same visual as subtle, message carries meaning
        destructive: "bg-white text-black border-black",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
