class Position extends Vector {
    /**
     * @param {number} x
     * @param {number} y
     * @param {World} world
     */
    constructor(x, y, world) {
        super(x, y);
        this.world = world;
    };
}