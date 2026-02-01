import { player, enemy } from './Fighter.js'
import { background, shop } from './Sprite.js'

const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

console.log('✅ PVE index.js running', window.location.href)

let timer = 30
let timerID = null
let gameEnded = false
let started = false

const onePlayer = document.getElementById('1player')
const twoPlayers = document.getElementById('2players')

// Player vs AI only: both buttons can start same mode for now
onePlayer.addEventListener('click', startGame)
twoPlayers.addEventListener('click', startGame)

function resetMatch() {
  timer = 30
  gameEnded = false
  if (timerID) clearTimeout(timerID)

  const resultDiv = document.querySelector('#result')
  if (resultDiv) {
    resultDiv.style.display = 'none'
    resultDiv.innerHTML = ''
  }
  const timerEl = document.querySelector('#timer')
  if (timerEl) timerEl.innerHTML = timer

  // reset fighters
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

  // reset player key states
  if (player.keys?.a) player.keys.a.pressed = false
  if (player.keys?.d) player.keys.d.pressed = false
}

function startGame() {
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

function attachControls() {
  window.addEventListener('keydown', (e) => {
    if (gameEnded) return

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
  })

  window.addEventListener('keyup', (e) => {
    if (e.key === 'a') player.keys.a.pressed = false
    if (e.key === 'd') player.keys.d.pressed = false
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

// ✅ AI (NO .movement() call anywhere)
function enemyAI() {
  if (enemy.health <= 0) return

  const dist = player.position.x - enemy.position.x
  const abs = Math.abs(dist)
  const speed = 2.5

  if (abs > 140) {
    enemy.velocity.x = dist > 0 ? speed : -speed
    if (!enemy.isAttacking && !enemy.isTakingHit && !enemy.inTheAir) enemy.switchSprite('run')
  } else {
    enemy.velocity.x = 0
    if (enemy.attackCooldown && enemy.isHitting(player)) {
      triggerAttack(enemy, player)
    } else if (!enemy.isAttacking && !enemy.isTakingHit && !enemy.inTheAir) {
      enemy.switchSprite('idle')
    }
  }
}

function animate() {
  if (gameEnded) return
  requestAnimationFrame(animate)

  c.clearRect(0, 0, canvas.width, canvas.height)

  background.update()
  shop.update()

  // player
  player.velocity.x = 0
  player.movement()
  player.update()

  // enemy AI
  enemyAI()
  enemy.update()

  // idle fallback
  if (!player.movement() && !player.isAttacking && !player.isTakingHit && !player.inTheAir) {
    player.switchSprite('idle')
  }

  // end condition
  if (player.health <= 0 || enemy.health <= 0) {
    determineWinner()
  }
}

function determineWinner() {
  if (gameEnded) return
  gameEnded = true
  if (timerID) clearTimeout(timerID)

  const resultDiv = document.querySelector('#result')
  resultDiv.style.display = 'flex'

  if (player.health === enemy.health) {
    resultDiv.innerHTML = 'Tie!'
  } else if (player.health > enemy.health) {
    resultDiv.innerHTML = 'Congratulations, you won!'
    enemy.switchSprite('death')

    setTimeout(() => {
      window.location.href = 'question.html'
    }, 2000)
  } else {
    resultDiv.innerHTML = 'Enemy won!'
    player.switchSprite('death')
  }
}
