class Mob extends Living {
    moving = false;
    movingWay = null;
    /*** @type {Behavior[]} */
    behaviors = [];
    isSwimmingUp = true;

    init() {
        super.init();
        this.behaviors.forEach(b => b.init());
    };

    /**
     * @param {Entity} byEntity
     * @param {number} damage
     * @param {Vector} knockback
     * @returns {boolean}
     */
    attack(byEntity, damage, knockback = new Vector(.4, .4)) {
        if (!super.attack(byEntity, damage, knockback)) return false;
        this.behaviors.forEach(b => b.attack(byEntity, damage, knockback));
        return true;
    };

    update(deltaTick) {
        super.update(deltaTick);
        this.behaviors.forEach(b => b.update(deltaTick));
        if (this.moving) {
            const dx = this.movingWay * this.movementSpeed * (this.onGround ? 1 : 1 / 2) * deltaTick;
            this.move(dx, 0);
            if (
                this.onGround &&
                !this.world.getBlock(this.x + .5 * this.movingWay, this.y).isPhaseable &&
                this.world.getBlock(this.x + .5 * this.movingWay, this.y + 1).isPhaseable
            ) this.jump();
        }
    };

    startMoving(way, behavior = null) {
        this.moving = true;
        this.movingWay = way;
        this.behaviors.forEach(i => i !== behavior && i.onStopMoving());
    };
}