import { player, enemy } from './Fighter.js'
import { background, shop } from './Sprite.js'

const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

let timer = 30
let timerID
let gameEnded = false
let mode = 'pvp' // 'pve' = Player vs AI, 'pvp' = Player vs Player

// Menu buttons
const onePlayer = document.getElementById('1player')
const twoPlayers = document.getElementById('2players')

onePlayer.addEventListener('click', () => {
  mode = 'pve'
  resetMatch()
  startGame()
})

twoPlayers.addEventListener('click', () => {
  mode = 'pvp'
  resetMatch()
  startGame()
})

function resetMatch() {
  // reset timer/UI flags
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

  // reset fighters (basic)
  player.health = 100
  enemy.health = 100
  player.isAttacking = false
  enemy.isAttacking = false
  player.isTakingHit = false
  enemy.isTakingHit = false
  player.attackCooldown = true
  enemy.attackCooldown = true

  // positions
  player.position.x = 100
  player.position.y = 0
  enemy.position.x = 750
  enemy.position.y = 0

  // velocities
  player.velocity.x = 0
  player.velocity.y = 0
  enemy.velocity.x = 0
  enemy.velocity.y = 0

  // keys reset
  if (player.keys?.a) player.keys.a.pressed = false
  if (player.keys?.d) player.keys.d.pressed = false
  if (player.keys?.w) player.keys.w.pressed = false
  if (player.keys?.[' ']) player.keys[' '].pressed = false

  if (enemy.keys?.ArrowLeft) enemy.keys.ArrowLeft.pressed = false
  if (enemy.keys?.ArrowRight) enemy.keys.ArrowRight.pressed = false
  if (enemy.keys?.ArrowUp) enemy.keys.ArrowUp.pressed = false
  if (enemy.keys?.Control) enemy.keys.Control.pressed = false

  // idle sprites
  player.switchSprite('idle')
  enemy.switchSprite('idle')

  // HUD health bars reset (if present)
  const pBar = document.getElementById('playerHealth')
  const eBar = document.getElementById('enemyHealth')
  if (pBar) pBar.style.width = '100%'
  if (eBar) eBar.style.width = '100%'
}

function startGame() {
  document.getElementById('menu').style.display = 'none'
  document.getElementById('hud').style.display = 'flex'

  // “loading” black flash
  c.fillRect(0, 0, canvas.width, canvas.height)

  setTimeout(() => {
    attachControlsForMode()
    animate()
    decreaseTimer()
  }, 300)
}

let controlsAttached = false
function attachControlsForMode() {
  if (controlsAttached) return
  controlsAttached = true

  // One global listener, but behavior depends on mode
  window.addEventListener('keydown', (e) => {
    if (gameEnded) return

    // In PVE: ONLY player controls are active
    // In PVP: both work (optional; you can remove enemy controls if you want only PVE now)

    // PLAYER controls
    if (e.key === 'a') {
      player.keys.a.pressed = true
      player.lastKey = 'a'
    } else if (e.key === 'd') {
      player.keys.d.pressed = true
      player.lastKey = 'd'
    } else if (e.key === 'w') {
      if (!player.inTheAir) player.velocity.y = -20
    } else if (e.key === ' ') {
      triggerAttack(player, enemy)
    }

    // ENEMY controls only in PVP
    if (mode === 'pvp') {
      if (e.key === 'ArrowLeft') {
        enemy.keys.ArrowLeft.pressed = true
        enemy.lastKey = 'ArrowLeft'
      } else if (e.key === 'ArrowRight') {
        enemy.keys.ArrowRight.pressed = true
        enemy.lastKey = 'ArrowRight'
      } else if (e.key === 'ArrowUp') {
        if (!enemy.inTheAir) enemy.velocity.y = -20
      } else if (e.key === 'Control') {
        triggerAttack(enemy, player)
      }
    }
  })

  window.addEventListener('keyup', (e) => {
    // PLAYER
    if (e.key === 'a') player.keys.a.pressed = false
    if (e.key === 'd') player.keys.d.pressed = false

    // ENEMY only in PVP
    if (mode === 'pvp') {
      if (e.key === 'ArrowLeft') enemy.keys.ArrowLeft.pressed = false
      if (e.key === 'ArrowRight') enemy.keys.ArrowRight.pressed = false
    }
  })
}

function triggerAttack(attacker, target) {
  if (attacker.health <= 0) return
  if (!attacker.attackCooldown) return

  // Original repo logic expects isAttacking true for attack() to do anything
  attacker.isAttacking = true
  attacker.attack(target)

  // stop attack state after attackTime
  const ms = attacker.attackTime || 400
  setTimeout(() => {
    attacker.isAttacking = false
  }, ms)
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

// AI: simple chase + attack in range
function enemyAI() {
  if (enemy.health <= 0) return

  // Decide direction based on distance
  const dist = player.position.x - enemy.position.x
  const abs = Math.abs(dist)

  // Movement speed
  const speed = 2.5

  if (abs > 140) {
    enemy.velocity.x = dist > 0 ? speed : -speed
    enemy.switchSprite('run')
  } else {
    enemy.velocity.x = 0

    // Attack when close and cooldown ready
    if (enemy.attackCooldown && enemy.isHitting(player)) {
      triggerAttack(enemy, player)
    } else if (!enemy.isAttacking && !enemy.isTakingHit && !enemy.inTheAir) {
      enemy.switchSprite('idle')
    }
  }
}

// Main loop
function animate() {
  if (gameEnded) return
  window.requestAnimationFrame(animate)

  // clear frame (optional; if you see trails, uncomment)
  // c.clearRect(0, 0, canvas.width, canvas.height)

  background.update()
  shop.update()

  // Reset horizontal velocity each frame; movement() will set it for player in repo style
  player.velocity.x = 0
  if (mode === 'pvp') enemy.velocity.x = 0
  else {
    // in PVE, enemyAI sets enemy.velocity.x, so do NOT zero here
  }

  // Player update
  player.movement()
  player.update()

  // Enemy update
  if (mode === 'pvp') {
    enemy.movement()
    enemy.update()
  } else {
    enemyAI()
    enemy.update()
  }

  // Idle fallback
  if (!player.movement() && !player.isAttacking && !player.isTakingHit && !player.inTheAir) {
    player.switchSprite('idle')
  }

  if (mode === 'pvp') {
    if (!enemy.movement() && !enemy.isAttacking && !enemy.isTakingHit && !enemy.inTheAir) {
      enemy.switchSprite('idle')
    }
  }

  // End condition
  if (player.health <= 0 || enemy.health <= 0) {
    determineWinner()
  }
}

function determineWinner() {
  if (gameEnded) return
  gameEnded = true
  clearTimeout(timerID)

  const resultDiv = document.querySelector('#result')
  resultDiv.style.display = 'flex'

  if (player.health === enemy.health) {
    resultDiv.innerHTML = 'Tie!'
  } else if (player.health > enemy.health) {
    resultDiv.innerHTML = mode === 'pve' ? 'You won!' : 'Player 1 won!'
    enemy.health = 0
    enemy.switchSprite('death')

    // OPTIONAL: PVE win => redirect
    if (mode === 'pve') {
      setTimeout(() => {
        window.location.href = 'question.html'
      }, 2000)
    }
  } else {
    resultDiv.innerHTML = mode === 'pve' ? 'Enemy won!' : 'Player 2 won!'
    player.health = 0
    player.switchSprite('death')
  }
}
