import { TILE, GAME_W, GAME_H } from './maps'
import { CFG, MODES, KEYMAPS, COLOR_HEX } from './gameConfig'

const DEG = Math.PI / 180
const TANK_SCALE = 0.18 // sprite 256px -> ~46px (muat di lorong 1 tile = 40px)

/**
 * Membuat class Phaser.Scene untuk satu pertandingan.
 * Dipisah dari komponen React supaya TankGame.jsx tetap ringkas.
 */
export function createMainScene(Phaser, { gameMode, map, onHud, onMatchOver }) {
  const modeCfg = MODES[gameMode] || MODES['1v1']
  const spawns = map.spawns[modeCfg.spawn]
  const dist = Phaser.Math.Distance.Between

  return class MainScene extends Phaser.Scene {
    constructor() {
      super('MainScene')
    }

    // ------------------------------------------------------------------
    preload() {
      this.load.image('floor', map.floor)
      this.load.image('wallTile', map.wallTile)
      this.load.image('crateTile', map.crateTile)
      modeCfg.colors.forEach((c) => {
        this.load.image(`hull${c}`, `/assets/PNG/Hulls_Color_${c}/Hull_01.png`)
        this.load.image(`gun${c}`, `/assets/PNG/Weapon_Color_${c}/Gun_01.png`)
      })
      this.load.image('bullet', '/assets/Meriam Boll.png')
    }

    // ------------------------------------------------------------------
    create() {
      this.matchOver = false
      this.paused = false
      this.grid = map.grid
      this.physics.world.setBounds(0, 0, GAME_W, GAME_H)

      // Lantai (gambar peta tanpa blok — blok digambar sebagai objek fisika)
      this.add.image(0, 0, 'floor').setOrigin(0, 0).setDisplaySize(GAME_W, GAME_H).setDepth(0)

      this.buildParticles()
      this.buildWorld()
      this.buildTanks()
      this.buildBulletsAndColliders()

      // HP bar & UI
      this.bars = this.add.graphics().setDepth(20)
      this.pauseText = this.add
        .text(GAME_W / 2, GAME_H / 2, 'PAUSED', {
          fontFamily: 'Arial Black, Impact, sans-serif',
          fontSize: '80px',
          color: '#ffe08a',
          stroke: '#3b2a1a',
          strokeThickness: 12,
        })
        .setOrigin(0.5)
        .setDepth(60)
        .setVisible(false)

      this.input.keyboard.on('keydown-P', () => this.togglePause())
      this.input.keyboard.on('keydown-ESC', () => this.togglePause())

      this.pushHud()
      this.showBanner('FIGHT!')
    }

    // ------------------------------------------------------------------
    buildParticles() {
      if (!this.textures.exists('spark')) {
        const g = this.make.graphics({ x: 0, y: 0, add: false })
        g.fillStyle(0xffffff, 1)
        g.fillCircle(6, 6, 6)
        g.generateTexture('spark', 12, 12)
        g.destroy()
      }
      const mk = (cfg) => this.add.particles(0, 0, 'spark', { emitting: false, ...cfg }).setDepth(30)
      this.fx = {
        spark: mk({
          speed: { min: 50, max: 170 },
          lifespan: 260,
          scale: { start: 0.55, end: 0 },
          tint: [0xfff1a8, 0xffb347],
          blendMode: 'ADD',
        }),
        fire: mk({
          speed: { min: 70, max: 320 },
          lifespan: { min: 300, max: 650 },
          scale: { start: 1.3, end: 0 },
          tint: [0xfff3b0, 0xffb020, 0xff5a1a],
          blendMode: 'ADD',
        }),
        smoke: mk({
          speed: { min: 20, max: 120 },
          lifespan: { min: 500, max: 900 },
          scale: { start: 1.2, end: 2.8 },
          alpha: { start: 0.5, end: 0 },
          tint: [0x444444, 0x777777],
        }),
        debris: mk({
          speed: { min: 60, max: 230 },
          gravityY: 420,
          lifespan: 520,
          scale: { start: 0.75, end: 0.15 },
          tint: [0x8b5a2b, 0xc98a3a, 0x5c3a1a],
        }),
      }
    }

    // ------------------------------------------------------------------
    buildWorld() {
      this.solids = this.physics.add.staticGroup() // tembok: peluru memantul, tank memantul
      this.crates = this.physics.add.staticGroup() // peti: hancur setelah beberapa tembakan

      // Tembok tepi (gambar tepi sudah ada di lantai)
      const border = (x, y, w, h) => {
        const r = this.add.rectangle(x, y, w, h, 0x000000, 0)
        this.physics.add.existing(r, true)
        this.solids.add(r)
      }
      border(GAME_W / 2, TILE / 2, GAME_W, TILE)
      border(GAME_W / 2, GAME_H - TILE / 2, GAME_W, TILE)
      border(TILE / 2, GAME_H / 2, TILE, GAME_H)
      border(GAME_W - TILE / 2, GAME_H / 2, TILE, GAME_H)

      this.grid.forEach((row, r) => {
        for (let c = 0; c < row.length; c++) {
          const ch = row[c]
          const x = c * TILE + TILE / 2
          const y = r * TILE + TILE / 2
          if (ch === 'W') {
            const w = this.solids.create(x, y, 'wallTile')
            w.setDisplaySize(TILE, TILE).setDepth(4)
            w.refreshBody()
          } else if (ch === 'C') {
            const cr = this.crates.create(x, y, 'crateTile')
            cr.setDisplaySize(TILE, TILE).setDepth(4)
            cr.refreshBody()
            cr.hp = CFG.crateHP
          }
        }
      })
    }

    // ------------------------------------------------------------------
    buildTanks() {
      this.tankGroup = this.physics.add.group()
      this.tanks = modeCfg.colors.map((color, i) => {
        const [sx, sy, sa] = spawns[i]
        const hull = this.tankGroup.create(sx, sy, `hull${color}`)
        hull.setScale(TANK_SCALE).setDepth(10).setAngle(sa)
        hull.setCollideWorldBounds(true)
        hull.body.setSize(176, 176, true) // ~32px di dunia game

        const gun = this.add.image(sx, sy, `gun${color}`).setScale(TANK_SCALE).setDepth(11).setAngle(sa)
        const label = this.add
          .text(sx, sy - 44, `P${i + 1}`, {
            fontFamily: 'Arial Black, Impact, sans-serif',
            fontSize: '13px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
          })
          .setOrigin(0.5)
          .setDepth(21)

        const tank = {
          idx: i,
          name: `Player ${i + 1}`,
          color,
          hex: COLOR_HEX[color],
          team: modeCfg.teams[i],
          keys: this.input.keyboard.addKeys(KEYMAPS[i]),
          sprite: hull,
          gun,
          label,
          hp: CFG.tankHP,
          alive: true,
          kills: 0,
          lastFired: 0,
          lastBump: 0,
          shieldUntil: this.time.now + 800,
          move: { x: 0, y: 0 },
          knock: { x: 0, y: 0 },
          spawn: [sx, sy, sa],
        }
        hull.tank = tank
        return tank
      })
      this.teamScores = Array(Math.max(...modeCfg.teams) + 1).fill(0)
    }

    // ------------------------------------------------------------------
    buildBulletsAndColliders() {
      this.bullets = this.physics.add.group()

      // Peluru: memantul dari tembok abu-abu (& tepi), hancur di peti, melukai tank
      this.physics.add.collider(this.bullets, this.solids, (b) => this.bulletBounce(b))
      this.physics.add.overlap(this.bullets, this.crates, (b, c) => this.bulletHitCrate(b, c))
      this.physics.add.overlap(
        this.bullets,
        this.tankGroup,
        (b, t) => this.bulletHitTank(b, t),
        (b, t) => this.canBulletHit(b, t)
      )

      // Tank: memantul dari tembok, peti, dan tank lain
      const tankHitBlock = (spr) => this.bumpTank(spr.tank)
      this.physics.add.collider(this.tankGroup, this.solids, tankHitBlock)
      this.physics.add.collider(this.tankGroup, this.crates, tankHitBlock)
      this.physics.add.collider(this.tankGroup, this.tankGroup, (a, b) => this.bumpTanks(a.tank, b.tank))
    }

    // ------------------------------------------------------------------
    update(time, delta) {
      if (this.paused) return
      this.bars.clear()
      if (!this.matchOver) {
        this.tanks.forEach((t) => this.updateTank(t, time, delta))
        this.bullets.getChildren().forEach((b) => {
          if (time - b.born > CFG.bulletLifetime) this.killBullet(b, true)
        })
      }
      this.tanks.forEach((t) => this.drawTankOverlay(t, time))
    }

    updateTank(tank, time, delta) {
      if (!tank.alive) return
      const s = tank.sprite
      const k = tank.keys
      const dt = delta / 1000

      if (k.left.isDown) s.angle -= CFG.turnSpeed * dt
      if (k.right.isDown) s.angle += CFG.turnSpeed * dt

      const dir = k.up.isDown ? 1 : k.down.isDown ? -CFG.reverseFactor : 0
      const rad = (s.angle - 90) * DEG
      const zone = this.zoneAt(s.x, s.y)
      const speed = CFG.tankSpeed * (zone === 'S' ? CFG.sandSpeed : 1)
      const trac = zone === 'I' ? CFG.iceTraction : CFG.traction
      const f = 1 - Math.pow(1 - trac, delta / 16.667)

      tank.move.x += (Math.cos(rad) * speed * dir - tank.move.x) * f
      tank.move.y += (Math.sin(rad) * speed * dir - tank.move.y) * f

      const decay = Math.exp(-dt * CFG.knockDecay)
      tank.knock.x *= decay
      tank.knock.y *= decay

      s.body.setVelocity(tank.move.x + tank.knock.x, tank.move.y + tank.knock.y)

      if (k.fire.isDown && time >= tank.lastFired + CFG.fireCooldown) {
        tank.lastFired = time
        this.fire(tank, rad)
      }
    }

    drawTankOverlay(tank, time) {
      const s = tank.sprite
      const show = tank.alive
      tank.label.setVisible(show)
      if (!show) return
      tank.gun.setPosition(s.x, s.y).setAngle(s.angle)
      tank.label.setPosition(s.x, s.y - 44)

      // berkedip saat kebal
      const a = time < tank.shieldUntil ? 0.5 + 0.35 * Math.sin(time / 55) : 1
      s.setAlpha(a)
      tank.gun.setAlpha(a)

      // bar HP
      const w = 38
      const pct = tank.hp / CFG.tankHP
      this.bars.fillStyle(0x000000, 0.65).fillRect(s.x - w / 2 - 1, s.y - 36, w + 2, 7)
      const col = pct > 0.5 ? 0x4ade80 : pct > 0.25 ? 0xfacc15 : 0xef4444
      this.bars.fillStyle(col, 1).fillRect(s.x - w / 2, s.y - 35, w * pct, 5)
    }

    // ------------------------------------------------------------------
    //  Menembak & peluru
    // ------------------------------------------------------------------
    fire(tank, rad) {
      const s = tank.sprite
      const bx = s.x + Math.cos(rad) * CFG.muzzleOffset
      const by = s.y + Math.sin(rad) * CFG.muzzleOffset
      this.fx.spark.explode(5, bx, by)

      // ditembakkan menempel tembok -> langsung pecah, bukan menembus
      if (this.isWallAt(bx, by)) return

      const b = this.bullets.create(bx, by, 'bullet')
      b.setDepth(12).setScale(CFG.bulletScale)
      b.body.setSize(600, 600, true) // hitbox ~8px
      b.setBounce(1, 1)
      b.setVelocity(Math.cos(rad) * CFG.bulletSpeed, Math.sin(rad) * CFG.bulletSpeed)
      b.owner = tank
      b.born = this.time.now
      b.bounces = 0

      tank.knock.x -= Math.cos(rad) * CFG.recoil
      tank.knock.y -= Math.sin(rad) * CFG.recoil
    }

    killBullet(b, spark) {
      if (!b || !b.active) return
      if (spark) this.fx.spark.explode(6, b.x, b.y)
      b.destroy()
    }

    bulletBounce(b) {
      if (!b.active) return
      b.bounces++
      this.fx.spark.explode(4, b.x, b.y)
      if (b.bounces > CFG.maxBounces) this.killBullet(b, true)
    }

    bulletHitCrate(b, crate) {
      if (!b.active || !crate.active) return
      const owner = b.owner
      this.killBullet(b, true)
      this.hitCrate(crate, 1, owner)
    }

    canBulletHit(b, spr) {
      const tank = spr.tank
      if (!tank || !tank.alive || this.matchOver) return false
      const owner = b.owner
      if (owner === tank) return CFG.selfHit && this.time.now - b.born > CFG.selfHitDelay
      if (!CFG.friendlyFire && owner && owner.team === tank.team) return false
      return true
    }

    bulletHitTank(b, spr) {
      if (!b.active) return
      const tank = spr.tank
      const dir = { x: b.body.velocity.x, y: b.body.velocity.y }
      const owner = b.owner
      this.killBullet(b, true)
      this.damageTank(tank, CFG.bulletDamage, owner, dir)
    }

    // ------------------------------------------------------------------
    //  Peti oranye
    // ------------------------------------------------------------------
    hitCrate(crate, dmg, owner) {
      if (!crate || !crate.active) return
      crate.hp -= dmg
      crate.lastOwner = owner
      if (crate.hp <= 0) {
        this.explodeCrate(crate)
        return
      }
      crate.setTint(crate.hp === 2 ? 0xd9c8b4 : 0xff8a6a) // makin rusak, makin gelap/merah
      this.fx.debris.explode(5, crate.x, crate.y)
      this.tweens.add({
        targets: crate,
        angle: { from: -6, to: 6 },
        duration: 55,
        yoyo: true,
        repeat: 1,
        onComplete: () => crate.active && crate.setAngle(0),
      })
    }

    explodeCrate(crate) {
      const { x, y } = crate
      const owner = crate.lastOwner
      this.crates.remove(crate, true, true)
      this.fx.debris.explode(12, x, y)
      this.explosionFx(x, y, 1)

      // ledakan melukai tank di sekitar
      this.tanks.forEach((t) => {
        if (!t.alive) return
        if (dist(x, y, t.sprite.x, t.sprite.y) <= CFG.blastRadius) {
          this.damageTank(t, CFG.blastTankDamage, owner, { x: t.sprite.x - x, y: t.sprite.y - y })
        }
      })

      // reaksi berantai ke peti di dekatnya
      this.crates.getChildren().forEach((o) => {
        if (dist(x, y, o.x, o.y) <= CFG.chainRadius) {
          this.time.delayedCall(150, () => this.hitCrate(o, 1, owner))
        }
      })
    }

    // ------------------------------------------------------------------
    //  Tank: pantulan, damage, hancur, respawn
    // ------------------------------------------------------------------
    bumpTank(tank) {
      if (!tank) return
      const b = tank.sprite.body
      let nx = 0
      let ny = 0
      if (b.touching.left) nx = 1
      else if (b.touching.right) nx = -1
      if (b.touching.up) ny = 1
      else if (b.touching.down) ny = -1
      if (!nx && !ny) return

      const into = -(tank.move.x * nx + tank.move.y * ny) // kecepatan menuju blok
      if (into < CFG.bumpMinSpeed) return
      tank.move.x += nx * into
      tank.move.y += ny * into
      tank.knock.x += nx * into * CFG.wallBounce
      tank.knock.y += ny * into * CFG.wallBounce
      this.fx.smoke.explode(2, tank.sprite.x - nx * 14, tank.sprite.y - ny * 14)
    }

    bumpTanks(a, b) {
      if (!a || !b) return
      const now = this.time.now
      if (now - a.lastBump < 120) return
      a.lastBump = now
      b.lastBump = now
      let dx = a.sprite.x - b.sprite.x
      let dy = a.sprite.y - b.sprite.y
      const len = Math.hypot(dx, dy) || 1
      dx /= len
      dy /= len
      const rel = Math.hypot(a.move.x - b.move.x, a.move.y - b.move.y)
      const power = CFG.tankBump + rel * CFG.tankBumpRel
      a.knock.x += dx * power
      a.knock.y += dy * power
      b.knock.x -= dx * power
      b.knock.y -= dy * power
    }

    damageTank(tank, dmg, attacker, dir) {
      if (!tank.alive || this.matchOver) return
      if (this.time.now < tank.shieldUntil) return

      tank.hp = Math.max(0, tank.hp - dmg)
      if (dir) {
        const len = Math.hypot(dir.x, dir.y) || 1
        tank.knock.x += (dir.x / len) * CFG.hitKnockback
        tank.knock.y += (dir.y / len) * CFG.hitKnockback
      }
      tank.sprite.setTint(0xff6a6a)
      tank.gun.setTint(0xff6a6a)
      this.time.delayedCall(90, () => {
        tank.sprite.clearTint()
        tank.gun.clearTint()
      })
      this.cameras.main.shake(70, 0.0025)

      if (tank.hp <= 0) this.destroyTank(tank, attacker)
      this.pushHud()
    }

    destroyTank(tank, attacker) {
      tank.alive = false
      const { x, y } = tank.sprite
      tank.sprite.disableBody(true, true)
      tank.gun.setVisible(false)
      tank.label.setVisible(false)
      this.explosionFx(x, y, 1.7)

      if (attacker && attacker !== tank && attacker.team !== tank.team) {
        attacker.kills++
        this.teamScores[attacker.team]++
        if (this.teamScores[attacker.team] >= CFG.killsToWin) {
          this.pushHud()
          this.endMatch(attacker.team)
          return
        }
      }
      this.time.delayedCall(CFG.respawnDelay, () => this.respawn(tank))
    }

    respawn(tank) {
      if (this.matchOver) return
      const [x, y, a] = tank.spawn
      tank.hp = CFG.tankHP
      tank.alive = true
      tank.move.x = tank.move.y = 0
      tank.knock.x = tank.knock.y = 0
      tank.sprite.enableBody(true, x, y, true, true)
      tank.sprite.setAngle(a)
      tank.gun.setVisible(true).setPosition(x, y).setAngle(a)
      tank.shieldUntil = this.time.now + CFG.spawnShield
      this.fx.spark.explode(10, x, y)
      this.pushHud()
    }

    endMatch(team) {
      this.matchOver = true
      this.physics.pause()
      const members = this.tanks.filter((t) => t.team === team)
      const label = modeCfg.teamMode
        ? `Team ${team + 1} (${members.map((m) => `P${m.idx + 1}`).join(' & ')})`
        : members[0].name
      onMatchOver({ team, label, hex: members[0].hex })
    }

    // ------------------------------------------------------------------
    //  Efek & util
    // ------------------------------------------------------------------
    explosionFx(x, y, s = 1) {
      this.fx.fire.explode(Math.round(20 * s), x, y)
      this.fx.smoke.explode(Math.round(10 * s), x, y)

      const ring = this.add.circle(x, y, 12, 0xffffff, 0).setStrokeStyle(4, 0xffd27a, 1).setDepth(30)
      this.tweens.add({
        targets: ring,
        scale: { from: 0.5, to: 4.5 * s },
        alpha: { from: 1, to: 0 },
        duration: 380,
        onComplete: () => ring.destroy(),
      })
      const flash = this.add.circle(x, y, 24 * s, 0xffffff, 0.9).setDepth(30)
      this.tweens.add({
        targets: flash,
        alpha: 0,
        scale: 1.8,
        duration: 170,
        onComplete: () => flash.destroy(),
      })
      this.cameras.main.shake(150 * s, 0.004 * s)
    }

    showBanner(text) {
      const t = this.add
        .text(GAME_W / 2, GAME_H / 2, text, {
          fontFamily: 'Arial Black, Impact, sans-serif',
          fontSize: '96px',
          color: '#ffe08a',
          stroke: '#3b2a1a',
          strokeThickness: 14,
        })
        .setOrigin(0.5)
        .setDepth(60)
      this.tweens.add({
        targets: t,
        scale: { from: 0.4, to: 1.25 },
        alpha: { from: 1, to: 0 },
        duration: 1000,
        delay: 250,
        onComplete: () => t.destroy(),
      })
    }

    togglePause() {
      if (this.matchOver) return
      this.paused = !this.paused
      if (this.paused) {
        this.physics.pause()
        this.tweens.pauseAll()
        this.time.paused = true
      } else {
        this.physics.resume()
        this.tweens.resumeAll()
        this.time.paused = false
      }
      this.pauseText.setVisible(this.paused)
    }

    tileAt(x, y) {
      const r = Math.floor(y / TILE)
      const c = Math.floor(x / TILE)
      const row = this.grid[r]
      return row ? row[c] : '#'
    }
    zoneAt(x, y) {
      const ch = this.tileAt(x, y)
      return ch === 'I' || ch === 'S' ? ch : null
    }
    isWallAt(x, y) {
      const ch = this.tileAt(x, y)
      return ch === 'W' || ch === '#'
    }

    pushHud() {
      onHud({
        target: CFG.killsToWin,
        teamMode: modeCfg.teamMode,
        teams: this.teamScores.slice(),
        players: this.tanks.map((t) => ({
          idx: t.idx,
          name: t.name,
          hex: t.hex,
          team: t.team,
          hp: t.hp,
          maxHp: CFG.tankHP,
          alive: t.alive,
          kills: t.kills,
        })),
      })
    }
  }
}
