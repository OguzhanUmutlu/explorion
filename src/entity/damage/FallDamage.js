class FallDamage extends Damage {
    TYPE = DamageIds.FALL;

    constructor(height) {
        super();
        this.amount = max(0, height - 3);
        this.height = height;
    };
}