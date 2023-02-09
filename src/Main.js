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
let lastHurt = 0;
let lastHurtUpdate = false;
let lastExhaust = 0;
let lastDrown = 0; // for gui blink effects
let lastDrownUpdate = false;
let lastHealth = 0;
let lastMaxHealth = 0;
let lastActionbarId = null;
let lastFood = 0;
let lastBubble = 0;
const worlds = {};
const overworld = new World("overworld");
worlds.overworld = overworld;
/*** @type {Player} */
const player = overworld.summonEntity(EntityIds.PLAYER, 0, 0);

const actualMouse = {x: -BLOCK_SIZE, y: -BLOCK_SIZE};
/*** @type {{x: number, y: number}} */
const worldMouse = {};
Object.defineProperties(worldMouse, {
    x: {get: () => (actualMouse.x - canvas.width / 2) / BLOCK_SIZE + player.x},
    y: {get: () => -(actualMouse.y - canvas.height / 2) / BLOCK_SIZE + player.y + player.size - 1}
});
const floatFix = n => round(n * 10000000) / 10000000;
let lastHandIndex = 0;
const EXPECTED_TICK = 20;
let firstTime = true;

const getTPS = () => _tps.length ? _tps.reduce((a, b) => a + b[1], 0) : 0;

const hotbarNodes = Array.from(document.querySelector(".hotbar").children);
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

const renderMinX = _ => -floor(canvas.width / BLOCK_SIZE / 2 + 1);
const renderMaxX = _ => floor(canvas.width / BLOCK_SIZE / 2 + 2.5);
const renderMinY = _ => -floor(canvas.height / BLOCK_SIZE / 2);
const renderMaxY = _ => floor(canvas.height / BLOCK_SIZE / 2 + player.size + 1);

