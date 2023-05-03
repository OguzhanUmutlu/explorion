class Item {
    /**
     * @param {number} id
     * @param {number} count
     * @param {Object} nbt
     */
    constructor(id, count = 1, nbt = {}) {
        this._id = id;
        if (isNaN(count) || count < 0 || floor(count) !== count) throw new Error("Expected a positive integer for the count of the item. Found: " + JSON.stringify(count));
        this.count = count;
        this.nbt = nbt;
        if (!this.nbt.damage) this.nbt.damage = 0;
    };

    get maxDurability() {
        return metadata.durabilities[this.id] || -1;
    };

    get maxCount() {
        return metadata.maxStack[this.id] || 64;
    };

    get id() {
        return this._id;
    };

    get isBlock() {
        return metadata.block.includes(this.id);
    };

    get isEdible() {
        return !!metadata.edible[this.id];
    };

    get feedAmount() {
        return metadata.edible[this.id];
    };

    get name() {
        const n = metadata.itemName[this.id] || metadata.itemName.other(this.id);
        if (typeof n === "string") return n;
        return n[this.nbt.damage];
    };

    /*** @returns {Texture} */
    get texture() {
        if (this.isBlock) return Block.getTexture(this.id, this.nbt.damage);
        return Texture.get(idTextures[this.id]);
    };

    get isArmor() {
        return metadata.armors.includes(this.id);
    };

    /*** @param {Entity} entity */
    use(entity) {
        if (this.isEdible && entity instanceof Player) {
            if (entity.food >= 20) return;
            entity.food += this.feedAmount;
            return true;
        }
        return false;
    };

    /**
     * @param {Item | {id: number, count: number, nbt: Object}} item
     * @param {boolean} count
     * @param {boolean} nbt
     * @return {boolean}
     */
    equals(item, count = false, nbt = false) {
        if (item.id !== this.id) return false;
        if (count && item.count !== this.count) return false;
        return !(nbt && JSON.stringify(item.nbt) !== JSON.stringify(this.nbt));

    };

    clone() {
        return new Item(this.id, this.count, this.nbt);
    };

    toJSON() {
        return {
            id: this.id,
            count: this.count,
            //nbt: JSON.parse(JSON.stringify(this.nbt))
            nbt: {...this.nbt}
        };
    };
}

const itemPlaceholder = new Item(0, 0);
const itemPlaceholderJSON = new Item(0, 0).toJSON();
