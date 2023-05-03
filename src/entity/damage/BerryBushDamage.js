class BerryBushDamage extends Damage {
    TYPE = DamageIds.BERRY_BUSH;
    amount = 1;

    /*** @param {Block} block */
    constructor(block) {
        super();
        this.block = block;
    }
}