class AttackDamage extends KnockbackDamage {
    TYPE = DamageIds.ATTACK;

    /**
     * @param {number} amount
     * @param {Entity} entity
     */
    constructor(amount, entity) {
        super(amount, entity);
        this.amount = amount;
        this.entity = entity;
    };
}