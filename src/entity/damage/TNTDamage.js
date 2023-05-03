class TNTDamage extends ExplosionDamage {
    TYPE = DamageIds.TNT;

    constructor(entity, distance) {
        const amount = entity.maxDamage * (1 - distance / entity.damageRadius);
        super(amount, entity);
        this.distance = distance;
    };
}