const {sqrt, floor, ceil, round, sin, cos, atan2, random, PI, min, max, abs} = Math;
const rand = (min, max) => floor(random() * (max - min + 1)) + min;
const randFloat = (min, max) => random() * (max - min) + min;
const calcRenderX = x => BLOCK_SIZE * (x - player.x) + canvas.width / 2;
const calcRenderY = y => BLOCK_SIZE * -(y - player.y - player.size + 1) + canvas.height / 2;

// TODO: when loading chunks and block enhancements save grass blocks and make them spread in random ticks, make a list like World.randomTickBlocks and Block.randomUpdate
// TODO: blast resistance

// TODO **********************************

// TODO: actual biomes
// TODO: lighting, actual shadows
// TODO: bed and sleeping
// TODO: crafting
// TODO: make entities depend on models
// TODO: make a real-time model viewer where it shows the model components according to model.json(update the file when focus event is triggered)
// TODO: model.json will have these parts; offsets, animations, hitboxes and collision
// TODO: then add breaking emojis, walking emojis etc. to player and other entities
// TODO: make it so item entities' item amounts are visually visible
// TODO: add other leaf textures
// TODO: make it so some trees are large or tall
// TODO: make mobs run to water when they are on fire

// TODO: inventory actions:
// [X] left click          pick
// [X] right click         pick the ceil(amount / 2) of the item
// [X] middle click        make the item a stack
// [ ] triple click        pick the items from the inventory
// [X] q                   throw 1
// [X] ctrl q              throw slot
// [ ] shift click         change places
// [X] pick + left click   put back
// [X] pick + right click  put 1 back
// [X] pick + drag right   distribute 1s
// [ ] pick + drag left    distribute equally
// [X] 1-9                 switch from hotbar

// TODO: settings: sound settings, maxFPS
// TODO: custom cursor, make it red when there is an enemy, make it green when there is a block
// TODO: calm music

// TODO **********************************

// TODO: zombie and creeper
// TODO: sprinting and sneaking
// TODO: deny block?
// TODO: add block breaking delay
// TODO: source of water is removed
// TODO: source of the lava is removed
// TODO: saplings
// TODO: eating delay and animation
// TODO: rendering inventory
// TODO: feed effect
// TODO: regeneration effect
// TODO: ice
// TODO: bow
// TODO: ladders and vines
// TODO: horses and riding
// TODO: Arrows shot from fully charged bows have a 25% chance of becoming "critical arrows"

// TODO: finish the tiles


let DEBUG_ON = false;

const debug = (...s) => {
    if (DEBUG_ON) console.debug(...s);
};

const chunkArray = (arr, size, _c = []) => {
    for (let i = 0; i < arr.length; i += size) _c.push(arr.slice(i, i + size));
    return _c;
};

const updateLoadingScreen = (src, log = true, startedAt = null) => {
    if (log) debug(`%c[${(performance.now() - startedAt).toFixed(2)}ms] Loaded ${src}`, "color: #00ff00");
    return;
    const done = [...Object.values(Texture.textures), ...Object.values(Sound.sounds)].filter(i => i.loaded).length + 1;
    const all = TextureList.length;
    if (done <= all) {
        if (log) console.info("%c" +/*`[${done}/${all}] ` +*/ `Loaded ${src}`, "color: #00ff00");
        /*** @type {HTMLCanvasElement} */
        const cnv = document.querySelector(".loading-percent");
        const ct = cnv.getContext("2d");
        ct.clearRect(0, 0, cnv.width, cnv.height);
        ct.fillStyle = "#00ff00";
        ct.fillRect(0, 0, done / all * cnv.width, cnv.height);
        ct.textAlign = "center";
        ct.font = "20px monospace";
        ct.fillStyle = "white";
        ct.fillText(floor(done / all * 100) + "%", cnv.width / 2, cnv.height / 2 + 5);
    }
};