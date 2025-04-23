"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="container flex min-h-[calc(100vh-3.5rem)] max-w-screen-2xl flex-col items-center justify-center space-y-8 py-24 text-center md:py-32">
      <div className="space-y-4">
        <h1 className="bg-gradient-to-br from-foreground from-30% via-foreground/90 to-foreground/70 bg-clip-text text-4xl tracking-tight text-transparent sm:text-5xl md:text-6xl lg:text-7xl">
          Driving Transparent
          <br />
          <span className="font-bold">Carbon</span> Solutions.
        </h1>
        <p className="mx-auto max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
          Seamless, secure, and transparent carbon credit trading powered by
          blockchain.
        </p>
      </div>
      <div className="flex gap-4">
        <Button size="lg" variant="outline">
          BETA AVAIABLE SOON
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
