class World {
    MIN_HEIGHT = 0;
    MAX_HEIGHT = 128;
    generator = new DefaultGenerator(this);
    /*** @type {Object<number, [Object<number, [number, number]>, Entity[], Object<number, Object<number, Tile>>]>} */
    chunks = {};
    /** @type {Particle[]} */
    particles = [];
    ticks = 0;
    timeTicks = 0;
    _lastOverload = 0;
    randomTickCooldown = 0;
    gameRules = {
        doDaylightCycle: true,
        doEntityDrops: true,
        //doFireTick: true, // TODO
        doImmediateRespawn: false,
        doMobSpawning: true,
        doTileDrops: true,
        drowningDamage: true,
        fireDamage: true,
        keepInventory: false,
        maxEntityCramming: 24,
        //mobGriefing: true, // TODO
        naturalRegeneration: true,
        //pvp: true, // TODO
        randomTickSpeed: 3,
        showDeathMessages: true,
        tntExplodes: true
    };
    lightCache = {}; // TODO: lights

    /**
     * @param {string} name
     */
    constructor(name) {
        this.name = name;
    };

    get time() {
        return this.timeTicks % 12000;
    };

    set time(v) {
        while (v < 0) v += 12000;
        while (v > 12000) v -= 12000;
        this.timeTicks = this.timeTicks - this.time + v;
    };

    get day() {
        return this.timeTicks / 12000;
    };

    /*** @returns {Entity[]}} */
    get entities() {
        const list = [];
        const ks1 = Object.keys(this.chunks);
        for (let i = 0; i < ks1.length; i++) {
            const k1 = ks1[i];
            list.push(...this.chunks[k1][1]);
        }
        return list;
    };