const animate = () => {
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
            if (player.selectedItem.id !== ItemIds.AIR) actionbar(player.selectedItem.name);
        }
        hotbarNodes.forEach((node, i) => {
            const item = player.inventory.get(i);
            node.children[0].src = idTextures[item.id] || idTextures[0];
            node.children[1].innerHTML = item.count > 1 ? item.count.toString() : "";
            node.children[2].innerHTML = metadata.durabilities[item] ? item.nbt.damage : "";
        });
        document.querySelector(".health").style.display = player.mode % 2 === 0 ? "" : "none";
        document.querySelector(".food").style.display = player.mode % 2 === 0 ? "" : "none";
        document.querySelector(".hotbar").style.display = player.mode === 3 ? "none" : "";
        document.querySelector(".bubble").style.display = player.mode === 3 || (!player.isUnderwater && player.waterTicks <= 0) ? "none" : "";
        if (lastHealth !== player.health || lastMaxHealth !== player.maxHealth || (lastHurt + 200 >= Date.now) !== lastHurtUpdate) {
            if (lastHealth > player.health) lastHurt = Date.now();
            lastHealth = player.health;
            lastMaxHealth = player.maxHealth;
            const topHearts = ceil(player.maxHealth / 2) % 10;
            const bottomHearts = floor((player.maxHealth + 1) / 20) * 10;
            const hurtAddition = (lastHurtUpdate = lastHurt + 200 >= Date.now()) ? "_blink" : "";
            const renderHealth = ceil(player.health);
            document.querySelector(".health").innerHTML =
                `<div>${new Array(topHearts).fill(0).map((_, i) => {
                    if ((i + 1) * 2 <= renderHealth - bottomHearts * 2) {
                        return `<img src="assets/gui/heart${hurtAddition}.png" draggable="false">`;
                    } else if ((i + 1) * 2 - 1 <= renderHealth - bottomHearts * 2) {
                        return `<img src="assets/gui/half_heart${hurtAddition}.png" draggable="false">`;
                    } else {
                        return `<img src="assets/gui/empty_heart${hurtAddition}.png" draggable="false">`;
                    }
                }).join("")}</div>` +
                new Array(floor(bottomHearts / 10)).fill(0).map((_, i) =>
                        "<div>" + new Array(10).fill(0).map((_, j) => {
                            const req = (bottomHearts / 10 - i - 1) * 20 + (j + 1) * 2;
                            if (renderHealth >= req) {
                                return `<img src="assets/gui/heart${hurtAddition}.png" draggable="false">`;
                            } else if (renderHealth >= req - 1) {
                                return `<img src="assets/gui/half_heart${hurtAddition}.png" draggable="false">`;
                            } else {
                                return `<img src="assets/gui/empty_heart${hurtAddition}.png" draggable="false">`;
                            }
                        }).join("") + "</div>"
                ).join("");
        }
        const renderFood = ceil(min(player.food, 20));
        if (lastFood !== renderFood) {
            if (lastFood > renderFood) lastExhaust = Date.now();
            lastFood = renderFood;
            document.querySelector(".food").innerHTML =
                "<div>" + new Array(10).fill(0).map((_, i) => {
                    const req = ((9 - i) + 1) * 2;
                    if (renderFood >= req) {
                        return `<img src="../assets/gui/food.png" draggable="false">`;
                    } else if (renderFood >= req - 1) {
                        return `<img src="../assets/gui/half_food.png" draggable="false">`;
                    } else {
                        return `<img src="../assets/gui/empty_food.png" draggable="false">`;
                    }
                }).join("") + "</div>";
        }
        const renderBubble = floor(10.5 - player.waterTicks / 20);
        if (lastBubble !== renderBubble || (lastDrown + 100 >= Date.now) !== lastDrownUpdate) {
            if (lastBubble > renderBubble) lastDrown = Date.now();
            lastBubble = renderBubble;
            const drownAddition = (lastDrownUpdate = lastDrown + 100 >= Date.now()) ? "_pop" : "";
            document.querySelector(".bubble").innerHTML =
                "<div>" + new Array(10).fill(0).map((_, i) => {
                    const req = (9 - i) + 1;
                    const next = (9 - (i + 1)) + 1;
                    if (renderBubble >= req) {
                        return `<img src="../assets/gui/bubble.png" draggable="false">`;
                    } else if (i !== 9 && renderBubble >= next ? drownAddition : "") return `<img src="../assets/gui/bubble_pop.png" draggable="false">`;
                    return `<img src="../assets/blocks/air.png" draggable="false">`;
                }).join("") + "</div>";
        }
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = "#add8e6";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#83f156";
        const renderBlock = (x, y, isHovering = false) => {
            const bX = BLOCK_SIZE * (x - 1 / 2 - player.x) + canvas.width / 2;
            const bY = BLOCK_SIZE * (-y - 1 / 2 + player.size - 1 + player.y) + canvas.height / 2;
            const id = player.world.getBlockId(x, y);
            if (id) {
                if (!idTextures[id]) throw new Error("Invalid ID texture: " + id);
                ctx.globalAlpha = id >= ItemIds.WATER_1 && id <= ItemIds.WATER ? 0.5 : 1;
                ctx.drawImage(Texture.get(idTextures[id]).image, bX, bY, BLOCK_SIZE, BLOCK_SIZE);
                ctx.globalAlpha = 1;
            }
            ctx.strokeStyle = isHovering ? "yellow" : "";
            ctx.lineWidth = isHovering ? 3 : 1;
            if (isHovering) ctx.strokeRect(bX, bY, BLOCK_SIZE, BLOCK_SIZE);
        };
        for (let X = renderMinX(); X < renderMaxX(); X++) {
            const x = X + floor(player.x);
            for (let Y = renderMinY(); Y < renderMaxY(); Y++) {
                const y = Y + floor(player.y);
                const block = player.world.getBlockId(x, y);
                if (!block) continue;
                renderBlock(x, y);
            }
        }
        const mouseEntity = player.world.entities.find(entity => entity !== player && entity instanceof Living && entity.hitboxes.some(hitbox => hitbox.collidesPoint(entity, worldMouse)));
        const hoverVector = new Vector(worldMouse.x * 1, worldMouse.y * 1).round();
        const hoverBlock = player.world.getBlock(hoverVector.x, hoverVector.y);
        if (player.mode < 2 && !mouseEntity) {
            if (
                (hoverBlock.isBreakable || player.mode % 2 === 1) &&
                player.distance(hoverVector) <= player.blockReach
            ) renderBlock(hoverVector.x, hoverVector.y, true); // break
            else if (
                player.world.entities.every(entity => entity instanceof ItemEntity || !entity.collides(hoverBlock)) &&
                player.selectedItem.id !== ItemIds.AIR &&
                hoverBlock.isReplaceable &&
                hoverVector.y >= player.world.MIN_HEIGHT &&
                hoverVector.y <= player.world.MAX_HEIGHT &&
                player.distance(hoverVector) <= player.blockReach &&
                (
                    !metadata.notPlaceableOn.includes(player.world.getBlockId(hoverVector.x, hoverVector.y + 1)) ||
                    !metadata.notPlaceableOn.includes(player.world.getBlockId(hoverVector.x, hoverVector.y - 1)) ||
                    !metadata.notPlaceableOn.includes(player.world.getBlockId(hoverVector.x + 1, hoverVector.y)) ||
                    !metadata.notPlaceableOn.includes(player.world.getBlockId(hoverVector.x - 1, hoverVector.y))
                )
            ) renderBlock(hoverVector.x, hoverVector.y, true); // place
        }
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        /*ctx.strokeRect(
            canvas.width / 2 - BLOCK_SIZE * 2 / 6,
            canvas.height / 2 - BLOCK_SIZE * 2 / 6 - BLOCK_SIZE * 2 / 12,
            BLOCK_SIZE * 2 / 3,
            BLOCK_SIZE * 2 / 3 + BLOCK_SIZE * 2 / 6 + BLOCK_SIZE * (player.size - 1)
        );*/
        player.world.entities.filter(entity => entity.x >= player.x + renderMinX() - 3 && entity.x <= player.x + renderMaxX() + 3 && entity.y >= player.y + renderMinY() - 3 && entity.y <= player.y + renderMaxY() + 3).forEach(entity => {
            entity.render();
        });
        player.world.particles.filter(particle => particle.x >= player.x + renderMinX() - 3 && particle.x <= player.x + renderMaxX() + 3 && particle.y >= player.y + renderMinY() - 3 && particle.y <= player.y + renderMaxY() + 3).forEach(particle => {
            particle.render();
        });
        if (player.selectedItem.id !== ItemIds.AIR) {
            ctx.drawImage(
                Texture.get(idTextures[player.selectedItem.id]).image,
                canvas.width / 2 + (player.direction ? -1 : 1) * (player.collision.x) * BLOCK_SIZE + (player.direction ? 0 : -BLOCK_SIZE * .3),
                canvas.height / 2 + (player.collision.y + player.collision.h / 2) * BLOCK_SIZE,
                BLOCK_SIZE * .3,
                BLOCK_SIZE * .3
            );
        }
    }
    requestAnimationFrame(animate);
};
animate();

