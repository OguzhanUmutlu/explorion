const ParticleIds = {
    NOTHING: 0, CRITICAL_HIT: 1, EXPLOSION: 2
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
    ],
};

class Particle extends Position {
    aliveTicks = 0;
    DESPAWN_AFTER = 16;

    /**
     * @param {number} x
     * @param {number} y
     * @param {World} world
     * @param {number} type
     * @param {number} size
     */
    constructor(x, y, world, type, size) {
        super(x, y, world);
        this.type = type;
        if (type === ParticleIds.CRITICAL_HIT)
            this.velocity = new Vector(randFloat(-.008, .008), randFloat(-.008, .008));
        this.size = size;
    };

    update(deltaTick) {
        if ((this.aliveTicks += deltaTick) >= this.DESPAWN_AFTER) this.close();
        if (this.type === ParticleIds.CRITICAL_HIT)
            this.add(this.velocity);
    };

    render() {
        const textures = particleTextures[this.type];
        let src = textures[floor(this.aliveTicks / this.DESPAWN_AFTER * textures.length) % textures.length];
        const img = Texture.get(src).image;
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