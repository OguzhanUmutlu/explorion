class KnockbackDamage extends Damage {
    TYPE = -1;
    knockback = new Vector(0.4, 0.4);

    /**
     * @param {number} amount
     * @param {Vector} center
     */
    constructor(amount, center) {
        super();
        this.amount = amount;
        this.center = center;
    };
}