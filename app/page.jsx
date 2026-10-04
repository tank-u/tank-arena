'use client'

import React, { useState } from 'react'
import {
  Users, Shield, Trophy, Play, MapPin, BookOpen, ChevronRight, ArrowLeft,
  Crosshair, Snowflake, Bomb, Heart, Wind,
} from 'lucide-react'
import TankGame from '../components/TankGame'
import TankIcon from '../components/TankIcon'
import { MAPS } from '../lib/maps'
import { CFG, MODES, KEY_LABELS, COLOR_HEX, COLOR_NAME } from '../lib/gameConfig'

/* ------------------------------------------------------------------ */
/*  Data tampilan                                                      */
/* ------------------------------------------------------------------ */
const MODE_CARDS = [
  {
    id: '1v1',
    title: '1 vs 1 Duel',
    desc: 'Head-to-head showdown for 2 players on a single keyboard.',
    tag: '2 PLAYERS',
    head: '#5b6b2f',
    Icon: Users,
  },
  {
    id: '2v2',
    title: '2 vs 2 Team',
    desc: 'Cool tanks vs warm tanks. Teammates can\u2019t hurt each other with shells.',
    tag: '4 PLAYERS',
    head: '#c2762f',
    Icon: Shield,
  },
  {
    id: '1v1v1v1',
    title: '1v1v1v1 FFA',
    desc: 'Free-for-all chaos! Every tank for itself, bank shots welcome.',
    tag: '4 PLAYERS',
    head: '#a9432a',
    Icon: Trophy,
  },
]

const MAP_INFO = {
  1: { blurb: 'Symmetric lanes of walls and crates. The classic.', chips: [{ Icon: Bomb, t: 'Crates explode' }] },
  2: { blurb: 'Frozen patches make tanks slide. Brake early!', chips: [{ Icon: Snowflake, t: 'Slippery ice' }, { Icon: Bomb, t: 'Crates explode' }] },
  3: { blurb: 'Soft sand slows you down. Wide-open dunes.', chips: [{ Icon: Wind, t: 'Slow sand' }, { Icon: Bomb, t: 'Crates explode' }] },
  4: { blurb: 'Dense walls at night. Perfect for bank shots.', chips: [{ Icon: Crosshair, t: 'Bank shots' }, { Icon: Bomb, t: 'Crates explode' }] },
}

const STEPS = ['menu', 'map', 'briefing']
const STEP_LABEL = { menu: '1 \u00b7 Mode', map: '2 \u00b7 Map', briefing: '3 \u00b7 Briefing' }

/* ------------------------------------------------------------------ */
/*  Dekorasi latar gurun                                               */
/* ------------------------------------------------------------------ */
function Cactus({ className = '', style = {} }) {
  return (
    <svg viewBox="0 0 100 160" className={className} style={style} aria-hidden="true">
      <g stroke="#3b2a1a" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" fill="#6f9a3f">
        <rect x="38" y="14" width="26" height="140" rx="13" />
        <path d="M38 84 H24 a10 10 0 0 1 -10 -10 V50 a10 10 0 0 1 20 0 V66 H38" />
        <path d="M64 100 H76 a10 10 0 0 0 10 -10 V64 a10 10 0 0 0 -20 0 V80 H64" />
      </g>
      <g stroke="#3f6a22" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7">
        <path d="M51 28 V140 M44 40 V130 M58 40 V130" />
      </g>
      <circle cx="51" cy="12" r="6" fill="#ff7aa8" stroke="#3b2a1a" strokeWidth="4" />
    </svg>
  )
}

function Cloud({ className = '', style = {} }) {
  const shapes = (
    <>
      <circle cx="40" cy="58" r="22" />
      <circle cx="72" cy="40" r="30" />
      <circle cx="108" cy="52" r="24" />
      <rect x="30" y="52" width="92" height="30" rx="15" />
    </>
  )
  return (
    <svg viewBox="0 0 150 100" className={className} style={style} aria-hidden="true">
      <g fill="#3b2a1a" stroke="#3b2a1a" strokeWidth="9">{shapes}</g>
      <g fill="#fff8e1">{shapes}</g>
    </svg>
  )
}

function Parade({ color, dir = 'right', size = 100, bottom, durationClass, delay = '0s' }) {
  const right = dir === 'right'
  return (
    <div className={`absolute left-0 ${durationClass}`} style={{ bottom, animationDelay: delay }}>
      <div className="relative">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="dust-puff absolute rounded-full bg-[#f6e2b3] border-2 border-[#3b2a1a]/40"
            style={{
              width: size * 0.22,
              height: size * 0.22,
              top: '55%',
              [right ? 'right' : 'left']: '88%',
              animationDelay: `${i * 0.35}s`,
            }}
          />
        ))}
        <TankIcon color={color} size={size} rotate={right ? 90 : -90} className="bob" />
      </div>
    </div>
  )
}

