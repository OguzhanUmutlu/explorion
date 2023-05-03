class ThornsDamage extends AttackDamage {
    TYPE = DamageIds.THORNS;

    /**
     * @param {number} level
     * @param {Entity} entity
     * @param {Item} item
     */
    constructor(level, entity, item) { // TODO: make level = item.level
        super(level > 10 ? level - 10 : (random() < (level * 15) ? rand(1, 4) : 0), entity);
        this.item = item;
    }
}