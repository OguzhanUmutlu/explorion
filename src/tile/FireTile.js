class FireTile extends Tile {
    static BLOCK_ID = ItemIds.FIRE;
    TYPE = TileIds.FIRE;
    age = 0;
    ageRepeats = 20;

    loadNBT() {
        super.loadNBT();
        this.age = this.nbt.age || 0;
    };

    saveNBT() {
        super.saveNBT();
        this.nbt.age = this.age;
    };

    updateRandomly() {
        if ((this.ageRepeats--) < 0) {
            this.ageRepeats = 20;
            this.age++;
        }
        if (this.age >= 7 && random() < 0.25) {
            this.world.setAndUpdateBlock(this.x, this.y, ItemIds.AIR);
        }
    };
}