"use client";
import { Button } from "@/components/ui/button";

export default function CTA() {
  return (
    <section className="">
      <div className="container flex flex-col items-center gap-4 py-24 text-center md:py-32">
        <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl">
          Ready to transform carbon markets?
        </h2>
        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
          Join companies worldwide leveraging CarbonPay for transparent,
          efficient, and verifiable carbon credit trading powered by blockchain.
        </p>
        <Button size="lg" className="mt-4">
          Beta Avaiable on Q2/2025
        </Button>
      </div>
    </section>
  );
}
