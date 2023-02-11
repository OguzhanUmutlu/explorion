class EscapeWhenHitBehavior extends Behavior {
    attack(byEntity, damage, knockback = new Vector(.4, .4)) {
        this.mob.moving = true;
        this.mob.movingWay = byEntity.x < this.mob.x ? 1 : -1;
        this.escapeTimer = 20 * 3;
    };

    update(deltaTick) {
        if ((this.escapeTimer -= deltaTick) <= 0)
            this.mob.moving = false;
    };

    onStopMoving() {
    };
}