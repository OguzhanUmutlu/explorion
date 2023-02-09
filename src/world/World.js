class World {
    MIN_HEIGHT = 0;
    MAX_HEIGHT = 128;
    generator = new ChunkGenerator(this);
    /*** @type {Object<number, Object<number, Object<number, number>> | {}>} */
    chunks = {};
    /*** @type {Entity[]} */
    entities = [];
    /*** @type {Tile[]} */
    tiles = [];
    /** @type {Particle[]} */
    particles = [];

    /**
     * @param {string} name
     */
    constructor(name) {
        this.name = name;
    };

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} type
     * @param {number} size
     * @returns {Particle}
     */
    addParticle(x, y, type, size = .2) {
        const particle = new Particle(x, y, this, type, size);
        this.particles.push(particle);
        return particle;
    };

    /**
     * @param {number} x
     * @param {number} y
     * @param {Item} item
     * @returns {ItemEntity}
     */
    dropItem(x, y, item) {
        return this.summonEntity(EntityIds.ITEM, x, y, {
            item: [item.id, item.count], velocity: [random() / 5 - .1, 0.5]
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
        this.entities.push(entity);
        return entity;
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
        return this.entities.filter(entity => this.getChunkIdAt(entity.x) === chunkX);
    };

    /**
     * @param {number} worldX
     * @param {boolean} create
     * @return {Object<number, Object<number, number>> | null}
     */
    getChunkAt(worldX, create = false) { // not chunkX
        const chunk = this.chunks[this.getChunkIdAt(worldX)];
        if (create && !chunk) return this.chunks[this.getChunkIdAt(worldX)] = {};
        return chunk;
    };

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} id
     */
    setBlock(x, y, id) {
        x = round(x);
        y = round(y);
        if (y < this.MIN_HEIGHT || y > this.MAX_HEIGHT) return;
        const chunk = this.getChunkAt(x, true);
        const bX = (x % 16 + (x < 0 ? 16 : 0)) % 16;
        let X = chunk[bX];
        if (!id) {
            if (X) delete X[y];
            return;
        }
        if (!X) X = chunk[bX] = {};
        X[y] = id;
    };

    /**
     * @param {number} x
     * @param {number} y
     * @return {number}
     */
    getBlockId(x, y) {
        x = round(x);
        y = round(y);
        const chunk = this.getChunkAt(x);
        if (!chunk) return 0;
        const bX = (x % 16 + (x < 0 ? 16 : 0)) % 16;
        let X = chunk[bX];
        if (!X) X = chunk[bX] = {};
        return X[y] || 0;
    };

    /**
     * @param {number} x
     * @param {number} y
     * @return {Block}
     */
    getBlock(x, y) {
        x = round(x);
        y = round(y);
        return new Block(x, y, this.getBlockId(x, y), this);
    };

    generateChunk(chunkX) {
        this.generator.generate(this.chunks[chunkX] = {}, chunkX);
    };

    updateBlocksAround(x, y) {
        [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(pos => this.getBlock(x + pos[0], y + pos[1]).update(this));
    };

    update(deltaTick) {
        const mainPlayer = player;
        const entities = this.entities.map(entity => [entity.x >= mainPlayer.x + renderMinX() - 64 && entity.x <= mainPlayer.x + renderMaxX() + 64, entity]);
        entities.filter(i => !i[0]).forEach(ent => {
            if (ent[1].canDespawn) if ((ent[1].despawnTick += deltaTick) > ent[1].DESPAWN_AFTER) ent[1].close();
        });
        entities.filter(i => i[0]).forEach(ent => {
            ent[1].update(deltaTick);
        });
        const particles = this.particles.map(p => [p.x >= mainPlayer.x + renderMinX() - 8 && p.x <= mainPlayer.x + renderMaxX() + 8, p]);
        particles.filter(i => !i[0]).forEach(p => { // TODO: on server-side this should be generalized to all players. if one player doesn't render the particle it will remove from everyone.
            p[1].close();
        });
        particles.filter(i => i[0]).forEach(p => {
            p[1].update(deltaTick);
        });
        const playerChunkX = this.getChunkIdAt(player.x);
        const UPDATE_DISTANCE = ceil(canvas.width / BLOCK_SIZE / 16) + 3;
        for (let x = playerChunkX - UPDATE_DISTANCE; x <= playerChunkX + UPDATE_DISTANCE; x++) {
            if (!this.chunks[x]) {
                this.generateChunk(x);
            } else {
                const chunkEntities = this.getChunkEntities(x);
                if (chunkEntities.length < 4 && random() < 0.01 * deltaTick) {
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
    };

    /**
     * @param {number} x
     * @returns {number}
     */
    getHighestAt(x) {
        let y = 0;
        for (; y <= this.MAX_HEIGHT + 1; y++) {
            if (this.getBlockId(x, y) === ItemIds.AIR) break;
        }
        return y;
    };
}