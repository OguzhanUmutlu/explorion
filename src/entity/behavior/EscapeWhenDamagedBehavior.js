class EscapeWhenDamagedBehavior extends Behavior {
    attack(damage) {
        let center;
        if (damage instanceof AttackDamage) center = damage.center;
        else if (damage instanceof FireDamage) center = damage.block;
        else if (damage instanceof BerryBushDamage) center = damage.block;
        else return;
        this.mob.moving = true;
        this.mob.movingWay = center.x < this.mob.x ? 1 : -1;
        this.escapeTimer = 20 * 3;
    };

    update(deltaTick) {
        if ((this.escapeTimer -= deltaTick) <= 0)
            this.mob.moving = false;
    };

    onStopMoving() {
    };
}