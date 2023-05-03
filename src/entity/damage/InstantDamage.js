class InstantDamage extends Damage {
    TYPE = DamageIds.INSTANT_DAMAGE;

    constructor(amount) {
        super();
        this.amount = amount;
    }
}