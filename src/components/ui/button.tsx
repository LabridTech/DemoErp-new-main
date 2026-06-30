import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        glass: "bg-white/30 text-primary-foreground border border-white/20 backdrop-blur-md hover:bg-white/40 hover:shadow-md hover:scale-105",
        default:
          "bg-primary/90 text-primary-foreground shadow-sm hover:bg-primary hover:shadow-md hover:scale-105 backdrop-blur-md border border-primary/20",
        destructive:
          "bg-destructive/90 text-destructive-foreground shadow-sm hover:bg-destructive hover:shadow-md hover:scale-105 focus-visible:ring-destructive/20 backdrop-blur-md border border-destructive/20",
        outline:
          "border border-border/50 bg-background/50 backdrop-blur-md shadow-sm hover:bg-accent/50 hover:text-accent-foreground hover:shadow-md hover:scale-105",
        secondary:
          "bg-secondary/90 text-secondary-foreground shadow-sm hover:bg-secondary hover:shadow-md hover:scale-105 backdrop-blur-md border border-secondary/20",
        ghost:
          "hover:bg-accent/50 hover:text-accent-foreground hover:scale-105 backdrop-blur-sm transition-all duration-300",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
