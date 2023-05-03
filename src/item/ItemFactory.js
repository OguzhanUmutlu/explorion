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
    WATER: 16,
    LAVA: 17,
    FIRE: 18,
    LOG: 19,
    LEAVES: 20,
    GRASS: 21,
    GRASS_DOUBLE: 22,
    ALLIUM: 23,
    BLUE_ORCHID: 24,
    DANDELION: 25,
    HOUSTONIA: 26,
    ORANGE_TULIP: 27,
    OXEYE_DAISY: 28,
    PAEONIA: 29,
    PINK_TULIP: 30,
    RED_TULIP: 31,
    ROSE: 32,
    WHITE_TULIP: 33,
    NATURAL_LOG: 34,
    NATURAL_LEAVES: 35,
    SPONGE: 36,
    WET_SPONGE: 37,
    PLANKS: 38,

    APPLE: 200,
    COAL: 201,
    COOKED_BEEF: 203,
    DIAMOND: 204,
    FLINT: 205,
    FLINT_AND_STEEL: 206,
    GOLD_INGOT: 207,
    IRON_INGOT: 208,
    RAW_BEEF: 209,
    WHEAT_SEEDS: 210,
    LEATHER: 211
};

const metadata = {
    block: [],
    item: [],
    phaseable: [],
    replaceable: [],
    hardness: {},
    canPlaceBlockOnIt: [],
    isExplodeable: [],
    noDropBlocks: [],
    blockDrops: {},
    edible: {[ItemIds.APPLE]: 4},
    itemName: {
        other: id => (Object.keys(ItemIds).find(i => ItemIds[i] === id) || "UNKNOWN").split("_").map(i => i[0].toUpperCase() + i.substring(1).toLowerCase()).join(" ")
    },
    entityName: {
        other: id => (Object.keys(EntityIds).find(i => EntityIds[i] === id) || "UNKNOWN").split("_").map(i => i[0].toUpperCase() + i.substring(1).toLowerCase()).join(" ")
    },
    durabilities: {},
    maxStack: {},
    canFall: [],
    canBePlacedOn: {},
    cannotBePlacedOn: {},
    transparent: [],
    canStayOnPhaseables: [],
    step: {},
    dig: {},
    toolLevel: {},
    toolType: {},
    armors: []
};
const idTextures = {};
const TOOL_TYPES = {
    SWORD: 0,
    AXE: 1,
    PICKAXE: 2,
    SHOVEL: 3,
    HOE: 4,
    SHEARS: 5
};
const TOOL_LEVEL = {
    NONE: 0,
    WOODEN: 1,
    STONE: 2,
    IRON: 3,
    GOLDEN: 4,
    DIAMOND: 5,
    NETHERITE: 6
};
const STEPS = {
    CLOTH: "cloth",
    CORAL: "coral",
    GRASS: "grass",
    GRAVEL: "gravel",
    LADDER: "ladder",
    SAND: "sand",
    SCAFFOLD: "scaffold",
    SNOW: "snow",
    STONE: "stone",
    WET_GRASS: "wet_grass",
    WOOD: "wood"
};
const DIGS = {
    CLOTH: "cloth",
    CORAL: "coral",
    GLASS: "glass",
    GRASS: "grass",
    GRAVEL: "gravel",
    SAND: "sand",
    SNOW: "snow",
    STONE: "stone",
    WET_GRASS: "wet_grass",
    WOOD: "wood"
};

/**
 * @param {number} id
 * @param {string | 0} texture
 * @param {string | Object | 0} name
 * @param {number | 0} edible
 * @param {number | 0} durability
 * @param {number | 0} maxStack
 * @param {0 | 1} isArmor
 */
