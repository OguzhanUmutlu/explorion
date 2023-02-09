class TNTEntity extends Entity {
    TYPE = EntityIds.TNT;
    explodeTick = 0;
    explodeRadius = 3;
    damageRadius = 3;
    maxDamage = 10;

    /*** @return {Object} */
    get DEFAULT_NBT() {
        const def = super.DEFAULT_NBT;
        def.explodeTick = 0;
        def.explodeRadius = 3;
        def.damageRadius = 3;
        def.maxDamage = 10;
        return def;
    };

    init() {
        super.init();
        this.collision = blockCollision;
    }

    saveNBT() {
        super.saveNBT();
        this.nbt.explodeTick = this.explodeTick;
        this.nbt.explodeRadius = this.explodeRadius;
        this.nbt.damageRadius = this.damageRadius;
        this.nbt.maxDamage = this.maxDamage;
    };

    loadNBT() {
        super.loadNBT();
        this.explodeTick = this.nbt.explodeTick;
        this.explodeRadius = this.nbt.explodeRadius;
        this.damageRadius = this.nbt.damageRadius;
        this.maxDamage = this.nbt.maxDamage;
    };

    render() {
        super.render();
        ctx.drawImage(
            Texture.get(idTextures[ItemIds.TNT]).image,
            calcRenderX(this.x) - BLOCK_SIZE / 2, calcRenderY(this.y) - BLOCK_SIZE / 2,
            BLOCK_SIZE, BLOCK_SIZE
        );
        if (this.explodeTick % 10 <= 5) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "white";
            ctx.fillRect(
                calcRenderX(this.x) - BLOCK_SIZE / 2, calcRenderY(this.y) - BLOCK_SIZE / 2,
                BLOCK_SIZE, BLOCK_SIZE
            );
            ctx.globalAlpha = 1;
        }
    };

    update(deltaTick) {
        super.update(deltaTick);
        if ((this.explodeTick += deltaTick) >= 20 * 4) {
            this.explode();
            this.kill();
        }
    };

    explode() {
        if (!this.isUnderwater) {
            for (let x = this.x - this.explodeRadius; x <= this.x + this.explodeRadius; x++) {
                for (let y = this.y - this.explodeRadius; y <= this.y + this.explodeRadius; y++) {
                    const block = this.world.getBlock(x, y);
                    if (this.distance(new Vector(x, y)) <= this.explodeRadius && !metadata.notExplodeable.includes(block.id)) {
                        if (block.id === ItemIds.TNT) {
                            block.world.setBlock(block.x, block.y, ItemIds.AIR);
                            block.world.updateBlocksAround(block.x, block.y);
                            block.world.summonEntity(EntityIds.TNT, block.x, block.y, {velocity: [0, 0.3]});
                        } else block.break(this);
                    }
                }
            }
        }
        this.world.entities.forEach(entity => {
            const dist = this.distance(entity);
            if (dist > this.damageRadius) return;
            entity.attack(this, (this.damageRadius - dist) / this.damageRadius * this.maxDamage);
        });
    };
}