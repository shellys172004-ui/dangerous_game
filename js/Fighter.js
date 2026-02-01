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
    attackTime
  }) {
    super({ position, imageSrc, scale, maxFrames, holdFrames, offsetFrame })

    this.name = name
    this.velocity = { x: 0, y: 0 }

    this.width = 50
    this.height = 150

    this.moveFactor = 6

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

    this.attackTime = attackTime
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

    // hit check
    if (this.isHitting(enemyFighter)) {
      enemyFighter.health = Math.max(0, enemyFighter.health - 20)
      enemyFighter.isTakingHit = true
      enemyFighter.switchSprite('takeHit')
      setTimeout(() => (enemyFighter.isTakingHit = false), 250)
    }

    setTimeout(() => (this.isAttacking = false), this.attackTime || 400)
    setTimeout(() => (this.attackCooldown = true), 600)
  }

  update() {
    super.update()

    // follow fighter
    this.attackBox.position.x = this.position.x + this.attackBox.offSet.x
    this.attackBox.position.y = this.position.y

    // apply velocity
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y

    // ground + gravity
    if (this.position.y + this.height >= canvas.height - 96) {
      this.velocity.y = 0
      this.inTheAir = false
    } else {
      this.velocity.y += gravity
      this.inTheAir = true

      // ✅ air animations (fix glitch)
      if (!this.isAttacking && !this.isTakingHit) {
        if (this.velocity.y < 0) this.switchSprite('jump')
        else this.switchSprite('fall')
      }
    }

    // keep inside canvas
    if (this.position.x < 0) this.position.x = 0
    if (this.position.x > canvas.width - this.width) this.position.x = canvas.width - this.width
  }

  switchSprite(sprite) {
    if (!this.sprites[sprite]) return
    if (this.image === this.sprites[sprite].image) return
    this.image = this.sprites[sprite].image
    this.maxFrames = this.sprites[sprite].maxFrames
    this.currentFrame = 0
  }
}

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
    takeHit: { imageSrc: '/dangerous_game/assets/img/samuraiMack/Take Hit White.png', maxFrames: 4 },
    death: { imageSrc: '/dangerous_game/assets/img/samuraiMack/Death.png', maxFrames: 6 }
  },
  attackTime: 400
})

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
    // ⚠️ Make sure this matches your actual file name EXACTLY
    takeHit: { imageSrc: '/dangerous_game/assets/img/kenji/Take hit white.png', maxFrames: 3 },
    death: { imageSrc: '/dangerous_game/assets/img/kenji/Death.png', maxFrames: 7 }
  },
  attackTime: 350
})

export default Fighter
