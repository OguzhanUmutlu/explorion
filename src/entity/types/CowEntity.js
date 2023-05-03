// noinspection JSCheckFunctionSignatures

class CowEntity extends Mob {
    static DEF_COLLISION = new Collision(-.45, -.45, .9, .9);
    static HEADS = [
        new Collision(.48, .45, .3, .4),
        new Collision(-.78, .45, .3, .4)
    ];
    static DEF_HITBOXES = [
        CowEntity.HEADS[0], // head
        new Collision(-.47, .15, .94, .6), // body
        new Collision(-.47, -.45, .21, .6), // left leg
        new Collision(.26, -.45, .21, .6) // right leg
    ];
    behaviors = [
        new EscapeWhenDamagedBehavior(this),
        new WanderAroundBehavior(this)
    ];
    DESPAWN_AFTER = 20 * 10;
    TYPE = EntityIds.COW;
    _health = 10;
    maxHealth = 10;
    movementSpeed = 0.01;
    static DEFAULT_SKIN = "assets/entities/cow.png";

    /*** @return {Object<*, *>} */
    get DEFAULT_NBT() {
        const def = super.DEFAULT_NBT;
        def.health = 10;
        def.maxHealth = 10;
        def.movementSpeed = 0.1;
        return def;
    };

    get drops() {
        const drops = [new Item(ItemIds.RAW_BEEF, rand(1, 3))];
        const a = rand(-2, 2);
        if (a > 0) drops.push(new Item(ItemIds.LEATHER, a));
        return drops;
    };

    init() {
        super.init();
        this.collision = CowEntity.DEF_COLLISION;
        this.hitboxes.push(...CowEntity.DEF_HITBOXES);
    };

    render() {
        const skin = Texture.get(CowEntity.DEFAULT_SKIN);
        const size = 1.3;
        ctx.drawImage(
            this.direction ? skin.image : skin.flip(),
            calcRenderX(this.x + (this.direction ? -.52 : -.78)), calcRenderY(this.y + .85),
            size * BLOCK_SIZE, size * BLOCK_SIZE
        );
        super.render();
    };

    update(deltaTick) {
        super.update(deltaTick);
        this.hitboxes[0] = CowEntity.HEADS[1 - this.direction];
    };
}