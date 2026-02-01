import { player, enemy } from './Fighter.js'
import { background, shop } from './Sprite.js'

const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

let started = false
let gameOver = false

// ✅ Robust controls
const controls = {
  left: false,
  right: false
}

// Only 1 player button exists now
document.getElementById('1player').addEventListener('click', start)

function start() {
  // hide menu
  const menu = document.getElementById('menu')
  if (menu) menu.style.display = 'none'

  // ✅ show HUD only after starting
  const hud = document.getElementById('hud')
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
      // stop scroll
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') e.preventDefault()
      if (e.key === 'w') e.preventDefault()

      if (gameOver) return

      // movement
      if (e.key === 'a') controls.left = true
      if (e.key === 'd') controls.right = true

      // jump
      if (e.key === 'w') {
        if (!player.inTheAir) player.velocity.y = -20
      }

      // attack
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        if (!player.isAttacking) {
          player.attack(enemy)
        }
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

// ✅ Simple AI
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

  // freeze
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
      <div style="text-align:center">
        <h1>${winnerText}</h1>
        <p>Redirecting...</p>
      </div>
    `
    setTimeout(() => {
      window.location.href = './question.html'
    }, 2000)
    return
  }

  // LOSS -> retry
  result.innerHTML = `
    <div style="text-align:center">
      <h1>${winnerText}</h1>
      <button id="retryBtn" style="padding:10px 20px;font-size:16px;cursor:pointer">
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

  // reset X velocities every frame
  player.velocity.x = 0
  enemy.velocity.x = 0

  // player movement
  if (controls.left && !controls.right) player.velocity.x = -player.moveFactor
  else if (controls.right && !controls.left) player.velocity.x = player.moveFactor

  // AI
  enemyAI()

  player.update()
  enemy.update()

  // player animation
  if (!(player.isAttacking || player.isTakingHit)) {
    if (!player.inTheAir && player.velocity.x !== 0) player.switchSprite('run')
    else if (!player.inTheAir) player.switchSprite('idle')
  }

  // enemy animation
  if (!enemy.isAttacking && !enemy.isTakingHit) {
    if (!enemy.inTheAir && enemy.velocity.x !== 0) enemy.switchSprite('run')
    else if (!enemy.inTheAir) enemy.switchSprite('idle')
  }

  updateHealthBars()

  // game over checks
  if (player.health <= 0) return endGame('You Lost 💀')
  if (enemy.health <= 0) return endGame('You Won 🏆')
}
