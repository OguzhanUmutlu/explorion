const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const fpsDiv = document.querySelector(".fps");
const tpsDiv = document.querySelector(".tps");
const upsDiv = document.querySelector(".ups");
const posDiv = document.querySelector(".pos");
const velDiv = document.querySelector(".vel");
const mouseDiv = document.querySelector(".mouse");

let __uuid__ = 0; // TODO: store this in world files
let pressingKeys = {};
let pressingButtons = [false, false, false];
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
let breakingState = null;
let chatState = false;
let onDeathScreen = false;
let lastUnderwater = false;
let containerHovering = null;
let containerDragCache = null;
let firstTime = true;

let BLOCK_SIZE = 64;
let SHOW_SHADOWS = true;
let SHOW_HITBOXES = false;
let SHOW_COLLISIONS = false;

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

const getTPS = () => _tps.length ? _tps.reduce((a, b) => a + b[1], 0) : 0;

const emptyItemDiv = `<img src="" draggable="false"><div></div><div></div>`;
const emptyItemDiv2 = `<div class="item" data-inventory="..."><img src="" draggable="false"><div></div><div></div></div>`;
for (let i = 0; i < 4; i++) document.querySelector(".player-inventory > .armors").innerHTML += emptyItemDiv2
    .replace("...", "armorInventory;" + i);
for (let i = 0; i < 27; i++) document.querySelector(".player-inventory > .inventory").innerHTML += emptyItemDiv2
    .replace("...", "inventory;" + (9 + i));
for (let i = 0; i < 9; i++) document.querySelector(".player-inventory > .hotbars").innerHTML += emptyItemDiv2
    .replace("...", "inventory;" + i);
for (let i = 0; i < 4; i++) document.querySelector(".player-inventory > .crafting-input").innerHTML += emptyItemDiv2
    .replace("...", "craftingInventory;" + i);
document.querySelector(".player-inventory > .crafting-output").innerHTML += emptyItemDiv2
    .replace("...", "outputInventory;0");
document.querySelector(".cursor-item").innerHTML = emptyItemDiv2
    .replace("...", "cursorInventory;0");
const hotbarNodes = Array.from(document.querySelector(".hotbar").children);
hotbarNodes.forEach(i => i.innerHTML = emptyItemDiv);
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
const playerInventoryDiv = document.querySelector(".player-inventory");
const chatInput = document.querySelector(".chat-input > input");

const renderMinX = _ => -floor(canvas.width / BLOCK_SIZE / 2 + 1);
const renderMaxX = _ => floor(canvas.width / BLOCK_SIZE / 2 + 2.5);
const renderMinY = _ => -floor(canvas.height / BLOCK_SIZE / 2);
const renderMaxY = _ => floor(canvas.height / BLOCK_SIZE / 2 + player.size + 2);

