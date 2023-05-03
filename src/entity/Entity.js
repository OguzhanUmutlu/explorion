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
    damageCooldown = {};
    moved = 0;
    _nametag = "";
    nametagVisible = "";
    /*** @type {number | null} */
    cacheCurrentChunk = null;

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

    /*** @return {Object<*, *>} */
    get DEFAULT_NBT() {
        return {
            type: this.TYPE,
            position: [0, 0, ""],
            motion: [0, 0],
            velocity: [0, 0],
            isFlying: false,
            nametag: "",
            nametagVisible: false
        };
    };

    get id() {
        return this._id;
    };

    get nametag() {
        return this.name;
    };

    get name() {
        return metadata.entityName[this.TYPE] || metadata.entityName.other(this.TYPE);
    }

    get canDespawn() {
        return !(this instanceof Player);
    };

    get isExposedToAir() { // TODO: make it so it caches this kinds of stuff like, cacheCurrentTick = tick, and reset this every tick: cacheObj = {}
        return !!this.getBlockCollisions(1, true, [0]).length;
    };

    get isInSolidBlock() {
        return !!this.getBlockCollisions(1).length;
    };

    get isUnderwater() {
        const cl = this.getBlockCollisions(1, true)[0];
        return cl && cl.isLiquid && !this.isExposedToAir;
        //return !this.isInSolidBlock && !this.isExposedToAir;
    };

    get onGround() {
        const groundCollision = new Collision(this.collision.x, this.collision.y - 0.01, this.collision.w, 0.1);
        return !!this.getBlockCollisions(1, false, [], groundCollision).length;
    };

    get isTouchingWater() {
        return !!this.getBlockCollisions(1, true, [ItemIds.WATER])[0];
    };

    get isTouchingLava() {
        return !!this.getBlockCollisions(1, true, [ItemIds.LAVA])[0];
    };

    get isTouchingLiquid() {
        return this.getBlockCollisions(null, true).some(i => i.isLiquid);
    };

    get exists() {
        return !this.dead && this.world && this.world.entities.includes(this);
    };

    checkChunk() {
        if (this.cacheCurrentChunk !== null && this.dead) {
            const ch = this.world.getChunkActualAt(this.cacheCurrentChunk);
            if (ch) ch[1].splice(ch[1].indexOf(this), 1);
            this.cacheCurrentChunk = null;
            return;
        }
        if (this.cacheCurrentChunk === null || this.world.getChunkIdAt(this.x) !== this.cacheCurrentChunk || !this.world.getChunkAt(this.x, true)[1].includes(this)) {
            if (this.cacheCurrentChunk !== null) {
                const ch = this.world.getChunkActualAt(this.cacheCurrentChunk);
                if (ch) ch[1].splice(ch[1].indexOf(this), 1);
            }
            this.cacheCurrentChunk = this.world.getChunkIdAt(this.x);
            this.world.getChunkAt(this.x, true)[1].push(this);
        }
    };

    init() {
        this.loadNBT();
        this._x = this.x;
        this.checkChunk();
    };

    saveNBT() {
        this.nbt = this.TYPE;
        this.nbt.position = [this.x, this.y, this.world.name];
        this.nbt.motion = [this.motion.x, this.motion.y];
        this.nbt.velocity = [this.velocity.x, this.velocity.y];
        this.nbt.isFlying = this.isFlying * 1;
        this.nbt.nametag = this._nametag;
        this.nbt.nametagVisible = this.nametagVisible;
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
        this._nametag = this.nbt.nametag;
        this.nametagVisible = this.nbt.nametagVisible;
    };

    render() {
        this.despawnTick = 0;
        if (SHOW_COLLISIONS) {
            ctx.fillRect(calcRenderX(this.x) - 3, calcRenderY(this.y) - 3, 6, 6);
            ctx.strokeStyle = "black";
            ctx.lineWidth = 1;
            ctx.strokeRect(
                calcRenderX(this.x + this.collision.x), calcRenderY(this.y + this.collision.y),
                BLOCK_SIZE * this.collision.w,
                -BLOCK_SIZE * this.collision.h
            );
        }
    };

    /*** @param {number} deltaTick */
    update(deltaTick) {
        if (this.constructor === Entity && this.y < -5) this.close();
        if (this.x !== this._x) {
            this.direction = this.x > this._x ? 1 : 0;
            this._x = this.x;
        }
        if (this.y < -10) this.attack(new VoidDamage);
        const inBlock = this.getBlockCollisions(1).length;
        if (!this.isFlying) {
            if (!(this instanceof Living) || !this.isSwimmingUp || !this.isTouchingLiquid || this.world.getBlockId(this.x, this.y) === ItemIds.AIR) {
                if (!this.onGround) this.velocity.y -= 0.1 * deltaTick;
                this.velocity.y -= this.velocity.y * 0.1 * deltaTick;
            }
            if (inBlock) this.y += 1;
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
                    const oldY = this.y;
                    // TODO: Y is not being set correctly for player, example; expected: 1, got: 2
                    // TODO: jumping doesn't work
                    // TODO: swimming is slow
                    this.y = c2.y + (this.velocity.y < 0 ? 1 : -1) * (c2.collision.y + c2.collision.h + this.collision.y);
                    if (this.getBlockCollisions(1).length) this.y = oldY;
                    //else if (this instanceof Living && this.velocity.y < 0) this.maxAirY = true;
                    this.velocity.y = 0;
                }
            }
            if (this.moved > 1) {
                this.moved -= 1;
                if (this.moved < 0) this.moved = 0;
                const block = this.world.getBlock(this.x, this.y - 1);
                if (!block.isPhaseable) {
                    const sound = block.stepSound;
                    if (sound) this.playSound(sound);
                }
            }
        }
        this.velocity.x -= this.velocity.x * 0.1 * deltaTick;
        if (this.y <= -128) {
            this.y = -128;
            this.velocity.y = 0;
        }
        const move = this.motion.div(10);
        if (move.len >= 0.01) {
            this.move(move.x, move.y);
        }
        this.motion.mul(9);
        this.checkChunk();
    };

    updateRandomly() {
    };

    /**
     * @param {number} dx
     * @param {number} dy
     * @return {Block | null}
     */
    move(dx, dy) {
        const stx = this.x;
        const vector = new Vector(0, 0).getDirectionVectorTo(new Vector(dx, dy));
        const distance = sqrt(dx ** 2 + dy ** 2);
        const STEPS = 3;
        vector.mul(distance / STEPS);
        for (let i = 0; i < STEPS; i++) {
            this.add(vector);
            const block = this.getBlockCollisions(1)[0];
            if (block) {
                this.sub(vector);
                return block;
            }
        }
        let d = this.x - stx;
        if ((this.moved < 0 && d > 0) || (this.moved > 0 && d < 0)) this.moved = 0;
        this.moved += d;
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

    /*** @returns {Entity[]} */
    getChunkEntities() {
        return this.world.getChunkEntities(this.world.getChunkIdAt(this.x))
    };

    /*** @param {Damage} damage */
    attack(damage) {
        if (this.dead) return false;
        if (this.damageCooldown[damage.TYPE]) return false;
        if (damage.amount <= 0) return false;
        if (damage instanceof AttackDamage && damage.entity instanceof Player &&
            damage.entity.distance(this) > damage.entity.attackReach) return false;
        if (damage instanceof AttackDamage && damage.entity instanceof Living)
            damage.entity.lastFight = [this.world.ticks, this];
        this.damageCooldown[damage.TYPE] = damage.cooldown;
        if (damage instanceof KnockbackDamage) {
            this.velocity.x = (this.x > damage.center.x ? 1 : -1) * damage.knockback.x;
            this.velocity.y = .4 * damage.knockback.y;
        }
        return true;
    };

    kill() {
        this.close();
    };

    close() {
        this.dead = true;
        this.checkChunk();
    };
}