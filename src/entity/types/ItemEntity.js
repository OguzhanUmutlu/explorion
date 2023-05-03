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
            this.item.texture.image,
            calcRenderX(this.x) - BLOCK_SIZE / 8, calcRenderY(this.y) - BLOCK_SIZE / 8,
            BLOCK_SIZE / 4, BLOCK_SIZE / 4
        );
    };

    attack(damage) {
        if (!super.attack(damage)) return false;
        if (damage instanceof VoidDamage) this.kill();
        return true;
    };

    update(deltaTick) {
        super.update(deltaTick);
        this.timer++;
        if (this.onGround) this.velocity.set(new Vector(0, 0));
        if (!this.selectedPlayer) {
            const chunkEnt = this.getChunkEntities();
            for (let i = 0; i < chunkEnt.length; i++) {
                const ent = chunkEnt[i];
                if (ent === this || !(ent instanceof ItemEntity) || !ent.item.equals(this.item, false, true)) continue;
                if (!this.collision.collides(ent.collision.clone().expand(8, 8), this, ent)) continue;
                ent.item.count += this.item.count;
                return this.kill();
            }
        }
        if (this.selectedPlayer && !this.selectedPlayer.exists) this.selectedPlayer = null;
        if (!this.selectedPlayer && this.timer >= 20) {
            const entities = this.world.entities;
            for (let i = 0; i < entities.length; i++) {
                const entity = entities[i];
                if (
                    !entity.dead &&
                    entity instanceof Player &&
                    entity.mode !== 3 &&
                    this.collision.collides(entity.collision.clone().expand(6, 1), this, entity)
                ) {
                    const maxAdd = entity.inventory.getMaxAddition(this.item);
                    if (maxAdd > 0) {
                        if (maxAdd < this.item.count) {
                            const a = maxAdd; // this
                            const b = this.item.count - maxAdd; // creating
                            const newItem = this.item.clone();
                            newItem.count = b;
                            this.item.count = a;
                            this.world.dropItem(this.x, this.y, newItem, [0, 0]);
                        }
                        this.selectedPlayer = entity;
                        this.selectedPlayer._boundedItems.push(this);
                        this.timer = 0;
                        this.isFlying = true;
                        return;
                    }
                }
            }
        }
        if (this.selectedPlayer && this.timer >= 10) {
            this.selectedPlayer.inventory.add(this.item);
            this.playSound("assets/sounds/random/pop.ogg");
            this.kill();
        }
        if (this.selectedPlayer && this.distance(this.selectedPlayer) > 0.1) {
            this.x += (this.selectedPlayer.x - this.x) / 5;
            this.y += (this.selectedPlayer.y - this.y) / 5;
        }
    };

    kill() {
        if (this.selectedPlayer) this.selectedPlayer._boundedItems.splice(this.selectedPlayer._boundedItems.indexOf(this), 1);
        return super.kill();
    };
}