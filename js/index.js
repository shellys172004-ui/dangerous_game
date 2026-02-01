import { player, enemy } from './Fighter.js'
import { background, shop } from './Sprite.js'

const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

let started = false
let gameOver = false

// ✅ Robust controls
const controls = { left: false, right: false }

// ===================== ENTRY MUSIC + VISUALIZER (NEW) =====================
const bgMusic = document.getElementById('bgMusic')
const startBtn = document.getElementById('1player')
const menuEl = document.getElementById('menu')

let audioCtx = null
let analyser = null
let dataArr = null
let sourceNode = null
let startedVisualizer = false

function ensureAudio() {
  if (audioCtx) return
  audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  analyser = audioCtx.createAnalyser()
  analyser.fftSize = 4096
  dataArr = new Uint8Array(analyser.frequencyBinCount)
  analyser.connect(audioCtx.destination)

  if (bgMusic) {
    sourceNode = audioCtx.createMediaElementSource(bgMusic)
    sourceNode.connect(analyser)
  }
}

function unlockAudio() {
  if (!bgMusic) return
  ensureAudio()
  audioCtx.resume().catch(() => {})

  bgMusic.volume = 0.6
  const p = bgMusic.play()
  if (p) p.catch(() => {})

  if (!startedVisualizer) {
    startedVisualizer = true
    setupStartRadiators()
    requestAnimationFrame(visualLoop)
  }
}

window.addEventListener('pointerdown', unlockAudio, { once: true })
window.addEventListener('keydown', unlockAudio, { once: true })

// -------- radiators builder (same as question.html concept) --------
let startRad = null

function makeBars(n, cls) {
  const frag = document.createDocumentFragment()
  for (let i = 0; i < n; i++) {
    const b = document.createElement('span')
    b.className = cls
    frag.appendChild(b)
  }
  return frag
}

function attachRadiators(target, topCount = 96, sideCount = 34) {
  const r = document.createElement('div')
  r.className = 'radiators'

  const top = document.createElement('div')
  top.className = 'rside top'
  top.appendChild(makeBars(topCount, 'rbarV'))

  const bottom = document.createElement('div')
  bottom.className = 'rside bottom'
  bottom.appendChild(makeBars(topCount, 'rbarV down'))

  const left = document.createElement('div')
  left.className = 'rside left'
  left.appendChild(makeBars(sideCount, 'rbarH'))

  const right = document.createElement('div')
  right.className = 'rside right'
  right.appendChild(makeBars(sideCount, 'rbarH right'))

  r.appendChild(top)
  r.appendChild(bottom)
  r.appendChild(left)
  r.appendChild(right)

  target.appendChild(r)

  return {
    root: r,
    topBars: [...top.children],
    bottomBars: [...bottom.children],
    leftBars: [...left.children],
    rightBars: [...right.children],
    topPeak: new Float32Array(topCount),
    botPeak: new Float32Array(topCount),
    leftPeak: new Float32Array(sideCount),
    rightPeak: new Float32Array(sideCount),
    topVal: new Float32Array(topCount),
    botVal: new Float32Array(topCount),
    leftVal: new Float32Array(sideCount),
    rightVal: new Float32Array(sideCount),
  }
}

function setRadiatorsOn(rad, on) {
  if (!rad) return
  if (on) rad.root.classList.add('on')
  else rad.root.classList.remove('on')
}

function resetRadiators(rad) {
  if (!rad) return
  setRadiatorsOn(rad, false)
  for (const b of rad.topBars) b.style.height = '2px'
  for (const b of rad.bottomBars) b.style.height = '2px'
  for (const b of rad.leftBars) b.style.width = '2px'
  for (const b of rad.rightBars) b.style.width = '2px'
  rad.topVal.fill(0); rad.botVal.fill(0); rad.leftVal.fill(0); rad.rightVal.fill(0)
  rad.topPeak.fill(0); rad.botPeak.fill(0); rad.leftPeak.fill(0); rad.rightPeak.fill(0)
}