playerInventoryDiv.querySelectorAll(".player-inventory > div > div").forEach((i, j) => {
    const spl = i.getAttribute("data-inventory").split(";");
    const inventoryType = spl[0];
    /*** @type {Inventory} */
    const inventory = player[inventoryType];
    const index = spl[1] * 1;
    i.addEventListener("mousedown", e => {
        const holdingItem = player.cursorInventory.get(0);
        const clickedItem = inventory.get(index);
        containerDragCache = null;
        if (e.which === 1) {
            if (holdingItem.id === ItemIds.AIR || inventoryType === "outputInventory") { // picking item up
                if (clickedItem.id === ItemIds.AIR && inventoryType !== "outputInventory") return;
                if (inventoryType === "outputInventory" && !player.cursorInventory.canAdd(clickedItem)) return;
                player.cursorInventory.add(clickedItem);
                delete inventory.contents[index];
                if (inventoryType === "outputInventory") player.decreaseCrafting();
            } else {
                if (clickedItem.id === ItemIds.AIR) { // putting all items player has in cursor
                    if (inventoryType === "outputInventory") return;
                    inventory.set(index, holdingItem);
                    player.cursorInventory.set(0, itemPlaceholder);
                } else if (holdingItem.equals(clickedItem, false, true)) { // combining items clicked and in cursor
                    if (inventoryType === "outputInventory") return;
                    const total = clickedItem.count + holdingItem.count;
                    if (total > clickedItem.maxCount) {
                        const remaining = total - clickedItem.maxCount;
                        inventory.contents[index].count = clickedItem.maxCount;
                        holdingItem.count = remaining;
                        player.cursorInventory.set(0, holdingItem);
                    } else {
                        inventory.contents[index].count += holdingItem.count;
                        player.cursorInventory.set(0, itemPlaceholder);
                    }
                } else { // swapping items clicked and in cursor
                    if (inventoryType === "outputInventory") return;
                    inventory.set(index, holdingItem);
                    player.cursorInventory.set(0, clickedItem);
                }
            }
        } else if (e.which === 2) {
            if (player.mode === 1 && holdingItem.id === ItemIds.AIR) { // cloning item
                if (inventoryType === "outputInventory") return;
                clickedItem.count = clickedItem.maxCount;
                player.cursorInventory.set(0, clickedItem);
            }
        } else if (e.which === 3) {
            if (holdingItem.id === ItemIds.AIR) { // picking half item
                if (inventoryType === "outputInventory") return;
                if (clickedItem.id === ItemIds.AIR) return;
                const total = clickedItem.count;
                clickedItem.count = ceil(total / 2);
                player.cursorInventory.set(0, clickedItem);
                clickedItem.count = floor(total / 2);
                inventory.set(index, clickedItem);
            } else {
                if (clickedItem.id === ItemIds.AIR) { // putting 1 item down
                    if (inventoryType === "outputInventory") return;
                    containerDragCache = {
                        type: "oneDistribute",
                        indexes: [index]
                    };
                    const actualCount = holdingItem.count;
                    holdingItem.count = 1;
                    inventory.set(index, holdingItem);
                    holdingItem.count = actualCount - 1;
                    player.cursorInventory.set(0, holdingItem);
                } else if (holdingItem.equals(clickedItem, false, true)) { // combining 1 item
                    if (inventoryType === "outputInventory") return;
                    if (clickedItem.count >= clickedItem.maxCount) return;
                    containerDragCache = {
                        type: "oneDistribute",
                        indexes: [index]
                    };
                    clickedItem.count++;
                    inventory.set(index, clickedItem);
                    holdingItem.count--;
                    player.cursorInventory.set(0, holdingItem);
                } else { // swapping items clicked and in cursor
                    if (inventoryType === "outputInventory") return;
                    inventory.set(index, holdingItem);
                    player.cursorInventory.set(0, clickedItem);
                }
            }
        }
    });
    i.addEventListener("mouseenter", () => {
        containerHovering = [inventory, index];
        const item = inventory.get(index);
        if (item.id === ItemIds.AIR) return;
        document.querySelector(".hover-info").innerHTML = item.name;
        document.querySelector(".hover-info").style.display = "";
    });
    i.addEventListener("mouseleave", () => {
        containerHovering = null;
        document.querySelector(".hover-info").innerHTML = "";
        document.querySelector(".hover-info").style.display = "none";
    });
});
addEventListener("mouseup", () => {
    containerDragCache = null;
});

