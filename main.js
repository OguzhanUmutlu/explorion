const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const fpsDiv = document.querySelector(".fps");
const tpsDiv = document.querySelector(".tps");
const posDiv = document.querySelector(".pos");
const velDiv = document.querySelector(".vel");
const mouseDiv = document.querySelector(".mouse");
const healthDiv = document.querySelector(".health");

let __uuid__ = 0;
let pressingKeys = {};
let pressingButtons = [false, false, false];
const BLOCK_SIZE = 64;
let time = 0;
let animating = true;
let _fps = [];
let _tps = [];
let lastTick = -1;
const worlds = {};
const overworld = new World("overworld");
worlds[overworld.uuid] = overworld;
const player = new Player(0, 5, overworld);
const actualMouse = {x: -BLOCK_SIZE, y: -BLOCK_SIZE};
/*** @type {{x: number, y: number}} */
const worldMouse = {};
Object.defineProperties(worldMouse, {
    x: {get: () => (actualMouse.x - canvas.width / 2) / BLOCK_SIZE + player.x},
    y: {get: () => -(actualMouse.y - canvas.height / 2) / BLOCK_SIZE + player.y + player.size - 1}
});
const floatFix = n => Math.round(n * 10000000) / 10000000;
const imagePlaceholder = document.createElement("canvas");
let lastHandIndex = 0;

class Texture {
    image = imagePlaceholder;

    /*** @param {Promise<Image>} promise */
    constructor(promise) {
        this._promise = promise;
        promise.then(image => this.image = image);
    };

    async wait() {
        await this._promise;
    };
}

const textureList = ["dirt.png", "grass.png", "dirt.png", "stone.png", "cobblestone.png", "bedrock.png"];
/*** @type {Object<string, Texture>} */
const textureCache = {};
const getTexture = src => {
    if (textureCache[src]) return textureCache[src];
    const image = new Image;
    image.src = src;
    return textureCache[src] = new Texture(new Promise(r => image.onload = () => r(image)));
};
textureList.forEach(txt => getTexture("assets/" + txt));
const blockTextures = {
    1: "assets/grass.png",
    2: "assets/dirt.png",
    3: "assets/stone.png",
    4: "assets/cobblestone.png",
    5: "assets/bedrock.png"
};

const animate = () => {
    _fps.push(Date.now());
    _fps = _fps.filter(i => i + 1000 > Date.now());
    fpsDiv.innerHTML = _fps.length - 1 + " FPS";
    tpsDiv.innerHTML = _tps.length + " TPS";
    posDiv.innerHTML = `X: ${floatFix(player.x)}, Y: ${floatFix(player.y)}`;
    velDiv.innerHTML = `Velocity; X: ${floatFix(player.velocity.x)}, Y: ${floatFix(player.velocity.y)}`;
    mouseDiv.innerHTML = `Mouse; X: ${floatFix(worldMouse.x)}, Y: ${floatFix(worldMouse.y)}`;
    healthDiv.innerHTML = `Health: ${"&hearts;".repeat(player.health / 2)}`;
    if (animating) {
        if (lastHandIndex !== player.handIndex) {
            const nodes = Array.from(document.querySelector(".hotbar").children);
            nodes[lastHandIndex].classList.remove("selected");
            nodes[player.handIndex].classList.add("selected");
            lastHandIndex = player.handIndex;
        }
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        ctx.fillStyle = "#add8e6";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#83f156";
        const renderMinX = -Math.floor(canvas.width / BLOCK_SIZE / 2 + 1);
        const renderMaxX = Math.floor(canvas.width / BLOCK_SIZE / 2 + 2.5);
        const renderMinY = -Math.floor(canvas.height / BLOCK_SIZE / 2);
        const renderMaxY = Math.floor(canvas.height / BLOCK_SIZE / 2 + player.size + 1);
        const renderBlock = (x, y, isHovering = false) => {
            const bX = BLOCK_SIZE * (x - 1 / 2 - player.x) + canvas.width / 2;
            const bY = BLOCK_SIZE * (-y - 1 / 2 + player.size - 1 + player.y) + canvas.height / 2;
            const id = player.world.getBlockId(x, y);
            if (id) {
                ctx.drawImage(getTexture(blockTextures[id]).image, bX, bY, BLOCK_SIZE, BLOCK_SIZE);
            }
            ctx.strokeStyle = isHovering ? "yellow" : "black";
            ctx.lineWidth = isHovering ? 3 : 1;
            if (ctx.strokeStyle) ctx.strokeRect(bX, bY, BLOCK_SIZE, BLOCK_SIZE);
        };
        for (let X = renderMinX; X < renderMaxX; X++) {
            const x = X + Math.floor(player.x);
            for (let Y = renderMinY; Y < renderMaxY; Y++) {
                const y = Y + Math.floor(player.y);
                const block = player.world.getBlockId(x, y);
                if (!block) continue;
                renderBlock(x, y);
            }
        }
        const hoverVector = new Vector2(worldMouse.x * 1, worldMouse.y * 1).round();
        if (
            player.distance(hoverVector) <= player.blockReach &&
            (
                player.world.getBlockId(hoverVector.x, hoverVector.y + 1) ||
                player.world.getBlockId(hoverVector.x, hoverVector.y - 1) ||
                player.world.getBlockId(hoverVector.x + 1, hoverVector.y) ||
                player.world.getBlockId(hoverVector.x - 1, hoverVector.y)
            )
        ) renderBlock(hoverVector.x, hoverVector.y, true);
        ctx.fillStyle = "red";
        ctx.fillRect(canvas.width / 2 - 2, canvas.height / 2 - 2, 4, 4);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        ctx.strokeRect(
            canvas.width / 2 - BLOCK_SIZE * 2 / 6,
            canvas.height / 2 - BLOCK_SIZE * 2 / 6 - BLOCK_SIZE * 2 / 12,
            BLOCK_SIZE * 2 / 3,
            BLOCK_SIZE * 2 / 3 + BLOCK_SIZE * 2 / 6 + BLOCK_SIZE * (player.size - 1)
        );
    }
    requestAnimationFrame(animate);
};
animate();

