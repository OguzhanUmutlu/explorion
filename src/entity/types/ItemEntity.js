class ItemEntity extends Entity {
    static DEF_COLLISION = new Collision(-.1, -.1, .2, .2);
    TYPE = EntityIds.ITEM;
    timer = 0;
    /*** @type {Player | null} */
    selectedPlayer = null;
    item = itemPlaceholder;

    /*** @return {Object} */
    get DEFAULT_NBT() {
        const def = super.DEFAULT_NBT;
        def.item = [0, 0, {}];
        return def;
    };

    init() {
        super.init();
        this.collision = ItemEntity.DEF_COLLISION;
        this.isSwimmingUp = true;
    };

    saveNBT() {
        super.saveNBT();
        this.nbt.item = [this.item.id, this.item.count, this.item.nbt];
    };

    loadNBT() {
        super.loadNBT();
        this.item = new Item(...this.nbt.item);
    };

    render() {
        super.render();
        ctx.drawImage(
            Texture.get(idTextures[this.item.id]).image,
            calcRenderX(this.x) - BLOCK_SIZE / 8, calcRenderY(this.y) - BLOCK_SIZE / 8,
            BLOCK_SIZE / 4, BLOCK_SIZE / 4
        );
    }

    update(deltaTick) {
        super.update(deltaTick);
        this.timer++;
        if (this.onGround) this.velocity.set(new Vector(0, 0));
        if (this.selectedPlayer && !this.selectedPlayer.exists) this.selectedPlayer = null;
        if (!this.selectedPlayer && this.timer >= 20) {
            /*** @type {Player} */
            const p = this.world.entities.find(entity =>
                !entity.dead &&
                entity instanceof Player &&
                entity.mode !== 3 &&
                this.collision.collides(entity.collision.clone().expand(6, 1), this, entity) &&
                entity.inventory.canAdd(this.item)
            );
            if (p) {
                this.selectedPlayer = p;
                this.selectedPlayer._boundedItems.push(this);
                this.timer = 0;
                this.isFlying = true;
            }
        }
        if (this.selectedPlayer && this.timer >= 10) {
            this.selectedPlayer.inventory.add(this.item);
            this.kill();
        }
        if (!this.selectedPlayer) {
            /*** @type {ItemEntity} */
            const i = this.world.entities.find(entity =>
                entity !== this &&
                !entity.dead &&
                entity instanceof ItemEntity &&
                entity.item.id === this.item.id &&
                this.item.maxCount <= entity.item.count + this.item.count &&
                this.collision.collides(entity.collision.clone().expand(8, 8), this, entity)
            );
            if (i) {
                this.close();
                i.item.count += this.item.count;
                this.item.count = 0;
            }
        } else if (this.distance(this.selectedPlayer) > 0.1) {
            this.x += (this.selectedPlayer.x - this.x) / 5;
            this.y += (this.selectedPlayer.y - this.y) / 5;
        }
    };

    kill() {
        if (this.selectedPlayer) this.selectedPlayer._boundedItems.splice(this.selectedPlayer._boundedItems.indexOf(this), 1);
        return super.kill();
    }
}