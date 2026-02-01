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
  window.addEventListener('keydown', (e) => {
    // IMPORTANT: stop browser scrolling (space/arrow keys)
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault()
    }

    if (e.key === 'a') {
      player.keys.left.pressed = true
      player.lastKey = 'left'
    }
    if (e.key === 'd') {
      player.keys.right.pressed = true
      player.lastKey = 'right'
    }
    if (e.key === 'w') {
      e.preventDefault()
      if (!player.inTheAir) player.velocity.y = -20
    }
    if (e.key === ' ') {
      e.preventDefault()
      player.attack(enemy)
    }
  })

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

  // move closer until in “fight range”
  if (abs > 140) {
    enemy.velocity.x = dist > 0 ? speed : -speed
    enemy.switchSprite('run')
    return
  }

  // stop in range
  enemy.velocity.x = 0

  // attack only if actually hitting + cooldown ready
  if (enemy.attackCooldown && enemy.isHitting(player)) {
    enemy.attack(player)
  } else {
    enemy.switchSprite('idle')
  }
}

function animate() {
  requestAnimationFrame(animate)
  c.clearRect(0, 0, canvas.width, canvas.height)

  background.update()
  shop.update()

  // reset x each frame; movement()/AI will set it
  player.velocity.x = 0
  enemy.velocity.x = 0

  player.movement()
  enemyAI()

  player.update()
  enemy.update()
}
