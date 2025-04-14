"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUpRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OnDemandOffset() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const [graphData, setGraphData] = useState<number[]>([25, 30, 28, 35, 40, 38, 45, 50, 48, 55, 60, 65])
  const [currentIndex, setCurrentIndex] = useState(0)

  // Animation for graph data
  useEffect(() => {
    const interval = setInterval(() => {
      setGraphData((prev) => {
        const newData = [...prev]
        // Add a new data point with some random variation
        const lastValue = newData[newData.length - 1]
        const randomChange = Math.random() * 10 - 5 // Random value between -5 and 5
        const newValue = Math.max(20, Math.min(70, lastValue + randomChange)) // Keep between 20 and 70
        newData.push(Math.round(newValue))

        // Remove first item if we have more than 12 points
        if (newData.length > 12) {
          newData.shift()
        }

        return newData
      })

      setCurrentIndex((prev) => (prev + 1) % 12)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Intersection observer to trigger animations when section is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
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

  // Calculate the SVG path for the graph
  const getPath = () => {
    const height = 200
    const width = 500
    const max = Math.max(...graphData)
    const min = Math.min(...graphData)
    const range = max - min

    const points = graphData.map((value, index) => {
      const x = (index / (graphData.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })

    return `M0,${height} L${points.join(" L")} L${width},${height} Z`
  }

  return (
    <section ref={sectionRef} className="py-24 overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div
            className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"}`}
          >
            <h2 className="text-4xl font-bold mb-6">On-Demand Offset</h2>
            <p className="text-xl text-gray-300 mb-8">
              Offset your emissions in real-time with verified carbon credits.
            </p>

            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Instant Verification</h3>
                  <p className="text-gray-400">All carbon credits are instantly verified on the blockchain.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Real-Time Tracking</h3>
                  <p className="text-gray-400">Monitor your carbon footprint reduction in real-time.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Transparent Reporting</h3>
                  <p className="text-gray-400">Generate detailed reports for sustainability initiatives.</p>
                </div>
              </div>
            </div>

          </div>

          <div
            className={`transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"}`}
          >
            <div className="bg-black/40 border border-white/10 rounded-xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Carbon Offset Tracking</h3>
                  <p className="text-sm text-gray-400">Real-time monitoring of your carbon credits</p>
                </div>
                <div className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-sm font-medium">
                  (Mock)Live Data
                </div>
              </div>

              <div className="relative h-[250px] w-full">
                {/* Graph visualization */}
                <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="0" y1="0" x2="500" y2="0" stroke="#333" strokeWidth="1" />
                  <line x1="0" y1="50" x2="500" y2="50" stroke="#333" strokeWidth="1" />
                  <line x1="0" y1="100" x2="500" y2="100" stroke="#333" strokeWidth="1" />
                  <line x1="0" y1="150" x2="500" y2="150" stroke="#333" strokeWidth="1" />
                  <line x1="0" y1="200" x2="500" y2="200" stroke="#333" strokeWidth="1" />

                  {/* Animated graph area */}
                  <path d={getPath()} fill="url(#graphGradient)" className="transition-all duration-1000 ease-in-out" />

                  {/* Line on top of area */}
                  <path
                    d={`M${graphData
                      .map((value, index) => {
                        const x = (index / (graphData.length - 1)) * 500
                        const y =
                          200 -
                          ((value - Math.min(...graphData)) / (Math.max(...graphData) - Math.min(...graphData))) * 200
                        return `${x},${y}`
                      })
                      .join(" L")}`}
                    fill="none"
                    stroke="#05A94F"
                    strokeWidth="3"
                    className="transition-all duration-1000 ease-in-out"
                  />

                  {/* Data points */}
                  {graphData.map((value, index) => {
                    const x = (index / (graphData.length - 1)) * 500
                    const y =
                      200 - ((value - Math.min(...graphData)) / (Math.max(...graphData) - Math.min(...graphData))) * 200
                    return (
                      <circle
                        key={index}
                        cx={x}
                        cy={y}
                        r={index === currentIndex ? 6 : 4}
                        fill={index === currentIndex ? "#fff" : "#05A94F"}
                        stroke={index === currentIndex ? "#05A94F" : "none"}
                        strokeWidth="2"
                        className="transition-all duration-300"
                      />
                    )
                  })}

                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="graphGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#05A94F" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#05A94F" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Current value indicator */}
                <div className="absolute top-4 right-4 bg-black/60 border border-white/10 rounded-lg px-4 py-2">
                  <div className="text-sm text-gray-400">Current Offset</div>
                  <div className="text-2xl font-bold text-green-500">{graphData[currentIndex]} tCO₂e</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-black/30 rounded-lg p-3">
                  <div className="text-sm text-gray-400">Total Offset</div>
                  <div className="text-xl font-semibold">1,245 tCO₂e</div>
                </div>
                <div className="bg-black/30 rounded-lg p-3">
                  <div className="text-sm text-gray-400">Projects</div>
                  <div className="text-xl font-semibold">12 Active</div>
                </div>
                <div className="bg-black/30 rounded-lg p-3">
                  <div className="text-sm text-gray-400">Certificates</div>
                  <div className="text-xl font-semibold">35 Issued</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

