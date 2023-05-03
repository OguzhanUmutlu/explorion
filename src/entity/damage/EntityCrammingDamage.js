class EntityCrammingDamage extends Damage {
    TYPE = DamageIds.CRAMMING;
    amount = 6;

    /*** @param {Entity[]} entities */
    constructor(entities) {
        super();
        this.entities = entities;
    }
}