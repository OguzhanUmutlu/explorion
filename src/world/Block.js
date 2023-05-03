class Block extends CollideablePosition {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} id
     * @param {number} meta
     * @param {World} world
     */
    constructor(x, y, id, meta, world) {
        super(x, y, world);
        this.id = id;
        this.meta = meta;
        this.updateCollision();
    };

    /**
     * @param {Item | null} item
     * @return {Item[]}
     */
    getDrops(item = null) {
        if (metadata.noDropBlocks.includes(this.id)) return [];
        if (this.id === ItemIds.LEAVES || this.id === ItemIds.NATURAL_LEAVES) return random() < .9 ? [] : [new Item(ItemIds.APPLE)];
        else if (this.id === ItemIds.GRAVEL) return [new Item(random() > .2 ? ItemIds.GRAVEL : ItemIds.FLINT)];
        let d = metadata.blockDrops[this.id] || [this.id];
        if (!Array.isArray(d)) d = d[this.meta];
        return d.map(i => typeof i === "number" ? new Item(i) : new Item(i[0], i[1], i[2] || {}));
    };

    get stepSound() {
        const defaultStep = metadata.step[this.id];
        if (!defaultStep) return null;
        const list = TextureList.filter(i => i.includes("/step/") && i.includes("/" + defaultStep));
        return Sound.get("assets/" + list[rand(0, list.length - 1)]);
    };

    get digSound() {
        const defaultDig = metadata.dig[this.id];
        if (!defaultDig) return null;
        const list = TextureList.filter(i => i.includes("/dig/") && i.includes("/" + defaultDig));
        return Sound.get("assets/" + list[rand(0, list.length - 1)]);
    };

    get placeSound() {
        return this.digSound;
    };

    get hardness() {
        return metadata.hardness[this.id];
    };

    get isBreakable() {
        return metadata.hardness[this.id] !== -1;
    };

    get isLiquid() {
        return [ItemIds.WATER, ItemIds.LAVA].includes(this.id);
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

    /*** @returns {Texture} */
    static getTexture(id, meta) {
        const texture = idTextures[id];
        if (typeof texture === "string") return Texture.get(texture);
        return Texture.get(texture[meta]);
    };

    get texture() {
        return Block.getTexture(this.id, this.meta);
    };

    get tileType() {
        const id = Object.keys(TileClasses).find(i => TileClasses[i].BLOCK_ID === this.id) * 1;
        if (isNaN(id)) return null;
        return id;
    };

    get fullId() {
        return World.arrayToFullId(this.id, this.meta);
    };

    setMeta(v) {
        this.meta = v;
        this.world.setBlock(this.x, this.y, this.id, v);
        this.world.updateBlocksAround(this.x, this.y);
    };

    updateCollision() {
        this.collision = blockCollision;
    };

    update() {
        if (this.meta < 0) this.setMeta(0);
        if (this.id === ItemIds.SPONGE) {
            let soaked = 0;
            const maxSoak = 16;
            const soakRadius = 3;
            const l = [];
            for (let x = this.x - soakRadius; x <= this.x + soakRadius; x++) {
                if (soaked >= maxSoak) break;
                for (let y = this.y - soakRadius; y <= this.y + soakRadius; y++) {
                    if (soaked >= maxSoak) break;
                    const id = this.world.getBlockId(x, y);
                    if (id === ItemIds.WATER) {
                        this.world.setBlock(x, y, ItemIds.AIR);
                        l.push([x, y]);
                        soaked++;
                    }
                }
            }
            if (soaked) this.world.setAndUpdateBlock(this.x, this.y, ItemIds.WET_SPONGE)
            l.forEach(i => this.world.updateBlocksAround(...i));
        }
        const downId = this.world.getBlockId(this.x, this.y - 1);
        if (this.id === ItemIds.WATER) {
            // source     ->  0
            // connection ->  1-7
            // flowing    ->  8
            const waterCanBreak = [ItemIds.AIR, ItemIds.GRASS_DOUBLE, ItemIds.GRASS, ...FlowerIds];
            if (this.meta > 8) this.setMeta(0);

            const down = this.world.getBlock(this.x, this.y - 1);
            if (waterCanBreak.includes(down.id)) { // move down
                if (down !== ItemIds.AIR) down.break(null);
                this.world.setAndUpdateBlock(this.x, this.y - 1, this.id, 8);
            } else if (down.id === this.id) {
                if (down.meta !== 8 && down.meta !== 0) {
                    this.world.setAndUpdateBlock(this.x, this.y - 1, this.id, 8);
                }
            }

            if ((down.id !== ItemIds.AIR || this.meta === 0) && (!down.isLiquid || this.meta === 0) && this.meta !== 7) { // move right and left
                const nextMeta = this.meta === 8 ? 1 : this.meta + 1;
                [1, -1].forEach(dx => {
                    const b = this.world.getBlock(this.x + dx, this.y);
                    if (waterCanBreak.includes(b.id)) {
                        if (b !== ItemIds.AIR) b.break(null);
                    } else if (b.id === this.id) {
                        if (b.meta <= nextMeta || b.meta === 8) return;
                    } else return;
                    this.world.setAndUpdateBlock(this.x + dx, this.y, this.id, nextMeta);
                });
            }

            if (this.meta > 0 && this.meta < 8) { // removal of small waters
                const left = this.world.getBlockInfo(this.x - 1, this.y);
                const right = this.world.getBlockInfo(this.x + 1, this.y);
                if (!((left[0] === this.id && (left[1] === 8 || left[1] === 0 || left[1] < this.meta)) ||
                    (right[0] === this.id && (right[1] === 8 || right[1] === 0 || right[1] < this.meta)))) this.world.setAndUpdateBlock(this.x, this.y, ItemIds.AIR);
            } else if (this.meta === 8) { // removal of flowing waters
                const up = this.world.getBlockId(this.x, this.y + 1);
                if (up !== this.id) this.world.setAndUpdateBlock(this.x, this.y, ItemIds.AIR);
            }
        } else if (this.id === ItemIds.LAVA) {
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
                fullBlockId: World.arrayToFullId(this.id, this.meta), velocity: [0, 0.01]
            });
        }
        if (this.tileType !== null && !this.world.getTile(this.x, this.y)) this.world.addTile(this.tileType, this.x, this.y);
    };

    /**
     * @param {Entity | null} entity
     * @param {Object} extraData
     * @return {boolean}
     */
    break(entity = null, extraData = {}) {
        if (this.id === ItemIds.AIR) return false;
        if (!this.isVisible) return false;
        if (entity && entity.dead) return false;
        if (entity instanceof Player && entity.mode > 1) return false;
        if (entity instanceof Player) entity.food -= 0.05;
        if (
            (!(entity instanceof Living) || extraData.noReach || entity.distance(this) <= entity.blockReach) &&
            (this.isBreakable || (entity instanceof Player && player.mode % 2 === 1))
        ) {
            if (!(entity instanceof Player) || entity.mode % 2 === 0) {
                if (this.world.gameRules.doTileDrops) this.getDrops(entity instanceof Player ? entity.selectedItem : null).forEach(item => {
                    this.world.dropItem(this.x, this.y, item);
                });
            }
            this.world.setBlock(this.x, this.y, ItemIds.AIR);
            this.world.updateBlocksAround(this.x, this.y); // TODO
            this.world.playSound(this.digSound, this.x, this.y);
            for (let i = 0; i < 10; i++) player.world.addParticle(
                this.x + randFloat(-.5, .5), this.y + randFloat(-.5, .5),
                ParticleIds.BLOCK_BREAK, 0.1, {fullBlockId: this.fullId}
            );
        }
        let rmA = 0;
        const treeRemove = (x, y, b) => {
            if (rmA > 8) return;
            if (b) {
                b.break(entity, {tree: true, noReach: true});
                rmA++;
            }
            [[0, 1], [1, 0], [-1, 0]].forEach(([dx, dy]) => {
                const bN = this.world.getBlock(x + dx, y + dy);
                if (bN.id === ItemIds.NATURAL_LOG || bN.id === ItemIds.NATURAL_LEAVES) {
                    treeRemove(dx + x, dy + y, bN);
                }
            });
        }
        if (!extraData.tree && this.id === ItemIds.NATURAL_LOG && entity instanceof Player) {
            treeRemove(this.x, this.y);
        }
        return true;
    };

    /**
     * @param {Entity} entity
     * @return {boolean}
     */
    place(entity) {
        if (this.id === ItemIds.AIR) return false;
        if (entity && entity.dead) return false;
        const downId = this.world.getBlockId(this.x, this.y - 1);
        if (this.canBePlacedOn && !this.canBePlacedOn.includes(downId)) return false;
        entity.world.setBlock(this.x, this.y, this.id);
        entity.world.updateBlocksAround(this.x, this.y);
        if (this.id === ItemIds.FIRE) this.playSound("assets/sounds/random/ignite.ogg");
        else this.playSound(this.placeSound);
        if (entity instanceof Player && entity.mode % 2 === 0) entity.inventory.removeSlot(entity.handIndex);
        return true;
    };

    /*** @param {Entity} entity */
    interact(entity) {
        if (entity && entity.dead) return false;
        if (this.id === ItemIds.AIR && entity instanceof Player && entity.selectedItem.id === ItemIds.FLINT_AND_STEEL) {
            this.world.setBlock(this.x, this.y, ItemIds.FIRE);
            entity.world.updateBlocksAround(this.x, this.y);
            if (entity.mode % 2 === 0) entity.inventory.damageItem(entity.handIndex);
        }
        if (this.id === ItemIds.TNT && entity instanceof Player && entity.selectedItem.id === ItemIds.FLINT_AND_STEEL) {
            entity.world.setBlock(this.x, this.y, ItemIds.AIR);
            entity.world.updateBlocksAround(this.x, this.y);
            entity.world.summonEntity(EntityIds.TNT, this.x, this.y, {velocity: [0, 0.3], parentEntityId: entity.id});
            this.playSound("assets/sounds/random/fuse.ogg");
            if (entity.mode % 2 === 0) entity.inventory.damageItem(entity.handIndex);
        }
    };
}