import { SignInForm } from "@/components/auth/sign-in-form"
import Image from "next/image"

export default function SignInPage() {
  return (
    <div className="relative min-h-screen flex overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.12),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.10),_transparent_35%)]" />
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 pb-20 lg:pb-8">
        <div className="relative z-10 w-full max-w-md space-y-8">
          <div className="text-center">
            <Image 
              src="/bs.jpg" 
              alt="Bin Sultan Logo" 
              className="mx-auto mb-6 h-20 w-20 rounded-2xl border border-border object-cover shadow-lg" 
              width={150} 
              height={150}
              priority
              quality={100}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              sizes="(max-width: 700px) 100px, 150px"
            />
            <h2 className="mb-2 text-4xl font-bold leading-tight text-foreground">
              Bin Sultan Fabrics ERP
            </h2>
            <p className="text-muted-foreground text-lg">
              Modern operations for purchasing, inventory, sales and reporting
            </p>
          </div>
          <div className="rounded-3xl border border-border/80 bg-card/95 p-8 shadow-2xl backdrop-blur-sm">
            <SignInForm />
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.25),_transparent_40%)]" />
        <div className="relative z-10 flex h-full w-full items-center justify-center p-12">
          <div className="max-w-xl space-y-8 text-white">
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur">
              Trusted ERP for Fabric Business
            </div>
            <h3 className="text-5xl font-bold leading-tight">
              Beautifully designed workflows for modern retail teams
            </h3>
            <p className="text-lg text-blue-100/90">
              Track sales, inventory, purchasing, and reporting in one clean and professional interface built for speed.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <div className="text-3xl font-bold">24/7</div>
                <div className="text-sm text-blue-100">Operational visibility</div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <div className="text-3xl font-bold">100%</div>
                <div className="text-sm text-blue-100">Centralized management</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 lg:bottom-6 lg:right-6 lg:left-auto bg-background/80 backdrop-blur-sm border border-border/50 rounded-none lg:rounded-lg px-3 py-2 lg:px-4 shadow-lg">
        <div className="flex items-center justify-center lg:justify-start gap-1 lg:gap-2">
          <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-xs lg:text-sm font-semibold text-gradient">
            Powered By
          </span>
          <span className="text-xs lg:text-sm font-bold text-foreground">
          NUCLEUS ONE ERP
          </span>
        </div>
      </div>
    </div>
  )
}