function applySideBarsV(bars, peakArr, scalePx) {
  for (let i = 0; i < bars.length; i++) {
    const h = Math.max(2, 2 + peakArr[i] * scalePx)
    bars[i].style.height = h + 'px'
  }
}
function applySideBarsH(bars, peakArr, scalePx) {
  for (let i = 0; i < bars.length; i++) {
    const w = Math.max(2, 2 + peakArr[i] * scalePx)
    bars[i].style.width = w + 'px'
  }
}

function applySpectrum(rad, freq, gain = 1) {
  const fall = 0.78
  const peakFall = 0.92

  const topN = rad.topBars.length
  const sideN = rad.leftBars.length
  const total = topN + sideN + topN + sideN

  const startBin = 10
  const endBin = Math.min(freq.length - 1, 640)
  const band = Math.max(1, endBin - startBin)

  const binFor = (pos) => startBin + Math.floor((pos / total) * band)

  for (let i = 0; i < topN; i++) {
    const v = freq[binFor(i)] / 255
    const s = (v * v) * gain
    rad.topVal[i] = Math.max(s, rad.topVal[i] * fall)
    rad.topPeak[i] = Math.max(rad.topVal[i], rad.topPeak[i] * peakFall)
  }

  for (let i = 0; i < sideN; i++) {
    const v = freq[binFor(topN + i)] / 255
    const s = (v * v) * gain
    rad.rightVal[i] = Math.max(s, rad.rightVal[i] * fall)
    rad.rightPeak[i] = Math.max(rad.rightVal[i], rad.rightPeak[i] * peakFall)
  }

  for (let i = 0; i < topN; i++) {
    const v = freq[binFor(topN + sideN + i)] / 255
    const s = (v * v) * gain
    rad.botVal[i] = Math.max(s, rad.botVal[i] * fall)
    rad.botPeak[i] = Math.max(rad.botVal[i], rad.botPeak[i] * peakFall)
  }

  for (let i = 0; i < sideN; i++) {
    const v = freq[binFor(topN + sideN + topN + i)] / 255
    const s = (v * v) * gain
    rad.leftVal[i] = Math.max(s, rad.leftVal[i] * fall)
    rad.leftPeak[i] = Math.max(rad.leftVal[i], rad.leftPeak[i] * peakFall)
  }

  const vScale = 54
  const hScale = 54
  applySideBarsV(rad.topBars, rad.topPeak, vScale)
  applySideBarsV(rad.bottomBars, rad.botPeak, vScale)
  applySideBarsH(rad.leftBars, rad.leftPeak, hScale)
  applySideBarsH(rad.rightBars, rad.rightPeak, hScale)
}

function setupStartRadiators() {
  if (!startBtn) return
  // prevent duplicates if hot reload
  const existing = startBtn.querySelector('.radiators')
  if (existing) existing.remove()

  startRad = attachRadiators(startBtn, 96, 34)
}

function visualLoop() {
  // only animate bars while menu is visible and music is playing
  const menuVisible = menuEl && menuEl.style.display !== 'none'
  const playing = bgMusic && !bgMusic.paused && analyser && dataArr

  if (!menuVisible || !playing) {
    resetRadiators(startRad)
    requestAnimationFrame(visualLoop)
    return
  }

  analyser.getByteFrequencyData(dataArr)
  setRadiatorsOn(startRad, true)
  applySpectrum(startRad, dataArr, 1.15)
  requestAnimationFrame(visualLoop)
}
// =================== END ENTRY MUSIC + VISUALIZER (NEW) ===================


// ✅ Start game from single button
const onePlayerBtn = document.getElementById('1player')
onePlayerBtn.addEventListener('click', start)

function start() {
  // ensure audio is unlocked even if user only clicks Start Game
  unlockAudio()

  document.getElementById('menu').style.display = 'none'
  document.getElementById('hud').style.display = 'flex'

  if (!started) {
    started = true
    attachControls()
    animate()
  }
}

function attachControls() {
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.code === 'Space') e.preventDefault()
      if (e.key === 'w') e.preventDefault()

      if (e.key === 'a') controls.left = true
      if (e.key === 'd') controls.right = true

      if (e.key === 'w') {
        if (!player.inTheAir) player.velocity.y = -20
      }

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        if (!player.isAttacking) player.attack(enemy)
      }
    },
    { passive: false }
  )

  window.addEventListener('keyup', (e) => {
    if (e.key === 'a') controls.left = false
    if (e.key === 'd') controls.right = false
  })
}

