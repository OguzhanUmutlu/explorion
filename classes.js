const {sqrt, floor, ceil, round, sin, cos, atan2, random, PI, min, abs} = Math;

class Vector2 {
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    };

    distance(vector) {
        return sqrt((vector.x - this.x) ** 2 + (vector.y - this.y) ** 2);
    };

    add(vector) {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    };

    sub(vector) {
        this.x -= vector.x;
        this.y -= vector.y;
        return this;
    };

    mul(scale) {
        this.x *= scale;
        this.y *= scale;
        return this;
    };

    div(scale) {
        this.x /= scale;
        this.y /= scale;
        return this;
    };

    ceil() {
        this.x = ceil(this.x);
        this.y = ceil(this.y);
        return this;
    };

    floor() {
        this.x = floor(this.x);
        this.y = floor(this.y);
        return this;
    };

    round() {
        this.x = round(this.x);
        this.y = round(this.y);
        return this;
    };

    clone() {
        return new Vector2(this.x, this.y);
    };
}

class ChunkGenerator {
    generate(chunk, chunkX) {
        const setBlock = (x, y, id) => {
            if (!chunk[x]) chunk[x] = {};
            chunk[x][y] = id;
        };
        const getBlock = (x, y) => {
            if (!chunk[x]) chunk[x] = {};
            return chunk[x][y];
        };
        const worldX = chunkX << 4;

        for (let x = 0; x < 16; x++) {
            //const pY = round((Perlin.perlin(worldX + x, 0.1) + 1) * 100);
            const pY = Math.sin((worldX + x) / 10) * 10 + 20;
            setBlock(x, pY, 1);
            for (let y = 1; y < pY; y++) setBlock(x, y, 2);
            setBlock(x, 0, 5);
        }
    };
}

class World {
    MIN_HEIGHT = 0;
    MAX_HEIGHT = 128;
    generator = new ChunkGenerator();

    /**
     * @param {string} name
     */
    constructor(name) {
        this.uuid = __uuid__++;
        this.name = name;
        /*** @type {Object<number, Object<number, Object<number, number>> | {}>} */
        this.chunks = {};
    };

    /**
     * @param {number} worldX
     * @return {number}
     */
    getChunkIdAt(worldX) {
        return worldX >> 4;
    };

    /**
     * @param {number} worldX
     * @param {boolean} create
     * @return {Object<number, Object<number, number>> | null}
     */
    getChunkAt(worldX, create = false) { // not chunkX
        const chunk = this.chunks[worldX >> 4];
        if (create && !chunk) return this.chunks[worldX >> 4] = {};
        return chunk;
    };

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} id
     */
    setBlock(x, y, id) {
        if (y < this.MIN_HEIGHT || y > this.MAX_HEIGHT) return;
        x = round(x);
        y = round(y);
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
}

class Position extends Vector2 {
    /**
     * @param {number} x
     * @param {number} y
     * @param {World} world
     */
    constructor(x, y, world) {
        super(x, y);
        this.world = world;
    };
}

class Collision {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    collides(col, p1, p2) {
        return this.x + p1.x + this.w > col.x + p2.x &&
            col.x + p2.x + col.w > this.x + p1.x &&
            this.y + p1.y + this.h > col.y + p2.y &&
            col.y + p2.y + col.h > this.y + p1.y;
    };
}

const blockCollision = new Collision(-.5, -.5, 1, 1);

class Block extends Position {
    /*** @type {Collision[]} */
    collisions = [];

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

    updateCollision() {
        this.collisions = [blockCollision];
    };

    /**
     * @param {World} world
     * @param {Object} extra
     */
    update(world, extra = {}) {
        if (this.id >= 7 && this.id <= 15) {
            if (extra.break) {
                // TODO: remove water
            } else if (!world.getBlockId(this.x, this.y - 1)) {
                world.setBlock(this.x, this.y - 1, 8);
                world.getBlock(this.x, this.y - 1).update(world);
            } else if (this.id !== 15) {
                [1, -1].forEach(dx => {
                    if (!world.getBlockId(this.x + dx, this.y)) {
                        world.setBlock(this.x + dx, this.y, this.id + 1);
                        world.getBlock(this.x + dx, this.y).update(world);
                    }
                });
            }
        }
    };

