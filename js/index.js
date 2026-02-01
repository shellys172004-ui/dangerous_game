import { player, enemy } from './Fighter.js'
import { background, shop } from './Sprite.js'

const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

let timer = 30
let timerID
let gameEnded = false
let started = false

// Buttons
const onePlayer = document.getElementById('1player')
const twoPlayers = document.getElementById('2players')

onePlayer.addEventListener('click', () => {
  startGame('pve')
})

twoPlayers.addEventListener('click', () => {
  startGame('pvp')
})

function resetMatch() {
  timer = 30
  gameEnded = false
  clearTimeout(timerID)

  const resultDiv = document.querySelector('#result')
  if (resultDiv) {
    resultDiv.style.display = 'none'
    resultDiv.innerHTML = ''
  }
  const timerEl = document.querySelector('#timer')
  if (timerEl) timerEl.innerHTML = timer

  player.health = 100
  enemy.health = 100

  player.position.x = 100
  player.position.y = 0
  enemy.position.x = 750
  enemy.position.y = 0

  player.velocity.x = 0
  player.velocity.y = 0
  enemy.velocity.x = 0
  enemy.velocity.y = 0

  player.isAttacking = false
  enemy.isAttacking = false
  player.isTakingHit = false
  enemy.isTakingHit = false
  player.attackCooldown = true
  enemy.attackCooldown = true

  player.switchSprite('idle')
  enemy.switchSprite('idle')

  // reset player key states if present
  if (player.keys?.a) player.keys.a.pressed = false
  if (player.keys?.d) player.keys.d.pressed = false
}

let mode = 'pve'

// Start game
function startGame(m) {
  mode = m
  resetMatch()

  document.getElementById('menu').style.display = 'none'
  document.getElementById('hud').style.display = 'flex'

  if (!started) {
    started = true
    attachControls()
    animate()
  }

  decreaseTimer()
}

function decreaseTimer() {
  if (gameEnded) return
  if (timer > 0) {
    timerID = setTimeout(decreaseTimer, 1000)
    timer--
    document.querySelector('#timer').innerHTML = timer
  } else {
    determineWinner()
  }
}

// Controls: player always, enemy only in pvp
function attachControls() {
  window.addEventListener('keydown', (e) => {
    if (gameEnded) return

    // PLAYER
    if (e.key === 'a') {
      player.keys.a.pressed = true
      player.lastKey = 'a'
    }
    if (e.key === 'd') {
      player.keys.d.pressed = true
      player.lastKey = 'd'
    }
    if (e.key === 'w') {
      if (!player.inTheAir) player.velocity.y = -20
    }
    if (e.key === ' ') {
      triggerAttack(player, enemy)
    }

    // ENEMY only in PVP
    if (mode === 'pvp') {
      if (e.key === 'ArrowLeft') {
        enemy.keys.ArrowLeft.pressed = true
        enemy.lastKey = 'ArrowLeft'
      }
      if (e.key === 'ArrowRight') {
        enemy.keys.ArrowRight.pressed = true
        enemy.lastKey = 'ArrowRight'
      }
      if (e.key === 'ArrowUp') {
        if (!enemy.inTheAir) enemy.velocity.y = -20
      }
      if (e.key === 'Control') {
        triggerAttack(enemy, player)
      }
    }
  })

  window.addEventListener('keyup', (e) => {
    if (e.key === 'a') player.keys.a.pressed = false
    if (e.key === 'd') player.keys.d.pressed = false

    if (mode === 'pvp') {
      if (e.key === 'ArrowLeft') enemy.keys.ArrowLeft.pressed = false
      if (e.key === 'ArrowRight') enemy.keys.ArrowRight.pressed = false
    }
  })
}

function triggerAttack(attacker, target) {
  if (attacker.health <= 0) return
  if (!attacker.attackCooldown) return

  attacker.isAttacking = true
  attacker.attack(target)

  const ms = attacker.attackTime || 400
  setTimeout(() => {
    attacker.isAttacking = false
  }, ms)
}

// Simple AI chase + attack
function enemyAI() {
  if (enemy.health <= 0) return

  const dist = player.position.x - enemy.position.x
  const abs = Math.abs(dist)
  const speed = 2.5

  if (abs > 140) {
    enemy.velocity.x = dist > 0 ? speed : -speed
    enemy.switchSprite('run')
  } else {
    enemy.velocity.x = 0
    if (enemy.attackCooldown && enemy.isHitting(player)) {
      triggerAttack(enemy, player)
    }
  }
}

function animate() {
  window.requestAnimationFrame(animate)

  // Clear
  c.clearRect(0, 0, canvas.width, canvas.height)

  // Draw background first
  background.update()
  shop.update()

  // Movement
  player.velocity.x = 0
  player.movement()

  if (mode === 'pvp') {
    enemy.velocity.x = 0
    enemy.movement()
  } else {
    enemyAI()
  }

  // Update fighters
  player.update()
  enemy.update()

  // ✅ DEBUG: draw rectangles at fighter positions so we can SEE them even if sprites invisible
  // If you see these boxes but not sprites => sprite offsets/images problem
  c.save()
  c.globalAlpha = 0.35
  c.fillStyle = 'red'
  c.fillRect(player.position.x, player.position.y, player.width, player.height)
  c.fillStyle = 'blue'
  c.fillRect(enemy.position.x, enemy.position.y, enemy.width, enemy.height)
  c.restore()

  // End check
  if (!gameEnded && (player.health <= 0 || enemy.health <= 0)) {
    determineWinner()
  }
}

function determineWinner() {
  if (gameEnded) return
  gameEnded = true
  clearTimeout(timerID)

  const resultDiv = document.querySelector('#result')
  resultDiv.style.display = 'flex'

  if (player.health === enemy.health) resultDiv.innerHTML = 'Tie!'
  else if (player.health > enemy.health) {
    resultDiv.innerHTML = mode === 'pve' ? 'You won!' : 'Player 1 won!'
    enemy.switchSprite('death')

    // OPTIONAL redirect on PVE win:
    if (mode === 'pve') {
      setTimeout(() => (window.location.href = 'question.html'), 2000)
    }
  } else {
    resultDiv.innerHTML = mode === 'pve' ? 'Enemy won!' : 'Player 2 won!'
    player.switchSprite('death')
  }
}
