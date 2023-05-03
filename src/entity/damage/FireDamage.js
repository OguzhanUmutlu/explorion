class FireDamage extends Damage {
    TYPE = DamageIds.FIRE;
    amount = 1;

    /*** @param {Block} block */
    constructor(block) {
        super();
        this.block = block;
    };
}