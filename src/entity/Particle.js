const ParticleIds = {
    NOTHING: 0, CRITICAL_HIT: 1, EXPLOSION: 2, BLOCK_BREAK: 3
};
const particleTextures = {
    [ParticleIds.CRITICAL_HIT]: ["assets/particles/critical_hit.png"],
    [ParticleIds.EXPLOSION]: [
        "assets/particles/explosion_0.png",
        "assets/particles/explosion_1.png",
        "assets/particles/explosion_2.png",
        "assets/particles/explosion_3.png",
        "assets/particles/explosion_4.png",
        "assets/particles/explosion_5.png",
        "assets/particles/explosion_6.png",
        "assets/particles/explosion_7.png",
        "assets/particles/explosion_8.png",
        "assets/particles/explosion_9.png",
        "assets/particles/explosion_10.png",
        "assets/particles/explosion_11.png",
        "assets/particles/explosion_12.png",
        "assets/particles/explosion_13.png",
        "assets/particles/explosion_14.png",
        "assets/particles/explosion_15.png"
    ]
};

class Particle extends Position {
    aliveTicks = 0;

    /**
     * @param {number} x
     * @param {number} y
     * @param {World} world
     * @param {number} type
     * @param {number} size
     * @param {Object} extra
     */
    constructor(x, y, world, type, size, extra = {}) {
        super(x, y, world);
        this.type = type;
        this.DESPAWN_AFTER = {
            [ParticleIds.CRITICAL_HIT]: 16,
            [ParticleIds.EXPLOSION]: 10,
            [ParticleIds.BLOCK_BREAK]: 14
        }[this.type];
        if (type === ParticleIds.CRITICAL_HIT)
            this.velocity = new Vector(randFloat(-.008, .008), randFloat(-.008, .008));
        else if (type === ParticleIds.BLOCK_BREAK)
            this.velocity = new Vector(randFloat(-.008, .008), -0.02);
        else this.velocity = new Vector(0, 0);

        this.size = size;
        this.extra = extra;
    };

    update(deltaTick) {
        if ((this.aliveTicks += deltaTick) >= this.DESPAWN_AFTER) this.close();
        this.add(this.velocity);
    };

    render() {
        let img;
        if (this.type === ParticleIds.BLOCK_BREAK) {
            img = Block.getTexture(...World.fullIdToArray(this.extra.fullBlockId)).image;
        } else {
            const textures = particleTextures[this.type];
            const src = textures[floor(this.aliveTicks / this.DESPAWN_AFTER * textures.length) % textures.length];
            img = Texture.get(src).image;
        }
        ctx.drawImage(
            img,
            calcRenderX(this.x) - BLOCK_SIZE * this.size / 2, calcRenderY(this.y) - BLOCK_SIZE * this.size / 2,
            BLOCK_SIZE * this.size, BLOCK_SIZE * this.size
        );
    };

    close() {
        this.world.particles.splice(this.world.particles.indexOf(this), 1);
    };
}