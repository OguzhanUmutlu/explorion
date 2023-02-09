class Entity extends CollideablePosition {
    TYPE = EntityIds.NOTHING;
    DESPAWN_AFTER = 20 * 60;
    motion = new Vector(0, 0);
    collision = collisionPlaceholder;
    velocity = new Vector(0, 0);
    isFlying = false;
    despawnTick = 0;
    lastInWater = false;
    direction = 1;
    dead = false;

    /**
     * @param {number} x
     * @param {number} y
     * @param {World} world
     * @param {Object} nbt
     */
    constructor(x, y, world, nbt = {}) {
        super(x, y, world);
        nbt.position = [x, y, world.name];
        this.nbt = nbt;
        this._id = __uuid__++;
    };

    /*** @return {Object} */
    get DEFAULT_NBT() {
        return {
            type: this.TYPE,
            position: [0, 0, ""],
            motion: [0, 0],
            velocity: [0, 0],
            isFlying: false
        };
    };

    get id() {
        return this._id;
    };

    get name() {
        return metadata.entityName[this.id] || metadata.entityName.other(this.id);
    }

    get canDespawn() {
        return !(this instanceof Player);
    };

    get isExposedToAir() {
        return !!this.getBlockCollisions(1, true, [0]).length;
    };

    get isInSolidBlock() {
        return !!this.getBlockCollisions(1).length;
    };

    get isUnderwater() {
        return !this.isInSolidBlock && !this.isExposedToAir;
    };

    get onGround() {
        const groundCollision = new Collision(this.collision.x, this.collision.y - 0.001, this.collision.w, 0.1);
        return !!this.getBlockCollisions(1, false, [], groundCollision).length;
    };

    get isTouchingWater() {
        return this.getBlockCollisions(null, true).some(i => i.isLiquid);
    };

    get exists() {
        return !this.dead && this.world && this.world.entities.includes(this);
    };

    init() {
        this.loadNBT();
        this._x = this.x;
    };

    saveNBT() {
        this.nbt = this.TYPE;
        this.nbt.position = [this.x, this.y, this.world.name];
        this.nbt.motion = [this.motion.x, this.motion.y];
        this.nbt.velocity = [this.velocity.x, this.velocity.y];
        this.nbt.isFlying = this.isFlying * 1;
    };

    loadNBT() {
        Object.keys(this.DEFAULT_NBT).forEach(k => !Object.keys(this.nbt).includes(k) && (this.nbt[k] = this.DEFAULT_NBT[k]));
        if (this.TYPE !== this.nbt.type) throw new Error("Unexpected entity type '" + this.nbt.type + "'. Expected: " + this.TYPE);
        this.x = this.nbt.position[0];
        this.y = this.nbt.position[1];
        this.world = worlds[this.nbt.position[2]];
        this.motion = new Vector(...this.nbt.motion);
        this.velocity = new Vector(...this.nbt.velocity);
        this.isFlying = Boolean(this.nbt.isFlying);
    };

    render() {
        this.despawnTick = 0;
        // ctx.fillRect(calcRenderX(this.x) - 3, calcRenderY(this.y) - 3, 6, 6);
        // ctx.strokeStyle = "black";
        // ctx.lineWidth = 1;
        // ctx.strokeRect(
        //     calcRenderX(this.x + this.collision.x), calcRenderY(this.y + this.collision.y),
        //     BLOCK_SIZE * this.collision.w,
        //     -BLOCK_SIZE * this.collision.h
        // );
    };

    /*** @param {number} deltaTick */
    update(deltaTick) {
        if (this.constructor === Entity && this.y < -5) this.close();
        if (this.x !== this._x) {
            this.direction = this.x > this._x ? 1 : 0;
            this._x = this.x;
        }
        if (!this.isFlying) {
            if (!this.onGround) this.velocity.y -= 0.1 * deltaTick;
            this.velocity.y -= this.velocity.y * 0.1 * deltaTick;
        }
        this.velocity.x -= this.velocity.x * 0.1 * deltaTick;
        if (this.y <= -128) {
            this.y = -128;
            this.velocity.y = 0;
        }
        const inBlock = this.getBlockCollisions(1).length;
        if (this.velocity.x || inBlock) {
            const c1 = this.move(this.velocity.x * deltaTick, 0);
            if (c1) {
                const oldX = this.x;
                this.x = c1.x + (this.velocity.x < 0 ? 1 : -1) * (c1.collision.x + c1.collision.w + this.collision.x + this.collision.w);
                if (this.getBlockCollisions(1).length) this.x = oldX;
                this.velocity.x = 0;
            }
        }
        if (this.velocity.y || inBlock) {
            const c2 = this.move(0, this.velocity.y * deltaTick);
            if (c2) {
                if (inBlock) this.y += 1;
                const oldY = this.y;
                //this.y = round(this.y);
                // TODO: Y is not being set correctly for player, example; expected: 1, got: 2
                this.y = c2.y + (this.velocity.y < 0 ? 1 : -1) * (c2.collision.y + c2.collision.h + this.collision.y);
                if (this.getBlockCollisions(1).length) this.y = oldY;
                //else if (this instanceof Living && this.velocity.y < 0) this.maxAirY = true;
                this.velocity.y = 0;
            }
        }
        const move = this.motion.div(10);
        if (move.len >= 0.01) {
            this.move(move.x, move.y);
        }
        this.motion.mul(9);
    };

    /**
     * @param {number} dx
     * @param {number} dy
     * @return {Block | null}
     */
    move(dx, dy) {
        const vector = new Vector(0, 0).getDirectionVectorTo(new Vector(dx, dy));
        const distance = sqrt(dx ** 2 + dy ** 2);
        vector.mul(distance / 30);
        for (let i = 0; i < 30; i++) {
            this.add(vector);
            const block = this.getBlockCollisions(1)[0];
            if (block) {
                this.sub(vector);
                return block;
            }
        }
        return null;
    };

    /*** @return {Block[]} */
    getBlockCollisions(enough = null, phaseables = false, filter = [], collision = this.collision) {
        const list = [];
        const minX = collision.x + this.x - 1;
        const minY = collision.y + this.y - 1;
        const maxX = collision.x + collision.w + this.x + 1;
        const maxY = collision.y + collision.h + this.y + 1;
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const block = this.world.getBlock(x, y);
                if (filter.length && !filter.includes(block.id)) continue;
                if (!phaseables && metadata.phaseable.includes(block.id)) continue;
                if (collision.collides(block.collision, this, block)) {
                    list.push(block);
                    if (enough && list.length >= enough) return list;
                }
            }
        }
        return list;
    };

    /**
     * @param {Entity} byEntity
     * @param {number} damage
     * @param {number} knockback
     */
    attack(byEntity, damage, knockback = 1) {
        if (
            byEntity === this ||
            (byEntity instanceof Player ? byEntity.distance(this) > byEntity.attackReach : false)
        ) return false;
        const vec = byEntity.getDirectionVectorTo(this);
        vec.y += 1;
        this.velocity.set(vec.mul(knockback));
        return true;
    };

    kill() {
        this.dead = true;
        if (this instanceof Player) return;
        this.close();
    };

    close() {
        this.world.entities.splice(this.world.entities.indexOf(this), 1);
    };
}