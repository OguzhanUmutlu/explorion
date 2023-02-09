const EntityIds = {
    NOTHING: 0, PLAYER: 1, COW: 2, TNT: 3, ITEM: 4, FALLING_BLOCK: 5
};
const ParticleIds = {
    NOTHING: 0, CRITICAL_HIT: 1
};
const particleTextures = {
    [ParticleIds.CRITICAL_HIT]: "assets/particles/critical_hit.png"
};

const EntityClasses = {
    [EntityIds.NOTHING]: Entity,
    [EntityIds.PLAYER]: Player,
    [EntityIds.COW]: CowEntity,
    [EntityIds.TNT]: TNTEntity,
    [EntityIds.ITEM]: ItemEntity,
    [EntityIds.FALLING_BLOCK]: FallingBlockEntity
};