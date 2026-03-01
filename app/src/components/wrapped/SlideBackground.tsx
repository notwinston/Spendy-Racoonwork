import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Rect, G } from 'react-native-svg';

// Slide 0: Radiating fan of semi-transparent wedge paths from top center
export function drawFanSvg(width: number, height: number, accent: string): React.ReactElement {
  const cx = width / 2;
  const cy = 0;
  const radius = Math.max(width, height) * 1.2;
  const numWedges = 18;
  const paths: React.ReactElement[] = [];

  for (let i = 0; i < numWedges; i++) {
    const angle1 = (i / numWedges) * Math.PI;
    const angle2 = ((i + 0.5) / numWedges) * Math.PI;
    const x1 = cx + Math.cos(angle1) * radius;
    const y1 = cy + Math.sin(angle1) * radius;
    const x2 = cx + Math.cos(angle2) * radius;
    const y2 = cy + Math.sin(angle2) * radius;
    paths.push(
      <Path
        key={i}
        d={`M ${cx} ${cy} L ${x1} ${y1} L ${x2} ${y2} Z`}
        fill={accent}
        opacity={0.06 + (i % 3) * 0.02}
      />
    );
  }

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      {paths}
    </Svg>
  );
}

// Slide 1: Concentric circles expanding from bottom-left
export function drawRingsSvg(width: number, height: number, accent: string): React.ReactElement {
  const cx = 0;
  const cy = height;
  const maxRadius = Math.max(width, height) * 1.4;
  const numRings = 12;
  const circles: React.ReactElement[] = [];

  for (let i = 1; i <= numRings; i++) {
    const r = (i / numRings) * maxRadius;
    circles.push(
      <Circle
        key={i}
        cx={cx}
        cy={cy}
        r={r}
        stroke={accent}
        strokeWidth={1.5}
        fill="none"
        opacity={0.08 - i * 0.004}
      />
    );
  }

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      {circles}
    </Svg>
  );
}

// Slide 2: Parallel diagonal lines from top-right to bottom-left
export function drawSlashesSvg(width: number, height: number, accent: string): React.ReactElement {
  const numLines = 20;
  const lines: React.ReactElement[] = [];
  const spacing = (width + height) / numLines;

  for (let i = 0; i < numLines; i++) {
    const offset = i * spacing;
    lines.push(
      <Line
        key={i}
        x1={offset}
        y1={0}
        x2={offset - height}
        y2={height}
        stroke={accent}
        strokeWidth={1}
        opacity={0.07}
      />
    );
  }

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      {lines}
    </Svg>
  );
}

// Slide 3: Horizontal gradient bands with varying widths
export function drawBandsSvg(width: number, height: number, accent: string): React.ReactElement {
  const numBands = 14;
  const rects: React.ReactElement[] = [];
  let y = 0;

  for (let i = 0; i < numBands; i++) {
    const bandHeight = (height / numBands) * (0.6 + Math.sin(i * 0.7) * 0.4);
    rects.push(
      <Rect
        key={i}
        x={0}
        y={y}
        width={width}
        height={bandHeight}
        fill={accent}
        opacity={i % 2 === 0 ? 0.05 : 0.03}
      />
    );
    y += bandHeight;
  }

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      {rects}
    </Svg>
  );
}

// Slide 4: Grid of dots with distance-based opacity falloff
export function drawDotsSvg(width: number, height: number, accent: string): React.ReactElement {
  const spacing = 28;
  const centerX = width * 0.6;
  const centerY = height * 0.4;
  const maxDist = Math.sqrt(width * width + height * height) * 0.5;
  const dots: React.ReactElement[] = [];

  for (let x = spacing / 2; x < width; x += spacing) {
    for (let y = spacing / 2; y < height; y += spacing) {
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const opacity = Math.max(0.02, 0.1 * (1 - dist / maxDist));
      dots.push(
        <Circle key={`${x}-${y}`} cx={x} cy={y} r={2} fill={accent} opacity={opacity} />
      );
    }
  }

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      {dots}
    </Svg>
  );
}

// Slide 5: Concentric arcs from top-right corner
export function drawArcsSvg(width: number, height: number, accent: string): React.ReactElement {
  const cx = width;
  const cy = 0;
  const numArcs = 10;
  const maxRadius = Math.max(width, height) * 1.2;
  const arcs: React.ReactElement[] = [];

  for (let i = 1; i <= numArcs; i++) {
    const r = (i / numArcs) * maxRadius;
    const startAngle = Math.PI * 0.5;
    const endAngle = Math.PI;
    const x1 = cx + Math.cos(startAngle) * r;
    const y1 = cy + Math.sin(startAngle) * r;
    const x2 = cx + Math.cos(endAngle) * r;
    const y2 = cy + Math.sin(endAngle) * r;
    arcs.push(
      <Path
        key={i}
        d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
        stroke={accent}
        strokeWidth={1.5}
        fill="none"
        opacity={0.07}
      />
    );
  }

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      {arcs}
    </Svg>
  );
}

// Slide 6: Radiating lines from bottom-left corner
export function drawRaysSvg(width: number, height: number, accent: string): React.ReactElement {
  const cx = 0;
  const cy = height;
  const radius = Math.max(width, height) * 1.3;
  const numRays = 24;
  const lines: React.ReactElement[] = [];

  for (let i = 0; i < numRays; i++) {
    const angle = -(i / numRays) * (Math.PI / 2);
    const x2 = cx + Math.cos(angle) * radius;
    const y2 = cy + Math.sin(angle) * radius;
    lines.push(
      <Line
        key={i}
        x1={cx}
        y1={cy}
        x2={x2}
        y2={y2}
        stroke={accent}
        strokeWidth={1}
        opacity={0.06}
      />
    );
  }

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      {lines}
    </Svg>
  );
}

// Slide 7: Fan of wedge paths from top center (similar to slide 0)
export function drawFanTopSvg(width: number, height: number, accent: string): React.ReactElement {
  const cx = width / 2;
  const cy = 0;
  const radius = Math.max(width, height) * 1.1;
  const numWedges = 24;
  const paths: React.ReactElement[] = [];

  for (let i = 0; i < numWedges; i++) {
    const angle1 = (i / numWedges) * Math.PI;
    const angle2 = ((i + 0.4) / numWedges) * Math.PI;
    const x1 = cx + Math.cos(angle1) * radius;
    const y1 = cy + Math.sin(angle1) * radius;
    const x2 = cx + Math.cos(angle2) * radius;
    const y2 = cy + Math.sin(angle2) * radius;
    paths.push(
      <Path
        key={i}
        d={`M ${cx} ${cy} L ${x1} ${y1} L ${x2} ${y2} Z`}
        fill={accent}
        opacity={0.04 + (i % 4) * 0.015}
      />
    );
  }

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      {paths}
    </Svg>
  );
}

const PATTERN_FUNCTIONS = [
  drawFanSvg,
  drawRingsSvg,
  drawSlashesSvg,
  drawBandsSvg,
  drawDotsSvg,
  drawArcsSvg,
  drawRaysSvg,
  drawFanTopSvg,
];

interface SlideBackgroundViewProps {
  patternIndex: number;
  accent: string;
}

export default function SlideBackgroundView({ patternIndex, accent }: SlideBackgroundViewProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const drawFn = PATTERN_FUNCTIONS[patternIndex % PATTERN_FUNCTIONS.length];

  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setDimensions({ width, height });
      }}
    >
      {dimensions.width > 0 && drawFn(dimensions.width, dimensions.height, accent)}
    </View>
  );
}
