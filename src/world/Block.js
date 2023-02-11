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

    /**
     * @param {Item | null} item
     * @return {Item[]}
     */
    getDrops(item = null) {
        if (metadata.noDropBlocks.includes(this.id)) return [];
        if (this.id === ItemIds.OAK_LEAVES) return random() < .9 ? [] : [new Item(ItemIds.APPLE)];
        else if (this.id === ItemIds.GRAVEL) return [new Item(random() > .2 ? ItemIds.GRAVEL : ItemIds.FLINT)];
        return (metadata.blockDrops[this.id] || [this.id])
            .map(i => typeof i === "number" ? new Item(i) : new Item(i[0], i[1]));
    };

    get isBreakable() {
        return metadata.breakable.includes(this.id);
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

    get cannotBePlacedOn() {
        return metadata.cannotBePlacedOn[this.id] || [];
    };

    get canBePlacedOn() {
        return metadata.canBePlacedOn[this.id] || null;
    };

    get isTransparent() {
        return metadata.transparent.includes(this.id);
    };

    get canStayOnPhaseables() {
        return metadata.canStayOnPhaseables.includes(this.id);
    };

    get isVisible() {
        return [[0, 1], [0, -1], [1, 0], [-1, 0]].some(i => this.world.getBlock(this.x + i[0], this.y + i[1]).isTransparent);
    };

    updateCollision() {
        this.collision = blockCollision;
    };

    update() {
        const downId = this.world.getBlockId(this.x, this.y - 1);
        if (this.id <= ItemIds.WATER && this.id >= ItemIds.WATER_1) {
            const nextId = this.id === ItemIds.WATER ? ItemIds.WATER_7 : this.id - 1;
            if (downId <= ItemIds.WATER_7 && downId >= ItemIds.WATER_1) {
                this.world.setBlock(this.x, this.y - 1, ItemIds.WATER_8);
                this.world.updateBlocksAround(this.x, this.y - 1);
            }
            if (downId === ItemIds.AIR) {
                this.world.setBlock(this.x, this.y - 1, ItemIds.WATER_8);
                this.world.updateBlocksAround(this.x, this.y - 1);
            } else if ((downId < ItemIds.WATER_1 || downId > ItemIds.WATER || this.id === ItemIds.WATER) && this.id !== ItemIds.WATER_1) {
                [1, -1].forEach(dx => {
                    const bId = this.world.getBlockId(this.x + dx, this.y);
                    if (bId === ItemIds.AIR || (bId >= ItemIds.WATER_1 && bId <= ItemIds.WATER && bId < nextId)) {
                        this.world.setBlock(this.x + dx, this.y, nextId);
                        this.world.updateBlocksAround(this.x + dx, this.y);
                    }
                });
            }
        } else if (this.id <= ItemIds.LAVA && this.id >= ItemIds.LAVA_1) {
            const nextId = this.id === ItemIds.LAVA ? ItemIds.LAVA_3 : this.id - 1;
            if (downId <= ItemIds.LAVA_3 && downId >= ItemIds.LAVA_1) {
                this.world.setBlock(this.x, this.y - 1, ItemIds.LAVA_4);
                this.world.updateBlocksAround(this.x, this.y - 1);
            }
            if (downId === ItemIds.AIR) {
                this.world.setBlock(this.x, this.y - 1, ItemIds.LAVA_4);
                this.world.updateBlocksAround(this.x, this.y - 1);
                this.world.getBlock(this.x, this.y - 1).update(this.world);
            } else if ((downId < ItemIds.LAVA_1 || downId > ItemIds.LAVA) && this.id !== ItemIds.LAVA_1) {
                [1, -1].forEach(dx => {
                    const bId = this.world.getBlockId(this.x + dx, this.y);
                    if (bId === ItemIds.AIR || (bId >= ItemIds.LAVA_1 && bId <= ItemIds.LAVA && bId < nextId)) {
                        this.world.setBlock(this.x + dx, this.y, nextId);
                        this.world.updateBlocksAround(this.x + dx, this.y);
                    }
                });
            }
        }
        if (
            (metadata.phaseable.includes(downId) && !this.canStayOnPhaseables) ||
            this.cannotBePlacedOn.includes(downId) ||
            (this.canBePlacedOn && !this.canBePlacedOn.includes(downId))
        ) {
            this.getDrops().forEach(item => this.world.dropItem(this.x, this.y, item));
            this.world.setBlock(this.x, this.y, ItemIds.AIR);
            this.world.updateBlocksAround(this.x, this.y);
        }
        if (this.canFall && metadata.phaseable.includes(downId)) {
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
        if (!this.isVisible) return false;
        if (entity instanceof Player && entity.mode > 1) return false;
        if (entity instanceof Player) entity.food -= 0.05;
        if (
            (!(entity instanceof Living) || entity.distance(this) <= entity.blockReach) &&
            (this.isBreakable || (entity instanceof Player && player.mode % 2 === 1))
        ) {
            if (!(entity instanceof Player) || entity.mode % 2 === 0) {
                this.getDrops(entity instanceof Player ? entity.selectedItem : null).forEach(item => {
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
                const id = this.world.getBlockId(x + dx, y + dy);

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
        const downId = this.world.getBlockId(this.x, this.y - 1);
        if (this.canBePlacedOn && !this.canBePlacedOn.includes(downId)) return false;
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