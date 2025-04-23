import Navbar from "@/components/landingpage/navbar";
import Hero from "@/components/landingpage/hero";
import Features from "@/components/landingpage/features";
import CTA from "@/components/landingpage/cta";
import Footer from "@/components/landingpage/footer";
import ImageGrid from "@/components/landingpage/image-grid";
import ContactForm from "@/components/landingpage/contact-form";
import OnDemandOffset from "@/components/landingpage/on-demand-offset";
import TokenizationProcess from "@/components/landingpage/tokenization-process";
import CarbonCreditsExplainer from "@/components/landingpage/carbon-credit-explainer";
export default function Home() {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Background gradients */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(50% 50% at 50% 0%, #05A94F 0%, transparent 100%)`,
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col gap-0">
        {" "}
        <Navbar />
        <Hero />
        {/* <ImageGrid /> */}
        <Features />
        <CarbonCreditsExplainer />
        <TokenizationProcess />
        <OnDemandOffset />
        <CTA />
        <ContactForm />
        <Footer />
      </div>
    </div>
  );
}
