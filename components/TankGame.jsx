'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Trophy, RotateCcw, Home, Star, Pause } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getMap, GAME_W, GAME_H } from '../lib/maps'
import { CFG, MODES, KEY_LABELS, COLOR_HEX, COLOR_NAME } from '../lib/gameConfig'
import { createMainScene } from '../lib/createScene'
import TankIcon from './TankIcon'

function PlayerCard({ p, color }) {
  const pct = Math.max(0, Math.round((p.hp / p.maxHp) * 100))
  const barColor = pct > 50 ? '#4ade80' : pct > 25 ? '#facc15' : '#ef4444'
  return (
    <div
      className="flex items-center gap-2 bg-[#fff8e1] border-[3px] border-[#3b2a1a] rounded-2xl px-3 py-2 min-w-[150px] flex-1 shadow-[0_4px_0_#3b2a1a]"
      style={{ opacity: p.alive ? 1 : 0.55 }}
    >
      <TankIcon color={color} size={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-display text-sm leading-none truncate" style={{ color: p.hex }}>
            {p.name}
          </span>
          <span className="flex items-center gap-1 text-xs font-bold text-[#3b2a1a]">
            <Star size={12} className="fill-amber-400 text-amber-600" /> {p.kills}
          </span>
        </div>
        <div className="mt-1.5 h-3 rounded-full bg-[#3b2a1a]/25 border-2 border-[#3b2a1a] overflow-hidden">
          <div className="h-full transition-all duration-150" style={{ width: `${pct}%`, background: barColor }} />
        </div>
        <div className="text-[10px] font-bold text-[#3b2a1a]/70 mt-0.5">{p.alive ? `${pct}% HP` : 'DESTROYED…'}</div>
      </div>
    </div>
  )
}

export default function TankGame({ gameMode, mapId, onReturnHome }) {
  const mountRef = useRef(null)
  const [hud, setHud] = useState(null)
  const [result, setResult] = useState(null) // { label, hex }
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | error
  const [round, setRound] = useState(0) // naik 1 setiap "Play Again"

  const map = getMap(mapId)
  const modeCfg = MODES[gameMode] || MODES['1v1']

  useEffect(() => {
    let cancelled = false
    let game = null
    setHud(null)
    setResult(null)
    setSaveState('idle')

    import('phaser').then((mod) => {
      if (cancelled || !mountRef.current) return
      const Phaser = mod.default || mod

      const onMatchOver = async (res) => {
        if (cancelled) return
        setResult(res)
        setSaveState('saving')
        try {
          const { error } = await supabase
            .from('matches')
            .insert([{ mode: gameMode, winner: res.label, timestamp: new Date() }])
          if (!cancelled) setSaveState(error ? 'error' : 'saved')
        } catch {
          if (!cancelled) setSaveState('error')
        }
      }

      const Scene = createMainScene(Phaser, {
        gameMode,
        map,
        onHud: (snapshot) => !cancelled && setHud(snapshot),
        onMatchOver,
      })

      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: mountRef.current,
        width: GAME_W,
        height: GAME_H,
        backgroundColor: '#2a1d10',
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
        scene: Scene,
      })
    })

    return () => {
      cancelled = true
      if (game) game.destroy(true)
    }
  }, [gameMode, mapId, round]) // eslint-disable-line react-hooks/exhaustive-deps

  // Space / panah jangan menggulung halaman saat bermain
  

  const players = hud?.players || []
  const colorOf = (i) => modeCfg.colors[i]

  return (
    <div className="desert-sky min-h-screen flex flex-col items-center px-3 py-4 relative">
      <div className="w-full max-w-[1280px] relative z-10">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display bg-[#5b6b2f] text-[#fff3c4] px-4 py-1.5 rounded-full border-[3px] border-[#3b2a1a] shadow-[0_3px_0_#3b2a1a] text-sm">
              {gameMode.toUpperCase()}
            </span>
            <span className="font-display bg-[#fff1c9] text-[#3b2a1a] px-4 py-1.5 rounded-full border-[3px] border-[#3b2a1a] shadow-[0_3px_0_#3b2a1a] text-sm">
              {map.name}
            </span>
            <span className="hidden sm:flex items-center gap-1 text-xs font-bold text-[#3b2a1a]/80">
              <Pause size={14} /> P / Esc = pause
            </span>
          </div>
          <button onClick={onReturnHome} className="btn-cartoon bg-[#fff1c9] text-[#3b2a1a] px-4 py-2 text-sm flex items-center gap-2">
            <Home size={16} /> Exit to Menu
          </button>
        </div>

        {/* Scoreboard */}
        <div className="flex flex-wrap items-stretch gap-3 mb-4">
          {hud && hud.teamMode ? (
            <>
              <div className="flex flex-1 gap-3 min-w-[300px]">
                {players.filter((p) => p.team === 0).map((p) => (
                  <PlayerCard key={p.idx} p={p} color={colorOf(p.idx)} />
                ))}
              </div>
              <div className="cartoon-card bg-[#5b6b2f] text-[#fff3c4] px-5 flex flex-col items-center justify-center">
                <div className="text-[10px] font-bold tracking-widest">FIRST TO {hud.target}</div>
                <div className="font-display text-4xl leading-none">
                  {hud.teams[0]} : {hud.teams[1]}
                </div>
              </div>
              <div className="flex flex-1 gap-3 min-w-[300px]">
                {players.filter((p) => p.team === 1).map((p) => (
                  <PlayerCard key={p.idx} p={p} color={colorOf(p.idx)} />
                ))}
              </div>
            </>
          ) : (
            <>
              {players.map((p) => (
                <PlayerCard key={p.idx} p={p} color={colorOf(p.idx)} />
              ))}
              <div className="cartoon-card bg-[#5b6b2f] text-[#fff3c4] px-5 py-2 flex flex-col items-center justify-center">
                <div className="text-[10px] font-bold tracking-widest">FIRST TO</div>
                <div className="font-display text-3xl leading-none">{CFG.killsToWin} KILLS</div>
              </div>
            </>
          )}
        </div>

        {/* Game canvas */}
        <div className="relative cartoon-card overflow-hidden bg-[#2a1d10]">
          <div ref={mountRef} className="w-full" style={{ aspectRatio: `${GAME_W} / ${GAME_H}` }} />

          {result && (
            <div className="absolute inset-0 bg-[#2a1d10]/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 animate-fade-in">
              <Trophy className="w-20 h-20 text-amber-300 mb-3 animate-bounce" />
              <h1 className="font-display text-4xl md:text-6xl text-[#fff3c4] drop-shadow-[0_5px_0_#3b2a1a]">
                <span style={{ color: result.hex }}>{result.label}</span> Wins!
              </h1>
              <p className="text-[#f4dc9f] mt-2 mb-6 text-sm">
                {saveState === 'saving' && 'Saving match to database…'}
                {saveState === 'saved' && 'Match saved to the database.'}
                {saveState === 'error' && 'Match could not be saved (check the Supabase connection / matches table).'}
              </p>
              <div className="flex gap-4 flex-wrap justify-center">
                <button onClick={() => setRound((r) => r + 1)} className="btn-cartoon bg-[#d9622b] text-white px-6 py-3 flex items-center gap-2">
                  <RotateCcw size={20} /> Play Again
                </button>
                <button onClick={onReturnHome} className="btn-cartoon bg-[#fff1c9] text-[#3b2a1a] px-6 py-3 flex items-center gap-2">
                  <Home size={20} /> Main Menu
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {modeCfg.colors.map((c, i) => (
            <div key={i} className="flex items-center gap-3 bg-[#fff8e1] border-[3px] border-[#3b2a1a] rounded-2xl px-3 py-2 shadow-[0_4px_0_#3b2a1a]">
              <TankIcon color={c} size={38} />
              <div className="text-xs text-[#3b2a1a] leading-snug">
                <div className="font-display text-sm" style={{ color: COLOR_HEX[c] }}>
                  Player {i + 1} <span className="text-[#3b2a1a]/60">({COLOR_NAME[c]})</span>
                </div>
                <div>Move {KEY_LABELS[i].move} · Turn {KEY_LABELS[i].turn}</div>
                <div>Shoot {KEY_LABELS[i].fire}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
