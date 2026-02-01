import { player, enemy } from './Fighter.js'
import { background, shop } from './Sprite.js'

const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

let gameStarted = false

document.getElementById('1player').addEventListener('click', start)
document.getElementById('2players').addEventListener('click', start) // for now same

function start() {
  document.getElementById('menu').style.display = 'none'
  document.getElementById('hud').style.display = 'flex'

  if (!gameStarted) {
    gameStarted = true
    controls()
    animate()
  }
}

function controls() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'a') { player.keys.left.pressed = true; player.lastKey = 'left' }
    if (e.key === 'd') { player.keys.right.pressed = true; player.lastKey = 'right' }
    if (e.key === 'w') { if (!player.inTheAir) player.velocity.y = -20 }
    if (e.key === ' ') { player.attack(enemy) }
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
  const speed = 2.5

  if (abs > 140) {
    enemy.velocity.x = dist > 0 ? speed : -speed
    enemy.switchSprite('run')
  } else {
    enemy.velocity.x = 0
    if (enemy.attackCooldown && enemy.isHitting(player)) enemy.attack(player)
  }
}

function animate() {
  requestAnimationFrame(animate)

  c.clearRect(0, 0, canvas.width, canvas.height)

  background.update()
  shop.update()

  // Reset x then apply movement/AI
  player.velocity.x = 0
  enemy.velocity.x = 0

  player.movement()
  enemyAI()

  player.update()
  enemy.update()
}
