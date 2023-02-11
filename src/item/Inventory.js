class Inventory {
    /*** @type {({id: number, count: number, nbt: Object} | null)[]} */
    contents = [];

    constructor(size) {
        this.size = size;
        this.contents = new Array(size).fill(null);
    };

    get firstEmptySlot() {
        for (let i = 0; i < this.size; i++) if (!this.contents[i]) return i;
        return -1;
    };

    /**
     * @param {Item | number} item
     * @param {number} count
     */
    add(item, count = (item instanceof Item ? item.count : 1)) {
        if (typeof item === "number") item = new Item(item, count);
        if (item.id === ItemIds.AIR || !item.count) return;
        for (let i = 0; i < this.size; i++) {
            const c = this.contents[i];
            if (c && item.equals(c, false, true)) {
                c.count += count;
                count = 0;
                if (c.count > item.maxCount) {
                    count += c.count - item.maxCount;
                    c.count = item.maxCount;
                }
            } else if (!c) {
                const it = this.contents[i] = {id: item.id, count, nbt: {}};
                count = 0;
                if (it.count > item.maxCount) {
                    count += it.count - item.maxCount;
                    it.count = item.maxCount;
                }
            }
            if (count === 0) break;
        }
    };

    canAdd(item) {
        if (item.id === ItemIds.AIR || !item.count) return true;
        let count = item.count;
        for (let i = 0; i < this.size; i++) {
            const c = this.contents[i];
            if (c && item.equals(c, false, true)) {
                count = c.count + count > item.maxCount ? c.count + count - item.maxCount : 0;
            } else if (!c) {
                count = count > item.maxCount ? count - item.maxCount : 0;
            }
            if (count <= 0) break;
        }
        return count <= 0;
    };

    /**
     * @param {Item} item
     * @param {number} count
     */
    remove(item, count = item.count) {
        while (count > 0) {
            const index = this.contents.findIndex(i => i && item.equals(i, false, true));
            if (index === -1) break;
            const it = this.contents[index];
            if (it.count <= count) {
                count -= it.count;
                delete this.contents[index];
            } else {
                it.count -= count;
                count = 0;
            }
        }
    };

    damageItem(index, amount = 1) {
        const it = this.contents[index];
        if (!it || !metadata.durabilities[it.id]) return;
        it.nbt.damage += amount;
        if (it.nbt.damage >= metadata.durabilities[it.id]) delete this.contents[index];
        return amount - (it.nbt.damage - metadata.durabilities[it.id]);
    };

    /**
     * @param index
     * @return {Item}
     */
    get(index) {
        const i = this.contents[index];
        if (!i) return itemPlaceholder;
        return new Item(i.id, i.count, i.nbt);
    };

    removeSlot(index, amount = 1) {
        const it = this.contents[index];
        it.count -= amount;
        if (it.count <= 0) delete this.contents[index];
    };

    clear() {
        this.contents.fill(null);
    };
}