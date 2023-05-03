/*** @type {[Item[], Item][]} */
const craftings = [];
const trimCraftingMap = map => {
    const O = ItemIds.AIR;
    for (let i = 0; i < 2; i++) {
        if (map[0][0].id === O && map[1][0].id === O && map[2][0].id === O) {
            // move second column to first
            map[0][0] = map[0][1];
            map[1][0] = map[1][1];
            map[2][0] = map[2][1];
            // move third column to second
            map[0][1] = map[0][2];
            map[1][1] = map[1][2];
            map[2][1] = map[2][2];
            // clear the third column
            map[0][2] = itemPlaceholder;
            map[1][2] = itemPlaceholder;
            map[2][2] = itemPlaceholder;
        } else break;
    }
    for (let i = 0; i < 2; i++) {
        if (map[0][0].id === O && map[0][1].id === O && map[0][2].id === O) {
            // move second row to first
            map[0][0] = map[1][0];
            map[0][1] = map[1][1];
            map[0][2] = map[1][2];
            // move third row to second
            map[1][0] = map[2][0];
            map[1][1] = map[2][1];
            map[1][2] = map[2][2];
            // clear the third row
            map[2][0] = itemPlaceholder;
            map[2][1] = itemPlaceholder;
            map[2][2] = itemPlaceholder;
        } else break;
    }
    return map;
};
const addCrafting = (map, letters, result) => {
    trimCraftingMap(map);
    if (typeof result === "number") result = new Item(result);
    Object.keys(letters).forEach(i => {
        if (typeof letters[i] === "number") letters[i] = new Item(letters[i]);
        else letters[i] = letters[i];
    });
    letters[" "] = itemPlaceholder;
    const newMap = [];
    map.forEach(k => newMap.push(k.split("").map(i => letters[i])));
    craftings.push([newMap.flat(1), result]);
};
const findCrafting = map => {
    trimCraftingMap(map);
    map = map.flat(1);
    return craftings.find(i => i[0].every((k, j) => map[j].equals(k || itemPlaceholder, false, true)));
};

for (let meta = 0; meta <= 5; meta++) addCrafting([
    "A  ",
    "   ",
    "   "
], {
    A: new Item(ItemIds.LOG, 1, {damage: meta})
}, new Item(ItemIds.PLANKS, 4, {damage: meta}));