setInterval(() => {
    _ups.push(Date.now());
    _ups = _ups.filter(i => i + 1000 > Date.now());
    let deltaTick = min(floor(Date.now() - lastUpdate) / (1000 / EXPECTED_TICK), 2);
    const curTPS = getTPS();
    if (curTPS + deltaTick > 20) deltaTick = 20 - curTPS;
    _tps = _tps.filter(i => i[0] + 1000 > Date.now());
    _tps.push([Date.now(), deltaTick]);
    lastUpdate = Date.now();
    time += deltaTick;
    player.world.update(deltaTick);

    firstTime = false;
    if (player.mode === 3) {
        if (pressingKeys["d"]) player.x += player.realMovementSpeed * deltaTick;
        if (pressingKeys["a"]) player.x -= player.realMovementSpeed * deltaTick;
        if (pressingKeys["w"]) player.y += player.realMovementSpeed * deltaTick;
        if (pressingKeys["s"]) player.y -= player.realMovementSpeed * deltaTick;
    } else {
        if (pressingKeys["d"]) player.move(player.realMovementSpeed * deltaTick, 0);
        if (pressingKeys["a"]) player.move(-player.realMovementSpeed * deltaTick, 0);
        if (player.isFlying) {
            if (pressingKeys["w"] || pressingKeys[" "]) player.move(0, player.realMovementSpeed * deltaTick);
            if (pressingKeys["s"]) player.move(0, -player.realMovementSpeed * deltaTick);
        } else {
            player.isSwimmingUp = pressingKeys["w"] || pressingKeys[" "];
            if ((pressingKeys["w"] || pressingKeys[" "]) && player.onGround) player.jump();
        }
    }

    const block = player.world.getBlock(worldMouse.x * 1, worldMouse.y * 1);
    if (pressingButtons[0]) {
        const mouseEntity = player.world.entities.find(entity => entity !== player && entity instanceof Living && entity.hitboxes.some(hitbox => hitbox.collidesPoint(entity, worldMouse)));
        if (!player.holdBreak) pressingButtons[0] = false;
        if (mouseEntity) {
            mouseEntity.attack(player, player.onGround ? 1 : 2, .4);
            if (!player.onGround) {
                for (let i = 0; i < 10; i++) player.world.addParticle(mouseEntity.x, mouseEntity.y, ParticleIds.CRITICAL_HIT);
            }
            player.direction = mouseEntity.x < player.x ? 0 : 1;
        } else if (block.id !== ItemIds.AIR && player.mode < 2) {
            block.break(player);
        }
    }
    if (pressingButtons[2]) {
        const selectedItem = player.selectedItem;
        if (!player.holdPlace) pressingButtons[2] = false;
        if (
            selectedItem.isBlock &&
            player.mode < 2 &&
            block.isPhaseable &&
            block.isReplaceable &&
            selectedItem.id !== ItemIds.AIR && selectedItem.isBlock &&
            player.distance(block) <= player.blockReach &&
            !player.world.entities.some(entity => !(entity instanceof ItemEntity) && entity.collides(block)) &&
            (
                !metadata.notPlaceableOn.includes(player.world.getBlockId(block.x, block.y + 1)) ||
                !metadata.notPlaceableOn.includes(player.world.getBlockId(block.x, block.y - 1)) ||
                !metadata.notPlaceableOn.includes(player.world.getBlockId(block.x + 1, block.y)) ||
                !metadata.notPlaceableOn.includes(player.world.getBlockId(block.x - 1, block.y))
            )
        ) {
            if (block.id === ItemIds.AIR || block.break(player)) {
                new Block(block.x, block.y, selectedItem.id, player.world).place(player);
            }
        } else {
            if (
                player.distance(block) <= player.blockReach
            ) block.interact(player);
            if (!player.holdEat) pressingButtons[2] = false;
            if (selectedItem.use(player) && player.mode % 2 === 0)
                player.inventory.removeSlot(player.handIndex);
        }
    }
});

