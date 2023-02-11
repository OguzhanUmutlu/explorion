class Behavior {
    /*** @param {Mob} mob */
    constructor(mob) {
        this.mob = mob;
    };

    init() {
    };

    /**
     * @param {Entity} byEntity
     * @param {number} damage
     * @param {Vector} knockback
     */
    attack(byEntity, damage, knockback = new Vector(.4, .4)) {
    };

    /*** @param {number} deltaTick */
    update(deltaTick) {
    };

    onStopMoving() {
    };
}