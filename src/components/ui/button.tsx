import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-2xl text-sm font-medium ring-offset-black transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-emerald-500 text-black hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]": variant === "default",
            "border border-white/10 bg-transparent hover:bg-white/[0.04] text-white hover:border-white/20": variant === "outline",
            "hover:bg-white/[0.04] text-slate-400 hover:text-white": variant === "ghost",
            "bg-white/[0.04] text-white hover:bg-white/[0.08]": variant === "secondary",
            "bg-red-500/10 text-red-500 hover:bg-red-500/20": variant === "destructive",
            "h-12 px-6 py-2": size === "default",
            "h-10 rounded-xl px-4": size === "sm",
            "h-14 rounded-3xl px-8 text-base": size === "lg",
            "h-12 w-12": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
