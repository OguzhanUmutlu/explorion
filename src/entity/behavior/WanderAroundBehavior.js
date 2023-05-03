class WanderAroundBehavior extends Behavior {
    stopTimer = null;

    update(deltaTick) {
        if (!this.mob.moving && random() > (0.99 * (this.mob.isTouchingLiquid ? 10 : 1))) {
            this.mob.moving = true;
            this.mob.movingWay = [1, -1][rand(0, 1)];
            this.stopTimer = 20 * 2;
        }
        if (this.stopTimer && (this.stopTimer -= deltaTick) <= 0) {
            this.mob.moving = false;
            this.stopTimer = null;
        }
    };
}