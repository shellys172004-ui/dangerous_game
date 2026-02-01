import { player, enemy } from './Fighter.js'
import { background, shop } from './Sprite.js'

const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

console.log('✅ INDEX.JS V3 RUNNING', window.location.href)

let started = false

const onePlayer = document.getElementById('1player')
const twoPlayers = document.getElementById('2players')

onePlayer.addEventListener('click', () => startGame('pve'))
twoPlayers.addEventListener('click', () => startGame('pvp'))

let mode = 'pve'

function startGame(m) {
  mode = m

  document.getElementById('menu').style.display = 'none'
  document.getElementById('hud').style.display = 'flex'

  if (!started) {
    started = true
    attachControls()
    animate()
  }
}

function attachControls() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'a') { player.keys.a.pressed = true; player.lastKey = 'a' }
    if (e.key === 'd') { player.keys.d.pressed = true; player.lastKey = 'd' }
    if (e.key === 'w') { if (!player.inTheAir) player.velocity.y = -20 }
    if (e.key === ' ') { player.isAttacking = true; player.attack(enemy); setTimeout(()=>player.isAttacking=false, player.attackTime||400) }

    if (mode === 'pvp') {
      if (e.key === 'ArrowLeft') { enemy.keys.ArrowLeft.pressed = true; enemy.lastKey = 'ArrowLeft' }
      if (e.key === 'ArrowRight') { enemy.keys.ArrowRight.pressed = true; enemy.lastKey = 'ArrowRight' }
      if (e.key === 'ArrowUp') { if (!enemy.inTheAir) enemy.velocity.y = -20 }
      if (e.key === 'Control') { enemy.isAttacking = true; enemy.attack(player); setTimeout(()=>enemy.isAttacking=false, enemy.attackTime||400) }
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

function enemyAI() {
  const dist = player.position.x - enemy.position.x
  const abs = Math.abs(dist)
  const speed = 2.5

  if (abs > 140) {
    enemy.velocity.x = dist > 0 ? speed : -speed
  } else {
    enemy.velocity.x = 0
    if (enemy.attackCooldown && enemy.isHitting(player)) {
      enemy.isAttacking = true
      enemy.attack(player)
      setTimeout(() => (enemy.isAttacking = false), enemy.attackTime || 400)
    }
  }
}

function animate() {
  requestAnimationFrame(animate)

  c.clearRect(0, 0, canvas.width, canvas.height)

  // If YOU DON'T see this text on canvas, your updated index.js is NOT running.
  c.save()
  c.font = '16px monospace'
  c.fillText('INDEX.JS V3 RUNNING', 20, 30)
  c.restore()

  background.update()
  shop.update()

  // movement
  player.velocity.x = 0
  player.movement()

  if (mode === 'pvp') {
    enemy.velocity.x = 0
    enemy.movement()
  } else {
    enemyAI()
  }

  player.update()
  enemy.update()

  // DEBUG RECTANGLES + coords
  c.save()
  c.globalAlpha = 0.8
  c.strokeStyle = 'red'
  c.strokeRect(player.position.x, player.position.y, player.width, player.height)
  c.strokeStyle = 'blue'
  c.strokeRect(enemy.position.x, enemy.position.y, enemy.width, enemy.height)
  c.fillStyle = 'red'
  c.fillText(`P: ${Math.round(player.position.x)},${Math.round(player.position.y)}`, 20, 55)
  c.fillStyle = 'blue'
  c.fillText(`E: ${Math.round(enemy.position.x)},${Math.round(enemy.position.y)}`, 20, 75)
  c.restore()
}