let lastSpace = Date.now();

addEventListener("keydown", ev => {
    if ([..."123456789"].includes(ev.key)) player.handIndex = ev.key - 1;
    pressingKeys[ev.key.toLowerCase()] = true;
    if (ev.key.toLowerCase() === "q") player.dropItem(player.handIndex);
});
addEventListener("keyup", ev => {
    delete pressingKeys[ev.key.toLowerCase()];
    if (ev.key === " ") {
        if (lastSpace + 400 > Date.now() && player.mode === 1) {
            player.isFlying = !player.isFlying;
            player.velocity.y = 0;
        }
        lastSpace = Date.now();
    }
    if (ev.key.toLowerCase() === "j") {
        const info = document.querySelector(".info");
        info.style.display = info.style.display ? "" : "none";
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

texturePromise.then(() => {
    document.querySelector(".loading-screen").style.display = "none";
    console.clear();
    console.log("%cLoaded all preload textures!", "font-size: 20px; color: #00ffff")
});

addEventListener("wheel", ev => {
    const zoom = ev.deltaY / 100;
    player.handIndex += zoom;
    if (player.handIndex >= 9) player.handIndex = 0;
    if (player.handIndex <= -1) player.handIndex = 8;
    /*BLOCK_SIZE -= zoom;
    if (BLOCK_SIZE > 100) BLOCK_SIZE = 100;
    if (BLOCK_SIZE < 4) BLOCK_SIZE = 4;*/
});

player.kill();