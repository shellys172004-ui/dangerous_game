import { player, enemy } from './Fighter.js'
import { background, shop } from './Sprite.js'

const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

let started = false
let gameOver = false


// ✅ Robust controls (no lastKey / no nested pressed objects needed)
const controls = {
  left: false,
  right: false,
}

document.getElementById('1player').addEventListener('click', start)
document.getElementById('2players').addEventListener('click', start)

function start() {
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
      // stop scroll
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') e.preventDefault()
      if (e.key === 'w') e.preventDefault()

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


// ✅ Simple AI: approach + attack when close
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
    if (
  enemy.attackCooldown &&
  enemy.inAttackRange(enemy, player)) &&
  Math.random() < 0.7   // 🔽 35% chance to attack
) {
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

  // Freeze everything
  player.velocity.x = 0
  player.velocity.y = 0
  enemy.velocity.x = 0
  enemy.velocity.y = 0

  document.getElementById('result').style.display = 'flex'

  // ✅ WIN → auto redirect
  if (winnerText.includes('Won')) {
    document.getElementById('result').innerHTML = `
      <div style="text-align:center">
        <h1>${winnerText}</h1>
        <p>Redirecting...</p>
      </div>
    `

    // ⏳ wait 2 seconds, then go to question.html
    setTimeout(() => {
      window.location.href = './question.html'
    }, 2000)

    return
  }

  // ❌ LOSS → show retry
  document.getElementById('result').innerHTML = `
    <div style="text-align:center">
      <h1>${winnerText}</h1>
      <button id="retryBtn" style="padding:10px 20px;font-size:16px;cursor:pointer">
        Retry
      </button>
    </div>
  `

  document.getElementById('retryBtn').onclick = () => {
    location.reload()
  }
}


function animate() {
  requestAnimationFrame(animate)

  // ✅ If game over, freeze logic and just keep drawing current frame
  if (gameOver) {
    c.clearRect(0, 0, canvas.width, canvas.height)
    background.update()
    shop.update()
    player.update()
    enemy.update()
    return
  }

  // Normal game loop
  c.clearRect(0, 0, canvas.width, canvas.height)

  background.update()
  shop.update()

  // reset X velocity each frame
  player.velocity.x = 0
  enemy.velocity.x = 0

  // PLAYER movement from controls
  if (controls.left && !controls.right) {
    player.velocity.x = -player.moveFactor
  } else if (controls.right && !controls.left) {
    player.velocity.x = player.moveFactor
  }

  // AI
  enemyAI()

  // update/draw
  player.update()
  enemy.update()

  // PLAYER animation control (lock during attack / hit)
  if (player.isAttacking || player.isTakingHit) {
    // do nothing
  } else if (!player.inTheAir && player.velocity.x !== 0) {
    player.switchSprite('run')
  } else if (!player.inTheAir) {
    player.switchSprite('idle')
  }

  // Enemy animation control
  if (!enemy.isAttacking && !enemy.isTakingHit) {
    if (!enemy.inTheAir && enemy.velocity.x !== 0) enemy.switchSprite('run')
    else if (!enemy.inTheAir) enemy.switchSprite('idle')
  }

  updateHealthBars()

  // Game over check
  if (player.health <= 0) {
    endGame('You Lost 💀')
    return
  }
  if (enemy.health <= 0) {
    endGame('You Won 🏆')
    return
  }
}

