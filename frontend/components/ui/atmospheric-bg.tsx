'use client'

import React, { useMemo } from 'react'

interface AtmosphericBgProps {
  opacity?: number
}

// Helper to round floats to 2 decimal places to prevent SSR/CSR hydration mismatch
const f = (n: number) => n.toFixed(2)

export default function AtmosphericBg({ opacity = 1 }: AtmosphericBgProps) {
  // Generate grass layers once to avoid recalculating on every render
  const rearLayer = useMemo(() => {
    const count = 75
    const baseHeight = 160
    const seed = 1.5
    const blades = []
    for (let i = 0; i < count; i++) {
      const x = (i / count) * 1480 - 20
      const organicHeight = baseHeight + 
        Math.sin(i * 0.15 + seed) * (baseHeight * 0.35) + 
        Math.cos(i * 0.35 + seed * 2) * (baseHeight * 0.15) + 
        Math.sin(i * 0.8 + seed * 3) * 8
      const skew = Math.sin(i * 0.08 + seed) * 12
      const bladeWidth = 5 + (Math.abs(Math.sin(i * 0.5 + seed)) * 8)
      
      blades.push(
        <path
          key={i}
          d={`M ${f(x)} 300 Q ${f(x + skew)} ${f(300 - organicHeight)}, ${f(x + skew * 1.1)} ${f(300 - organicHeight)} Q ${f(x + bladeWidth + skew)} ${f(300 - organicHeight * 0.85)}, ${f(x + bladeWidth)} 300 Z`}
          fill="#08102a"
          opacity="0.35"
        />
      )
    }
    return blades
  }, [])

  const middleLayer = useMemo(() => {
    const count = 90
    const baseHeight = 120
    const seed = 3.2
    const blades = []
    for (let i = 0; i < count; i++) {
      const x = (i / count) * 1480 - 20
      const organicHeight = baseHeight + 
        Math.sin(i * 0.12 + seed) * (baseHeight * 0.3) + 
        Math.cos(i * 0.3 + seed * 2) * (baseHeight * 0.15) + 
        Math.sin(i * 0.7 + seed * 3) * 6
      const skew = Math.sin(i * 0.07 + seed) * 10
      const bladeWidth = 7 + (Math.abs(Math.sin(i * 0.4 + seed)) * 10)
      
      blades.push(
        <path
          key={i}
          d={`M ${f(x)} 300 Q ${f(x + skew)} ${f(300 - organicHeight)}, ${f(x + skew * 1.15)} ${f(300 - organicHeight)} Q ${f(x + bladeWidth + skew)} ${f(300 - organicHeight * 0.8)}, ${f(x + bladeWidth)} 300 Z`}
          fill="#050a1b"
          opacity="0.6"
        />
      )
    }
    return blades
  }, [])

  const frontLayer = useMemo(() => {
    const count = 100
    const baseHeight = 80
    const seed = 5.7
    const blades = []
    for (let i = 0; i < count; i++) {
      const x = (i / count) * 1480 - 20
      const organicHeight = baseHeight + 
        Math.sin(i * 0.1 + seed) * (baseHeight * 0.3) + 
        Math.cos(i * 0.25 + seed * 2) * (baseHeight * 0.1) + 
        Math.sin(i * 0.6 + seed * 3) * 5
      const skew = Math.sin(i * 0.06 + seed) * 8
      const bladeWidth = 8 + (Math.abs(Math.sin(i * 0.3 + seed)) * 12)
      
      blades.push(
        <path
          key={i}
          d={`M ${f(x)} 300 Q ${f(x + skew)} ${f(300 - organicHeight)}, ${f(x + skew * 1.2)} ${f(300 - organicHeight)} Q ${f(x + bladeWidth + skew)} ${f(300 - organicHeight * 0.8)}, ${f(x + bladeWidth)} 300 Z`}
          fill="#02040b"
          opacity="0.85"
        />
      )
    }
    return blades
  }, [])

  return (
    <div 
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0"
      style={{ opacity }}
    >
      {/* Deep twilight sky background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#090c1a] via-[#050814] to-[#020308]" />
      
      {/* Soft celestial glow from the top-center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] h-[65%] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/8 via-indigo-950/2 to-transparent blur-3xl" />
      <div className="absolute top-[-15%] left-[35%] w-[450px] h-[450px] rounded-full bg-blue-600/5 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute top-[-10%] right-[30%] w-[350px] h-[350px] rounded-full bg-purple-600/4 blur-[100px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />

      {/* Atmospheric Star Field */}
      <div className="absolute inset-0">
        {/* Pulsing stars */}
        <div className="absolute top-[12%] left-[18%] w-1.5 h-1.5 bg-white rounded-full animate-pulse [animation-duration:3s]" />
        <div className="absolute top-[22%] left-[82%] w-1 h-1 bg-white rounded-full opacity-60 animate-pulse [animation-duration:4s] [animation-delay:1s]" />
        <div className="absolute top-[38%] left-[42%] w-1 h-1 bg-indigo-300 rounded-full animate-pulse [animation-duration:5s] [animation-delay:2s]" />
        <div className="absolute top-[8%] left-[58%] w-1.5 h-1.5 bg-white rounded-full opacity-50 animate-pulse [animation-duration:6s]" />
        <div className="absolute top-[55%] left-[14%] w-1 h-1 bg-white rounded-full opacity-40 animate-pulse [animation-duration:4s] [animation-delay:0.5s]" />
        <div className="absolute top-[48%] left-[88%] w-1 h-1 bg-blue-300 rounded-full animate-pulse [animation-duration:7s] [animation-delay:1.5s]" />
        <div className="absolute top-[68%] left-[72%] w-1 h-1 bg-white rounded-full opacity-50 animate-pulse [animation-duration:3s] [animation-delay:1.2s]" />
        <div className="absolute top-[28%] left-[28%] w-1.5 h-1.5 bg-white rounded-full opacity-70 animate-pulse [animation-duration:2.5s]" />
        <div className="absolute top-[18%] left-[90%] w-1 h-1 bg-white rounded-full opacity-50 animate-pulse [animation-duration:4s] [animation-delay:0.3s]" />
        <div className="absolute top-[45%] left-[25%] w-1.5 h-1.5 bg-indigo-400 rounded-full opacity-60 animate-pulse [animation-duration:6s] [animation-delay:1.8s]" />
        <div className="absolute top-[62%] left-[52%] w-1 h-1 bg-white rounded-full opacity-35 animate-pulse [animation-duration:5s] [animation-delay:0.7s]" />

        {/* shooting star traces */}
        <div className="absolute top-[9%] left-[68%] w-[120px] h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-[-28deg] opacity-75" />
        <div className="absolute top-[26%] left-[8%] w-[80px] h-[1px] bg-gradient-to-r from-transparent via-blue-400/15 to-transparent rotate-[-32deg] opacity-60" />
      </div>

      {/* Layered Grass/Reeds Silhouettes at the bottom */}
      <svg
        viewBox="0 0 1440 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute bottom-0 left-0 w-full h-[32vh] min-h-[220px] object-cover pointer-events-none select-none"
        preserveAspectRatio="none"
      >
        {rearLayer}
        {middleLayer}
        {frontLayer}
      </svg>
    </div>
  )
}
