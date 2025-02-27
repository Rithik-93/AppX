import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="container px-4 py-6 md:py-8">
        <nav className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-6">
          <Link href="/#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Separator className="hidden md:block h-4" orientation="vertical" />
          <Link href="/#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Terms & Conditions
          </Link>
          <Separator className="hidden md:block h-4" orientation="vertical" />
          <Link href="/#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Disclaimer
          </Link>
          <Separator className="hidden md:block h-4" orientation="vertical" />
          <Link href="/#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Refund Policy
          </Link>
          <Separator className="hidden md:block h-4" orientation="vertical" />
          <Link href="/#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Contact Us
          </Link>
        </nav>
        <Separator className="my-4 md:my-6" />
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Rojgarwithankit. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

