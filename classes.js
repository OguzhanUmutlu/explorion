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
        return Math.sqrt((vector.x - this.x) ** 2 + (vector.y - this.y) ** 2);
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
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        return this;
    };

    floor() {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        return this;
    };

    round() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
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
        for (let x = 0; x < 16; x++) {
            setBlock(x, 0, 5);
            setBlock(x, 1, 2);
            setBlock(x, 2, 2);
            setBlock(x, 3, 1);
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
        x = Math.round(x);
        y = Math.round(y);
        const chunk = this.getChunkAt(x, true);
        const bX = x >= 0 ? x - ((x >> 4) << 4) : x - ((x >> 4) << 4);
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
        x = Math.round(x);
        y = Math.round(y);
        const chunk = this.getChunkAt(x);
        if (!chunk) return 0;
        const bX = x >= 0 ? x - ((x >> 4) << 4) : x - ((x >> 4) << 4);
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
        x = Math.round(x);
        y = Math.round(y);
        return new Block(x, y, this.getBlockId(x, y), this);
    };

    generateChunk(chunkX) {
        const chunk = this.chunks[chunkX] = {};
        this.generator.generate(chunk, chunkX);
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
    collisions = [blockCollision];

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} id
     * @param {World} world
     */
    constructor(x, y, id, world) {
        super(x, y, world);
        this.id = id;
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
    getBlockCollisions(enough = null) {
        const list = [];
        this.collisions.forEach(collision => {
            const minX = collision.x + this.x - 1;
            const minY = collision.y + this.y - 1;
            const maxX = collision.x + collision.w + this.x + 1;
            const maxY = collision.y + collision.h + this.y + 1;
            for (let x = minX; x <= maxX; x++) {
                for (let y = minY; y <= maxY; y++) {
                    const block = this.world.getBlock(x, y);
                    if (!block.id) continue;
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
        if (height >= 3.5) {
            this.health -= height - 3.5;
        }
    };

    get onGround() {
        const r = this.world.getBlockId(this.x + this.collisions[0].x, this.y - .51) || this.world.getBlockId(this.x + this.collisions[0].x + this.collisions[0].w, this.y - .51);
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

class Item {
    constructor(id, count = 1) {
        this._id = id;
        if (isNaN(count) || count < 0 || Math.floor(count) !== count) throw new Error("Expected a positive integer for the count of the item. Found: " + JSON.stringify(count));
        this.count = count;
    };

    get maxCount() {
        return 64;
    };

    get id() {
        return this._id;
    };

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
        for (let i = 0; i < this.size; i++) {
            const c = this.contents[i];
            if (c && c.id === item.id && c.count < item.maxCount) c.count += item.count;
            else if (!c) this.contents[i] = item;
            else continue;
            break;
        }
    };

    /*** @param {Item} item */
    remove(item) {
        let count = item.count;
        while (count > 0) {
            const index = this.contents.findIndex(i => i.id === item.id);
            if (index === -1) break;
            const it = this.contents[index];
            if (it.count <= count) {
                count -= it.count;
                it.count = 0
            } else {
                it.count -= count;
                count = 0;
            }
        }
    };
}

class Player extends Entity {
    renderPosition = new Vector2(0, 0);
    size = 2;
    handIndex = 0;
    inventory = new Inventory(9);
    blockReach = 4;

    /**
     * @param {number} x
     * @param {number} y
     * @param {World} world
     */
    constructor(x, y, world) {
        super(x, y, world);
        this.renderPosition.add(this);
        this.collisions.push(new Collision(-1 / 3, -1 / 2, 2 / 3, this.size));
        [1, 2, 3, 4, 5].forEach(id => this.inventory.add(new Item(id)));
    };

    get selectedItem() {
        return this.inventory.contents[this.handIndex];
    };

    /**
     * @param x
     * @param y
     * @return {[Block, Collision[]] | null}
     */
    move(x, y) {
        const vec = new Vector2(x, y);
        this.add(vec);
        const collision = this.getBlockCollisions(1)[0];
        if (collision) {
            this.sub(vec);
            return collision;
        }
        return null;
        /*const theta = Math.atan2(x - this.x, y - this.y);
        const vector = new Vector2(Math.sin(theta), Math.cos(theta));
        const distance = this.distance(new Vector2(x, y));
        vector.mul(distance / 30);
        for (let i = 0; i < 30; i++) {
            this.add(vector);
            const collision = this.getBlockCollisions(1)[0];
            if (collision) {
                this.sub(vector);
                return collision;
            }
        }
        return null;*/
    };

    kill() {
        super.kill();
        this._health = this.maxHealth;
        this.x = 0;
        this.y = 1;
        this.velocity.x = 0;
        this.velocity.y = 0;
    };
}