function Scenery() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* sinar matahari + matahari */}
      <div className="absolute -top-24 -right-24 w-[420px] h-[420px]">
        <div
          className="sun-rays absolute inset-0 rounded-full opacity-70"
          style={{
            background: 'repeating-conic-gradient(from 0deg, #fff0a8 0deg 9deg, transparent 9deg 18deg)',
            WebkitMaskImage: 'radial-gradient(circle, #000 35%, transparent 70%)',
            maskImage: 'radial-gradient(circle, #000 35%, transparent 70%)',
          }}
        />
        <div className="absolute inset-[110px] rounded-full bg-[#fff3b0] border-4 border-[#3b2a1a]" />
      </div>

      {/* awan */}
      <Cloud className="cloud absolute top-[9%] w-40" style={{ animationDuration: '110s' }} />
      <Cloud className="cloud absolute top-[22%] w-28 opacity-90" style={{ animationDuration: '150s', animationDelay: '-60s' }} />

      {/* bukit pasir (3 lapis) */}
      <svg viewBox="0 0 1440 420" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-[44vh] min-h-[260px]">
        <g stroke="#3b2a1a" strokeWidth="5" strokeLinejoin="round">
          <path d="M0 150 C180 70 340 70 520 140 C720 215 900 60 1100 100 C1260 130 1360 90 1440 70 V420 H0 Z" fill="#f2b866" />
          <path d="M0 230 C160 160 360 170 540 225 C760 290 960 170 1160 205 C1290 228 1380 200 1440 180 V420 H0 Z" fill="#e8a24f" />
          <path d="M0 310 C200 260 380 270 620 300 C860 330 1060 270 1240 285 C1340 292 1400 280 1440 270 V420 H0 Z" fill="#d98f3e" />
        </g>
        {/* tekstur riak pasir */}
        <g stroke="#b97a2f" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.8">
          <path d="M180 300 q20 -10 40 0 t40 0" />
          <path d="M640 335 q20 -10 40 0 t40 0" />
          <path d="M1020 318 q20 -10 40 0 t40 0" />
          <path d="M420 262 q20 -10 40 0 t40 0" />
        </g>
      </svg>

      {/* kaktus & blok dari peta game */}
      <Cactus className="absolute bottom-[19vh] left-[3%] w-16 md:w-24" />
      <Cactus className="absolute bottom-[23vh] left-[11%] w-10 md:w-14 hidden sm:block" />
      <Cactus className="absolute bottom-[17vh] right-[5%] w-14 md:w-20" />
      <img src="/assets/maps/map3-crate.png" alt="" className="absolute bottom-[16vh] right-[16%] w-12 md:w-16 -rotate-6 hidden sm:block" />
      <img src="/assets/maps/map3-crate.png" alt="" className="absolute bottom-[16vh] right-[19.5%] w-12 md:w-16 rotate-3 hidden sm:block" />
      <img src="/assets/maps/map3-crate.png" alt="" className="absolute bottom-[21vh] right-[17.5%] w-12 md:w-16 -rotate-3 hidden sm:block" />
      <img src="/assets/maps/map3-wall.png" alt="" className="absolute bottom-[16.5vh] left-[20%] w-12 md:w-16 hidden md:block" />

      {/* tank lewat */}
      <Parade color="D" dir="right" size={96} bottom="9vh" durationClass="drive-right" />
      <Parade color="A" dir="left" size={78} bottom="4vh" durationClass="drive-left" delay="-12s" />

      {/* garis kamuflase atas */}
      <div className="absolute top-0 left-0 right-0 h-3 camo border-b-4 border-[#3b2a1a]" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Komponen kecil                                                     */
/* ------------------------------------------------------------------ */
function Stepper({ step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
      {STEPS.map((s) => {
        const active = s === step
        const done = STEPS.indexOf(s) < STEPS.indexOf(step)
        return (
          <span
            key={s}
            className={`font-display text-sm px-4 py-1.5 rounded-full border-[3px] border-[#3b2a1a] shadow-[0_3px_0_#3b2a1a] ${
              active ? 'bg-[#d9622b] text-white' : done ? 'bg-[#5b6b2f] text-[#fff3c4]' : 'bg-[#fff1c9] text-[#3b2a1a]/70'
            }`}
          >
            {STEP_LABEL[s]}
          </span>
        )
      })}
    </div>
  )
}

