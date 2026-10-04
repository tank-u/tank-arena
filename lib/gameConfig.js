// ============================================================
//  Pengaturan game Tank U — ubah angka di sini untuk menyetel
//  rasa permainan (kecepatan, damage, bounce, dll).
// ============================================================

export const CFG = {
  // --- Pertandingan ---
  killsToWin: 5,          // tim/pemain pertama yang mencapai jumlah kill ini menang
  respawnDelay: 2200,     // ms sebelum tank yang hancur muncul lagi
  spawnShield: 1600,      // ms kebal setelah respawn

  // --- Tank ---
  tankHP: 100,
  tankSpeed: 175,         // px/detik
  reverseFactor: 0.55,    // kecepatan mundur relatif terhadap maju
  turnSpeed: 190,         // derajat/detik
  traction: 0.35,         // 0..1, makin besar = makin responsif (lantai biasa)
  iceTraction: 0.035,     // lantai es: tank meluncur
  sandSpeed: 0.6,         // pasir memperlambat tank
  knockDecay: 7,          // seberapa cepat efek mental hilang
  wallBounce: 0.55,       // tank memantul saat menabrak blok (0 = berhenti, 1 = pantul penuh)
  bumpMinSpeed: 45,       // tabrakan lebih lambat dari ini tidak memantul (supaya tidak "bergetar")
  tankBump: 90,           // dorongan awal saat dua tank bertabrakan
  tankBumpRel: 0.4,       // tambahan dorongan sesuai kecepatan tabrakan
  hitKnockback: 150,      // mental tank saat terkena peluru
  recoil: 45,             // mundur sedikit saat menembak

  // --- Peluru ---
  bulletSpeed: 520,
  bulletDamage: 25,       // 4 tembakan = 1 tank hancur (HP 100)
  bulletScale: 0.0135,    // ukuran gambar peluru
  maxBounces: 3,          // memantul 3x dari tembok abu-abu, tembakan ke-4 meledak
  bulletLifetime: 6000,   // ms (pengaman)
  fireCooldown: 450,      // ms
  muzzleOffset: 27,       // jarak muncul peluru dari pusat tank
  selfHit: true,          // peluru pantul bisa mengenai penembaknya sendiri
  selfHitDelay: 220,      // ms setelah ditembak baru boleh kena diri sendiri
  friendlyFire: false,    // peluru tidak melukai rekan satu tim (mode 2v2)

  // --- Peti oranye ---
  crateHP: 3,             // hancur setelah 3 tembakan
  blastRadius: 72,        // ledakan peti melukai tank dalam radius ini
  blastTankDamage: 18,
  chainRadius: 60,        // peti di sekitar ikut terkena 1 damage (reaksi berantai)
}

export const MODES = {
  '1v1': { colors: ['D', 'A'], teams: [0, 1], spawn: '1v1', teamMode: false },
  '2v2': { colors: ['D', 'C', 'A', 'B'], teams: [0, 0, 1, 1], spawn: '2v2', teamMode: true },
  '1v1v1v1': { colors: ['D', 'A', 'C', 'B'], teams: [0, 1, 2, 3], spawn: 'ffa', teamMode: false },
}

// Warna sprite tank: A = merah, B = kuning, C = hijau tosca, D = biru
export const COLOR_HEX = { A: '#ef4444', B: '#eab308', C: '#14b8a6', D: '#3b82f6' }
export const COLOR_NAME = { A: 'Red', B: 'Yellow', C: 'Teal', D: 'Blue' }

export const KEYMAPS = [
  { up: 'W', down: 'S', left: 'A', right: 'D', fire: 'SPACE' },
  { up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', fire: 'ENTER' },
  { up: 'I', down: 'K', left: 'J', right: 'L', fire: 'O' },
  { up: 'T', down: 'G', left: 'F', right: 'H', fire: 'Y' },
]

// Teks untuk legenda kontrol
export const KEY_LABELS = [
  { move: 'W / S', turn: 'A / D', fire: 'SPACE' },
  { move: '↑ / ↓', turn: '← / →', fire: 'ENTER' },
  { move: 'I / K', turn: 'J / L', fire: 'O' },
  { move: 'T / G', turn: 'F / H', fire: 'Y' },
]
