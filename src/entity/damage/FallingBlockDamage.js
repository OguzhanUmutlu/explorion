class FallingBlockDamage extends Damage {
    TYPE = DamageIds.FALLING_BLOCK;

    /**
     * @param {number} amount
     * @param {FallingBlockEntity} entity
     */
    constructor(amount, entity) {
        super();
        this.amount = amount;
        this.entity = entity;
    }
}