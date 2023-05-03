class Behavior {
    /*** @param {Mob} mob */
    constructor(mob) {
        this.mob = mob;
    };

    init() {
    };

    /*** @param {Damage} damage */
    attack(damage) {
    };

    /*** @param {number} deltaTick */
    update(deltaTick) {
    };

    onStopMoving() {
    };
}