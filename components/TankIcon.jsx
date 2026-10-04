'use client'

import React from 'react'

// Tank kecil (badan + meriam) dari sprite yang sama dengan di dalam game.
// color: 'A' merah, 'B' kuning, 'C' hijau tosca, 'D' biru
export default function TankIcon({ color = 'D', size = 56, rotate = 0, className = '', style = {} }) {
  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size, transform: `rotate(${rotate}deg)`, filter: 'drop-shadow(0 2px 0 rgba(59,42,26,0.55))', ...style }}
    >
      <img
        src={`/assets/PNG/Hulls_Color_${color}/Hull_01.png`}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full select-none"
      />
      <img
        src={`/assets/PNG/Weapon_Color_${color}/Gun_01.png`}
        alt=""
        draggable={false}
        className="absolute select-none"
        style={{ height: '82.8%', left: '31.6%', top: '8.6%' }}
      />
    </div>
  )
}
