"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import Logo from "@/components/globalAssets/logo";
export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/0 bg-background/0 backdrop-blur supports-[backdrop-filter]:bg-background/0">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Logo className="h-8 w-auto" />
        </Link>
        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          {/* <Link href="/solutions" className="transition-colors hover:text-primary">
            Solutions
          </Link>
          <Link href="/industries" className="transition-colors hover:text-primary">
            Industries
          </Link>
          <Link href="/about" className="transition-colors hover:text-primary">
            About Us
          </Link> */}
        </nav>
        <div className="flex items-center space-x-4">
          {/* <Link href="https://github.com/carbonpay" target="_blank" rel="noreferrer">
            <Button variant="ghost" size="icon">
              <Github className="h-4 w-4" />
              <span className="sr-only">GitHub</span>
            </Button>
          </Link> */}
          {/* <Button variant="ghost" size="sm">
            Contact
          </Button>
          <Button variant="ghost" size="sm">
            Contact
          </Button>
          <Button variant="ghost" size="sm">
            Contact
          </Button> */}
          <Button size="sm">Beta Avaiable Soon</Button>
        </div>
      </div>
    </header>
  );
}