function inAttackRange(attacker, defender) {
  const attackX = attacker.position.x + attacker.attackBox.offSet.x
  return (
    attackX + attacker.attackBox.width >= defender.position.x &&
    attackX <= defender.position.x + defender.width &&
    attacker.position.y + attacker.attackBox.height >= defender.position.y &&
    attacker.position.y <= defender.position.y + defender.height
  )
}

// ✅ AI: approach + attack
function enemyAI() {
  if (enemy.health <= 0) {
    enemy.velocity.x = 0
    return
  }

  const dist = player.position.x - enemy.position.x
  const abs = Math.abs(dist)
  const speed = 1.4

  if (abs > 160) {
    enemy.velocity.x = dist > 0 ? speed : -speed
  } else {
    enemy.velocity.x = 0
    if (enemy.attackCooldown && inAttackRange(enemy, player) && Math.random() < 0.7) {
      enemy.attack(player)
    }
  }
}

function updateHealthBars() {
  const p = document.getElementById('playerHealth')
  const e = document.getElementById('enemyHealth')
  if (p) p.style.width = `${Math.max(0, player.health)}%`
  if (e) e.style.width = `${Math.max(0, enemy.health)}%`
}

function endGame(winnerText) {
  gameOver = true

  player.velocity.x = 0
  player.velocity.y = 0
  enemy.velocity.x = 0
  enemy.velocity.y = 0

  const result = document.getElementById('result')
  result.style.display = 'flex'

  if (winnerText.includes('Won')) {
    result.innerHTML = `
      <div style="text-align:center">
        <h1 style="color:#00fff0;text-shadow:0 0 25px #00fff0;margin-bottom:10px;">${winnerText}</h1>
        <p style="opacity:.9">Redirecting...</p>
      </div>
    `
    setTimeout(() => {
      window.location.href = './question.html'
    }, 2000)
    return
  }

  // loss retry (kept simple; you said you’ll style later)
  result.innerHTML = `
    <div style="text-align:center">
      <h1 style="color:#00fff0;text-shadow:0 0 25px #00fff0;margin-bottom:14px;">${winnerText}</h1>
      <button id="retryBtn"
        style="
          padding:14px 36px;
          font-family:Orbitron, sans-serif;
          font-weight:700;
          border-radius:10px;
          border:2px solid #00fff0;
          background:rgba(0,0,0,.88);
          color:#00fff0;
          cursor:pointer;
          box-shadow:0 0 18px rgba(0,255,240,.9), 0 0 55px rgba(0,255,240,.35);
        ">
        Retry
      </button>
    </div>
  `
  document.getElementById('retryBtn').onclick = () => location.reload()
}

function animate() {
  requestAnimationFrame(animate)

  if (gameOver) {
    c.clearRect(0, 0, canvas.width, canvas.height)
    background.update()
    shop.update()
    player.update()
    enemy.update()
    return
  }

  c.clearRect(0, 0, canvas.width, canvas.height)
  background.update()
  shop.update()

  player.velocity.x = 0
  enemy.velocity.x = 0

  if (controls.left && !controls.right) player.velocity.x = -player.moveFactor
  else if (controls.right && !controls.left) player.velocity.x = player.moveFactor

  enemyAI()

  player.update()
  enemy.update()

  if (!(player.isAttacking || player.isTakingHit)) {
    if (!player.inTheAir && player.velocity.x !== 0) player.switchSprite('run')
    else if (!player.inTheAir) player.switchSprite('idle')
  }

  if (!enemy.isAttacking && !enemy.isTakingHit) {
    if (!enemy.inTheAir && enemy.velocity.x !== 0) enemy.switchSprite('run')
    else if (!enemy.inTheAir) enemy.switchSprite('idle')
  }

  updateHealthBars()

  if (player.health <= 0) return endGame('You Lost 💀')
  if (enemy.health <= 0) return endGame('You Won 🏆')
}