    get tiles() {
        const list = [];
        const ks1 = Object.keys(this.chunks);
        for (let i = 0; i < ks1.length; i++) {
            const k1 = ks1[i];
            const ks2 = Object.keys(this.chunks[k1][2]);
            for (let j = 0; j < ks2.length; j++) {
                const k2 = ks2[j];
                const ks3 = Object.keys(this.chunks[k1][2][k2]);
                for (let k = 0; k < ks3.length; k++) {
                    const k3 = ks3[k];
                    list.push(this.chunks[k1][2][k2][k3]);
                }
            }
        }
        return list;
    };

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} type
     * @param {number} size
     * @param {Object} extra
     * @returns {Particle}
     */
    addParticle(x, y, type, size = .2, extra = {}) {
        const particle = new Particle(x, y, this, type, size, extra);
        this.particles.push(particle);
        return particle;
    };

    /**
     * @param {number} x
     * @param {number} y
     * @param {Item} item
     * @param {[number, number]} velocity
     * @returns {ItemEntity}
     */
    dropItem(x, y, item, velocity = [random() / 5 - .1, 0.5]) {
        return this.summonEntity(EntityIds.ITEM, x, y, {
            item: [item.id, item.count, item.nbt], velocity
        });
    };

    /**
     * @param {number} id
     * @param {number} x
     * @param {number} y
     * @param {Object} nbt
     * @returns {Entity | Living | Mob | CowEntity | TNTEntity | ItemEntity | FallingBlockEntity | Player}
     */
    summonEntity(id, x, y, nbt = {}) {
        const entity = new (EntityClasses[id])(x, y, this, nbt);
        entity.init();
        return entity;
    };

    /**
     * @param {number} x
     * @param {number} y
     * @returns {Tile | null}
     */
    getTile(x, y) {
        const chunk = this.getChunkAt(x);
        if (!chunk) return null;
        if (!chunk[2][x]) return null;
        return chunk[2][y] || null;
    };

    /**
     * @param {number} id
     * @param {number} x
     * @param {number} y
     * @param {Object} nbt
     * @returns {Entity | Living | Mob | CowEntity | TNTEntity | ItemEntity | FallingBlockEntity | Player}
     */
    addTile(id, x, y, nbt = {}) {
        const tile = new (TileClasses[id])(x, y, this, nbt);
        tile.init();
        return tile;
    };

    playSound(sound, x, y, vol = 1) {
        if (!sound) return;
        const dist = sqrt((x - player.x) ** 2 + (y - player.y) ** 2);
        if (dist > 50) return;
        const volume = vol * min(1, 1 / dist);
        sound.play(volume);
    };

    /**
     * @param {number} worldX
     * @return {number}
     */
    getChunkIdAt(worldX) {
        return floor(worldX / 16);
    };

    /**
     * @param {number} chunkX
     * @returns {Entity[]}
     */
    getChunkEntities(chunkX) {
        const chunk = this.getChunkActualAt(chunkX);
        if (!chunk) return [];
        return [...chunk[1]];
    };

    /**
     * @param {number} x
     * @param {boolean} create
     * @return {[Object<number, [number, number]>, Entity[], Object<number, Object<number, Tile>>] | null}
     */
    getChunkActualAt(x, create = false) { // not chunkX
        const chunk = this.chunks[x];
        if (create && !chunk) {
            this.generateChunk(x);
            return this.chunks[x];
        }
        return chunk;
    };

    /**
     * @param {number} worldX
     * @param {boolean} create
     * @return {[Object<number, [number, number]>, Entity[], Object<number, Object<number, Tile>>] | null}
     */
    getChunkAt(worldX, create = false) {
        return this.getChunkActualAt(this.getChunkIdAt(worldX), create);
    };

    static fullIdToArray(fId) {
        return [fId >> 4, fId & 0xf];
    };

    static arrayToFullId(id, meta = 0) {
        return (id << 4) + meta;
    };

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} id
     * @param {number} meta
     */
    setBlock(x, y, id, meta = 0) {
        x = round(x);
        y = round(y);
        if (y < this.MIN_HEIGHT || y > this.MAX_HEIGHT) return;
        const chunk = this.getChunkAt(x, true);
        const bX = (x % 16 + (x < 0 ? 16 : 0)) % 16;
        let X = chunk[0][bX];
        if (!id) {
            if (X) delete X[y];
            return;
        }
        if (!X) X = chunk[0][bX] = {};
        if (!X[y]) X[y] = {};
        X[y] = World.arrayToFullId(id, meta);
    };

    setAndUpdateBlock(x, y, id, meta = 0) {
        this.setBlock(x, y, id, meta);
        this.updateBlocksAround(x, y);
    };

    /**
     * @param {number} x
     * @param {number} y
     * @return {[number, number]}
     */
    getBlockInfo(x, y) {
        x = round(x);
        y = round(y);
        const chunk = this.getChunkAt(x);
        if (!chunk) return [0, 0];
        const bX = (x % 16 + (x < 0 ? 16 : 0)) % 16;
        let X = chunk[0][bX];
        if (!X) X = chunk[0][bX] = {};
        return X[y] ? World.fullIdToArray(X[y]) : [0, 0];
    };

    /**
     * @param {number} x
     * @param {number} y
     * @return {number}
     */
    getBlockId(x, y) {
        return this.getBlockInfo(x, y)[0];
    };

    /**
     * @param {number} x
     * @param {number} y
     * @return {number}
     */
    getBlockMeta(x, y) {
        return this.getBlockInfo(x, y)[1];
    };

    /**
     * @param {number} x
     * @param {number} y
     * @return {Block}
     */
    getBlock(x, y) {
        x = round(x);
        y = round(y);
        const info = this.getBlockInfo(x, y);
        return new Block(x, y, info[0], info[1], this);
    };

    generateChunk(chunkX) {
        if (this.chunks[chunkX]) return false;
        this.generator.generate(this.chunks[chunkX] = [{}, [], {}], chunkX);
    };

    updateBlocksAround(x, y) {
        [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(pos => this.getBlock(x + pos[0], y + pos[1]).update(this));
    };

    update(deltaTick) {
        const mainPlayer = player;
        this.ticks += deltaTick;
        if (this.gameRules.doDaylightCycle) this.timeTicks += deltaTick;
        if (deltaTick >= 2 && this._lastOverload + 5000 <= Date.now()) {
            this._lastOverload = Date.now();
            console.error("%cDid the game overload?", "color: red");
        }
        let tickingRandomly = false;
        if (this.gameRules.randomTickSpeed > 0 && (this.randomTickCooldown -= deltaTick) <= 0) {
            this.randomTickCooldown = this.gameRules.randomTickSpeed;
            tickingRandomly = true;
        }
        this.entities.forEach(entity => {
            if (entity.x >= mainPlayer.x + renderMinX() - 64 && entity.x <= mainPlayer.x + renderMaxX() + 64) {
                entity.update(deltaTick);
                if (tickingRandomly) entity.updateRandomly();
            } else {
                if (entity.canDespawn) if ((entity.despawnTick += deltaTick) > entity.DESPAWN_AFTER) entity.close();
            }
        });
        const particles = this.particles.map(p => [p.x >= mainPlayer.x + renderMinX() - 8 && p.x <= mainPlayer.x + renderMaxX() + 8, p]);
        particles.filter(i => !i[0]).forEach(p => { // TODO: on server-side this should be generalized to all players. if one player doesn't render the particle it will remove from everyone.
            p[1].close();
        });
        particles.filter(i => i[0]).forEach(p => {
            p[1].update(deltaTick);
        });
        if (tickingRandomly) this.tiles.forEach(tile => tile.updateRandomly());
        const playerChunkX = this.getChunkIdAt(player.x);
        const UPDATE_DISTANCE = ceil(canvas.width / BLOCK_SIZE / 16) + 3;
        for (let x = playerChunkX - UPDATE_DISTANCE; x <= playerChunkX + UPDATE_DISTANCE; x++) {
            if (!this.getChunkActualAt(x)) {
                this.generateChunk(x);
            } else {
                if (this.gameRules.doMobSpawning) {
                    const chunkEntities = this.getChunkEntities(x);
                    if (chunkEntities.length < 3 && random() < 0.01 * deltaTick) {
                        const X = x * 16 + rand(0, 15);
                        const Y = this.getHighestAt(X);
                        const onBlock = this.getBlockId(X, Y - 1);
                        if (onBlock === ItemIds.GRASS_BLOCK || onBlock === ItemIds.SNOWY_GRASS_BLOCK) {
                            const cow = this.summonEntity(EntityIds.COW, X, Y);
                            if (chunkEntities.some(i => i.collides(cow))) cow.close();
                        }
                    }
                }
            }
        }
    };

    /**
     * @param {number} x
     * @returns {number}
     */
    getHighestAt(x) {
        let y = 0;
        for (; y <= this.MAX_HEIGHT + 1; y++) if (metadata.phaseable.includes(this.getBlockId(x, y))) break;
        return y;
    };
}