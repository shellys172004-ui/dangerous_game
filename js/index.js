import { player, enemy } from './Fighter.js'
import { background, shop } from './Sprite.js'

const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

let started = false
let gameOver = false

const controls = { left: false, right: false }

const startBtn = document.getElementById('1player')
startBtn.addEventListener('click', start)

function start() {
  const menu = document.getElementById('menu')
  const hud = document.getElementById('hud')
  if (menu) menu.style.display = 'none'
  if (hud) hud.style.display = 'flex'

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
      if (e.code === 'Space' || e.key === 'w' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
      }

      if (e.key === 'a') controls.left = true
      if (e.key === 'd') controls.right = true

      if (e.key === 'w') {
        if (!player.inTheAir) player.velocity.y = -20
      }

      if ((e.code === 'Space' || e.key === ' ') && !e.repeat) {
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
  if (!result) return

  result.style.display = 'flex'

  // WIN -> redirect
  if (winnerText.includes('Won')) {
    result.innerHTML = `
      <div style="text-align:center; font-family:Orbitron, sans-serif; color:#00fff0;">
        <h1 style="text-shadow:0 0 25px #00fff0; margin-bottom:10px;">${winnerText}</h1>
        <p style="opacity:.9;">Redirecting...</p>
      </div>
    `
    setTimeout(() => {
      window.location.href = './question.html'
    }, 2000)
    return
  }

  // LOSS -> neon themed retry (matches "You Lost" vibe)
  result.innerHTML = `
    <div style="text-align:center; font-family:Orbitron, sans-serif;">
      <h1 style="
        color:#00fff0;
        text-shadow:0 0 12px rgba(0,255,240,1), 0 0 40px rgba(0,255,240,.9), 0 0 90px rgba(0,255,240,.6);
        margin-bottom:18px;">
        ${winnerText}
      </h1>

      <button id="retryBtn" style="
        width:240px;
        height:56px;
        display:inline-flex;
        align-items:center;
        justify-content:center;

        font-family:Orbitron, sans-serif;
        font-size:1.1rem;
        font-weight:700;
        letter-spacing:1px;

        cursor:pointer;
        border-radius:12px;
        border:2px solid #00fff0;

        background:rgba(0,0,0,.92);
        color:#00fff0;

        box-shadow:0 0 18px rgba(0,255,240,.9), 0 0 65px rgba(0,255,240,.35);
        transition:transform .15s ease, background .15s ease, color .15s ease, box-shadow .15s ease;
      ">RETRY</button>
    </div>
  `

  const btn = document.getElementById('retryBtn')
  btn.onmouseenter = () => {
    btn.style.background = 'linear-gradient(135deg,#00fff0,#00b3ff)'
    btn.style.color = '#000'
    btn.style.transform = 'translateY(-2px) scale(1.04)'
    btn.style.boxShadow = '0 0 30px rgba(0,255,240,1), 0 0 110px rgba(0,255,240,.85)'
  }
  btn.onmouseleave = () => {
    btn.style.background = 'rgba(0,0,0,.92)'
    btn.style.color = '#00fff0'
    btn.style.transform = 'none'
    btn.style.boxShadow = '0 0 18px rgba(0,255,240,.9), 0 0 65px rgba(0,255,240,.35)'
  }
  btn.onclick = () => location.reload()
}

function animate() {
  requestAnimationFrame(animate)

  c.clearRect(0, 0, canvas.width, canvas.height)

  background.update()
  shop.update()

  if (gameOver) {
    player.update()
    enemy.update()
    return
  }

  player.velocity.x = 0
  enemy.velocity.x = 0

  if (controls.left && !controls.right) player.velocity.x = -player.moveFactor
  else if (controls.right && !controls.left) player.velocity.x = player.moveFactor

  enemyAI()

  player.update()
  enemy.update()

  if (!player.isAttacking && !player.isTakingHit) {
    if (!player.inTheAir && player.velocity.x !== 0) player.switchSprite('run')
    else if (!player.inTheAir) player.switchSprite('idle')
  }

  if (!enemy.isAttacking && !enemy.isTakingHit) {
    if (!enemy.inTheAir && enemy.velocity.x !== 0) enemy.switchSprite('run')
    else if (!enemy.inTheAir) enemy.switchSprite('idle')
  }

  updateHealthBars()

  if (player.health <= 0) {
    endGame('You Lost 💀')
    return
  }
  if (enemy.health <= 0) {
    endGame('You Won 🏆')
    return
  }
}
