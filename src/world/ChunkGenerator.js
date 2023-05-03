class ChunkGenerator {
    /**
     * @param {World} world
     * @param {number} seed
     */
    constructor(world, seed = floor(random() * 9999999999999)) {
        this.world = world;
        this.seed = seed;
        this.positiveGen = generateSeed(seed);
        this.negativeGen = generateSeed(seed);
    }

    generate(chunk, chunkX) {
        const setBlock = (x, y, id, meta = 0) => {
            x = round(x);
            y = round(y);
            if (y < this.world.MIN_HEIGHT || y > this.world.MAX_HEIGHT) return;
            if (!chunk[0][x]) chunk[0][x] = {};
            chunk[0][x][y] = World.arrayToFullId(id, meta);
        };
        const getBlock = (x, y) => {
            x = round(x);
            y = round(y);
            if (y < this.world.MIN_HEIGHT || y > this.world.MAX_HEIGHT) return [0, 0];
            if (!chunk[0][x]) chunk[0][x] = {};
            return World.fullIdToArray(chunk[0][x][y]);
        };
        const addEntity = entity => !chunk[1].includes(entity) && chunk[1].push(entity);
        const addTile = tile => !chunk[2].includes(tile) && chunk[2].push(tile);
        return {setBlock, getBlock, addTile, addEntity};
    };
}