const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const fpsDiv = document.querySelector(".fps");
const tpsDiv = document.querySelector(".tps");
const upsDiv = document.querySelector(".ups");
const posDiv = document.querySelector(".pos");
const velDiv = document.querySelector(".vel");
const mouseDiv = document.querySelector(".mouse");

let __uuid__ = 0;
let pressingKeys = {};
let pressingButtons = [false, false, false];
let BLOCK_SIZE = 64;
let time = 0;
let animating = true;
let _fps = [];
let _tps = [];
let _ups = [];
let lastUpdate = Date.now();
const worlds = {};
const overworld = new World("overworld");
worlds[overworld.uuid] = overworld;
const player = new Player(0, 4, overworld);
const actualMouse = {x: -BLOCK_SIZE, y: -BLOCK_SIZE};
/*** @type {{x: number, y: number}} */
const worldMouse = {};
Object.defineProperties(worldMouse, {
    x: {get: () => (actualMouse.x - canvas.width / 2) / BLOCK_SIZE + player.x},
    y: {get: () => -(actualMouse.y - canvas.height / 2) / BLOCK_SIZE + player.y + player.size - 1}
});
const floatFix = n => round(n * 10000000) / 10000000;
const imagePlaceholder = document.createElement("canvas");
let lastHandIndex = 0;
const EXPECTED_TICK = 20;

const textureList = [
    "air.png", "dirt.png", "grass.png", "dirt.png", "stone.png", "cobblestone.png", "bedrock.png", "heart.png",
    "half_heart.png", "empty_heart.png", "water_1.png", "water_2.png", "water_3.png", "water_4.png", "water_5.png",
    "water_6.png", "water_7.png", "water_8.png"
];
/*** @type {Object<string, Texture>} */
const textureCache = {};
const getTexture = src => {
    if (textureCache[src]) return textureCache[src];
    const image = new Image;
    image.src = src;
    return textureCache[src] = new Texture(new Promise(r => image.onload = () => r(image)));
};
textureList.forEach(txt => getTexture("assets/" + txt));

ctx.imageSmoothingEnabled = false;

const getTPS = () => _tps.length ? _tps.reduce((a, b) => a + b[1], 0) : 0;

