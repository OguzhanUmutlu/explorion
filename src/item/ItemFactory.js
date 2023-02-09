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
    WATER: 23,
    LAVA_1: 24,
    LAVA_2: 25,
    LAVA_3: 26,
    LAVA: 27,
    FIRE: 28,
    OAK_WOOD: 29,
    OAK_LEAVES: 30,
    GRASS: 31,
    GRASS_DOUBLE: 32,

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
    unbreakable: [],
    notPlaceableOn: [],
    notExplodeable: [],
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
    canFloat: []
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
const registerItem = (
    id, texture = 0, name = 0, edible = 0, durability = 0,
    maxStack = 0
) => {
    idTextures[id] = texture || "assets/items/" + Object.keys(ItemIds).find(k => ItemIds[k] === id).toLowerCase() + ".png";
    metadata.item.push(id);
    if (edible) metadata.edible[id] = edible;
    if (name) metadata.itemName[id] = name;
    if (durability) metadata.durabilities[id] = durability;
    if (maxStack) metadata.maxStack[id] = maxStack;
};
/**
 * @param {number} id
 * @param {string | 0} texture
 * @param {string | 0} name
 * @param canFloat
 * @param canFall
 * @param isReplaceable
 * @param isPhaseable
 * @param isBreakable
 * @param isPlaceableOn
 * @param isExplodeable
 * @param {(number | [number, number])[] | 0} drops
 */
const registerBlock = (
    id, texture = 0, name = 0, canFloat = 1, canFall = 0,
    isReplaceable = 0, isPhaseable = 0, isBreakable = 1, isPlaceableOn = 1,
    isExplodeable = 1, drops = 0
) => {
    idTextures[id] = texture || "assets/blocks/" + Object.keys(ItemIds).find(k => ItemIds[k] === id).toLowerCase() + ".png";
    metadata.block.push(id);
    if (name) metadata.itemName[id] = name;
    if (canFloat) metadata.canFloat.push(id);
    if (canFall) metadata.canFall.push(id);
    if (isReplaceable) metadata.replaceable.push(id);
    if (isPhaseable) metadata.phaseable.push(id);
    if (!isBreakable) metadata.unbreakable.push(id);
    if (!isPlaceableOn) metadata.notPlaceableOn.push(id);
    if (!isExplodeable) metadata.notExplodeable.push(id);
    if (drops) metadata.blockDrops[id] = drops;
};
//
registerBlock(ItemIds.AIR, 0, 0, 1, 0, 1, 1, 0, 0, 0, []);
registerBlock(ItemIds.BEDROCK, 0, 0, 1, 0, 0, 0, 0, 1, 0, []);
registerBlock(ItemIds.COAL_ORE, 0, 0, 1, 0, 0, 0, 1, 1, 1, [ItemIds.COAL]);
registerBlock(ItemIds.COBBLESTONE);
registerBlock(ItemIds.DIAMOND_ORE, 0, 0, 1, 0, 0, 0, 1, 1, 1, [ItemIds.DIAMOND]);
registerBlock(ItemIds.DIRT);
registerBlock(ItemIds.GOLD_ORE);
registerBlock(ItemIds.GRASS_BLOCK, 0, 0, 1, 0, 0, 0, 1, 1, 1, [ItemIds.DIRT]);
registerBlock(ItemIds.SNOWY_GRASS_BLOCK, 0, 0, 1, 0, 0, 0, 1, 1, 1, [ItemIds.DIRT]);
registerBlock(ItemIds.ICE, 0, 0, 1, 0, 0, 0, 1, 1, 1, []);
registerBlock(ItemIds.PACKED_ICE);
registerBlock(ItemIds.IRON_ORE);
registerBlock(ItemIds.SAND, 0, 0, 1, 0, 1);
registerBlock(ItemIds.GRAVEL, 0, 0, 1, 0, 1);
registerBlock(ItemIds.STONE, 0, 0, 1, 0, 0, 0, 1, 1, 1, [ItemIds.COBBLESTONE]);
registerBlock(ItemIds.TNT);
registerBlock(ItemIds.FIRE, 0, 0, 1, 0, 1, 1, 1, 0, 1, []);
registerBlock(ItemIds.OAK_WOOD);
registerBlock(ItemIds.OAK_LEAVES, 0, 0, 1, 0, 0, 0, 1, 1, 1);
registerBlock(ItemIds.GRASS, 0, 0, 0, 0, 1, 1, 1, 1, 1, [ItemIds.WHEAT_SEEDS]);
registerBlock(ItemIds.GRASS_DOUBLE, 0, 0, 0, 0, 1, 1, 1, 1, 1, [ItemIds.WHEAT_SEEDS]);

const LiquidOpts = [0, 1, 0, 1, 1, 0, 0, 0];
registerBlock(ItemIds.WATER_1, 0, ...LiquidOpts);
registerBlock(ItemIds.WATER_2, 0, ...LiquidOpts);
registerBlock(ItemIds.WATER_3, 0, ...LiquidOpts);
registerBlock(ItemIds.WATER_4, 0, ...LiquidOpts);
registerBlock(ItemIds.WATER_5, 0, ...LiquidOpts);
registerBlock(ItemIds.WATER_6, 0, ...LiquidOpts);
registerBlock(ItemIds.WATER_7, 0, ...LiquidOpts);
registerBlock(ItemIds.WATER, "assets/blocks/water_8.png", ...LiquidOpts);
registerBlock(ItemIds.LAVA_1, 0, ...LiquidOpts);
registerBlock(ItemIds.LAVA_2, 0, ...LiquidOpts);
registerBlock(ItemIds.LAVA_3, 0, ...LiquidOpts);
registerBlock(ItemIds.LAVA, "assets/blocks/lava_8.png", ...LiquidOpts);

registerItem(ItemIds.APPLE, 0, 0, 4);
registerItem(ItemIds.COAL);
registerItem(ItemIds.COOKED_BEEF, 0, 0, 8);
registerItem(ItemIds.DIAMOND);
registerItem(ItemIds.FLINT);
registerItem(ItemIds.FLINT_AND_STEEL, 0, 0, 0, 64, 1);
registerItem(ItemIds.GOLD_INGOT);
registerItem(ItemIds.IRON_INGOT);
registerItem(ItemIds.RAW_BEEF, 0, 0, 6);
registerItem(ItemIds.WHEAT_SEEDS);
registerItem(ItemIds.LEATHER);