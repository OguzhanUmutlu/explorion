class Player extends Living {
    TYPE = EntityIds.PLAYER;
    size = 1.8;
    handIndex = 0;
    inventory = new Inventory(36);
    armorInventory = new Inventory(4);
    craftingInventory = new Inventory(4);
    cursorInventory = new Inventory(1);
    outputInventory = new Inventory(1); // smelting & crafting result
    blockReach = 4;
    attackReach = 3.5;
    holdBreak = false;
    holdPlace = false;
    holdEat = false;
    container = -1;
    _boundedItems = [];
    static DEFAULT_SKIN = "assets/entities/steve.png";

    // noinspection JSCheckFunctionSignatures
    /*** @return {Object<*, *>} */
    get DEFAULT_NBT() {
        const def = super.DEFAULT_NBT;
        def.health = 20;
        def.maxHealth = 20;
        def.inventory = new Array(9).fill(null);
        def.size = 1.95;
        def.blockReach = 4;
        def.attackReach = 3.5;
        def.holdBreak = 0;
        def.holdPlace = 0;
        def.holdEat = 0;
        def.mode = 0;
        def.food = 30;
        return def;
    };

    _mode = 0;

    get mode() {
        return this._mode;
    };

    set mode(v) {
        this._mode = v;
        this.invincible = v % 2 === 1;
        this.holdBreak = v === 1;
        this.holdPlace = v === 1;
        this.holdEat = v === 1;
        this.movementSpeed = [0.2, 0.5, 0.2, 0.7][v];
        this.blockReach = v === 1 ? 10 : 4;
        this.attackReach = v === 1 ? 10 : 3.5;
        this.isFlying = v === 3;
    }

    _food = 30;

    get food() {
        return this._food;
    };

    set food(v) {
        if (this.mode % 2 === 1) return;
        this._food = v;
        if (this._food <= 0) this._food = 0;
    };

    /*** @return {Item} */
    get selectedItem() {
        if (this.mode === 3) return itemPlaceholder;
        return this.inventory.get(this.handIndex) || itemPlaceholder;
    };

    init() {
        super.init();
        this.fixCollision();
    }

    saveNBT() {
        super.saveNBT();
    };

    loadNBT() {
        super.loadNBT();
    };

    fixCollision() {
        this.collision = new Collision(-1 / 6, -1 / 2, 1 / 3, this.size);
        this.hitboxes.push(
            new Collision(-.135, -.5, .24, this.size * .74),
            new Collision(-.25, (-.5 + this.size * .74), .5, this.size * .26),
        );
    };

    kill() {
        if (this.invincible) return this.dead = false;
        super.kill();
        if (!this.world.gameRules.keepInventory) this.inventory.contents.forEach((item, i) => {
            if (!item) return;
            this.world.dropItem(this.x, this.y, new Item(item.id, item.count, item.nbt));
            delete this.inventory.contents[i];
        });
        if (this.world.gameRules.doImmediateRespawn) this.respawn();
        this._boundedItems.forEach(item => item.selectedPlayer === this && (item.selectedPlayer = null));
    };

    respawn() {
        this.maxAirY = null;
        this.fireTicks = 0;
        this.waterTicks = 0;
        this._health = this.maxHealth;
        this.food = 30;
        this.x = rand(-128, 128);
        this.world.generateChunk(this.world.getChunkIdAt(this.x));
        let maxY = this.world.getHighestAt(this.x);
        this.y = maxY + 1;
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.dead = false;
        this._x = this.x;
        this.direction = 1;
        this.checkChunk();
    };

    move(dx, dy) {
        const fx = this.x;
        const result = super.move(dx, dy);
        this.food -= abs(fx - this.x) * 0.1;
        return result;
    }

    update(deltaTick) {
        if (this.mode % 2 === 1) {
            this.waterTicks = 0;
            this.fireTicks = 0;
        }
        if (this.world.gameRules.naturalRegeneration && this.food > 20.001 && this.health < this.maxHealth) {
            this.health += 0.005;
            this.food -= 0.001;
        }
        if (this.food <= 0) this.attack(new StarvationDamage);
        super.update(deltaTick);
    };

    render() {
        const skin = Texture.get(Player.DEFAULT_SKIN);
        ctx.drawImage(
            this.direction ? skin.image : skin.flip(), calcRenderX(this.x + (this.direction ? -.25 : .25)), calcRenderY(this.y + this.size - .5),
            (this.direction ? 1 : -1) * skin.image.width / skin.image.height * this.size * BLOCK_SIZE, this.size * BLOCK_SIZE
        );
        super.render();
    };

    dropItemAt(index, amount = 1, inventory = this.inventory) {
        const selectedItem = inventory.get(index);
        if (selectedItem.id === ItemIds.AIR) return 0;
        if (selectedItem.count < amount) amount = selectedItem.count;
        const item = this.dropItem(selectedItem, amount);
        item.velocity.x = this.direction ? .4 : -.4;
        inventory.removeSlot(index, amount);
        return amount;
    };

    /**
     * @param {Item} item
     * @param {number} count
     * @returns {ItemEntity}
     */
    dropItem(item, count = item.count) {
        return this.world.dropItem(this.x, this.y + this.size - 1, new Item(item.id, item.count, item.nbt));
    };

    onDamage(damage) {
        this.playSound("assets/sounds/damage/hit" + rand(1, 3) + ".ogg");
    };

    updateOutputInventory() {
        if (this.container === ContainerIds.PLAYER_CONTAINER) {
            const crafting = findCrafting([
                [player.craftingInventory.get(0), player.craftingInventory.get(1), itemPlaceholder],
                [player.craftingInventory.get(2), player.craftingInventory.get(3), itemPlaceholder],
                [itemPlaceholder, itemPlaceholder, itemPlaceholder]
            ]) || [[], itemPlaceholder];
            player.outputInventory.set(0, crafting[1]);
        } else player.outputInventory.clear();
    };

    decreaseCrafting() {
        for (let i = 0; i < player.craftingInventory.size; i++) {
            const item = player.craftingInventory.contents[i];
            if (!item || item.id === ItemIds.AIR) continue;
            item.count--;
            if (item.count <= 0) delete player.craftingInventory.contents[i];
        }
        this.updateOutputInventory();
    };

    clear() {
        this.inventory.clear();
        this.armorInventory.clear();
        this.cursorInventory.clear();
        this.craftingInventory.clear();
        this.outputInventory.clear();
    };
}