function Chip({ Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide bg-[#f4dc9f] text-[#3b2a1a] border-2 border-[#3b2a1a] rounded-full px-2.5 py-0.5">
      <Icon size={12} /> {children}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Halaman utama                                                      */
/* ------------------------------------------------------------------ */
export default function Home() {
  const [gameMode, setGameMode] = useState(null) // '1v1' | '2v2' | '1v1v1v1'
  const [mapId, setMapId] = useState(1)
  const [step, setStep] = useState('menu') // 'menu' | 'map' | 'briefing' | 'playing'

  const map = MAPS.find((m) => m.id === mapId) || MAPS[0]
  const modeCfg = gameMode ? MODES[gameMode] : null

  if (step === 'playing' && gameMode) {
    return (
      <TankGame
        gameMode={gameMode}
        mapId={mapId}
        onReturnHome={() => {
          setGameMode(null)
          setStep('menu')
        }}
      />
    )
  }

  return (
    <main className="desert-sky min-h-screen relative">
      <Scenery />

      <div className="relative z-10 max-w-5xl mx-auto px-5 pt-10 pb-24 text-center">
        {/* Judul */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5b6b2f] text-[#fff3c4] border-[3px] border-[#3b2a1a] shadow-[0_3px_0_#3b2a1a] text-xs sm:text-sm font-extrabold tracking-wider uppercase mb-5">
          <Shield size={16} /> Couch PvP &bull; 2-4 players &bull; One keyboard
        </div>

        <div className="block">
          <div className="camo cartoon-card inline-block px-8 md:px-16 py-3 md:py-5 -rotate-1">
            <h1 className="font-display title-outline text-6xl md:text-8xl leading-none">
              TANK <span className="text-[#ffb347]">U</span>
            </h1>
          </div>
        </div>

        <p className="text-[#3b2a1a] text-base md:text-lg max-w-2xl mx-auto mt-7 mb-8 font-bold">
          Command heavily armored tanks in same-device warfare. Bounce shells off walls, blow up crates, and be the
          first to <span className="text-[#a9432a]">{CFG.killsToWin} kills</span>!
        </p>

        <Stepper step={step} />

        {/* LANGKAH 1: PILIH MODE */}
        {step === 'menu' && (
          <div className="animate-fade-in">
            <h2 className="font-display text-3xl text-[#3b2a1a] mb-6 flex items-center justify-center gap-2">
              <Crosshair className="text-[#a9432a]" /> Select Combat Mode
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {MODE_CARDS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setGameMode(m.id)
                    setStep('map')
                  }}
                  className="group cartoon-card bg-[#fff1c9] overflow-hidden text-left flex flex-col transition-all duration-200 hover:-translate-y-2 hover:-rotate-1 hover:shadow-[0_14px_0_#3b2a1a] active:translate-y-1 active:shadow-[0_3px_0_#3b2a1a]"
                >
                  <div className="camo relative h-28 border-b-4 border-[#3b2a1a] flex items-center justify-center gap-1">
                    <span
                      className="absolute top-2 left-2 font-display text-[11px] text-white px-2.5 py-0.5 rounded-full border-2 border-[#3b2a1a]"
                      style={{ background: m.head }}
                    >
                      {m.tag}
                    </span>
                    {MODES[m.id].colors.map((c, i) => (
                      <TankIcon
                        key={i}
                        color={c}
                        size={MODES[m.id].colors.length > 2 ? 54 : 70}
                        rotate={i % 2 === 0 ? 45 : -45}
                        className="transition-transform duration-300 group-hover:scale-110"
                      />
                    ))}
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display text-2xl text-[#3b2a1a] mb-1.5 flex items-center gap-2">
                        <m.Icon size={22} style={{ color: m.head }} /> {m.title}
                      </h3>
                      <p className="text-[#3b2a1a]/80 text-sm font-bold leading-relaxed">{m.desc}</p>
                    </div>
                    <div className="mt-5 flex items-center gap-1 font-display text-[#a9432a] tracking-wide">
                      SELECT MODE <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* LANGKAH 2: PILIH PETA */}
        {step === 'map' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
              <button onClick={() => setStep('menu')} className="btn-cartoon bg-[#fff1c9] text-[#3b2a1a] px-4 py-2 flex items-center gap-2 text-sm">
                <ArrowLeft size={16} /> Back to Modes
              </button>
              <h2 className="font-display text-3xl text-[#3b2a1a] flex items-center gap-2">
                <MapPin className="text-[#a9432a]" /> Select Battle Map
              </h2>
              <div className="hidden md:block w-[150px]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {MAPS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMapId(m.id)
                    setStep('briefing')
                  }}
                  className="group cartoon-card bg-[#fff1c9] overflow-hidden text-left transition-all duration-200 hover:-translate-y-2 hover:rotate-1 hover:shadow-[0_14px_0_#3b2a1a] active:translate-y-1 active:shadow-[0_3px_0_#3b2a1a]"
                >
                  <div className="h-48 overflow-hidden border-b-4 border-[#3b2a1a] relative bg-[#2a1d10]">
                    <img
                      src={m.preview}
                      alt={m.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-2xl text-[#3b2a1a] mb-1">{m.name}</h3>
                    <p className="text-[#3b2a1a]/80 text-sm font-bold mb-3">{MAP_INFO[m.id].blurb}</p>
                    <div className="flex flex-wrap gap-2">
                      {MAP_INFO[m.id].chips.map((c) => (
                        <Chip key={c.t} Icon={c.Icon}>{c.t}</Chip>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* LANGKAH 3: BRIEFING */}
        {step === 'briefing' && gameMode && (
          <div className="animate-fade-in max-w-3xl mx-auto cartoon-card bg-[#fff1c9] p-6 md:p-8 text-left mb-6">
            <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b-4 border-dashed border-[#3b2a1a]/30 flex-wrap">
              <h2 className="font-display text-3xl text-[#3b2a1a] flex items-center gap-3">
                <BookOpen className="text-[#a9432a]" /> Mission Briefing
              </h2>
              <button onClick={() => setStep('map')} className="btn-cartoon bg-[#f4dc9f] text-[#3b2a1a] px-3 py-1.5 text-sm">
                Change Map
              </button>
            </div>

            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="font-display text-sm bg-[#5b6b2f] text-[#fff3c4] px-3 py-1 rounded-full border-[3px] border-[#3b2a1a]">
                {gameMode.toUpperCase()}
              </span>
              <span className="font-display text-sm bg-[#fff8e1] text-[#3b2a1a] px-3 py-1 rounded-full border-[3px] border-[#3b2a1a]">
                {map.name}
              </span>
            </div>

            <div className="space-y-4 text-[#3b2a1a] text-sm font-bold leading-relaxed mb-6">
              <div className="bg-[#fff8e1] p-4 rounded-2xl border-[3px] border-[#3b2a1a]/70">
                <h4 className="font-display text-lg text-[#5b6b2f] mb-1">Combat Objective</h4>
                <p>
                  First {modeCfg.teamMode ? 'team' : 'tank'} to <strong>{CFG.killsToWin} kills</strong> wins. Each tank has{' '}
                  <strong>{CFG.tankHP} HP</strong> — {Math.ceil(CFG.tankHP / CFG.bulletDamage)} shell hits destroy it, then it
                  respawns with a short shield.
                </p>
              </div>

              <div className="bg-[#fff8e1] p-4 rounded-2xl border-[3px] border-[#3b2a1a]/70">
                <h4 className="font-display text-lg text-[#a9432a] mb-1 flex items-center gap-2">
                  <Heart size={16} /> Battlefield Physics
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Grey blocks</strong> bounce shells up to {CFG.maxBounces} times — and tanks bounce off them too. Use bank shots!</li>
                  <li><strong>Orange crates</strong> break after {CFG.crateHP} hits and explode. The blast hurts nearby tanks and can chain to other crates.</li>
                  {map.id === 2 && <li><strong>Ice patches</strong> are slippery — tanks keep sliding.</li>}
                  {map.id === 3 && <li><strong>Sand patches</strong> slow your tank down.</li>}
                  {modeCfg.teamMode && <li>Shells never hurt teammates, but crate explosions hurt everyone.</li>}
                  <li>Press <strong>P</strong> or <strong>Esc</strong> to pause.</li>
                </ul>
              </div>

              <div className="bg-[#fff8e1] p-4 rounded-2xl border-[3px] border-[#3b2a1a]/70">
                <h4 className="font-display text-lg text-[#c2762f] mb-2">Control Assignments</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {modeCfg.colors.map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <TankIcon color={c} size={40} />
                      <div className="text-xs leading-snug">
                        <div className="font-display text-sm" style={{ color: COLOR_HEX[c] }}>
                          Player {i + 1} <span className="text-[#3b2a1a]/60">({COLOR_NAME[c]})</span>
                        </div>
                        <div>Move {KEY_LABELS[i].move} · Turn {KEY_LABELS[i].turn} · Shoot {KEY_LABELS[i].fire}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep('playing')}
              className="btn-cartoon w-full bg-[#d9622b] text-white py-4 text-xl flex items-center justify-center gap-2"
            >
              <Play size={22} fill="currentColor" /> DEPLOY TO BATTLEFIELD
            </button>
          </div>
        )}

        <div className="inline-flex items-center gap-2 text-xs font-bold text-[#3b2a1a]/80 bg-[#fff1c9]/80 px-4 py-2 rounded-full border-2 border-[#3b2a1a]/50">
          Match results are saved to Supabase &bull; Mode:{' '}
          <span className="text-[#3b2a1a]">{gameMode ? gameMode.toUpperCase() : 'NOT SELECTED'}</span>
        </div>
      </div>
    </main>
  )
}
