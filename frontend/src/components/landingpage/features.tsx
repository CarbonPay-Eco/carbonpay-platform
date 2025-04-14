"use client";
import {
  Brain,
  Cloud,
  Shield,
  Zap,
  Earth,
  LocateFixed,
  DollarSign,
} from "lucide-react";

const features = [
  {
    name: "Tokenize Carbon Credits",
    description:
      "CarbonPay securely transforms verified carbon credits into blockchain-based tokens, ensuring transparency and authenticity.",
    icon: Shield,
  },
  {
    name: "Facilitate Global Trading",
    description:
      "Enables seamless buying and selling of carbon credits globally, removing intermediaries and promoting market accessibility.",
    icon: Earth,
  },
  {
    name: "Real-Time Tracking ",
    description:
      "Provides real-time insights into carbon credit ownership, usage, and compliance through a user-friendly dashboard.",
    icon: LocateFixed,
  },
  {
    name: "Multi-Currency & Payment Options",
    description:
      "Support payments in stablecoins, fiat, and crypto, providing flexibility for businesses and institutions worldwide.",
    icon: DollarSign,
  },
];

export default function Features() {
  return (
    <section className="container space-y-16 py-24 md:py-32">
      <div className="mx-auto max-w-[58rem] text-center">
        <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl">
          Redefining Carbon Offsetting
        </h2>
        <p className="mt-4 text-muted-foreground sm:text-lg">
          CarbonPay brings trust, speed, and innovation to global carbon
          markets.
        </p>
      </div>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
        {features.map((feature) => (
          <div
            key={feature.name}
            className="relative overflow-hidden rounded-lg border bg-background p-8"
          >
            <div className="flex items-center gap-4">
              <feature.icon className="h-8 w-8" />
              <h3 className="font-bold">{feature.name}</h3>
            </div>
            <p className="mt-2 text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
