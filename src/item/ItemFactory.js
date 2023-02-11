const ItemIds = {
    AIR: 0,
    BEDROCK: 1,
    COAL_ORE: 2,
    COBBLESTONE: 3,
    DIAMOND_ORE: 4,
    DIRT: 5,
    GOLD_ORE: 6,
    GRASS_BLOCK: 7,
    GRAVEL: 8,
    ICE: 9,
    IRON_ORE: 10,
    PACKED_ICE: 11,
    SAND: 12,
    SNOWY_GRASS_BLOCK: 13,
    STONE: 14,
    TNT: 15,
    WATER_1: 16,
    WATER_2: 17,
    WATER_3: 18,
    WATER_4: 19,
    WATER_5: 20,
    WATER_6: 21,
    WATER_7: 22,
    WATER_8: 23,
    WATER: 24,
    LAVA_1: 25,
    LAVA_2: 26,
    LAVA_3: 27,
    LAVA_4: 28,
    LAVA: 29,
    FIRE: 30,
    OAK_WOOD: 31,
    OAK_LEAVES: 32,
    GRASS: 33,
    GRASS_DOUBLE: 34,
    ALLIUM: 35,
    BLUE_ORCHID: 36,
    DANDELION: 37,
    HOUSTONIA: 38,
    ORANGE_TULIP: 39,
    OXEYE_DAISY: 40,
    PAEONIA: 41,
    PINK_TULIP: 42,
    RED_TULIP: 43,
    ROSE: 44,
    WHITE_TULIP: 45,

    APPLE: 100,
    COAL: 101,
    COOKED_BEEF: 103,
    DIAMOND: 104,
    FLINT: 105,
    FLINT_AND_STEEL: 106,
    GOLD_INGOT: 107,
    IRON_INGOT: 108,
    RAW_BEEF: 109,
    WHEAT_SEEDS: 110,
    LEATHER: 111
};

const metadata = {
    block: [],
    item: [],
    phaseable: [],
    replaceable: [],
    breakable: [],
    canPlaceBlockOnIt: [],
    isExplodeable: [],
    noDropBlocks: [],
    blockDrops: {},
    edible: {[ItemIds.APPLE]: 4},
    itemName: {
        other: id => (Object.keys(ItemIds).find(i => ItemIds[i] === id) || "UNKNOWN").split("_").map(i => i[0].toUpperCase() + i.substring(1).toLowerCase()).join(" ")
    },
    entityName: {
        other: id => (Object.keys(EntityIds).find(i => ItemIds[i] === id) || "UNKNOWN").split("_").map(i => i[0].toUpperCase() + i.substring(1).toLowerCase()).join(" ")
    },
    durabilities: {},
    maxStack: {},
    canFall: [],
    canBePlacedOn: {},
    cannotBePlacedOn: {},
    transparent: [],
    canStayOnPhaseables: []
};
const idTextures = {};

/**
 * @param {number} id
 * @param {string | 0} texture
 * @param {string | 0} name
 * @param {number | 0} edible
 * @param {number | 0} durability
 * @param {number | 0} maxStack
 */
const registerItem = (id, {
    texture = 0, name = 0, edible = 0, durability = 0, maxStack = 0
} = {}) => {
    idTextures[id] = texture || "assets/items/" + Object.keys(ItemIds).find(k => ItemIds[k] === id).toLowerCase() + ".png";
    metadata.item.push(id);
    if (edible) metadata.edible[id] = edible;
    if (name) metadata.itemName[id] = name;
    if (durability) metadata.durabilities[id] = durability;
    if (maxStack) metadata.maxStack[id] = maxStack;
    console.log("%cRegistered item with the ID " + id, "color: #00ff00");
};

/**
 * @param {number} id
 * @param {string | 0} texture
 * @param {string | 0} name
 * @param {0 | 1} isTransparent
 * @param {number[] | 0} canBePlacedOn
 * @param {number[]} cannotBePlacedOn
 * @param {0 | 1} canStayOnPhaseables
 * @param {0 | 1} canFall
 * @param {0 | 1} isReplaceable
 * @param {0 | 1} isPhaseable
 * @param {0 | 1} isBreakable
 * @param {0 | 1} canPlaceBlockOnIt
 * @param {0 | 1} isExplodeable
 * @param {(number | [number, number])[] | 0} drops
 */
const registerBlock = (id, {
    texture = 0, name = 0, isTransparent = 0, canBePlacedOn = 0, cannotBePlacedOn = [],
    canStayOnPhaseables = 0, canFall = 0, isReplaceable = 0, isPhaseable = 0,
    isBreakable = 0, canPlaceBlockOnIt = 0, isExplodeable = 0, drops = 0
} = {}) => {
    idTextures[id] = texture || "assets/blocks/" + Object.keys(ItemIds).find(k => ItemIds[k] === id).toLowerCase() + ".png";
    metadata.block.push(id);
    if (name) metadata.itemName[id] = name;
    if (isTransparent) metadata.transparent.push(id);
    if (canBePlacedOn && canBePlacedOn.length) metadata.canBePlacedOn[id] = canBePlacedOn;
    if (canStayOnPhaseables) metadata.canStayOnPhaseables.push(id);
    if (cannotBePlacedOn) metadata.cannotBePlacedOn[id] = cannotBePlacedOn;
    if (canFall) metadata.canFall.push(id);
    if (isReplaceable) metadata.replaceable.push(id);
    if (isPhaseable) metadata.phaseable.push(id);
    if (isBreakable) metadata.breakable.push(id);
    if (canPlaceBlockOnIt) metadata.canPlaceBlockOnIt.push(id);
    if (isExplodeable) metadata.isExplodeable.push(id);
    if (drops) metadata.blockDrops[id] = drops;
    console.log("%cRegistered block with the ID " + id, "color: #00ff00");
};

