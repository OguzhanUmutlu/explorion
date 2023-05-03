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
    movementSpeed = .2;
    jumpVelocity = .6;
    inventory = new Inventory(0);
    isSwimmingUp = false;
    wasGround = false;
    realMovementSpeed = .2;
    fireTicks = 0;
    _health = 20;
    /*** @type {Damage | null} */
    lastDamage = null;
    /*** @type {[number, Entity] | null} */
    lastFight = null;

    get health() {
        return this._health;
    };

    set health(v) {
        if (this.dead) return;
        if (!this.invincible) {
            if (v < this.health) this.onDamage(this.health - v);
            this._health = v;
        }
        if (this._health > this.maxHealth) this._health = this.maxHealth;
        if (this._health <= 0) {
            this._health = 0;
            this.kill();
        }
    };

    onDamage(damage) {
    };

    /*** @return {Object<*, *>} */
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

    get deathMessage() {
        const expireAfter = 20 * 10;
        if (this.lastFight && this.lastFight[0] + expireAfter < this.world.ticks) this.lastFight = null;
        const n = this.nametag;
        let deathMessage = `${n} died`;
        let attackMessage = this.lastFight ? `whilst fighting ${this.lastFight[1].nametag}` : "";
        let escaping = false;
        const dmg = this.lastDamage;
        if (dmg) switch (dmg.TYPE) {
            case DamageIds.LIGHTNING:
                deathMessage = `${n} was struck by lightning`;
                break;
            case DamageIds.FALL:
                if (dmg instanceof FallDamage) {
                    if (dmg.height <= 5) deathMessage = `${n} hit the ground too hard`;
                    else deathMessage = `${n} fell from a high place`;
                }
                escaping = true;
                break;
            case DamageIds.FALLING_BLOCK:
                if (dmg instanceof FallingBlockDamage)
                    deathMessage = `${n} was squashed by a ${dmg.entity.nametag}`;
                break;
            case DamageIds.THORNS:
                if (dmg instanceof ThornsDamage)
                    deathMessage = `${n} was killed by ${dmg.item.name} trying to hurt ${dmg.entity.nametag}`;
                attackMessage = "";
                break;
            case DamageIds.SUFFOCATION:
                deathMessage = `${n} suffocated in a wall`;
                break;
            case DamageIds.CRAMMING:
                if (dmg instanceof EntityCrammingDamage)
                    deathMessage = `${n} was squashed by ${dmg.entities[0].nametag}`;
                break;
            case DamageIds.DROWNING:
                deathMessage = `${n} drowned`;
                escaping = true;
                break;
            case DamageIds.STARVATION:
                deathMessage = `${n} starved to death`;
                break;
            case DamageIds.CACTUS:
                deathMessage = attackMessage ? `${n} walked into a cactus` : `${n} was pricked to death`;
                escaping = true;
                break;
            case DamageIds.BERRY_BUSH:
                deathMessage = `${n} was poked to death by a sweet berry`;
                escaping = true;
                break;
            case DamageIds.FIRE:
            case DamageIds.CAMPFIRE:
                deathMessage = attackMessage ? `${n} walked into fire` : `${n} went up in flames`;
                break;
            case DamageIds.LAVA:
                deathMessage = `${n} tried to swim in lava`;
                escaping = true;
                break;
            case DamageIds.BURNING:
                deathMessage = attackMessage ? `${n} was burnt to a crisp` : `${n} burned to death`;
                break;
            case DamageIds.MAGMA:
                deathMessage = `${n} discovered floor was lava`;
                break;
            case DamageIds.POTION:
            case DamageIds.INSTANT_DAMAGE:
            case DamageIds.POISON:
                if (dmg instanceof PotionDamage)
                    deathMessage = dmg.entity ? `${n} was killed by ${dmg.entity.nametag} with magic` : `${n} was killed by magic`;
                escaping = true;
                break;
            case DamageIds.WITHER:
                deathMessage = `${n} withered away`;
                break;
            case DamageIds.VOID:
                deathMessage = attackMessage ? `${n} didn't want to live in the same world as ${this.lastFight[1].nametag}` : `${n} fell out of the world`;
                attackMessage = "";
                break;
            case DamageIds.EXPLOSION:
                deathMessage = `${n} blew up`;
                break;
            case DamageIds.TNT:
                if (dmg instanceof TNTDamage && dmg.cause instanceof TNTEntity) {
                    const ignitedBy = dmg.cause.parentEntity;
                    deathMessage = `${n} was blown up by a TNT` + (ignitedBy ? ` ignited by ${ignitedBy.nametag}` : "");
                }
                break;
            case DamageIds.FIREWORK:
                if (dmg instanceof FireworkDamage && dmg.cause instanceof FireworkEntity) { // TODO: fireworks
                    const ignitedBy = dmg.cause.parentEntity;
                    deathMessage = `${n} was blown up by a firework` + (ignitedBy ? ` ignited by ${ignitedBy.nametag}` : "");
                }
                break;
            case DamageIds.INTENTIONAL_GAME_DESIGN:
                deathMessage = `${n} was killed by [Intentional Game Design]`;
                break;
            case DamageIds.FREEZING:
                deathMessage = `${n} froze to death`;
                break;
            case DamageIds.ATTACK:
                if (dmg instanceof AttackDamage) deathMessage = `${n} was slain by ${dmg.entity.nametag}`;
                attackMessage = "";
                break;
            case DamageIds.MELEE:
                if (dmg instanceof MeleeDamage) {
                    const nm = dmg.childEntity.name;
                    deathMessage = `${n} was shot` + (dmg.entity ? ` by ${dmg.entity.nametag}` : "") + ` with a${[..."aeiou"].some(i => nm.startsWith(i)) ? "n" : ""} ${nm} `;
                }
                attackMessage = "";
                break;
        }
        return deathMessage + " " + attackMessage;
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
     * @param {Damage} damage
     * @returns {boolean}
     */
    attack(damage) {
        if (this.invincible) return false;
        if (!super.attack(damage)) return false;
        if (damage instanceof AttackDamage) this.lastFight = [this.world.ticks, damage.entity];
        if (damage instanceof AttackDamage && damage.entity instanceof Player && damage.entity.velocity.y < 0 &&
            !damage.entity.isTouchingLiquid && !damage.entity.isFlying) {
            for (let i = 0; i < 10; i++) this.world.addParticle(this.x, this.y, ParticleIds.CRITICAL_HIT);
            damage.amount *= 2;
        }
        if (!damage.kills && this.health - damage.amount < 1) this.health = 1;
        else this.health -= damage.amount;
        this.lastDamage = damage;
        return true;
    };

    onFallDamage(height) {
        if (height >= 3.5 && !this.isTouchingLiquid) {
            this.playSound("assets/sounds/damage/fall" + (height >= 8 ? "big" : "small") + ".ogg");
            this.attack(new FallDamage(height));
        }
    };

    update(deltaTick) {
        super.update(deltaTick);
        const damageKeys = Object.keys(this.damageCooldown);
        for (let i = 0; i < damageKeys.length; i++) {
            const k = damageKeys[i];
            if ((this.damageCooldown[k] -= deltaTick) <= 0) delete this.damageCooldown[k];
        }
        if (this.isUnderwater) {
            if ((this.waterTicks += deltaTick) >= 20 * 10) {
                this.waterTicks = 20 * 10;
                if (this.world.gameRules.drowningDamage) this.attack(new DrowningDamage);
            }
        } else { // TODO: water & lava should have a custom collision for its size
            this.waterTicks -= deltaTick * 2;
            if (this.waterTicks <= 0) this.waterTicks = 0;
        }
        const isTouchingLiquid = this.isTouchingLiquid && this.world.getBlockId(this.x, this.y);
        if (!this.lastInWater && isTouchingLiquid) {
            this.velocity.y /= 2;
            const dist = this.maxAirY - this.y;
            if (dist > 2) this.playSound("assets/sounds/liquid/" + (dist > 6 ? "heavy_splash" : "splash" + ["", "2"][rand(0, 1)]) + ".ogg");
        }
        if (isTouchingLiquid) this.maxAirY = this.y;
        if (this.lastInWater && !isTouchingLiquid && this.world.getBlockId(this.x, this.y - 0.5) === ItemIds.WATER) this.velocity.y = 0.5;
        this.lastInWater = isTouchingLiquid;
        //if (isTouchingLiquid && Math.floor(this.world.ticks) % 50 === 0 && !this.onGround) this.playSound("assets/sounds/liquid/swim" + rand(1, 18) + ".ogg", 0.1)
        this.realMovementSpeed = isTouchingLiquid ? this.movementSpeed / 2 : this.movementSpeed;
        if (!this.isFlying && isTouchingLiquid) this.velocity.y = this.isSwimmingUp ? .1 : -.1;
        if (this.fireTicks < 0) this.fireTicks = 0;
        if (this.fireTicks > 20 * 10) this.fireTicks = 20 * 10;
        const touchingFireBlock = this.getBlockCollisions(1, true, [ItemIds.FIRE])[0];
        if (touchingFireBlock) this.fireTicks += deltaTick / 2;
        if (this.isOnFire) {
            if (!touchingFireBlock) this.fireTicks -= deltaTick;
            if (this.world.gameRules.fireDamage) this.attack(touchingFireBlock ? new FireDamage(touchingFireBlock) : new BurningDamage);
        }
        const cramEntities = this.world.entities.filter(i => i !== this && round(i.x) === round(this.x) && round(i.y) === round(this.y));
        if (this.world.gameRules.maxEntityCramming > 0 && cramEntities.length > this.world.gameRules.maxEntityCramming) {
            this.attack(new EntityCrammingDamage(cramEntities));
        }
    };

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
        if (!Object.keys(this.damageCooldown).length) return;
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
    };

    kill() {
        super.kill();
        if (this.world.gameRules.doEntityDrops) this.drops.forEach(item => {
            this.world.dropItem(this.x, this.y, item);
        });
    };
}