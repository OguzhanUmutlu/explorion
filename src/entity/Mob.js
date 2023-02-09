class Mob extends Living {
    running = false;
    runningWay = null;
    runningTimer = null;
    isSwimmingUp = true;

    /*** @return {Object} */
    get DEFAULT_NBT() { // TODO: Fix incompatible override error
        return super.DEFAULT_NBT;
    };

    attack(byEntity, damage, knockback) {
        if (!super.attack(byEntity, damage, knockback)) return false;
        this.running = true;
        this.runningWay = byEntity.x < this.x ? 1 : -1;
        this.runningTimer = 20 * 10;
        return true;
    };

    update(deltaTick) {
        super.update(deltaTick);
        if (this.running) {
            const dx = this.runningWay * this.movementSpeed * (this.onGround ? 1 : 1 / 2) * deltaTick;
            this.move(dx, 0);
            if (
                this.onGround &&
                !this.world.getBlock(this.x + .5 * this.runningWay, this.y).isPhaseable &&
                this.world.getBlock(this.x + .5 * this.runningWay, this.y + 1).isPhaseable
            ) this.jump();
            if ((this.runningTimer -= deltaTick) <= 0) {
                this.running = false;
            }
        }
    };
}