const blockOpts = {
    isBreakable: 1, canPlaceBlockOnIt: 1, isExplodeable: 1, canStayOnPhaseables: 1
};

registerBlock(ItemIds.AIR, {
    isTransparent: 1, isReplaceable: 1, isPhaseable: 1, drops: [], canStayOnPhaseables: 1
});
registerBlock(ItemIds.BEDROCK, {
    drops: [], canStayOnPhaseables: 1, canPlaceBlockOnIt: 1
});
registerBlock(ItemIds.COAL_ORE, {
    ...blockOpts, drops: [ItemIds.COAL]
});
registerBlock(ItemIds.COBBLESTONE, blockOpts);
registerBlock(ItemIds.DIAMOND_ORE, {
    ...blockOpts, drops: [ItemIds.DIAMOND]
});
registerBlock(ItemIds.DIRT, blockOpts);
registerBlock(ItemIds.GOLD_ORE, blockOpts);
registerBlock(ItemIds.GRASS_BLOCK, {
    ...blockOpts, drops: [ItemIds.DIRT]
});
registerBlock(ItemIds.SNOWY_GRASS_BLOCK, {
    ...blockOpts, drops: [ItemIds.DIRT]
});
registerBlock(ItemIds.ICE, {
    ...blockOpts, isTransparent: 1, drops: []
});
registerBlock(ItemIds.PACKED_ICE, {
    ...blockOpts, isTransparent: 1
});
registerBlock(ItemIds.IRON_ORE, blockOpts);
registerBlock(ItemIds.SAND, {
    ...blockOpts, canFall: 1
});
registerBlock(ItemIds.GRAVEL, {
    ...blockOpts, canFall: 1
});
registerBlock(ItemIds.STONE, {
    ...blockOpts, drops: [ItemIds.COBBLESTONE]
});
registerBlock(ItemIds.TNT, blockOpts);
registerBlock(ItemIds.FIRE, {
    ...blockOpts, isTransparent: 1, canStayOnPhaseables: 0, drops: []
});
registerBlock(ItemIds.OAK_WOOD, blockOpts);
registerBlock(ItemIds.OAK_LEAVES, {
    ...blockOpts, isTransparent: 1
});

const FlowerOpts = {
    isTransparent: 1, canBePlacedOn: [ItemIds.GRASS_BLOCK, ItemIds.SNOWY_GRASS_BLOCK, ItemIds.DIRT],
    isPhaseable: 1, isBreakable: 1, isExplodeable: 1, canStayOnPhaseables: 0
};
registerBlock(ItemIds.GRASS, {
    ...FlowerOpts, drops: [ItemIds.WHEAT_SEEDS]
});
registerBlock(ItemIds.GRASS_DOUBLE, {
    ...FlowerOpts, drops: [ItemIds.WHEAT_SEEDS]
});
registerBlock(ItemIds.ALLIUM, FlowerOpts);
registerBlock(ItemIds.BLUE_ORCHID, FlowerOpts);
registerBlock(ItemIds.DANDELION, FlowerOpts);
registerBlock(ItemIds.HOUSTONIA, FlowerOpts);
registerBlock(ItemIds.ORANGE_TULIP, FlowerOpts);
registerBlock(ItemIds.OXEYE_DAISY, FlowerOpts);
registerBlock(ItemIds.PAEONIA, FlowerOpts);
registerBlock(ItemIds.PINK_TULIP, FlowerOpts);
registerBlock(ItemIds.RED_TULIP, FlowerOpts);
registerBlock(ItemIds.ROSE, FlowerOpts);
registerBlock(ItemIds.WHITE_TULIP, FlowerOpts);

const LiquidOpts = {
    isTransparent: 1, canStayOnPhaseables: 1, isReplaceable: 1, drops: [], isPhaseable: 1
};
registerBlock(ItemIds.WATER_1, LiquidOpts);
registerBlock(ItemIds.WATER_2, LiquidOpts);
registerBlock(ItemIds.WATER_3, LiquidOpts);
registerBlock(ItemIds.WATER_4, LiquidOpts);
registerBlock(ItemIds.WATER_5, LiquidOpts);
registerBlock(ItemIds.WATER_6, LiquidOpts);
registerBlock(ItemIds.WATER_7, LiquidOpts);
registerBlock(ItemIds.WATER_8, LiquidOpts);
registerBlock(ItemIds.WATER, {
    ...LiquidOpts, texture: "assets/blocks/water_8.png"
});
registerBlock(ItemIds.LAVA_1, LiquidOpts);
registerBlock(ItemIds.LAVA_2, LiquidOpts);
registerBlock(ItemIds.LAVA_3, LiquidOpts);
registerBlock(ItemIds.LAVA_4, LiquidOpts);
registerBlock(ItemIds.LAVA, {
    ...LiquidOpts, texture: "assets/blocks/lava_4.png"
});

registerItem(ItemIds.APPLE, {edible: 4});
registerItem(ItemIds.RAW_BEEF, {edible: 6});
registerItem(ItemIds.COOKED_BEEF, {edible: 8});
registerItem(ItemIds.COAL);
registerItem(ItemIds.DIAMOND);
registerItem(ItemIds.FLINT);
registerItem(ItemIds.FLINT_AND_STEEL, {maxStack: 1, durability: 64});
registerItem(ItemIds.GOLD_INGOT);
registerItem(ItemIds.IRON_INGOT);
registerItem(ItemIds.WHEAT_SEEDS);
registerItem(ItemIds.LEATHER);