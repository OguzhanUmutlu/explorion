class Tile extends CollideablePosition {
    static BLOCK_ID = -1;
    TYPE = TileIds.NOTHING;
    closed = false;

    constructor(x, y, world, nbt = {}) {
        super(x, y, world);
        nbt.position = [x, y, world.name];
        this.nbt = nbt;
    };

    /*** @return {Object<*, *>} */
    get DEFAULT_NBT() {
        return {
            type: this.TYPE,
            position: [0, 0, ""]
        };
    };

    get blockId() {
        return this.constructor.BLOCK_ID;
    };

    init() {
        this.loadNBT();
        this.checkBlock();
    };

    checkBlock() {
        if (this.world.getBlockId(this.x, this.y) !== this.blockId) return this.close();
        const chunk = this.world.getChunkAt(this.x);
        if (!chunk) return this.close();
        let cX = chunk[2][this.x];
        if (!cX) cX = chunk[2][this.x] = {};
        if (cX[this.y] && cX[this.y] !== this) cX[this.y].close();
        cX[this.y] = this;
    };

    saveNBT() {
        this.nbt = this.TYPE;
        this.nbt.position = [this.x, this.y, this.world.name];
    };

    loadNBT() {
        Object.keys(this.DEFAULT_NBT).forEach(k => !Object.keys(this.nbt).includes(k) && (this.nbt[k] = this.DEFAULT_NBT[k]));
        if (this.TYPE !== this.nbt.type) throw new Error("Unexpected tile type '" + this.nbt.type + "'. Expected: " + this.TYPE);
        this.x = this.nbt.position[0];
        this.y = this.nbt.position[1];
        this.world = worlds[this.nbt.position[2]];
    };

    updateRandomly() {
    };

    close() {
        this.closed = true;
        const chunk = this.world.getChunkAt(this.x);
        if (!chunk) return;
        if (!chunk[2][this.x]) return;
        delete chunk[2][this.y];
    };
}