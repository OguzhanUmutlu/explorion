class DefaultGenerator extends ChunkGenerator {
    generate(chunk, chunkX) {
        const {setBlock, getBlock, addTile, addEntity} = super.generate(chunk, chunkX);
        const worldX = chunkX * 16;
        //const pY = round((PerlinNoise.perlin(worldX + x, 0.1) + 1) * 100);
        const getPY = x => sin((worldX + x) / 10) * 10 + 60;
        //const pY = floor((sin(chunkX * 1000) + 5) / 2 * sin(PI * x / 16) / (3 * PI / 2) * 32 + 30);
        //const pY = seed(worldX + x)() * 100;
        //const pY = chunkX + 20;
        /*const rn = k => sin(k * 100);
        const back2 = rn(worldX + x - 2);
        const back1 = rn(worldX + x - 1);
        const cur = back2 < back1 ? back2 + (back2 - back1) : back1;
        const pY = cur * 50 + 10;
        */
        /*const X = (worldX + x) / 10;
        const pY = sin(2 * X) + X / 10 * cos(X * (X / 2)) * 50 + 20;
        */

        for (let x = 0; x < 16; x++) {
            const pY = getPY(x);
            const hasTree = x >= 2 && x <= 13 && x % 3 === 0 && round(pY) > 54;
            setBlock(x, pY, round(pY) <= 54 ? [ItemIds.SAND, ItemIds.GRAVEL][rand(0, 1)] : (hasTree ? ItemIds.DIRT : ItemIds.GRASS_BLOCK));
            if (hasTree) {
                const treeSize = rand(3, 5);
                const treeType = rand(0, 5);
                for (let y = 0; y < treeSize; y++) setBlock(x, pY + y + 1, ItemIds.NATURAL_LOG, treeType);
                [
                    [0, 0], [0, 1], [0, 2],
                    [1, -1], [1, 0], [1, 1], [1, 2],
                    [-1, -1], [-1, 0], [-1, 1], [-1, 2],
                    [2, 0], [2, -1], [-2, 0], [-2, -1]
                ].forEach(pos => setBlock(pos[0] + x, pos[1] + pY + treeSize + 1, ItemIds.NATURAL_LEAVES, treeType));
            }
            for (let y = 1; y < max(round(pY), 55); y++) {
                if (getBlock(x, y)[0] !== ItemIds.AIR) continue;
                if (y < pY) {
                    let oreA = 0;
                    const types = [0];
                    if (y <= 32) types.push(1);
                    if (y <= 11) types.push(2);
                    const oreType = types[rand(0, types.length - 1)]; // TODO: DO NOT USE THE RAND FUNCTION
                    const oreId = [ItemIds.COAL_ORE, ItemIds.IRON_ORE, ItemIds.DIAMOND_ORE][oreType];
                    const ore = (x, y) => {
                        if (getBlock(x, y)[0] !== ItemIds.AIR || x > 15 || x < 0 || getPY(x) - y <= 3 || y <= 0) return false;
                        setBlock(x, y, oreId);
                        [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(p => {
                            if (!oreA || random() >= oreA / 5) ore(x + p[0], y + p[1], oreA++);
                        });
                        return true;
                    };
                    if (random() >= 0.02 || !ore(x, y)) setBlock(x, y, pY - y <= 3 ? (round(pY) <= 54 ? [ItemIds.SAND, ItemIds.GRAVEL][rand(0, 1)] : ItemIds.DIRT) : ItemIds.STONE);
                } else {
                    setBlock(x, y, ItemIds.WATER);
                }
            }
            setBlock(x, 0, ItemIds.BEDROCK);
        }
        return {setBlock, getBlock, addTile, addEntity};
    };
}