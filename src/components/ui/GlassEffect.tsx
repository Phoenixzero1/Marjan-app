"use client"

import React from "react"
import LiquidGlass from "@/lib/liquid-glass"

type GlassMode = "standard" | "polar" | "prominent" | "shader"

interface GlassEffectProps {
  children: React.ReactNode
  width?: number
  height?: number
  cornerRadius?: number
  mode?: GlassMode
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
  displacementScale?: number
  blurAmount?: number
  saturation?: number
  aberrationIntensity?: number
  elasticity?: number
  padding?: string
  overLight?: boolean
}

/**
 * Inline-flow wrapper around LiquidGlass.
 * Renders a sized container (width × height) and positions
 * LiquidGlass absolutely at its centre — compatible with flexbox.
 */
export default function GlassEffect({
  children,
  width = 44,
  height = 44,
  cornerRadius = 999,
  mode = "standard",
  onClick,
  className,
  style,
  displacementScale = 64,
  blurAmount = 0.1,
  saturation = 130,
  aberrationIntensity = 2,
  elasticity = 0.4,
  padding = "0",
  overLight = false,
}: GlassEffectProps) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        width,
        height,
        flexShrink: 0,
        ...style,
      }}
    >
      <LiquidGlass
        cornerRadius={cornerRadius}
        mode={mode}
        onClick={onClick}
        displacementScale={displacementScale}
        blurAmount={blurAmount}
        saturation={saturation}
        aberrationIntensity={aberrationIntensity}
        elasticity={elasticity}
        padding={padding}
        overLight={overLight}
        style={{ position: "absolute", top: "50%", left: "50%" }}
      >
        {children}
      </LiquidGlass>
    </div>
  )
}
