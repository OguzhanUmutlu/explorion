class WitherDamage extends Damage {
    TYPE = DamageIds.WITHER;
    amount = 1;

    constructor(level) {
        super();
        this.cooldown = [null, 80, 40,][min(2, level)];
    };
}