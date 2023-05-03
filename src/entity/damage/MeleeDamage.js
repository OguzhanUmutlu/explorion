class MeleeDamage extends AttackDamage {
    TYPE = DamageIds.MELEE;

    /**
     * @param {number} amount
     * @param {Entity | null} childEntity
     * @param {Entity} entity
     */
    constructor(amount, childEntity, entity) {
        super(amount, entity);
        this.childEntity = childEntity;
    };
}