const hotbarNodes = Array.from(document.querySelector(".hotbar").children);
let lastHealth = 0;
let lastMaxHealth = 0;
let lastX = player.x;
let lastDirRight = true;
let lastActionbarId = null;
const actionbar = name => {
    const id = __uuid__++;
    lastActionbarId = id;
    const node = document.querySelector(".actionbar");
    node.style.transition = "opacity 1s";
    node.style.display = "none";
    node.style.opacity = "";
    node.innerHTML = name;
    node.style.display = "";
    setTimeout(() => lastActionbarId === id && (node.style.opacity = "0"), 500);
};
const animate = () => {
    if (lastX !== player.x) {
        lastDirRight = lastX < player.x;
        lastX = player.x;
    }
    _fps.push(Date.now());
    _fps = _fps.filter(i => i + 1000 > Date.now());
    fpsDiv.innerHTML = _fps.length - 1 + " FPS";
    tpsDiv.innerHTML = floatFix(getTPS()).toFixed(2) + " TPS";
    upsDiv.innerHTML = _ups.length + " UPS";
    posDiv.innerHTML = `X: ${floatFix(player.x)}, Y: ${floatFix(player.y)}`;
    velDiv.innerHTML = `Velocity; X: ${floatFix(player.velocity.x).toFixed(2)}, Y: ${floatFix(player.velocity.y).toFixed(2)}`;
    mouseDiv.innerHTML = `Mouse; X: ${floatFix(worldMouse.x).toFixed(2)}, Y: ${floatFix(worldMouse.y).toFixed(2)};`;
    if (animating) {
        if (lastHandIndex !== player.handIndex) {
            hotbarNodes[lastHandIndex].classList.remove("selected");
            hotbarNodes[player.handIndex].classList.add("selected");
            lastHandIndex = player.handIndex;
            if (player.selectedItem.id) actionbar(player.selectedItem.name);
        }
        hotbarNodes.forEach((node, i) => {
            const item = player.inventory.get(i);
            node.children[0].src = idTextures[item.id] || idTextures[0];
            node.children[1].innerHTML = item.count ? item.count.toString() : "";
        });
        document.querySelector(".health").style.display = player.mode === 0 ? "" : "none";
        if (lastHealth !== player.health || lastMaxHealth !== player.maxHealth) {
            lastHealth = player.health;
            lastMaxHealth = player.maxHealth;
            const topHearts = ceil(player.maxHealth / 2) % 10;
            const bottomHearts = floor((player.maxHealth + 1) / 20) * 10;
            document.querySelector(".health").innerHTML =
                `<div>${new Array(topHearts).fill(0).map((_, i) => {
                    if ((i + 1) * 2 <= player.health - bottomHearts * 2) {
                        return `<img src="assets/heart.png" draggable="false">`;
                    } else if ((i + 1) * 2 - 1 <= player.health - bottomHearts * 2) {
                        return `<img src="assets/half_heart.png" draggable="false">`;
                    } else {
                        return `<img src="assets/empty_heart.png" draggable="false">`;
                    }
                }).join("")}</div>` +
                new Array(floor(bottomHearts / 10)).fill(0).map((_, i) =>
                        "<div>" + new Array(10).fill(0).map((_, j) => {
                            const req = (bottomHearts / 10 - i - 1) * 20 + (j + 1) * 2;
                            if (player.health >= req) {
                                return `<img src="assets/heart.png" draggable="false">`;
                            } else if (player.health >= req - 1) {
                                return `<img src="assets/half_heart.png" draggable="false">`;
                            } else {
                                return `<img src="assets/empty_heart.png" draggable="false">`;
                            }
                        }).join("") + "</div>"
                ).join("");
        }
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        ctx.fillStyle = "#add8e6";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#83f156";
        const renderMinX = -floor(canvas.width / BLOCK_SIZE / 2 + 1);
        const renderMaxX = floor(canvas.width / BLOCK_SIZE / 2 + 2.5);
        const renderMinY = -floor(canvas.height / BLOCK_SIZE / 2);
        const renderMaxY = floor(canvas.height / BLOCK_SIZE / 2 + player.size + 1);
        const renderBlock = (x, y, isHovering = false) => {
            const bX = BLOCK_SIZE * (x - 1 / 2 - player.x) + canvas.width / 2;
            const bY = BLOCK_SIZE * (-y - 1 / 2 + player.size - 1 + player.y) + canvas.height / 2;
            const id = player.world.getBlockId(x, y);
            if (id) {
                ctx.globalAlpha = id >= 7 && id <= 15 ? 0.5 : 1;
                ctx.drawImage(getTexture(idTextures[id]).image, bX, bY, BLOCK_SIZE, BLOCK_SIZE);
                ctx.globalAlpha = 1;
            }
            ctx.strokeStyle = isHovering ? "yellow" : "";
            ctx.lineWidth = isHovering ? 3 : 1;
            if (isHovering) ctx.strokeRect(bX, bY, BLOCK_SIZE, BLOCK_SIZE);
        };
        for (let X = renderMinX; X < renderMaxX; X++) {
            const x = X + floor(player.x);
            for (let Y = renderMinY; Y < renderMaxY; Y++) {
                const y = Y + floor(player.y);
                const block = player.world.getBlockId(x, y);
                if (!block) continue;
                renderBlock(x, y);
            }
        }
        const hoverVector = new Vector2(worldMouse.x * 1, worldMouse.y * 1).round();
        const hoverId = player.world.getBlockId(hoverVector.x, hoverVector.y);
        if (
            !itemInfo.phaseable.includes(hoverId) &&
            (!itemInfo.unbreakable.includes(hoverId) || player.mode === 1) &&
            player.distance(hoverVector) <= player.blockReach
        ) renderBlock(hoverVector.x, hoverVector.y, true);
        else if (
            player.selectedItem.id &&
            itemInfo.phaseable.includes(hoverId) &&
            hoverVector.y >= player.world.MIN_HEIGHT &&
            hoverVector.y <= player.world.MAX_HEIGHT &&
            player.distance(hoverVector) <= player.blockReach &&
            (
                !itemInfo.notPlaceableOn.includes(player.world.getBlockId(hoverVector.x, hoverVector.y + 1)) ||
                !itemInfo.notPlaceableOn.includes(player.world.getBlockId(hoverVector.x, hoverVector.y - 1)) ||
                !itemInfo.notPlaceableOn.includes(player.world.getBlockId(hoverVector.x + 1, hoverVector.y)) ||
                !itemInfo.notPlaceableOn.includes(player.world.getBlockId(hoverVector.x - 1, hoverVector.y))
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
        if (player.selectedItem.id) {
            const handItemTexture = getTexture(idTextures[player.selectedItem.id]).image;
            ctx.drawImage(
                handItemTexture,
                canvas.width / 2 + (lastDirRight ? -1 : 1) * (player.collisions[0].x) * BLOCK_SIZE + (lastDirRight ? 0 : -handItemTexture.width),
                canvas.height / 2 + (player.collisions[0].y + player.collisions[0].h / 2) * BLOCK_SIZE
            );
        }
    }
    requestAnimationFrame(animate);
};
animate();

setInterval(() => {
    const UPDATE_DISTANCE = ceil(canvas.width / BLOCK_SIZE / 16) + 3;
    _ups.push(Date.now());
    _ups = _ups.filter(i => i + 1000 > Date.now());
    let deltaTick = floor(Date.now() - lastUpdate) / (1000 / EXPECTED_TICK);
    const curTPS = getTPS();
    if (curTPS + deltaTick > 20) deltaTick = 20 - curTPS;
    _tps = _tps.filter(i => i[0] + 1000 > Date.now());
    _tps.push([Date.now(), deltaTick]);
    lastUpdate = Date.now();
    time += deltaTick;
    if (!player.isFlying) {
        if (!player.onGround) player.velocity.y -= 0.1 * deltaTick;
        player.velocity.y -= player.velocity.y * 0.1 * deltaTick;
    }
    if (player.y <= -128) {
        player.y = -128;
        player.velocity.y = 0;
    }
    const c1 = player.move(player.velocity.x * min(deltaTick, 2), 0);
    if (c1) {
        player.x = (player.velocity.x < 0 ? 1 : -1) * c1[1][0].w + c1[0].x;
        player.velocity.x = 0;
    }
    const c2 = player.move(0, player.velocity.y * min(deltaTick, 2));
    if (c2) {
        player.y = (player.velocity.y < 0 ? 1 : -1) * c2[1][0].h + c2[0].y + (player.velocity.y >= 0 ? 1 - player.size : 0);
        player.velocity.y = 0;
    }
    player.add(player.motion.clone().div(10));
    player.motion.mul(.9);
    if (player.y < -10) player.health -= 0.5 * deltaTick;
    const playerChunkX = player.world.getChunkIdAt(player.x);
    for (let x = playerChunkX - UPDATE_DISTANCE; x <= playerChunkX + UPDATE_DISTANCE; x++)
        if (!player.world.chunks[x]) player.world.generateChunk(x);
    if (pressingKeys["d"]) player.move(player.movementSpeed * deltaTick, 0);
    if (pressingKeys["a"]) player.move(-player.movementSpeed * deltaTick, 0);
    if (player.isFlying) {
        if (pressingKeys["w"] || pressingKeys[" "]) player.move(0, player.movementSpeed * deltaTick);
        if (pressingKeys["s"]) player.move(0, -player.movementSpeed * deltaTick);
    } else {
        if ((pressingKeys["w"] || pressingKeys[" "]) && player.onGround) player.velocity.y = player.jumpVelocity;
    }

    const block = player.world.getBlock(worldMouse.x * 1, worldMouse.y * 1);
    if (pressingButtons[0] && block.id) {
        if (!player.holdBreak) pressingButtons[0] = false;
        if (
            player.distance(block) <= player.blockReach &&
            (block.isBreakable || player.mode === 1)
        ) {
            if (player.mode !== 1) player.inventory.add(new Item(block.id));
            player.world.setBlock(block.x, block.y, 0);
            player.world.updateBlocksAround(block.x, block.y);
        }
    }
    if (pressingButtons[2]) {
        const selectedItem = player.selectedItem;
        if (selectedItem.isBlock) {
            if (!player.holdPlace) pressingButtons[2] = false;
            if (
                itemInfo.phaseable.includes(block.id) &&
                selectedItem.id && selectedItem.isBlock &&
                player.distance(block) <= player.blockReach &&
                !block.collisions.some(collision1 => player.collisions.some(collision2 => collision1.collides(collision2, block, player))) &&
                (
                    !itemInfo.notPlaceableOn.includes(player.world.getBlockId(block.x, block.y + 1)) ||
                    !itemInfo.notPlaceableOn.includes(player.world.getBlockId(block.x, block.y - 1)) ||
                    !itemInfo.notPlaceableOn.includes(player.world.getBlockId(block.x + 1, block.y)) ||
                    !itemInfo.notPlaceableOn.includes(player.world.getBlockId(block.x - 1, block.y))
                )
            ) {
                player.world.setBlock(block.x, block.y, selectedItem.id);
                if (block.id === 7) block.update(player.world, {break: true}); // source block
                player.world.updateBlocksAround(block.x, block.y);
                if (player.mode !== 1) {
                    const it = player.inventory.contents[player.handIndex];
                    it.count--;
                    if (it.count <= 0) delete player.inventory.contents[player.handIndex];
                }
            }
        } else if (selectedItem.isEdible) {
            if (!player.holdEat) pressingButtons[2] = false;
            if (player.health === player.maxHealth) return;
            player.health += selectedItem.foodHeal;
            if (player.mode !== 1) player.inventory.remove(selectedItem, 1);
        }
    }
});

let lastSpace = Date.now();

addEventListener("keydown", ev => {
    if ([..."123456789"].includes(ev.key)) player.handIndex = ev.key - 1;
    pressingKeys[ev.key.toLowerCase()] = true;
});
addEventListener("keyup", ev => {
    delete pressingKeys[ev.key.toLowerCase()];
    if (ev.key === " ") {
        if (lastSpace + 300 > Date.now() && player.mode === 1) {
            player.isFlying = !player.isFlying;
            player.velocity.y = 0;
        }
        lastSpace = Date.now();
    }
});
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

addEventListener("wheel", ev => {
    const zoom = ev.deltaY / 100;
    BLOCK_SIZE -= zoom;
    if (BLOCK_SIZE > 100) BLOCK_SIZE = 100;
    if (BLOCK_SIZE < 4) BLOCK_SIZE = 4;
});

player.kill();