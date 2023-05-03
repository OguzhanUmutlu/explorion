class IntentionalGameDesignDamage extends ExplosionDamage {
    TYPE = DamageIds.INTENTIONAL_GAME_DESIGN;

    constructor(amount, block) {
        super(amount, block);
    };
}