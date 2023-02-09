class FallingBlockEntity extends Entity {
    TYPE = EntityIds.FALLING_BLOCK;

    /*** @return {Object} */
    get DEFAULT_NBT() {
        const def = super.DEFAULT_NBT;
        def.blockId = 0;
        return def;
    };

    init() {
        super.init();
        this.collision = blockCollision;
    }

    saveNBT() {
        super.saveNBT();
        this.nbt.blockId = this.block.id;
    };

    loadNBT() {
        super.loadNBT();
        this.blockId = this.nbt.blockId;
    };

    render() {
        super.render();
        ctx.drawImage(
            Texture.get(idTextures[this.blockId]).image,
            calcRenderX(this.x) - BLOCK_SIZE / 2, calcRenderY(this.y) - BLOCK_SIZE / 2,
            BLOCK_SIZE, BLOCK_SIZE
        );
    }

    update(deltaTick) {
        super.update(deltaTick);
        if (this.onGround) {
            this.close();
            this.world.setBlock(this.x, this.y, this.blockId);
            this.world.updateBlocksAround(this.x, this.y);
        }
    };
}