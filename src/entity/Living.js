class Living extends Entity {
    TYPE = EntityIds.NOTHING;
    /*** @type {Collision[]} */
    hitboxes = [];
    maxAirY = null;
    maxHealth = 20;
    invincible = false;
    blockReach = 0;
    attackReach = 0;
    waterTicks = 0;
    waterDamageTicks = 0;
    movementSpeed = .2;
    jumpVelocity = .6;
    inventory = new Inventory(0);
    isSwimmingUp = false;
    wasGround = false;
    realMovementSpeed = .2;
    fireTicks = 0;
    fireDamageTicks = 0;
    _health = 20;

    get health() {
        return this._health;
    };

    set health(v) {
        if (!this.invincible) {
            if (this.health > v) this.damageCooldown = 10;
            this._health = v;
        }
        if (this._health > this.maxHealth) this._health = this.maxHealth;
        if (this._health <= 0) {
            this._health = 0;
            this.kill();
        }
    };

    /*** @return {Object} */
    get DEFAULT_NBT() {
        const def = super.DEFAULT_NBT;
        def.health = 20;
        def.maxHealth = 20;
        def.invincible = false;
        def.blockReach = 0;
        def.attackReach = 0;
        def.movementSpeed = 0.2;
        def.jumpVelocity = 0.6;
        def.inventory = [];
        return def;
    };

    /*** @return {Item[]} */
    get drops() {
        return [];
    };

    get onGround() {
        const r = super.onGround;
        if (r && !this.wasGround) {
            if (this.maxAirY && this.maxAirY - this.y > 3.5) this.onFallDamage(this.maxAirY - this.y);
            this.maxAirY = this.y;
            this.velocity.x = 0;
        }
        if (!r && this.maxAirY < this.y) this.maxAirY = this.y;
        return this.wasGround = r;
    };

    get isOnFire() {
        return this.fireTicks > 0;
    };

    saveNBT() {
        super.saveNBT();
        this.nbt.health = this._health;
        this.nbt.maxHealth = this.maxHealth;
        this.nbt.invincible = this.invincible;
        this.nbt.blockReach = this.blockReach;
        this.nbt.attackReach = this.attackReach;
        this.nbt.movementSpeed = this.movementSpeed;
        this.nbt.jumpVelocity = this.jumpVelocity;
        this.nbt.inventory = this.inventory.contents;
    };

    loadNBT() {
        super.loadNBT();
        this._health = this.nbt.health;
        this.maxHealth = this.nbt.maxHealth;
        this.invincible = this.nbt.invincible;
        this.blockReach = this.nbt.blockReach;
        this.attackReach = this.nbt.attackReach;
        this.movementSpeed = this.nbt.movementSpeed;
        this.jumpVelocity = this.nbt.jumpVelocity;
        this.inventory.contents = this.nbt.inventory;
    };

    jump() {
        this.velocity.y = this.jumpVelocity;
    };

    /**
     * @param {Entity} byEntity
     * @param {number} damage
     * @param {Vector} knockback
     * @returns {boolean}
     */
    attack(byEntity, damage, knockback = new Vector(.4, .4)) {
        if (!super.attack(byEntity, damage, knockback)) return false;
        if (byEntity instanceof Player && byEntity.velocity.y < 0 && !byEntity.isTouchingWater && !byEntity.isFlying) {
            for (let i = 0; i < 10; i++) this.world.addParticle(this.x, this.y, ParticleIds.CRITICAL_HIT);
            damage *= 2;
        }
        this.health -= damage;
        return true;
    };

    onFallDamage(height) {
        if (height >= 3.5 && !this.isTouchingWater) this.health -= height - 3.5;
    };

    update(deltaTick) {
        super.update(deltaTick);
        this.damageCooldown -= deltaTick;
        if (this.damageCooldown < 0) this.damageCooldown = 0;
        if (this.y < -10) this.health -= 0.5 * deltaTick;
        if (this.isUnderwater) {
            this.waterTicks += deltaTick;
            if (this.waterTicks >= 20 * 10) {
                this.waterTicks = 20 * 10;
                this.waterDamageTicks += deltaTick;
                while (this.waterDamageTicks >= 25) {
                    this.waterDamageTicks -= 25;
                    this.health -= 1;
                }
            }
        } else { // TODO: water & lava should have a custom collision for its size
            this.waterTicks -= deltaTick * 2;
            if (this.waterTicks <= 0) this.waterTicks = 0;
            this.waterDamageTicks = 0;
        }
        const isTouchingWater = this.isTouchingWater && this.world.getBlockId(this.x, this.y);
        if (isTouchingWater) this.maxAirY = this.y;
        if (this.lastInWater && !isTouchingWater) this.velocity.y = .5;
        this.lastInWater = isTouchingWater;
        this.realMovementSpeed = isTouchingWater ? this.movementSpeed / 2 : this.movementSpeed;
        if (!this.isFlying && isTouchingWater)
            this.velocity.y = this.isSwimmingUp ? .1 : -.1;
        if (this.fireTicks < 0) this.fireTicks = 0;
        if (this.fireTicks > 20 * 10) this.fireTicks = 20 * 10;
        if (this.fireDamageTicks <= 0) this.fireDamageTicks = 0;
        const onFireBlock = this.getBlockCollisions(1, true, [ItemIds.FIRE]).length;
        if (onFireBlock) {
            if (!this.isOnFire) this.fireDamageTicks = 0;
            this.fireTicks += deltaTick / 2;
        }
        if (this.isOnFire) {
            if (!onFireBlock) this.fireTicks -= deltaTick;
            this.fireDamageTicks += deltaTick;
            const req = onFireBlock ? 10 : 20;
            if (this.fireDamageTicks >= req) {
                this.fireDamageTicks -= req;
                this.health -= 1;
            }
        }
    }

    // TODO: fire block should go away eventually

    render() {
        super.render();
        if (SHOW_HITBOXES) {
            const isHovering = this.hitboxes.some(c => c.collidesPoint(this, worldMouse)) && this !== player && player.distance(this) <= player.attackReach;
            ctx.strokeStyle = isHovering ? "red" : "green";
            ctx.lineWidth = isHovering ? 3 : 1;
            this.hitboxes.forEach(hitbox => {
                ctx.strokeRect(
                    calcRenderX(this.x + hitbox.x), calcRenderY(this.y + hitbox.y),
                    BLOCK_SIZE * hitbox.w,
                    -BLOCK_SIZE * hitbox.h
                );
            });
        }
        if (!this.damageCooldown) return;
        ctx.globalAlpha = .5;
        this.hitboxes.forEach(hitbox => {
            ctx.fillStyle = "red";
            ctx.fillRect(
                calcRenderX(this.x + hitbox.x), calcRenderY(this.y + hitbox.y),
                BLOCK_SIZE * hitbox.w,
                -BLOCK_SIZE * hitbox.h
            );
        });
        ctx.globalAlpha = 1;
    }

    kill() {
        super.kill();
        this.drops.forEach(item => {
            this.world.dropItem(this.x, this.y, item);
        });
    }
}