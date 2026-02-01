import { player, enemy } from './Fighter.js'
import { background, shop } from './Sprite.js'

const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

let started = false

document.getElementById('1player').addEventListener('click', start)
document.getElementById('2players').addEventListener('click', start)

function start() {
  document.getElementById('menu').style.display = 'none'
  document.getElementById('hud').style.display = 'flex'

  if (!started) {
    started = true
    controls()
    animate()
  }
}

function controls() {
  window.addEventListener(
    'keydown',
    (e) => {
      // Stop page scroll for keys we use
      if (e.code === 'Space' || e.key === 'w') e.preventDefault()

      // Avoid key-repeat spamming attack
      if (e.code === 'Space' && e.repeat) return

      if (e.key === 'a') {
        player.keys.left.pressed = true
        player.lastKey = 'left'
      }
      if (e.key === 'd') {
        player.keys.right.pressed = true
        player.lastKey = 'right'
      }
      if (e.key === 'w') {
        if (!player.inTheAir) player.velocity.y = -20
      }
      if (e.code === 'Space') {
        player.attack(enemy)
      }
    },
    { passive: false }
  )

  window.addEventListener('keyup', (e) => {
    if (e.key === 'a') player.keys.left.pressed = false
    if (e.key === 'd') player.keys.right.pressed = false
  })
}

function enemyAI() {
  if (enemy.health <= 0) return

  const dist = player.position.x - enemy.position.x
  const abs = Math.abs(dist)
  const speed = 2.2

  if (abs > 160) {
    enemy.velocity.x = dist > 0 ? speed : -speed
    enemy.lastKey = dist > 0 ? 'right' : 'left'
  } else {
    enemy.velocity.x = 0
    if (enemy.attackCooldown && enemy.isHitting(player)) {
      enemy.attack(player)
    }
  }
}

function animate() {
  requestAnimationFrame(animate)
  c.clearRect(0, 0, canvas.width, canvas.height)

  background.update()
  shop.update()

  // reset X velocity each frame; movement()/AI sets it
  player.velocity.x = 0
  enemy.velocity.x = 0

  // apply control + AI
  const playerRunning = player.movement()
  enemyAI()

  // update positions + draw
  player.update()
  enemy.update()

  // choose animations HERE (not inside Fighter.update)
  if (!player.inTheAir && !player.isAttacking && !player.isTakingHit) {
    if (playerRunning) player.switchSprite('run')
    else player.switchSprite('idle')
  }

  if (!enemy.inTheAir && !enemy.isAttacking && !enemy.isTakingHit) {
    if (Math.abs(enemy.velocity.x) > 0) enemy.switchSprite('run')
    else enemy.switchSprite('idle')
  }
}