const registerItem = (id, {
    texture = 0, name = 0, edible = 0, durability = 0, maxStack = 0,
    isArmor = 0
} = {}) => {
    idTextures[id] = texture || "assets/items/" + Object.keys(ItemIds).find(k => ItemIds[k] === id).toLowerCase() + ".png";
    metadata.item.push(id);
    if (edible) metadata.edible[id] = edible;
    if (name) metadata.itemName[id] = name;
    if (durability) metadata.durabilities[id] = durability;
    if (maxStack) metadata.maxStack[id] = maxStack;
    if (isArmor) metadata.armors.push(id);
    debug("%cRegistered item with the ID " + id, "color: #00ff00");
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
 * @param {0 | 1} canPlaceBlockOnIt
 * @param {number} hardness
 * @param {number} toolLevel
 * @param {number} toolType
 * @param {0 | 1} isExplodeable
 * @param {string} step
 * @param {string} dig
 * @param {(number | [number, number])[] | Object | 0} drops
 */
const registerBlock = (id, {
    texture = 0, name = 0, isTransparent = 0, canBePlacedOn = 0, cannotBePlacedOn = [],
    canStayOnPhaseables = 0, canFall = 0, isReplaceable = 0, isPhaseable = 0,
    canPlaceBlockOnIt = 0, isExplodeable = 0, drops = 0, hardness = -1, toolLevel = -1,
    toolType = -1, step = STEPS.STONE, dig = DIGS.STONE
} = blockOpts) => {
    idTextures[id] = texture || "assets/blocks/" + Object.keys(ItemIds).find(k => ItemIds[k] === id).toLowerCase() + ".png";
    metadata.block.push(id);
    metadata.hardness[id] = hardness;
    metadata.step[id] = step;
    metadata.dig[id] = dig;
    metadata.toolLevel[id] = toolLevel;
    metadata.toolType[id] = toolType;
    if (name) metadata.itemName[id] = name;
    if (isTransparent) metadata.transparent.push(id);
    if (canBePlacedOn && canBePlacedOn.length) metadata.canBePlacedOn[id] = canBePlacedOn;
    if (canStayOnPhaseables) metadata.canStayOnPhaseables.push(id);
    if (cannotBePlacedOn) metadata.cannotBePlacedOn[id] = cannotBePlacedOn;
    if (canFall) metadata.canFall.push(id);
    if (isReplaceable) metadata.replaceable.push(id);
    if (isPhaseable) metadata.phaseable.push(id);
    if (canPlaceBlockOnIt) metadata.canPlaceBlockOnIt.push(id);
    if (isExplodeable) metadata.isExplodeable.push(id);
    if (drops) metadata.blockDrops[id] = drops;
    debug("%cRegistered block with the ID " + id, "color: #00ff00");
};

const blockOpts = {
    hardness: 0, canPlaceBlockOnIt: 1, isExplodeable: 1, canStayOnPhaseables: 1
};

registerBlock(ItemIds.AIR, {
    isTransparent: 1, isReplaceable: 1, isPhaseable: 1, drops: [], canStayOnPhaseables: 1
});
registerBlock(ItemIds.BEDROCK, {
    drops: [], canStayOnPhaseables: 1, canPlaceBlockOnIt: 1
});
registerBlock(ItemIds.COAL_ORE, {
    ...blockOpts, drops: [ItemIds.COAL], hardness: 15, step: STEPS.STONE, dig: DIGS.STONE
});
registerBlock(ItemIds.COBBLESTONE, {
    ...blockOpts, hardness: 10, step: STEPS.STONE, dig: DIGS.STONE
});
registerBlock(ItemIds.DIAMOND_ORE, {
    ...blockOpts, drops: [ItemIds.DIAMOND], hardness: 15, step: STEPS.STONE, dig: DIGS.STONE
});
registerBlock(ItemIds.DIRT, {
    ...blockOpts, hardness: 0.75, step: STEPS.GRASS, dig: DIGS.GRASS
});
registerBlock(ItemIds.GOLD_ORE, {
    ...blockOpts, hardness: 15, step: STEPS.STONE, dig: DIGS.STONE
});
registerBlock(ItemIds.GRASS_BLOCK, {
    ...blockOpts, drops: [ItemIds.DIRT], hardness: 0.9, step: STEPS.GRASS, dig: DIGS.GRASS
});
registerBlock(ItemIds.SNOWY_GRASS_BLOCK, {
    ...blockOpts, drops: [ItemIds.DIRT], hardness: 0.9, step: STEPS.GRASS, dig: DIGS.GRASS
});
registerBlock(ItemIds.ICE, {
    ...blockOpts, isTransparent: 1, drops: [], hardness: 0.75, step: STEPS.STONE, dig: DIGS.GLASS // TODO: where is glass?
});
registerBlock(ItemIds.PACKED_ICE, {
    ...blockOpts, isTransparent: 1, hardness: 0.75, step: STEPS.STONE, dig: DIGS.GLASS
});
registerBlock(ItemIds.IRON_ORE, {
    ...blockOpts, hardness: 15, step: STEPS.STONE, dig: DIGS.STONE
});
registerBlock(ItemIds.SAND, {
    ...blockOpts, canFall: 1, hardness: 0.75, step: STEPS.SAND, dig: DIGS.SAND
});
registerBlock(ItemIds.GRAVEL, {
    ...blockOpts, canFall: 1, hardness: 0.9, step: STEPS.GRAVEL, dig: DIGS.GRAVEL
});
registerBlock(ItemIds.STONE, {
    ...blockOpts, drops: [ItemIds.COBBLESTONE], hardness: 7.5, step: STEPS.STONE, dig: DIGS.STONE
});
registerBlock(ItemIds.TNT, {
    ...blockOpts, step: STEPS.GRASS, dig: DIGS.GRASS, name: "TNT"
});
registerBlock(ItemIds.FIRE, {
    ...blockOpts, isTransparent: 1, canStayOnPhaseables: 0, drops: [], isPhaseable: true
});

registerBlock(ItemIds.LOG, {
    ...blockOpts, hardness: 3, step: STEPS.WOOD, dig: DIGS.WOOD,
    texture: {
        0: "assets/blocks/log_oak.png",
        1: "assets/blocks/log_big_oak.png",
        2: "assets/blocks/log_birch.png",
        3: "assets/blocks/log_jungle.png",
        4: "assets/blocks/log_spruce.png",
        5: "assets/blocks/log_acacia.png"
    },
    name: {
        0: "Oak Log",
        1: "Dark Oak Log",
        2: "Birch Log",
        3: "Jungle Log",
        4: "Spruce Log",
        5: "Acacia Log"
    }
});
registerBlock(ItemIds.PLANKS, {
    ...blockOpts, hardness: 3, step: STEPS.WOOD, dig: DIGS.WOOD,
    texture: {
        0: "assets/blocks/planks_oak.png",
        1: "assets/blocks/planks_big_oak.png",
        2: "assets/blocks/planks_birch.png",
        3: "assets/blocks/planks_jungle.png",
        4: "assets/blocks/planks_spruce.png",
        5: "assets/blocks/planks_acacia.png"
    },
    name: {
        0: "Oak Planks",
        1: "Dark Oak Planks",
        2: "Birch Planks",
        3: "Jungle Planks",
        4: "Spruce Planks",
        5: "Acacia Planks"
    }
});
registerBlock(ItemIds.LEAVES, {
    ...blockOpts, isTransparent: 1, hardness: 0.3, step: STEPS.GRASS, dig: DIGS.GRASS,
    texture: {
        0: "assets/blocks/leaves_oak.png",
        1: "assets/blocks/leaves_oak.png",
        2: "assets/blocks/leaves_oak.png",
        3: "assets/blocks/leaves_oak.png",
        4: "assets/blocks/leaves_oak.png",
        5: "assets/blocks/leaves_oak.png"
    },
    name: {
        0: "Oak Leaves",
        1: "Dark Oak Leaves",
        2: "Birch Leaves",
        3: "Jungle Leaves",
        4: "Spruce Leaves",
        5: "Acacia Leaves"
    }
});
registerBlock(ItemIds.NATURAL_LOG, {
    ...blockOpts,
    hardness: 2,
    step: STEPS.WOOD,
    dig: DIGS.WOOD,
    drops: {
        0: [ItemIds.LOG],
        1: [[ItemIds.LOG, 1, {damage: 1}]],
        2: [[ItemIds.LOG, 1, {damage: 2}]],
        3: [[ItemIds.LOG, 1, {damage: 3}]],
        4: [[ItemIds.LOG, 1, {damage: 4}]],
        5: [[ItemIds.LOG, 1, {damage: 5}]]
    },
    isPhaseable: true,
    texture: {
        0: "assets/blocks/log_oak.png",
        1: "assets/blocks/log_big_oak.png",
        2: "assets/blocks/log_birch.png",
        3: "assets/blocks/log_jungle.png",
        4: "assets/blocks/log_spruce.png",
        5: "assets/blocks/log_acacia.png"
    },
    name: {
        0: "Oak Planks",
        1: "Dark Oak Planks",
        2: "Birch Planks",
        3: "Jungle Planks",
        4: "Spruce Planks",
        5: "Acacia Log"
    }
});
registerBlock(ItemIds.NATURAL_LEAVES, {
    ...blockOpts,
    isTransparent: 1,
    hardness: 0.3,
    step: STEPS.GRASS,
    dig: DIGS.GRASS,
    isPhaseable: true,
    texture: {
        0: "assets/blocks/leaves_oak.png",
        1: "assets/blocks/leaves_oak.png",
        2: "assets/blocks/leaves_oak.png",
        3: "assets/blocks/leaves_oak.png",
        4: "assets/blocks/leaves_oak.png",
        5: "assets/blocks/leaves_oak.png"
    },
    name: {
        0: "Oak Leaves",
        1: "Dark Oak Leaves",
        2: "Birch Leaves",
        3: "Jungle Leaves",
        4: "Spruce Leaves",
        5: "Acacia Leaves"
    }
});
registerBlock(ItemIds.SPONGE, {
    ...blockOpts, hardness: 0.9, step: STEPS.GRASS, dig: DIGS.GRASS
});
registerBlock(ItemIds.WET_SPONGE, {
    ...blockOpts, hardness: 0.9, step: STEPS.GRASS, dig: DIGS.GRASS
});

const FlowerOpts = {
    isTransparent: 1, canBePlacedOn: [ItemIds.GRASS_BLOCK, ItemIds.SNOWY_GRASS_BLOCK, ItemIds.DIRT],
    isPhaseable: 1, hardness: 0, isExplodeable: 1, canStayOnPhaseables: 0, dig: DIGS.GRASS
};
registerBlock(ItemIds.GRASS, {
    ...FlowerOpts, drops: [ItemIds.WHEAT_SEEDS]
});
registerBlock(ItemIds.GRASS_DOUBLE, {
    ...FlowerOpts, drops: [ItemIds.WHEAT_SEEDS]
});
const FlowerIds = [
    ItemIds.ALLIUM, ItemIds.BLUE_ORCHID, ItemIds.DANDELION, ItemIds.HOUSTONIA, ItemIds.ORANGE_TULIP, ItemIds.OXEYE_DAISY,
    ItemIds.PAEONIA, ItemIds.PINK_TULIP, ItemIds.RED_TULIP, ItemIds.ROSE, ItemIds.WHITE_TULIP
];
FlowerIds.forEach(f => registerBlock(f, FlowerOpts));

const LiquidOpts = {
    isTransparent: 1, canStayOnPhaseables: 1, isReplaceable: 1, drops: [], isPhaseable: 1
};
registerBlock(ItemIds.WATER, {
    ...LiquidOpts,
    texture: {
        0: "assets/blocks/water_8.png",
        1: "assets/blocks/water_7.png",
        2: "assets/blocks/water_6.png",
        3: "assets/blocks/water_5.png",
        4: "assets/blocks/water_4.png",
        5: "assets/blocks/water_3.png",
        6: "assets/blocks/water_2.png",
        7: "assets/blocks/water_1.png",
        8: "assets/blocks/water_8.png",
    }
});
registerBlock(ItemIds.LAVA, {
    ...LiquidOpts,
    texture: {
        0: "assets/blocks/lava_4.png",
        1: "assets/blocks/lava_3.png",
        2: "assets/blocks/lava_2.png",
        3: "assets/blocks/lava_1.png",
        4: "assets/blocks/lava_4.png"
    }
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