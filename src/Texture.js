const preloadTextures = [
    "blocks/air.png",
    "blocks/bedrock.png",
    "blocks/coal_ore.png",
    "blocks/cobblestone.png",
    "blocks/diamond_ore.png",
    "blocks/dirt.png",
    "blocks/fire.png",
    "blocks/fire_layer.png", // TODO: fire animation, block animation implementation
    "blocks/gold_ore.png",
    "blocks/grass.png",
    "blocks/grass_block.png",
    "blocks/grass_double.png",
    "blocks/gravel.png",
    "blocks/ice.png",
    "blocks/iron_ore.png",
    "blocks/oak_leaves.png",
    "blocks/oak_wood.png",
    "blocks/packed_ice.png",
    "blocks/sand.png",
    "blocks/snowy_grass_block.png",
    "blocks/stone.png",
    "blocks/tnt.png",
    "blocks/water_1.png",
    "blocks/water_2.png",
    "blocks/water_3.png",
    "blocks/water_4.png",
    "blocks/water_5.png",
    "blocks/water_6.png",
    "blocks/water_7.png",
    "blocks/water_8.png",

    "entities/cow.png",
    "entities/steve.png",

    "gui/cursor.png",
    "gui/empty_food.png",
    "gui/empty_heart.png",
    "gui/empty_heart_blink.png",
    "gui/food.png",
    "gui/half_food.png",
    "gui/half_heart.png",
    "gui/half_heart_blink.png",
    "gui/heart.png",
    "gui/heart_blink.png",

    "items/apple.png",
    "items/coal.png",
    "items/cooked_beef.png",
    "items/diamond.png",
    "items/flint.png",
    "items/flint_and_steel.png",
    "items/gold_ingot.png",
    "items/iron_ingot.png",
    "items/leather.png",
    "items/raw_beef.png",
    "items/wheat_seeds.png",
];

/*** @type {Object<string, Texture>} */
const textureCache = {};

const imagePlaceholder = document.createElement("canvas");

class Texture {
    image = imagePlaceholder;
    _flipped = null;

    /*** @param {Promise<Image>} promise */
    constructor(promise) {
        this._promise = promise;
        promise.then(image => this.image = image);
    };

    get loaded() {
        return this.image !== imagePlaceholder;
    };

    static flipImage(image) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(image, 0, 0);
        ctx.restore();
        return canvas;
    };

    flip() {
        if (!this.loaded) return imagePlaceholder;
        return this._flipped = this._flipped || Texture.flipImage(this.image);
    };

    async wait() {
        await this._promise;
    };

    static get(src) {
        if (textureCache[src]) return textureCache[src];
        console.log("%cLoading " + src, "color: #ffff00");
        if (!src) throw new Error("Invalid texture src.");
        const image = new Image;
        let resolve;
        const prom = new Promise(r => resolve = r);
        image.src = src;
        image.addEventListener("load", () => {
            console.log("%cLoaded " + src, "color: #00ff00");
            resolve(image);
        });
        image.addEventListener("error", () => {
            console.log("%cFailed to load " + src, "color: #ff0000");
            resolve(image);
        });
        return textureCache[src] = new Texture(prom);
    };
}

const texturePromise = Promise.all(preloadTextures.map(txt => Texture.get("assets/" + txt).wait()));