import Sprite from './Sprite.js'

const canvas = document.querySelector('canvas')
canvas.width = 1024
canvas.height = 576

const gravity = 1

class Fighter extends Sprite {
  constructor({
    name,
    position,
    offset,
    imageSrc,
    scale,
    maxFrames,
    holdFrames,
    offsetFrame = { x: 0, y: 0 },
    sprites,
    keys,
    attackTime
  }) {
    super({ position, imageSrc, scale, maxFrames, holdFrames, offsetFrame })

    this.name = name
    this.velocity = { x: 0, y: 0 }
    this.moveFactor = 6
    this.lastKey = null

    this.width = 50
    this.height = 150

    this.inTheAir = false
    this.isAttacking = false
    this.isTakingHit = false
    this.attackCooldown = true
    this.health = 100

    this.attackBox = {
      position: { x: this.position.x, y: this.position.y },
      offSet: offset,
      width: 150,
      height: 150
    }

    this.sprites = sprites
    for (const s in this.sprites) {
      this.sprites[s].image = new Image()
      this.sprites[s].image.src = this.sprites[s].imageSrc
    }

    this.keys = keys
    this.attackTime = attackTime
  }

  movement() {
    let running = false

    if (this.health > 0) {
      if (this.keys.left.pressed && this.lastKey === 'left' && this.position.x >= 0) {
        this.velocity.x = -this.moveFactor
        this.switchSprite('run')
        running = true
      } else if (this.keys.right.pressed && this.lastKey === 'right' && this.position.x <= canvas.width - this.width) {
        this.velocity.x = this.moveFactor
        this.switchSprite('run')
        running = true
      }
    }

    return running
  }

  isHitting(enemyFighter) {
    return (
      this.attackBox.position.x + this.attackBox.width >= enemyFighter.position.x &&
      this.attackBox.position.x <= enemyFighter.position.x + enemyFighter.width &&
      this.attackBox.position.y + this.attackBox.height >= enemyFighter.position.y &&
      this.attackBox.position.y <= enemyFighter.position.y + enemyFighter.height
    )
  }

  attack(enemyFighter) {
    if (this.health <= 0) return
    if (!this.attackCooldown) return

    this.attackCooldown = false
    this.isAttacking = true
    this.switchSprite('attack1')

    // hit check immediately (simple)
    if (this.isHitting(enemyFighter)) {
      enemyFighter.health = Math.max(0, enemyFighter.health - 20)
      enemyFighter.isTakingHit = true
      enemyFighter.switchSprite('takeHit')
      setTimeout(() => (enemyFighter.isTakingHit = false), 300)
    }

    setTimeout(() => (this.isAttacking = false), this.attackTime)
    setTimeout(() => (this.attackCooldown = true), 600)
  }

  update() {
    super.update()

    // Update attack box
    this.attackBox.position.x = this.position.x + this.attackBox.offSet.x
    this.attackBox.position.y = this.position.y

    // Apply velocity
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y

    // Gravity / ground
    if (this.position.y + this.height >= canvas.height - 96) {
      this.velocity.y = 0
      this.inTheAir = false
    } else {
      this.velocity.y += gravity
      this.inTheAir = true
      if (this.velocity.y > 0) this.switchSprite('fall')
      else this.switchSprite('jump')
    }

    // Idle fallback
    if (!this.inTheAir && !this.isAttacking && !this.isTakingHit) {
      this.switchSprite('idle')
    }
  }

  switchSprite(sprite) {
    if (!this.sprites[sprite]) return
    if (this.image === this.sprites[sprite].image) return

    this.image = this.sprites[sprite].image
    this.maxFrames = this.sprites[sprite].maxFrames
    this.currentFrame = 0
  }
}

/* PLAYER */
export const player = new Fighter({
  name: 'player',
  position: { x: 100, y: 0 },
  offset: { x: 75, y: 0 },
  imageSrc: '/dangerous_game/assets/img/samuraiMack/Idle.png',
  scale: 2.5,
  maxFrames: 8,
  holdFrames: 4,
  offsetFrame: { x: 215, y: 154 },
  sprites: {
    idle: { imageSrc: '/dangerous_game/assets/img/samuraiMack/Idle.png', maxFrames: 8 },
    run: { imageSrc: '/dangerous_game/assets/img/samuraiMack/Run.png', maxFrames: 8 },
    jump: { imageSrc: '/dangerous_game/assets/img/samuraiMack/Jump.png', maxFrames: 2 },
    fall: { imageSrc: '/dangerous_game/assets/img/samuraiMack/Fall.png', maxFrames: 2 },
    attack1: { imageSrc: '/dangerous_game/assets/img/samuraiMack/Attack1.png', maxFrames: 6 },
    takeHit: { imageSrc: '/dangerous_game/assets/img/samuraiMack/Take hit White.png', maxFrames: 4 },
    death: { imageSrc: '/dangerous_game/assets/img/samuraiMack/Death.png', maxFrames: 6 }
  },
  keys: {
    left: { pressed: false },
    right: { pressed: false }
  },
  attackTime: 400
})

/* ENEMY */
export const enemy = new Fighter({
  name: 'enemy',
  position: { x: 750, y: 0 },
  offset: { x: -160, y: 0 },
  imageSrc: '/dangerous_game/assets/img/kenji/Idle.png',
  scale: 2.5,
  maxFrames: 4,
  holdFrames: 6,
  offsetFrame: { x: 215, y: 172 },
  sprites: {
    idle: { imageSrc: '/dangerous_game/assets/img/kenji/Idle.png', maxFrames: 4 },
    run: { imageSrc: '/dangerous_game/assets/img/kenji/Run.png', maxFrames: 8 },
    jump: { imageSrc: '/dangerous_game/assets/img/kenji/Jump.png', maxFrames: 2 },
    fall: { imageSrc: '/dangerous_game/assets/img/kenji/Fall.png', maxFrames: 2 },
    attack1: { imageSrc: '/dangerous_game/assets/img/kenji/Attack1.png', maxFrames: 4 },
    takeHit: { imageSrc: '/dangerous_game/assets/img/kenji/Take hit white.png', maxFrames: 3 },
    death: { imageSrc: '/dangerous_game/assets/img/kenji/Death.png', maxFrames: 7 }
  },
  keys: {
    left: { pressed: false },
    right: { pressed: false }
  },
  attackTime: 350
})

export default Fighter
