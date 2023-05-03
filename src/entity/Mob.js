class Mob extends Living {
    moving = false;
    movingWay = null;
    /*** @type {Behavior[]} */
    behaviors = [];
    isSwimmingUp = true;
    randomSoundCooldown = 0;

    init() {
        super.init();
        this.behaviors.forEach(b => b.init());
    };

    get fileName() {
        return this.name.toLowerCase().replaceAll(" ", "_");
    };

    getSound(type) {
        const list = TextureList.filter(i => i.startsWith("sounds/mob/" + this.fileName + "/" + type));
        return Sound.get("assets/" + list[rand(0, list.length - 1)]);
    };

    get stepSound() {
        return this.getSound("step");
    };

    get randomSound() {
        return this.getSound("say");
    };

    get hurtSound() {
        return this.getSound("hurt");
    };

    /**
     * @param {Damage} damage
     * @returns {boolean}
     */
    attack(damage) {
        if (!super.attack(damage)) return false;
        this.behaviors.forEach(b => b.attack(damage));
        this.playSound(this.hurtSound, 0.5);
        return true;
    };

    update(deltaTick) {
        super.update(deltaTick);
        this.behaviors.forEach(b => b.update(deltaTick));
        if ((this.randomSoundCooldown -= deltaTick) <= 0) {
            this.randomSoundCooldown = rand(20 * 30, 20 * 300);
            this.playSound(this.randomSound, 0.5);
        }
        if (this.moving) {
            const dx = this.movingWay * this.movementSpeed * (this.onGround ? 1 : 1 / 2) * deltaTick;
            if (
                !this.world.getBlock(this.x + .5 * this.movingWay, this.y - 1).isPhaseable ||
                !this.world.getBlock(this.x + .5 * this.movingWay, this.y - 2).isPhaseable
            ) this.move(dx, 0);
            if (
                this.onGround &&
                !this.world.getBlock(this.x + .5 * this.movingWay, this.y).isPhaseable &&
                this.world.getBlock(this.x + .5 * this.movingWay, this.y + 1).isPhaseable
            ) this.jump();
        }
    };

    startMoving(way, behavior = null) {
        this.moving = true;
        this.movingWay = way;
        this.behaviors.forEach(i => i !== behavior && i.onStopMoving());
    };
}