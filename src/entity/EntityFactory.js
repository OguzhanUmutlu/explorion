const EntityIds = {
    NOTHING: 0, PLAYER: 1, COW: 2, TNT: 3, ITEM: 4, FALLING_BLOCK: 5
};

const EntityClasses = {
    [EntityIds.NOTHING]: Entity,
    [EntityIds.PLAYER]: Player,
    [EntityIds.COW]: CowEntity,
    [EntityIds.TNT]: TNTEntity,
    [EntityIds.ITEM]: ItemEntity,
    [EntityIds.FALLING_BLOCK]: FallingBlockEntity
};