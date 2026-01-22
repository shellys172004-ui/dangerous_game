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
        offsetFrame,
        sprites,
        keys,
        attackTime
    }) {
        super({ position, imageSrc, scale, maxFrames, holdFrames, offsetFrame })

        console.log('FIGHTER CREATED:', name)

        this.name = name
        this.velocity = { x: 0, y: 0 }
        this.width = 50
        this.height = 150

        this.lastKey = null
        this.health = 100
        this.inTheAir = false
        this.isAttacking = false
        this.isTakingHit = false

        this.attackBox = {
            position: this.position,
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

    update() {
        super.update()

        this.velocity.x = 0
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y

        if (this.position.y + this.height >= canvas.height - 96) {
            this.velocity.y = 0
            this.inTheAir = false
        } else {
            this.velocity.y += gravity
        }

        if (!this.inTheAir && !this.isAttacking) {
            this.switchSprite('idle')
        }
    }

    switchSprite(sprite) {
        if (!this.sprites[sprite]) return

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
        idle: {
            imageSrc: '/dangerous_game/assets/img/samuraiMack/Idle.png',
            maxFrames: 8
        }
    },
    keys: {},
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
        idle: {
            imageSrc: '/dangerous_game/assets/img/kenji/Idle.png',
            maxFrames: 4
        }
    },
    keys: {},
    attackTime: 350
})

export default Fighter
