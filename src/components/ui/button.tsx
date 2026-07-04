import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 backdrop-blur-md",
  {
    variants: {
      variant: {
        glass: "bg-gradient-to-br from-white/45 to-white/20 text-foreground border border-white/35 shadow-lg shadow-primary/10 hover:from-white/55 hover:to-white/30 hover:shadow-xl hover:shadow-primary/20 hover:scale-105 dark:from-white/18 dark:to-white/8 dark:text-foreground dark:border-white/20",
        default:
          "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md shadow-primary/25 hover:brightness-110 hover:shadow-lg hover:shadow-primary/35 hover:scale-105 border border-white/20",
        destructive:
          "bg-gradient-to-br from-destructive/95 to-rose-500/90 text-destructive-foreground shadow-md shadow-destructive/25 hover:brightness-110 hover:shadow-lg hover:shadow-destructive/35 hover:scale-105 focus-visible:ring-destructive/30 border border-white/15",
        outline:
          "border border-border/60 bg-background/55 shadow-sm hover:bg-accent/35 hover:text-accent-foreground hover:shadow-md hover:scale-105 dark:bg-background/35",
        secondary:
          "bg-gradient-to-br from-secondary to-violet-500 text-secondary-foreground shadow-md shadow-secondary/25 hover:brightness-110 hover:shadow-lg hover:shadow-secondary/35 hover:scale-105 border border-white/15",
        ghost:
          "hover:bg-accent/35 hover:text-accent-foreground hover:scale-105 transition-all duration-300",
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
