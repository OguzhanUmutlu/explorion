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

    playSound(sound, volume = 1) {
        if (typeof sound === "string") sound = Sound.get(sound);
        this.world.playSound(sound, this.x, this.y, volume);
    };
}