    get isBreakable() {
        return !itemInfo.unbreakable.includes(this.id);
    };

    get isLiquid() {
        return this.id >= 7 && this.id <= 15;
    };
}

class Entity extends Position {
    motion = new Vector2(0, 0);
    /*** @type {Collision[]} */
    collisions = [];
    velocity = new Vector2(0, 0);
    rotation = 0;
    /*** @type {number | null} */
    maxAirY = null;
    wasGround = false;
    _health = 20;
    maxHealth = 20;

    /**
     * @param {number} x
     * @param {number} y
     * @param {World} world
     */
    constructor(x, y, world) {
        super(x, y, world);
    };

    get health() {
        return this._health;
    };

    set health(v) {
        this._health = v;
        if (this._health > this.maxHealth) this._health = this.maxHealth;
        if (this._health <= 0) {
            this._health = 0;
            this.kill();
        }
    };

    /*** @return {[Block, Collision[]][]} */
    getBlockCollisions(enough = null, phaseables = false) {
        const list = [];
        this.collisions.forEach(collision => {
            const minX = collision.x + this.x - 1;
            const minY = collision.y + this.y - 1;
            const maxX = collision.x + collision.w + this.x + 1;
            const maxY = collision.y + collision.h + this.y + 1;
            for (let x = minX; x <= maxX; x++) {
                for (let y = minY; y <= maxY; y++) {
                    const block = this.world.getBlock(x, y);
                    if (!phaseables && itemInfo.phaseable.includes(block.id)) continue;
                    const collided = block.collisions.filter(collision1 => this.collisions.some(collision2 => collision1.collides(collision2, block, this)));
                    if (collided.length) {
                        list.push([block, collided]);
                        if (enough && list.length >= enough) return list;
                    }
                }
            }
        });
        return list;
    };

    onFallDamage(height) {
        if (height >= 3.5 && !player.getBlockCollisions(null, true).some(i => i[0].isLiquid)) {
            this.health -= height - 3.5;
        }
    };

    get onGround() {
        const r = !itemInfo.phaseable.includes(this.world.getBlockId(this.x + this.collisions[0].x, this.y - .51)) || !itemInfo.phaseable.includes(this.world.getBlockId(this.x + this.collisions[0].x + this.collisions[0].w, this.y - .51));
        if (r && !this.wasGround) {
            if (this.maxAirY && this.maxAirY - this.y > 3.5) this.onFallDamage(this.maxAirY - this.y);
            this.maxAirY = this.y;
        }
        if (!r && this.maxAirY < this.y) this.maxAirY = this.y;
        return this.wasGround = r;
    };

    kill() {
    };
}

const idTextures = {
    0: "assets/air.png", 1: "assets/grass.png", 2: "assets/dirt.png", 3: "assets/stone.png",
    4: "assets/cobblestone.png", 5: "assets/bedrock.png", 6: "assets/apple.png", 7: "assets/water_8.png",
    8: "assets/water_8.png", 9: "assets/water_7.png", 10: "assets/water_6.png", 11: "assets/water_5.png",
    12: "assets/water_4.png", 13: "assets/water_3.png", 14: "assets/water_2.png", 15: "assets/water_1.png"
};

