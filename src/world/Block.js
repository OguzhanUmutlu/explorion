class Block extends CollideablePosition {

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} id
     * @param {World} world
     */
    constructor(x, y, id, world) {
        super(x, y, world);
        this.id = id;
        this.updateCollision();
    };

    /*** @return {Item[]} */
    get drops() {
        if (metadata.noDropBlocks.includes(this.id)) return [];
        if (this.id === ItemIds.OAK_LEAVES) return random() < .9 ? [] : [new Item(ItemIds.APPLE)];
        else if (this.id === ItemIds.GRAVEL) return [new Item(random() > .5 ? ItemIds.GRAVEL : ItemIds.FLINT)];
        return (metadata.blockDrops[this.id] || [this.id])
            .map(i => typeof i === "number" ? new Item(i) : new Item(i[0], i[1]));
    };

    get isBreakable() {
        return !metadata.unbreakable.includes(this.id);
    };

    get isLiquid() {
        return (this.id <= ItemIds.WATER && this.id >= ItemIds.WATER_1) ||
            (this.id <= ItemIds.LAVA && this.id >= ItemIds.LAVA_1);
    };

    get isPhaseable() {
        return metadata.phaseable.includes(this.id);
    };

    get isReplaceable() {
        return metadata.replaceable.includes(this.id);
    };

    get canFall() {
        return metadata.canFall.includes(this.id);
    };

    get canFloat() {
        return metadata.canFloat.includes(this.id);
    };

    updateCollision() {
        this.collision = blockCollision;
    };

    update() {
        if (this.id <= ItemIds.WATER && this.id >= ItemIds.WATER_1) {
            const downId = this.world.getBlockId(this.x, this.y - 1);
            if (downId <= ItemIds.WATER_7 && downId >= ItemIds.WATER_1) {
                this.world.setBlock(this.x, this.y - 1, ItemIds.WATER);
                this.world.updateBlocksAround(this.x, this.y - 1);
            }
            if (downId === ItemIds.AIR) {
                this.world.setBlock(this.x, this.y - 1, ItemIds.WATER);
                this.world.updateBlocksAround(this.x, this.y - 1);
            } else if (this.id !== ItemIds.WATER_1) {
                [1, -1].forEach(dx => {
                    if (!this.world.getBlockId(this.x + dx, this.y)) {
                        this.world.setBlock(this.x + dx, this.y, this.id - 1);
                        this.world.updateBlocksAround(this.x + dx, this.y);
                    }
                });
            }
        } else if (this.id <= ItemIds.LAVA && this.id >= ItemIds.LAVA_1) {
            const downId = this.world.getBlockId(this.x, this.y - 1);
            if (downId <= ItemIds.LAVA_3 && downId >= ItemIds.LAVA_1) {
                this.world.setBlock(this.x, this.y - 1, ItemIds.LAVA);
                this.world.updateBlocksAround(this.x, this.y - 1);
            }
            if (downId === ItemIds.AIR) {
                this.world.setBlock(this.x, this.y - 1, ItemIds.LAVA);
                this.world.updateBlocksAround(this.x, this.y - 1);
                this.world.getBlock(this.x, this.y - 1).update(this.world);
            } else if (this.id !== ItemIds.LAVA_1) {
                [1, -1].forEach(dx => {
                    if (!this.world.getBlockId(this.x + dx, this.y)) {
                        this.world.setBlock(this.x + dx, this.y, this.id - 1);
                        this.world.updateBlocksAround(this.x + dx, this.y);
                    }
                });
            }
        } else if (!this.canFloat) {
            const downId = this.world.getBlockId(this.x, this.y - 1);
            if (metadata.notPlaceableOn.includes(downId)) {
                this.world.setBlock(this.x, this.y, ItemIds.AIR);
                this.world.updateBlocksAround(this.x, this.y);
            }
        }
        if (this.canFall && this.world.getBlockId(this.x, this.y - 1) === ItemIds.AIR) {
            this.world.setBlock(this.x, this.y, ItemIds.AIR);
            this.world.updateBlocksAround(this.x, this.y);
            this.world.summonEntity(EntityIds.FALLING_BLOCK, this.x, this.y, {
                blockId: this.id
            });
        }
    };

    /**
     * @param {Entity} entity
     * @return {boolean}
     */
    break(entity) {
        if (this.id === ItemIds.AIR) return false;
        if (entity instanceof Player && entity.mode > 1) return false;
        if (entity instanceof Player) entity.food -= 0.05;
        if (
            (!(entity instanceof Living) || entity.distance(this) <= entity.blockReach) &&
            (this.isBreakable || (entity instanceof Player && player.mode % 2 === 1))
        ) {
            if (!(entity instanceof Player) || entity.mode % 2 === 0) {
                this.drops.forEach(item => {
                    entity.world.dropItem(this.x, this.y, item);
                });
            }
            this.world.setBlock(this.x, this.y, ItemIds.AIR);
            this.world.updateBlocksAround(this.x, this.y); // TODO
        }
        const liquidRemove = (x, y, min, cur = this.id) => {
            [
                [0, 1], [1, 0], [0, -1], [-1, 0]
            ].forEach(([dx, dy]) => {
                const block = this.world.getBlock(x + dx, y + dy);

            });
        };
        if (this.id <= ItemIds.WATER && this.id >= ItemIds.WATER_1) {
            liquidRemove(this.x, this.y, ItemIds.WATER_1);
        } else if (this.id <= ItemIds.LAVA && this.id >= ItemIds.LAVA_1) {
            liquidRemove(this.x, this.y, ItemIds.LAVA_1);
        }
        return true;
    };

    /**
     * @param {Entity} entity
     * @return {boolean}
     */
    place(entity) {
        if (this.id === ItemIds.AIR) return false;
        entity.world.setBlock(this.x, this.y, this.id);
        entity.world.updateBlocksAround(this.x, this.y);
        if (entity instanceof Player && entity.mode % 2 === 0) entity.inventory.removeSlot(entity.handIndex);
        return true;
    };

    /*** @param {Entity} entity */
    interact(entity) {
        if (this.id === ItemIds.AIR && entity instanceof Player && entity.selectedItem.id === ItemIds.FLINT_AND_STEEL) {
            this.world.setBlock(this.x, this.y, ItemIds.FIRE);
            entity.world.updateBlocksAround(this.x, this.y);
            entity.inventory.damageItem(entity.handIndex);
        }
        if (this.id === ItemIds.TNT && entity instanceof Player && entity.selectedItem.id === ItemIds.FLINT_AND_STEEL) {
            entity.world.setBlock(this.x, this.y, ItemIds.AIR);
            entity.world.updateBlocksAround(this.x, this.y);
            entity.world.summonEntity(EntityIds.TNT, this.x, this.y, {velocity: [0, 0.3]});
            entity.inventory.damageItem(entity.handIndex);
        }
    };
}