addEventListener("keydown", e => {
    if (player.container !== ContainerIds.PLAYER_CONTAINER || !containerHovering) return;
    const inv = containerHovering[0];
    const ind = containerHovering[1];
    const item = inv.get(ind);
    if (e.key.toLowerCase() === "q") {
        if (item.id !== ItemIds.AIR) player.dropItemAt(containerHovering[1], e.ctrlKey ? item.count : 1, inv);
    }
    if ([..."123456789"].includes(e.key)) {
        const toIndex = e.key * 1 - 1;
        const toItem = player.inventory.get(toIndex);
        containerHovering[0].set(containerHovering[1], toItem);
        player.inventory.set(toIndex, item);
    }
});
addEventListener("mousemove", () => {
    if (player.container !== ContainerIds.PLAYER_CONTAINER || !containerDragCache || !containerHovering) return;
    const inv = containerHovering[0];
    const ind = containerHovering[1];
    const item = inv.get(ind); // TODO: multipleDistribute?
    if (containerDragCache.type === "oneDistribute") {
        if (player.cursorInventory.get(0).id === ItemIds.AIR) return containerDragCache = null;
        if (item.id !== ItemIds.AIR && !player.cursorInventory.get(0).equals(item, false, true)) return;
        if (containerDragCache.indexes.includes(ind)) return;
        containerDragCache.indexes.push(ind);
        if (item.id === ItemIds.AIR) {
            const it = player.cursorInventory.get(0);
            it.count = 1;
            inv.set(ind, it);
            player.cursorInventory.contents[0].count--;
        } else if (item.count < item.maxCount) {
            inv.contents[ind].count++;
            player.cursorInventory.contents[0].count--;
        }
        if (player.cursorInventory.contents[0].count <= 0) delete player.cursorInventory.contents[0];
    }
});


