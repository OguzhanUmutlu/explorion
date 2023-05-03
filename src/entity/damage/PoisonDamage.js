class PoisonDamage extends PotionDamage {
    TYPE = DamageIds.POISON;
    amount = 1;
    cooldown = 25;
    kills = false;

    constructor(level) {
        super();
        this.amount = [null, 0.8, 1.66, 3.32, 6.66, 20][min(5, level)];
        this.cooldown = [null, 25, 12, 6, 3, 1][min(5, level)];
    };
}