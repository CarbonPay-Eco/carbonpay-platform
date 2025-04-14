"use client"

import { useEffect, useRef, useState } from "react"
import { Building, Globe, CheckCircle, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CarbonCreditsExplainer() {
  const [isVisible, setIsVisible] = useState(false)
  const [animateChart, setAnimateChart] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  // Intersection observer to trigger animations when section is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          setTimeout(() => setAnimateChart(true), 500)
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const reasons = [
    {
      title: "Regulatory Compliance",
      description: "Many governments mandate emission reductions, requiring businesses to offset their carbon output.",
      icon: <Building className="h-6 w-6" />,
    },
    {
      title: "Corporate Responsibility",
      description:
        "Consumers and investors demand sustainable business practices with clear environmental commitments.",
      icon: <Globe className="h-6 w-6" />,
    },
    {
      title: "Net Zero Goals",
      description: "Carbon credits help bridge the gap between unavoidable emissions and sustainability targets.",
      icon: <CheckCircle className="h-6 w-6" />,
    },
    {
      title: "Market Growth & Investment",
      description:
        "The global carbon market is projected to surpass $13 trillion by 2033, making it a valuable asset class.",
      icon: <TrendingUp className="h-6 w-6" />,
    },
  ]

  // Carbon offset volume data (in million metric tons)
  const offsetData = [120, 250, 420, 650, 950, 1500]
  const years = [2023, 2025, 2027, 2029, 2031, 2033]

  return (
    <section ref={sectionRef} className="py-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">What Are Carbon Credits and Why Offset?</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Carbon credits are tradable assets that represent the reduction or removal of one metric ton of CO₂ from the
            atmosphere. They are issued to projects that actively reduce emissions—allowing companies and individuals to
            offset their own carbon footprint.
          </p>
        </div>

        {/* Why Offset Section */}
        <div>
          {/* <h3 className="text-2xl font-semibold mb-8 text-center">Why Offset Carbon Emissions?</h3> */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Chart now on the left */}
            <div
              className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"}`}
            >
              {/* Carbon Offset Volume Visualization */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-6 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="font-semibold">Global Carbon Offset Volume</h4>
                    <p className="text-sm text-gray-400">Million metric tons of CO₂ offset per year</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></div>
                    <span className="text-sm text-green-500">Growing Market</span>
                  </div>
                </div>

                <div className="relative h-[300px] pt-6">
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-gray-500">
                    <div>1,500 Mt</div>
                    <div>1,200 Mt</div>
                    <div>900 Mt</div>
                    <div>600 Mt</div>
                    <div>300 Mt</div>
                    <div>0 Mt</div>
                  </div>

                  {/* Chart area */}
                  <div className="absolute left-16 right-0 top-0 bottom-0">
                    {/* Horizontal grid lines */}
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="absolute left-0 right-0 h-px bg-gray-800" style={{ top: `${i * 20}%` }} />
                    ))}

                    {/* X-axis labels */}
                    <div className="absolute left-0 right-0 bottom-0 flex justify-between text-xs text-gray-500">
                      {years.map((year, i) => (
                        <div key={i} className="text-center" style={{ width: `${100 / years.length}%` }}>
                          {year}
                        </div>
                      ))}
                    </div>

                    {/* Bars */}
                    <div className="absolute left-0 right-0 bottom-6 top-0 flex justify-around items-end">
                      {offsetData.map((value, i) => (
                        <div
                          key={i}
                          className="w-12 bg-gradient-to-t from-green-600 to-green-400 rounded-t-md relative group"
                          style={{
                            height: animateChart ? `${(value / 1500) * 100}%` : "0%",
                            transition: `height 1s ease-out ${i * 0.2}s`,
                          }}
                        >
                          {/* Tooltip */}
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {value} Mt CO₂
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center text-sm text-gray-400">
                  <p>Data source: Climate Action Registry & Voluntary Carbon Market Reports</p>
                  <p className="mt-2">
                    By offsetting emissions with transparent, verifiable credits, companies contribute to a sustainable
                    future while reinforcing their commitment to climate action.
                  </p>
                </div>
              </div>
            </div>

            {/* Text content now on the right */}
            <div
              className={`transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"}`}
            >
              <div className="space-y-6">
                {reasons.map((reason, index) => (
                  <div
                    key={index}
                    className="flex gap-4 bg-black/20 p-4 rounded-lg border border-white/5 hover:border-green-500/30 transition-colors duration-300"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center">
                      {reason.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg mb-1">{reason.title}</h4>
                      <p className="text-gray-400 text-sm">{reason.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                {/* <Button className="bg-green-600 hover:bg-green-500 text-white px-6 py-2">Start Offsetting Today</Button> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