const itemInfo = {
    block: [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    phaseable: [0, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    unbreakable: [0, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    notPlaceableOn: [0, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    edible: {6: 4},
    name: {
        0: "Air", 1: "Grass", 2: "Dirt", 3: "Stone", 4: "Cobblestone", 5: "Bedrock", 6: "Apple", 7: "Source Water",
        8: "Water", 9: "Flowing Water", 10: "Flowing Water", 11: "Flowing Water", 12: "Flowing Water",
        13: "Flowing Water", 14: "Flowing Water", 15: "Flowing Water"
    }
};

class Item {
    constructor(id, count = 1) {
        this._id = id;
        if (isNaN(count) || count < 0 || floor(count) !== count) throw new Error("Expected a positive integer for the count of the item. Found: " + JSON.stringify(count));
        this.count = count;
    };

    get maxCount() {
        return 64;
    };

    get id() {
        return this._id;
    };

    get isBlock() {
        return itemInfo.block.includes(this.id);
    };

    get isEdible() {
        return !!itemInfo.edible[this.id];
    };

    get foodHeal() {
        return itemInfo.edible[this.id];
    };

    get name() {
        return itemInfo.name[this.id] || "Unknown";
    }

    clone() {
        return new Item(this.id, this.count);
    };
}

const itemPlaceholder = new Item(0, 0);

class Inventory {
    /*** @type {{id: number, count: number}[]} */
    contents = [];

    constructor(size) {
        this.size = size;
        this.contents = new Array(size);
    };

    get firstEmptySlot() {
        for (let i = 0; i < this.size; i++) if (!this.contents[i]) return i;
        return -1;
    };

    /*** @param {Item} item */
    add(item) {
        if (!item.id || !item.count) return;
        let count = item.count;
        for (let i = 0; i < this.size; i++) {
            const c = this.contents[i];
            if (c && c.id === item.id) {
                c.count += count;
                count = 0;
                if (c.count > item.maxCount) {
                    count += c.count - item.maxCount;
                    c.count = item.maxCount;
                }
            } else if (!c) {
                const it = this.contents[i] = new Item(item.id, count);
                count = 0;
                if (it.count > item.maxCount) {
                    count += it.count - item.maxCount;
                    it.count = item.maxCount;
                }
            }
            if (count === 0) break;
        }
    };

    /**
     * @param {Item} item
     * @param {number} count
     */
    remove(item, count = item.count) {
        while (count > 0) {
            const index = this.contents.findIndex(i => i && i.id === item.id);
            if (index === -1) break;
            const it = this.contents[index];
            if (it.count <= count) {
                count -= it.count;
                delete this.contents[index];
            } else {
                it.count -= count;
                count = 0;
            }
        }
    };

    /**
     * @param index
     * @return {Item}
     */
    get(index) {
        const i = this.contents[index];
        if (!i) return itemPlaceholder;
        return new Item(i.id, i.count);
    };
}

class Player extends Entity {
    renderPosition = new Vector2(0, 0);
    size = 2;
    handIndex = 0;
    inventory = new Inventory(9);
    blockReach = 4;
    jumpVelocity = .6;
    holdBreak = false;
    holdPlace = false;
    holdEat = false;
    movementSpeed = 0.2;
    isFlying = false;

    /**
     * @param {number} x
     * @param {number} y
     * @param {World} world
     */
    constructor(x, y, world) {
        super(x, y, world);
        this.renderPosition.add(this);
        [1, 2, 3, 4, 5, 6, 7].forEach(id => this.inventory.add(new Item(id, 64)));
        this.fixCollision();
    };

    fixCollision() {
        this.collisions[0] = new Collision(-1 / 3, -1 / 2, 2 / 3, this.size);
    };

    /*** @return {Item} */
    get selectedItem() {
        return this.inventory.get(this.handIndex) || itemPlaceholder;
    };

    /**
     * @param x
     * @param y
     * @return {[Block, Collision[]] | null}
     */
    move(x, y) {
        /*const vec = new Vector2(x, y);
        this.add(vec);
        const collision = this.getBlockCollisions(1)[0];
        if (collision) {
            this.sub(vec);
            return collision;
        }
        return null;*/
        const theta = atan2(x, y);
        const vector = new Vector2(sin(theta), cos(theta));
        const distance = sqrt(x ** 2 + y ** 2);
        vector.mul(distance / 30);
        for (let i = 0; i < 30; i++) {
            this.add(vector);
            const collision = this.getBlockCollisions(1)[0];
            if (collision) {
                this.sub(vector);
                return collision;
            }
        }
        return null;
    };

    kill() {
        super.kill();
        this._health = this.maxHealth;
        this.x = 0;
        for (let y = this.world.MIN_HEIGHT; y <= this.world.MAX_HEIGHT + 1; y++) {
            if (!this.world.getBlockId(0, y)) {
                this.y = y;
                break;
            }
        }
        this.velocity.x = 0;
        this.velocity.y = 0;
    };
}

class Texture {
    image = imagePlaceholder;

    /*** @param {Promise<Image>} promise */
    constructor(promise) {
        this._promise = promise;
        promise.then(image => this.image = image);
    };

    async wait() {
        await this._promise;
    };
}