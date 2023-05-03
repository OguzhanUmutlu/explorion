class TNTEntity extends Entity {
    TYPE = EntityIds.TNT;
    explodeTick = 0;
    explodeRadius = 5;
    damageRadius = 5;
    maxDamage = 13;
    parentEntityId = -1;

    /*** @return {Object} */
    get DEFAULT_NBT() {
        const def = super.DEFAULT_NBT;
        def.explodeTick = 40;
        def.explodeRadius = 5;
        def.damageRadius = 5;
        def.maxDamage = 13;
        def.parentEntityId = -1;
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
        this.nbt.parentEntityId = this.parentEntityId;
    };

    loadNBT() {
        super.loadNBT();
        this.explodeTick = this.nbt.explodeTick;
        this.explodeRadius = this.nbt.explodeRadius;
        this.damageRadius = this.nbt.damageRadius;
        this.maxDamage = this.nbt.maxDamage;
        this.parentEntityId = this.nbt.parentEntityId;
    };

    /*** @returns {Entity | null} */
    get parentEntity() {
        return this.world.entities.find(i => i.id === this.parentEntityId) || null;
    };

    render() {
        super.render();
        ctx.drawImage(
            Block.getTexture(ItemIds.TNT, 0).image,
            calcRenderX(this.x) - BLOCK_SIZE / 2, calcRenderY(this.y) - BLOCK_SIZE / 2,
            BLOCK_SIZE, BLOCK_SIZE
        );
        if (this.explodeTick % 20 <= 10) {
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
        if ((this.explodeTick -= deltaTick) <= 0) this.explode();
        if (this.y <= this.world.MIN_HEIGHT) this.close();
    };

    explode() {
        if (this.world.gameRules.tntExplodes) {
            for (let x = this.x - this.explodeRadius; x <= this.x + this.explodeRadius; x++) {
                for (let y = this.y - this.explodeRadius; y <= this.y + this.explodeRadius; y++) {
                    const block = this.world.getBlock(x, y);
                    if (this.distance(new Vector(x, y)) <= this.explodeRadius && metadata.isExplodeable.includes(block.id)) {
                        //if (!block.isTransparent) this.world.addParticle(block.x, block.y, ParticleIds.EXPLOSION, 1.2);
                        if (block.id === ItemIds.TNT) {
                            block.world.setBlock(block.x, block.y, ItemIds.AIR);
                            block.world.updateBlocksAround(block.x, block.y);
                            block.world.summonEntity(EntityIds.TNT, block.x, block.y, {
                                velocity: [0, 0.3],
                                explodeTick: rand(10, 30),
                                parentEntityId: this.parentEntityId
                            });
                        } else if (!this.isTouchingWater) block.break(this);
                    }
                }
            }
            const chunkAmount = ceil(max(this.damageRadius, this.explodeRadius) / 16) + 1;
            const thChunk = this.world.getChunkIdAt(this.x);
            for (let cx = thChunk - chunkAmount; cx <= thChunk + chunkAmount; cx++) {
                const chunk = this.world.getChunkActualAt(cx);
                if (chunk) chunk[1].forEach(entity => {
                    const dist = this.distance(entity);
                    if (dist > this.damageRadius) return;
                    entity.attack(new TNTDamage(this, dist));
                });
            }
        }
        this.world.addParticle(this.x, this.y, ParticleIds.EXPLOSION, this.explodeRadius);
        this.playSound("assets/sounds/random/explode" + rand(1, 4) + ".ogg");
        this.close();
    };
}