const animate = () => {
    _fps.push(Date.now());
    _fps = _fps.filter(i => i + 1000 > Date.now());
    fpsDiv.innerHTML = _fps.length - 1 + " FPS";
    tpsDiv.innerHTML = floatFix(getTPS()).toFixed(2) + " TPS";
    upsDiv.innerHTML = _ups.length + " UPS";
    posDiv.innerHTML = `X: ${floatFix(player.x)}, Y: ${floatFix(player.y)}`;
    velDiv.innerHTML = `Velocity; X: ${floatFix(player.velocity.x).toFixed(2)}, Y: ${floatFix(player.velocity.y).toFixed(2)}`;
    mouseDiv.innerHTML = `Mouse; X: ${floatFix(worldMouse.x).toFixed(2)}, Y: ${floatFix(worldMouse.y).toFixed(2)};`;
    document.querySelector(".ent").innerHTML = "Entities: " + player.world.entities.length;
    let hours = floor(player.world.time / 500);
    let minutes = floor((player.world.time % 500) / (12000 / 60 / 60));
    let seconds = floor((player.world.time % 500 % (12000 / 60 / 60)) / (12000 / 60));
    const pad = s => s.toString().padStart(2, "0");
    document.querySelector(".tim").innerHTML = `Time: ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    if (animating) {
        if (lastUnderwater !== player.isUnderwater) {
            lastUnderwater = player.isUnderwater;
            if (lastUnderwater) {
                Sound.play("assets/sounds/liquid/enter" + rand(1, 3) + ".ogg");
                Sound.playAmbient("assets/sounds/liquid/underwater_ambience.ogg");
            } else {
                Sound.play("assets/sounds/liquid/exit" + rand(1, 3) + ".ogg");
                Sound.stopAmbient("assets/sounds/liquid/underwater_ambience.ogg");
            }
        }
        document.querySelector(".game_top").style.backgroundColor = "rgba(0, 0, 0, " + player.world.time / 24000 + ")";
        document.querySelector(".game_top_water").style.backgroundColor = "rgba(0, 0, " + (player.isUnderwater ? "255, 0.3" : "0, 0") + ")";
        document.querySelector(".game_top_water").style.backdropFilter = player.isUnderwater ? "blur(2px)" : "";
        document.querySelector(".chat").style.display = chatState ? "" : "none";
        document.querySelector(".chat-input").style.maxWidth = innerWidth + "px";
        document.querySelector(".death-screen").style.display = onDeathScreen ? "" : "none";
        if (player.dead) { // TODO: death messages for entities with nametag
            breakingState = null;
            const msg = player.deathMessage;
            document.querySelector(".death-screen > p").innerText = msg;
            if (!onDeathScreen) writeOut(msg);
        }
        onDeathScreen = player.dead;
        if (chatState) {
            ctx.save();
            ctx.font = "14px monospace";
            ctx.fillStyle = "red";
            document.querySelector(".chat-input").style.width = ctx.measureText(chatInput.value).width + "px";
            ctx.restore();
        }
        if (lastHandIndex !== player.handIndex) {
            hotbarNodes[lastHandIndex].classList.remove("selected");
            hotbarNodes[player.handIndex].classList.add("selected");
            lastHandIndex = player.handIndex;
            if (player.selectedItem.id !== ItemIds.AIR) actionbar(player.selectedItem.name);
        }
        const putItemInto = (item, div) => {
            div.children[0].src = item.texture.actualSrc || "assets/blocks/air.png";
            div.children[1].innerHTML = item.count > 1 ? item.count.toString() : "";
            div.children[2].style.width = metadata.durabilities[item] ? (item.nbt.damage / metadata.durabilities[item.id] * 100) + "%" : "0";
        };
        switch (player.container) {
            case ContainerIds.PLAYER_CONTAINER: // TODO: check for update
                [
                    ...Array.from(playerInventoryDiv.querySelector(".hotbars").children),
                    ...Array.from(playerInventoryDiv.querySelector(".inventory").children)
                ].forEach((node, i) => {
                    const item = player.inventory.get(i);
                    putItemInto(item, node);
                });
                Array.from(playerInventoryDiv.querySelector(".armors").children).forEach((node, i) => {
                    const item = player.armorInventory.get(i);
                    putItemInto(item, node);
                });
                Array.from(playerInventoryDiv.querySelector(".crafting-input").children).forEach((node, i) => {
                    const item = player.craftingInventory.get(i);
                    putItemInto(item, node);
                });
                const cursorItem = document.querySelector(".cursor-item").children[0];
                putItemInto(player.cursorInventory.get(0), cursorItem);
                const crOut = playerInventoryDiv.querySelector(".crafting-output").children[0];
                putItemInto(player.outputInventory.get(0), crOut);
                break;
            default:
                hotbarNodes.forEach((node, i) => {
                    const item = player.inventory.get(i);
                    putItemInto(item, node);
                });
        }
        document.querySelector(".cursor-item").style.display = player.container !== ContainerIds.NONE ? "" : "none";
        document.querySelector(".health").style.display = player.mode % 2 === 0 && player.container === ContainerIds.NONE ? "" : "none";
        document.querySelector(".food").style.display = player.mode % 2 === 0 && player.container === ContainerIds.NONE ? "" : "none";
        document.querySelector(".hotbar").style.display = player.mode === 3 || player.container !== ContainerIds.NONE ? "none" : "";
        document.querySelector(".hotbar").style.height = innerWidth / 18 + "px";
        document.querySelector(".bubble").style.display = player.mode === 3 || player.container !== ContainerIds.NONE || (!player.isUnderwater && player.waterTicks <= 0) ? "none" : "";
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
                        // noinspection HtmlUnknownTarget
                        return `<img src="assets/gui/food.png" draggable="false">`;
                    } else if (renderFood >= req - 1) {
                        // noinspection HtmlUnknownTarget
                        return `<img src="assets/gui/half_food.png" draggable="false">`;
                    } else {
                        // noinspection HtmlUnknownTarget
                        return `<img src="assets/gui/empty_food.png" draggable="false">`;
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
                        // noinspection HtmlUnknownTarget
                        return `<img src="assets/gui/bubble.png" draggable="false">`;
                    } else if (i !== 9 && renderBubble >= next ? drownAddition : "") {
                        // noinspection HtmlUnknownTarget
                        return `<img src="assets/gui/bubble_pop.png" draggable="false">`;
                    }
                    // noinspection HtmlUnknownTarget
                    return `<img src="assets/blocks/air.png" draggable="false">`;
                }).join("") + "</div>";
        }
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = "#add8e6";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#83f156";
        const renderBlock = (x, y, isHovering = false) => {
            //const bX = BLOCK_SIZE * (x - 1 / 2 - player.x) + canvas.width / 2;
            //const bY = BLOCK_SIZE * (-y - 1 / 2 + player.size - 1 + player.y) + canvas.height / 2;
            const bX = calcRenderX(x - .5);
            const bY = calcRenderY(y + .5);
            const [id, meta] = player.world.getBlockInfo(x, y);
            if (
                id !== ItemIds.AIR &&
                !isHovering
            ) {
                const bl = new Block(x, y, id, meta, player.world);
                if (!SHOW_SHADOWS || bl.isVisible) {
                    const texture = bl.texture;
                    ctx.globalAlpha = id === ItemIds.WATER ? 0.5 : 1;
                    ctx.drawImage(texture.image, bX, bY, BLOCK_SIZE, BLOCK_SIZE);
                    ctx.globalAlpha = 1;
                } else ctx.drawImage(Texture.shadow(1, BLOCK_SIZE), bX, bY, BLOCK_SIZE, BLOCK_SIZE);
            }
            ctx.strokeStyle = isHovering ? "yellow" : "";
            ctx.lineWidth = isHovering ? 3 : 1;
            if (isHovering) ctx.strokeRect(bX, bY, BLOCK_SIZE, BLOCK_SIZE);
            ctx.fillStyle = "white";
            ctx.font = "30px Calibri";
            if (DEBUG_ON && meta) ctx.fillText(meta.toString(), bX + 5, bY + 20);
            ctx.strokeStyle = "white";
            if (breakingState && breakingState.x === x && breakingState.y === y)
                ctx.drawImage(Texture.get("assets/blocks/destroy_stage_" + (min(floor(breakingState.ticks / breakingState.maxTick * 10), 9) || 0) + ".png").image, bX, bY, BLOCK_SIZE, BLOCK_SIZE);
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
        if (player.mode < 2 && !mouseEntity && hoverBlock.isVisible) {
            if (
                (hoverBlock.isBreakable || player.mode % 2 === 1) &&
                player.distance(hoverVector) <= player.blockReach
            ) renderBlock(hoverVector.x, hoverVector.y, player.container === ContainerIds.NONE && true); // break
            else if (
                player.world.entities.every(entity => entity instanceof ItemEntity || !entity.collides(hoverBlock)) &&
                player.selectedItem.id !== ItemIds.AIR &&
                hoverBlock.isReplaceable &&
                hoverVector.y >= player.world.MIN_HEIGHT &&
                hoverVector.y <= player.world.MAX_HEIGHT &&
                player.distance(hoverVector) <= player.blockReach &&
                [[0, 1], [0, -1], [1, 0], [-1, 0]].some(i => metadata.canPlaceBlockOnIt.includes(player.world.getBlockId(hoverVector.x + i[0], hoverVector.y + i[1])))
            ) renderBlock(hoverVector.x, hoverVector.y, player.container === ContainerIds.NONE && true); // place
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
                player.selectedItem.texture.image,
                canvas.width / 2 + (player.direction ? -1 : 1) * (player.collision.x) * BLOCK_SIZE + (player.direction ? 0 : -BLOCK_SIZE * .3),
                canvas.height / 2 + (player.collision.y + player.collision.h / 2) * BLOCK_SIZE,
                BLOCK_SIZE * .3,
                BLOCK_SIZE * .3
            );
        }
        if (player.container !== ContainerIds.NONE) {
            switch (player.container) {
                case ContainerIds.PLAYER_CONTAINER:
                    playerInventoryDiv.hidden = false;
                    break;
            }
            document.querySelector(".container-blur").style.display = "";
        } else {
            playerInventoryDiv.hidden = true;
            document.querySelector(".container-blur").style.display = "none";
        }
    }
    requestAnimationFrame(animate);
};
animate();

setInterval(() => {
    _ups.push(Date.now());
    _ups = _ups.filter(i => i + 1000 > Date.now());
    const actualDeltaTick = floor(Date.now() - lastUpdate) / (1000 / EXPECTED_TICK);
    let deltaTick = min(actualDeltaTick, 2);
    if (deltaTick <= 0.5) return;
    const curTPS = getTPS();
    if (curTPS + deltaTick > 20) deltaTick = 20 - curTPS;
    _tps = _tps.filter(i => i[0] + 1000 > Date.now());
    _tps.push([Date.now(), deltaTick]);
    lastUpdate = Date.now();
    player.world.update(deltaTick);
    firstTime = false;
    if (player.container !== ContainerIds.NONE) {
        player.updateOutputInventory();
        return;
    }
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
        if (breakingState && (breakingState.x !== block.x || breakingState.y !== block.y)) breakingState = null;
        if (!breakingState) {
            const mouseEntity = player.world.entities.find(entity => entity !== player && entity instanceof Living && entity.hitboxes.some(hitbox => hitbox.collidesPoint(entity, worldMouse)));
            if (mouseEntity) {
                if (!player.holdBreak) pressingButtons[0] = false;
                mouseEntity.attack(new AttackDamage(1, player)); // TODO: weapons
                player.direction = mouseEntity.x < player.x ? 0 : 1;
            } else if (block.id !== ItemIds.AIR && block.isVisible && block.isBreakable && player.distance(block) <= player.blockReach && player.mode < 2) {
                if (player.mode === 1) {
                    breakingState = null;
                    if (!player.holdBreak) pressingButtons[0] = false;
                    block.break(player);
                } else {
                    if (!breakingState || breakingState.x !== block.x || breakingState.y !== block.y)
                        breakingState = {
                            x: block.x,
                            y: block.y,
                            ticks: 0,
                            soundTicks: 0,
                            maxTick: block.hardness * 20,
                        };
                }
            }
        }
        if (breakingState) {
            if (breakingState.ticks >= breakingState.maxTick) {
                player.world.getBlock(breakingState.x, breakingState.y).break(player);
                breakingState = null;
            } else {
                const difference = actualDeltaTick
                    * (player.isUnderwater ? 1 / 5 : 1)
                    * (player.onGround ? 1 : 1 / 5);
                breakingState.ticks += difference;
                breakingState.soundTicks += difference;
                if (breakingState.soundTicks >= 5 && breakingState.maxTick > 8) {
                    breakingState.soundTicks -= 5;
                    player.world.playSound(
                        player.world.getBlock(breakingState.x, breakingState.y).digSound,
                        breakingState.x, breakingState.y
                    );
                }
            }
        }
    } else breakingState = null;
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
            [[0, 1], [0, -1], [1, 0], [-1, 0]].some(i => metadata.canPlaceBlockOnIt.includes(player.world.getBlockId(block.x + i[0], block.y + i[1])))
        ) {
            if (block.id === ItemIds.AIR || block.break(player)) {
                new Block(block.x, block.y, selectedItem.id, selectedItem.nbt.damage, player.world).place(player);
            }
        } else {
            if (
                player.distance(block) <= player.blockReach &&
                [[0, 1], [0, -1], [1, 0], [-1, 0]].some(i => player.world.getBlock(block.x + i[0], block.y + i[1]).isVisible)
            ) block.interact(player);
            if (!player.holdEat) pressingButtons[2] = false;
            if (selectedItem.use(player) && player.mode % 2 === 0)
                player.inventory.removeSlot(player.handIndex);
        }
    }
});

let lastSpace = Date.now();
const writeOut = s => {
    const mDiv = document.createElement("div");
    mDiv.innerText = s;
    document.querySelector(".messages").appendChild(mDiv);
};

addEventListener("keydown", ev => {
    if (ev.key === "F3") ev.preventDefault();
    if (onDeathScreen) return;
    if (chatState && ev.key === "Escape") {
        chatState = false;
        chatInput.value = "";
    }
    if (chatState) {
        if (document.activeElement === chatInput && ev.key === "Enter") {
            const msg = chatInput.value.trim();
            chatInput.value = "";
            if (msg.startsWith("/")) {
                runCommand(msg, player);
            } else writeOut("<World Owner> " + msg);
        }
        return;
    }
    if (ev.key.toLowerCase() === "t") {
        chatState = true;
        document.querySelector(".chat").style.display = "";
        chatInput.focus();
        setTimeout(() => chatInput.value = "");
    }
    if ([..."123456789"].includes(ev.key) && player.container === ContainerIds.NONE) player.handIndex = ev.key - 1;
    if ((ev.key.toLowerCase() === "e" && !pressingKeys.e) || (ev.key === "Escape" && player.container !== ContainerIds.NONE)) {
        if (player.container !== ContainerIds.NONE) {
            const addBack = item => {
                if (item.id === ItemIds.AIR) return;
                item.count = player.inventory.add(item);
                if (item.count) player.dropItem(item);
            };
            addBack(player.cursorInventory.get(0));
            for (let i = 0; i < player.craftingInventory.size; i++) addBack(player.craftingInventory.get(i));
            player.cursorInventory.clear();
            player.craftingInventory.clear();
            player.container = ContainerIds.NONE; // close container packet
        } else player.container = ContainerIds.PLAYER_CONTAINER;
        containerHovering = null;
    }
    pressingKeys[ev.key.toLowerCase()] = true;
    if (ev.key.toLowerCase() === "q" && player.mode !== 3 && player.container !== ContainerIds.NONE) player.dropItemAt(player.handIndex);
    if (ev.key === "Ctrl") ev.preventDefault();
});
addEventListener("keyup", ev => {
    if (onDeathScreen) return pressingKeys = {};
    if (chatState) return pressingKeys = {};
    delete pressingKeys[ev.key.toLowerCase()];
    if (ev.key === " ") {
        if (lastSpace + 400 > Date.now() && player.mode === 1) {
            player.isFlying = !player.isFlying;
            player.velocity.y = 0;
        }
        lastSpace = Date.now();
    }
    if (ev.key.toLowerCase() === "f3") {
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
    actualMouse.x = ev.pageX;
    actualMouse.y = ev.pageY;
    const cursorItem = document.querySelector(".cursor-item");
    cursorItem.style.left = (actualMouse.x - 20) + "px";
    cursorItem.style.top = (actualMouse.y - 20) + "px";
    const hoverInfo = document.querySelector(".hover-info");
    hoverInfo.style.left = (actualMouse.x - 20) + "px";
    hoverInfo.style.top = (actualMouse.y - 20) + "px";
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

(async () => {
    const loadAsset = asset => [Texture, Sound].find(i => i.EXTENSIONS.includes(asset.split(".").reverse()[0])).get("assets/" + asset).wait();
    /*const ASSET_CHUNK = 50;
    const chunks = chunkArray(TextureList, ASSET_CHUNK);
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        await Promise.all(chunk.map(asset => [Texture, Sound].find(i => i.EXTENSIONS.includes(asset.split(".").reverse()[0])).get("assets/" + asset).wait()))
    }*/
    const NewPreload = [
        "blocks/destroy_stage_0.png",
        "blocks/destroy_stage_1.png",
        "blocks/destroy_stage_2.png",
        "blocks/destroy_stage_3.png",
        "blocks/destroy_stage_4.png",
        "blocks/destroy_stage_5.png",
        "blocks/destroy_stage_6.png",
        "blocks/destroy_stage_7.png",
        "blocks/destroy_stage_8.png",
        "blocks/destroy_stage_9.png",
        //...TextureList.filter(i => i.endsWith(".ogg"))
    ];
    for (let i = 0; i < NewPreload.length; i++) {
        const asset = NewPreload[i];
        await loadAsset(asset);
    }
    if (DEBUG_ON) console.clear();
    debug("%cLoaded all preload textures!", "font-size: 20px; color: #00ffff");
})();

addEventListener("wheel", ev => {
    if (chatState || player.container !== ContainerIds.NONE || onDeathScreen) return;
    if (!ev.deltaY) return;
    const zoom = ev.deltaY > 0 ? 1 : -1;
    player.handIndex += zoom;
    if (player.handIndex >= 9) player.handIndex = 0;
    if (player.handIndex <= -1) player.handIndex = 8;
    /*BLOCK_SIZE -= zoom;
    if (BLOCK_SIZE > 100) BLOCK_SIZE = 100;
    if (BLOCK_SIZE < 4) BLOCK_SIZE = 4;*/
});

player.respawn();