const EXPECTED_TICK = 20;

setInterval(() => {
    const RENDER_DISTANCE = Math.ceil(canvas.width / BLOCK_SIZE / 16) + 3;
    if (lastTick + (1000 / EXPECTED_TICK) <= Date.now()) {
        lastTick = Date.now();
        time++;
        _tps.push(Date.now());
        _tps = _tps.filter(i => i + 1000 > Date.now());
        if (!player.onGround) player.velocity.y -= 0.1;
        player.velocity.y -= player.velocity.y * 0.1;
        const c1 = player.move(player.velocity.x, 0);
        if (c1) {
            player.x = (player.velocity.x < 0 ? 1 : -1) * c1[1][0].w + c1[0].x;
            player.velocity.x = 0;
        }
        const c2 = player.move(0, player.velocity.y);
        if (c2) {
            player.y = (player.velocity.y < 0 ? 1 : -1) * c2[1][0].h + c2[0].y + (player.velocity.y >= 0 ? 1 - player.size : 0);
            player.velocity.y = 0;
        }
        player.add(player.motion.clone().div(10));
        player.motion.mul(.9);
        if (player.y < -10) player.health -= 0.5;
        const playerChunkX = player.world.getChunkIdAt(player.x);
        for (let x = playerChunkX - RENDER_DISTANCE; x <= playerChunkX + RENDER_DISTANCE; x++)
            if (!player.world.chunks[x]) player.world.generateChunk(x);
    }
    if (pressingKeys["d"]) player.move(0.03, 0);
    if (pressingKeys["a"]) player.move(-0.03, 0);
    if ((pressingKeys["w"] || pressingKeys[" "]) && player.onGround) player.velocity.y = 0.6;

    const block = player.world.getBlock(worldMouse.x * 1, worldMouse.y * 1);
    if (pressingButtons[0] && block.id) {
        if (
            player.distance(block) <= player.blockReach &&
            block.id !== 5
        ) player.world.setBlock(block.x, block.y, 0);
    }
    if (pressingButtons[2] && !block.id) {
        if (
            player.selectedItem.id &&
            player.distance(block) <= player.blockReach &&
            !block.collisions.some(collision1 => player.collisions.some(collision2 => collision1.collides(collision2, block, player))) &&
            (
                player.world.getBlockId(block.x, block.y + 1) ||
                player.world.getBlockId(block.x, block.y - 1) ||
                player.world.getBlockId(block.x + 1, block.y) ||
                player.world.getBlockId(block.x - 1, block.y)
            )
        ) player.world.setBlock(block.x, block.y, player.selectedItem.id);
    }
});

addEventListener("keydown", ev => {
    if ([..."123456789"].includes(ev.key)) player.handIndex = ev.key - 1;
    pressingKeys[ev.key.toLowerCase()] = true;
});
addEventListener("keyup", ev => delete pressingKeys[ev.key.toLowerCase()]);
addEventListener("blur", () => {
    pressingKeys = {};
    actualMouse.x = -BLOCK_SIZE;
    actualMouse.y = -BLOCK_SIZE;
});

addEventListener("mousemove", ev => {
    actualMouse.x = ev.offsetX;
    actualMouse.y = ev.offsetY;
});

addEventListener("mousedown", ev => {
    if (!animating) return;
    pressingButtons[ev.button] = true;
});
addEventListener("mouseup", ev => {
    pressingButtons[ev.button] = false;
});
addEventListener("contextmenu", ev => {
    ev.preventDefault();
});

Promise.all(Object.values(textureCache).map(t => t.wait())).then(() => {
    document.querySelector(".loading-screen").style.display = "none";
});