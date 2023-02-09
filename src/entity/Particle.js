class Particle extends Position {
    aliveTicks = 0;
    DESPAWN_AFTER = 20;

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
        this.velocity = new Vector(randFloat(-.008, .008), randFloat(-.008, .008));
        this.size = size;
    };

    update(deltaTick) {
        if ((this.aliveTicks += deltaTick) >= this.DESPAWN_AFTER) this.close();
        this.add(this.velocity);
    };

    render() {
        ctx.globalAlpha = (this.DESPAWN_AFTER - this.aliveTicks) / this.DESPAWN_AFTER;
        const img = Texture.get(particleTextures[this.type]).image;
        ctx.drawImage(
            img,
            calcRenderX(this.x) - BLOCK_SIZE * this.size / 2, calcRenderY(this.y) - BLOCK_SIZE * this.size / 2,
            BLOCK_SIZE * this.size, BLOCK_SIZE * this.size
        );
        ctx.globalAlpha = 1;
    };

    close() {
        this.world.particles.splice(this.world.particles.indexOf(this), 1);
    };
}