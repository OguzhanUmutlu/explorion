class FallingBlockEntity extends Entity {
    TYPE = EntityIds.FALLING_BLOCK;

    /*** @return {Object} */
    get DEFAULT_NBT() {
        const def = super.DEFAULT_NBT;
        def.fullBlockId = 0;
        return def;
    };

    init() {
        super.init();
        this.collision = blockCollision;
    }

    saveNBT() {
        super.saveNBT();
        this.nbt.fullBlockId = this.fullBlockId;
    };

    loadNBT() {
        super.loadNBT();
        this.fullBlockId = this.nbt.fullBlockId;
        const inf = World.fullIdToArray(this.fullBlockId);
        this._blockId = inf[0];
        this._blockMeta = inf[1];
        this._texture = Block.getTexture(inf[0], inf[1]);
    };

    render() {
        super.render();
        ctx.drawImage(
            this._texture.image,
            calcRenderX(this.x) - BLOCK_SIZE / 2, calcRenderY(this.y) - BLOCK_SIZE / 2,
            BLOCK_SIZE, BLOCK_SIZE
        );
    };

    update(deltaTick) {
        super.update(deltaTick);
        if (this.onGround) {
            this.close();
            if (this.world.getBlock(this.x, this.y).isReplaceable) {
                this.world.setBlock(this.x, this.y, this._blockId, this._blockMeta);
                this.world.updateBlocksAround(this.x, this.y);
            } else {
                this.world.dropItem(this.x, this.y, new Item(this._blockId, 1, {damage: this._blockMeta}));
            }
        }
        if (this.y < -128) this.kill();
    };

    attack(damage) {
        if (!super.attack(damage)) return false;
        if (damage instanceof VoidDamage) this.kill();
        return true;
    };
}