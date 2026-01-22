import Sprite from './Sprite.js'

const canvas = document.querySelector('canvas')

// Canvas dimensions
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
        this.height = 150
        this.width = 50

        this.velocity = { x: 0, y: 0 }
        this.moveFactor = 6
        this.lastKey = null

        this.inTheAir = false
        this.isAttacking = false
        this.isTakingHit = false
        this.health = 100

        this.attackBox = {
            position: { x: this.position.x, y: this.position.y },
            offSet: offset,
            width: 150,
            height: 150
        }

        this.sprites = sprites
        for (const sprite in this.sprites) {
            this.sprites[sprite].image = new Image()
            this.sprites[sprite].image.src = this.sprites[sprite].imageSrc
        }

        this.keys = keys
        this.attackTime = attackTime
        this.attackCooldown = true
    }

    attack(enemy) {
        if (!this.attackCooldown || this.health <= 0) return

        this.isAttacking = true
        this.attackCooldown = false
        this.switchSprite('attack')

        setTimeout(() => {
            this.isAttacking = false
            this.attackCooldown = true
        }, this.attackTime)

        if (this.isHitting(enemy)) {
            enemy.health -= 20
            enemy.switchSprite('takehit')
            enemy.isTakingHit = true
        }
    }

    isHitting(enemy) {
        return (
            this.attackBox.position.x + this.attackBox.width >= enemy.position.x &&
            this.attackBox.position.x <= enemy.position.x + enemy.width &&
            this.attackBox.position.y + this.attackBox.height >= enemy.position.y &&
            this.attackBox.position.y <= enemy.position.y + enemy.height
        )
    }

    movement() {
        let running = false

        if (this.health <= 0) return false

        if (
            Object.values(this.keys)[0].pressed &&
            (this.lastKey === 'a' || this.lastKey === 'ArrowLeft')
        ) {
            this.velocity.x = -this.moveFactor
            this.switchSprite('run')
            running = true
        } else if (
            Object.values(this.keys)[1].pressed &&
            (this.lastKey === 'd' || this.lastKey === 'ArrowRight')
        ) {
            this.velocity.x = this.moveFactor
            this.switchSprite('run')
            running = true
        }

        return running
    }

    update() {
        // 🔥 CRITICAL FIX
        this.velocity.x = 0

        super.update()

        this.attackBox.position.x = this.position.x + this.attackBox.offSet.x
        this.attackBox.position.y = this.position.y

        this.position.x += this.velocity.x
        this.position.y += this.velocity.y

        if (this.position.y + this.height >= canvas.height - 95) {
            this.velocity.y = 0
            this.inTheAir = false
        } else {
            this.velocity.y += gravity

            if (this.velocity.y > 0) {
                this.switchSprite('fall')
            } else {
                this.inTheAir = true
                this.switchSprite('jump')
            }
        }

        // 🔥 DEFAULT STATE
        if (!this.inTheAir && !this.isAttacking && !this.isTakingHit) {
            this.switchSprite('idle')
        }
    }

    switchSprite(sprite) {
        switch (sprite) {
            case 'idle':
                if (this.image !== this.sprites.idle.image) {
                    this.image = this.sprites.idle.image
                    this.maxFrames = this.sprites.idle.maxFrames
                    this.currentFrame = 0
                }
                break

            case 'run':
                if (!this.isAttacking) {
                    this.image = this.sprites.run.image
                    this.maxFrames = this.sprites.run.maxFrames
                }
                break

            case 'jump':
                this.image = this.sprites.jump.image
                this.maxFrames = this.sprites.jump.maxFrames
                this.currentFrame = 0
                break

            case 'fall':
                this.image = this.sprites.fall.image
                this.maxFrames = this.sprites.fall.maxFrames
                this.currentFrame = 0
                break

            case 'attack':
                this.image = this.sprites.attack1.image
                this.maxFrames = this.sprites.attack1.maxFrames
                this.currentFrame = 0
                break

            case 'takehit':
                this.image = this.sprites.takeHit.image
                this.maxFrames = this.sprites.takeHit.maxFrames
                this.currentFrame = 0
                setTimeout(() => (this.isTakingHit = false), 300)
                break

            case 'death':
                this.image = this.sprites.death.image
                this.maxFrames = this.sprites.death.maxFrames
                this.currentFrame = 0
                break
        }
    }
}

/* ================= PLAYER ================= */

export const player = new Fighter({
    name: 'player',
    position: { x: 100, y: 0 },
    offset: { x: 75, y: 0 },
    imageSrc: '../assets/img/samuraiMack/Idle.png',
    scale: 2.5,
    maxFrames: 8,
    holdFrames: 4,
    offsetFrame: { x: 215, y: 154 },
    sprites: {
        idle: { imageSrc: '../assets/img/samuraiMack/Idle.png', maxFrames: 8 },
        run: { imageSrc: '../assets/img/samuraiMack/Run.png', maxFrames: 8 },
        jump: { imageSrc: '../assets/img/samuraiMack/Jump.png', maxFrames: 2 },
        fall: { imageSrc: '../assets/img/samuraiMack/Fall.png', maxFrames: 2 },
        death: { imageSrc: '../assets/img/samuraiMack/Death.png', maxFrames: 6 },
        attack1: { imageSrc: '../assets/img/samuraiMack/Attack1.png', maxFrames: 6 },
        takeHit: { imageSrc: '../assets/img/samuraiMack/Take hit White.png', maxFrames: 4 }
    },
    keys: {
        a: { pressed: false },
        d: { pressed: false },
        w: { pressed: false },
        ' ': { pressed: false }
    },
    attackTime: 400
})

/* ================= ENEMY ================= */

export const enemy = new Fighter({
    name: 'enemy',
    position: { x: 750, y: 0 },
    offset: { x: -160, y: 0 },
    imageSrc: '../assets/img/kenji/Idle.png',
    scale: 2.5,
    maxFrames: 4,
    holdFrames: 6,
    offsetFrame: { x: 215, y: 172 },
    sprites: {
        idle: { imageSrc: '../assets/img/kenji/Idle.png', maxFrames: 4 },
        run: { imageSrc: '../assets/img/kenji/Run.png', maxFrames: 8 },
        jump: { imageSrc: '../assets/img/kenji/Jump.png', maxFrames: 2 },
        fall: { imageSrc: '../assets/img/kenji/Fall.png', maxFrames: 2 },
        death: { imageSrc: '../assets/img/kenji/Death.png', maxFrames: 7 },
        attack1: { imageSrc: '../assets/img/kenji/Attack1.png', maxFrames: 4 },
        takeHit: { imageSrc: '../assets/img/kenji/Take hit white.png', maxFrames: 3 }
    },
    keys: {
        ArrowLeft: { pressed: false },
        ArrowRight: { pressed: false },
        ArrowUp: { pressed: false },
        Control: { pressed: false }
    },
    attackTime: 350
})

export default Fighter
