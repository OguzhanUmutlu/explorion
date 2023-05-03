class ExplosionDamage extends KnockbackDamage {
    TYPE = DamageIds.EXPLOSION;
    cooldown = 5;

    /**
     * @param {number} amount
     * @param {Entity | Block} cause
     */
    constructor(amount, cause) {
        super(amount, cause);
        this.amount = amount;
        this.cause = cause;
    };
}