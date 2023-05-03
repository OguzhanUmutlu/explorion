/**
 * @param {string} sel
 * @param {Entity} target
 * @returns {Entity[] | string}
 */
const parseSelector = (sel, target) => {
    sel = (sel || "").substring(1);
    if (![..."arsep"].includes(sel[0])) return "Invalid selector.";
    /*** @type {Entity[]} */
    let entities = [];
    switch (sel[0]) {
        case "a":
            entities = target.world.entities.filter(i => i instanceof Player);
            break;
        case "r":
            const p = target.world.entities.filter(i => i instanceof Player);
            entities = [p[rand(0, p.length - 1)]];
            break;
        case "s":
            entities = [target];
            break;
        case "e":
            entities = [...target.world.entities];
            break;
        case "p":
            if (target instanceof Player) entities = [target];
            else {
                const nearest = target.world.entities
                    .filter(i => i instanceof Player)
                    .sort((a, b) => a.distance(target) - b.distance(target))[0];
                entities = nearest ? [nearest] : [];
            }
            break;
    }
    sel = sel.substring(1);
    if (sel) {
        let props = {};
        try {
            props = JSON.parse(sel);
        } catch (e) {
            return "JSON Error: " + e.toString();
        }
        const keys = Object.keys(props);
        for (let i = 0; i < keys.length; i++) {
            if (!entities.length) break;
            const p = keys[i];
            let v = props[p];
            switch (p.toLowerCase()) {
                case "type":
                    const id = EntityIds[v.toUpperCase()];
                    if (!id) return "Invalid entity type: " + v;
                    entities = entities.filter(i => i.TYPE === id);
                    break;
                case "min" + "distance":
                    v *= 1;
                    if (isNaN(v)) return "Invalid minDistance.";
                    entities = entities.filter(i => i.distance(target) >= v);
                    break;
                case "max" + "distance":
                    v *= 1;
                    if (isNaN(v)) return "Invalid maxDistance.";
                    entities = entities.filter(i => i.distance(target) <= v);
                    break;
                case "min" + "x":
                    v *= 1;
                    if (isNaN(v)) return "Invalid minX.";
                    entities = entities.filter(i => i.x >= v);
                    break;
                case "max" + "x":
                    v *= 1;
                    if (isNaN(v)) return "Invalid maxX.";
                    entities = entities.filter(i => i.x <= v);
                    break;
                case "min" + "y":
                    v *= 1;
                    if (isNaN(v)) return "Invalid minY.";
                    entities = entities.filter(i => i.y >= v);
                    break;
                case "max" + "y":
                    v *= 1;
                    if (isNaN(v)) return "Invalid maxY.";
                    entities = entities.filter(i => i.y <= v);
                    break;
                case "limit":
                    v *= 1;
                    if (isNaN(v)) return "Invalid limit.";
                    entities = entities.slice(0, v);
                    break;
                case "sort":
                    v = v.toLowerCase();
                    if (!["nearest", "furthest", "random", "arbitrary"].includes(v)) return "Invalid sort.";
                    switch (v) {
                        case "nearest":
                            entities.sort((a, b) => a.distance(target) - b.distance(target));
                            break;
                        case "furthest":
                            entities.sort((a, b) => b.distance(target) - a.distance(target));
                            break;
                        case "random":
                            entities.sort(() => Math.random() > 0.5 ? 1 : -1);
                            break;
                    }
                    break;
                case "nbt":
                    if (typeof v !== "object") return "Invalid nbt.";
                    const keys = Object.keys(v);
                    entities = entities.filter(i => keys.every(k => i.nbt[k] === v[k]));
                    break;
            }
        }
    }
    return entities;
};
/**
 * @param {string | number} x
 * @param {string | number} y
 * @param {Entity} target
 * @returns {[number, number] | string}
 */
const parsePosition = (x, y, target) => {
    x = x || "";
    y = y || "";
    if (x.startsWith("~")) x = x.substring(1) * 1 + target.x;
    if (y.startsWith("~")) y = y.substring(1) * 1 + target.y;
    x *= 1;
    y *= 1;
    if (isNaN(x) || isNaN(y)) return "Invalid position.";
    return [x, y];
};

const commands = {};

/**
 * @param {string} name
 * @param {(args: string[], target: Entity) => string | false} run
 * @param {string} description
 * @param {string | Function} usage
 */
const registerCommand = (name, run, description, usage) => {
    commands[name] = {run, description, usage};
};

/**
 * @param {string} msg
 * @param {Entity} entity
 */
const runCommand = (msg, entity) => {
    const args = msg.split(" ").slice(1);
    const cmdName = msg.split(" ")[0].substring(1);
    const cmd = commands[cmdName];
    if (!cmd) return writeOut("Commands: help, " + Object.keys(commands).join(", "));
    const res = cmd.run(args, entity);
    if (typeof res === "string") writeOut(res);
    else if (res === false) writeOut("Usage: " + (typeof cmd.usage === "string" ? cmd.usage : cmd.usage(entity)));
};

registerCommand("kill", (args, target) => {
    if (args.length === 0) {
        target.kill();
        return "Killed " + target.name + ".";
    } else if (args.length === 1) {
        const entities = parseSelector(args[0], target);
        if (typeof entities === "string") return entities;
        entities.forEach(i => i.kill());
        return "Killed " + entities.length + " entities.";
    } else return false;
}, "Kills entities.", "/kill OR /kill @selector");

registerCommand("tp", (args, target) => {
    if (args.length === 1) {
        if (args[0][0] === "@") {
            const a = parseSelector(args[0], target);
            if (typeof a === "string") return a;
            if (a.length !== 1) return "Target entity should be a single entity.";
            target.set(a[0]);
            return "You have been teleported to " + a[0].nametag;
        } else return false;
    } else if (args.length === 2) {
        if (args[0][0] === "@" && args[1][0] === "@") {
            const a = parseSelector(args[0], target);
            if (typeof a === "string") return a;
            const b = parseSelector(args[1], target);
            if (typeof b === "string") return b;
            if (b.length !== 1) return "Target entity should be a single entity.";
            a.filter(i => i !== b[0]).forEach(i => i.set(b[0]));
            return "Teleported " + a.length + " entities to " + b[0].nametag;
        } else if (args[0][0] !== "@" && args[1][0] !== "@") {
            const pos = parsePosition(args[0], args[1], target);
            if (typeof pos === "string") return pos;
            target.set(new Vector(...pos));
            return "You have been teleported to (" + pos[0] + ", " + pos[1] + ")";
        } else return false;
    } else if (args.length === 3) {
        if (args[0][0] === "@" && args[1][0] !== "@" && args[2][0] !== "@") {
            const a = parseSelector(args[0], target);
            if (typeof a === "string") return a;
            const b = parsePosition(args[1], args[2], target);
            if (typeof b === "string") return b;
            a.forEach(i => i.set(new Vector(...b)));
            return "Teleported " + a.length + " entities to (" + b[0] + ", " + b[1] + ")";
        } else return false;
    } else return false;
}, "Teleports entities.", "/tp <x> <y> OR /tp @selector OR /tp @selector <x> <y> OR /tp @selector @selector");

registerCommand("time", (args, target) => {
    let t;
    switch (args[0]) {
        case "add":
            t = args[1] * 1;
            if (isNaN(t)) return "Invalid time.";
            target.world.time += t;
            return "Added " + t + " ticks to time.";
        case "query":
            switch (args[1]) {
                case "daytime":
                    return "The day time: " + floor(target.world.time);
                case "gametime":
                    return "The game time is: " + floor(target.world.timeTicks);
                case "day":
                    return "The days passed: " + floor(target.world.day);
                default:
                    return false;
            }
        case "set":
            t = {day: 1, night: 8000, noon: 6000, midnight: 10000}[args[1]] || args[1] * 1;
            if (isNaN(t)) return "Invalid time.";
            target.world.time = t;
            return "Time is now set to " + t + ".";
        default:
            return false;
    }
}, "Manages time.", "/time add <time> OR /time query (daytime|gametime|day) OR /time set (day|night|noon|midnight) OR /time set <time>");

registerCommand("gamemode", (args, target) => {
    let gm = {survival: 0, creative: 1, adventure: 2, spectator: 3}[args[0].toLowerCase()] + 1;
    if (!gm) return false;
    gm--;
    if (args.length === 1) {
        target.mode = gm;
    } else if (args.length === 2) {
        /*** @type {string | Player[]} */
        const a = parseSelector(args[1], target);
        if (typeof a === "string") return a;
        if (a.some(i => !(i instanceof Player))) return "Non-players can't have game modes.";
        a.forEach(i => i.mode = gm);
        return "Set " + a.length + " entities' gamemode to " + args[0].toLowerCase() + ".";
    } else return false;
}, "Sets the game mode of a player.", "Usage: /gamemode <gamemode> OR /gamemode <gamemode> @selector");

registerCommand("blocksize", (args) => {
    const s = args[0] * 1;
    if (isNaN(s) || s < 0) return false;
    BLOCK_SIZE = s;
    return "Block size has been changed to " + s + ".";
}, "", "Usage: /blocksize <size>");

registerCommand("summon", (args, target) => {
    if (!args[0]) return false;
    const e = EntityIds[args[0].toUpperCase().split("{")[0]];
    if (!e) return "Invalid entity type.";
    let nb2 = {};
    if (args[0].includes("{")) {
        try {
            nb2 = JSON.parse("{" + args[0].split("{").slice(1).join("{"));
        } catch (e) {
            return "JSON Error: " + e.toString();
        }
    }
    if (typeof nb2 !== "object") return "Invalid NBT.";
    if (args.length === 1) {
        target.world.summonEntity(e, target.x, target.y, nb2);
        return "Summoned a(n) " + args[0].toLowerCase() + " at (" + target.x + ", " + target.y + ")";
    } else if (args.length === 2) {
        const a = parseSelector(args[1], target);
        if (typeof a === "string") return a;
        if (a.length !== 1) return "Target entity should be a single entity.";
        target.world.summonEntity(e, a[0].x, a[0].y, nb2);
        return "Summoned a(n) " + args[0].toLowerCase() + " at (" + a[0].x + ", " + a[0].y + ").";
    } else if (args.length === 3) {
        const a = parsePosition(args[1], args[2], target);
        if (typeof a === "string") return a;
        target.world.summonEntity(e, a[0] * 1, a[1] * 1, nb2);
        return "Summoned a(n) " + args[0].toLowerCase() + " at (" + a[0] + ", " + a[1] + ").";
    } else return false;
}, "Summons entities.", "Usage: /summon <entity> OR /summon <entity> <x> <y> OR /summon <entity> @selector");

registerCommand("setblock", (args, target) => {
    if (args.length !== 1 && args.length !== 3) return false;
    if (args[0].includes(":") && args[0].split(":").length !== 1) return false;
    let b = ItemIds[args[0].toUpperCase().split(":")[0]] + 1;
    if (!b) return "Invalid block.";
    b--;
    let meta = (args[0].split(":")[1] || "0") * 1 + 1;
    if (!meta) return "Invalid block meta.";
    meta--;
    if (args.length === 1) {
        target.world.setBlock(target.x, target.y, b, meta);
        return "Block at (" + target.x + ", " + target.y + ") has been changed to " + b + ".";
    } else if (args.length === 3) {
        const pos = parsePosition(args[1], args[2], target);
        if (typeof pos === "string") return pos;
        target.world.setBlock(pos[0] * 1, pos[1] * 1, b, meta);
        return "Block at (" + pos[0] + ", " + pos[1] + ") has been changed to " + b + ".";
    } else return false;
}, "Sets blocks in the world.", "Usage: /setblock <block> OR /setblock <block> <x> <y>");

registerCommand("fill", (args, target) => {
    if (args.length < 5) return false;
    const pos1 = parsePosition(args[0], args[1], target);
    if (typeof pos1 === "string") return pos1;
    const pos2 = parsePosition(args[2], args[3], target);
    if (typeof pos2 === "string") return pos2;
    let b = ItemIds[(args[4] || "").toUpperCase().split(":")[0]] + 1;
    if (!b) return "Invalid block.";
    b--;
    if (args[4].includes(":") && args[4].split(":").length !== 1) return false;
    let met = ((args[4] || "").split(":")[1] || "0") * 1 + 1;
    if (!met) return "Invalid block meta.";
    met--;
    const method = (args[5] || "").toLowerCase() || "set";
    if (!["set", "destroy", "keep", "replace"].includes(method)) return "Invalid method.";
    let replaceWith = [0, 0];
    if (method === "replace") {
        replaceWith[0] = ItemIds[(args[6] || "").toUpperCase().split(":")[0]] + 1;
        if (!replaceWith[0]) return "Invalid block.";
        replaceWith[0]--;
        if (args[6].includes(":") && args[6].split(":").length !== 1) return false;
        replaceWith[1] = ((args[6] || "").split(":")[1] || "0") * 1 + 1;
        if (!replaceWith[1]) return "Invalid block meta.";
        replaceWith[1]--;
    }
    const minX = min(pos1[0], pos2[0]);
    const maxX = max(pos1[0], pos2[0]);
    const minY = min(pos1[1], pos2[1]);
    const maxY = max(pos1[1], pos2[1]);
    let action;
    let amount = 0;
    switch (method) {
        case "set":
            action = (x, y) => {
                target.world.setBlock(x, y, b, met);
                amount++;
            };
            break;
        case "destroy":
            action = (x, y) => {
                target.world.getBlock(x, y).break(null);
                target.world.setBlock(x, y, b, met);
                amount++;
            };
            break;
        case "keep":
            action = (x, y) => {
                if (target.world.getBlockId(x, y) === ItemIds.AIR) {
                    target.world.setBlock(x, y, b, met);
                    amount++;
                }
            };
            break;
        case "replace":
            action = (x, y) => {
                const inf = target.world.getBlockInfo(x, y);
                if (inf[0] === replaceWith[0] && inf[1] === replaceWith[1]) {
                    target.world.setBlock(x, y, b, met);
                    amount++;
                }
            };
            break;
    }
    for (let x = minX; x <= maxX; x++) for (let y = minY; y <= maxY; y++) action(x, y);
    return "Successfully filled " + amount + " blocks.";
}, "Fills the given range of blocks.", "Usage: /fill <x1> <y1> <x2> <y2> <block> (set|destroy|keep) OR /fill <x1> <y1> <x2> <y2> <block> replace <block>");

registerCommand("gamerule", (args, target) => {
    if (!Object.keys(target.world.gameRules).includes(args[0])) return false;
    if (args.length === 1) return "The game rule " + args[0] + " is set to " + target.world.gameRules[args[0]] + ".";
    if (args.length !== 2) return false;
    switch (typeof target.world.gameRules[args]) {
        case "boolean":
            if (!["true", "false"].includes(args[1])) return false;
            args[1] = args[1] === "true";
            break;
        case "number":
            if (isNaN(args[1] * 1)) return false;
            args[1] = args[1] * 1;
            break;
    }
    target.world.gameRules[args[0]] = args[1];
    if (args[0] === "randomTickSpeed") target.world.randomTickCooldown = args[1];
    return "The game rule " + args[0] + " has been set to " + args[1];
}, "Sets game rules.", target => "Usage: /gamerule (" + Object.keys(target.world.gameRules).join("|") + ") (true|false)");

registerCommand("give", (args, target) => {
    if ((args.length !== 2 && args.length !== 3) || args[0][0] !== "@") return false;
    const sel = parseSelector(args[0], target);
    if (typeof sel === "string") return sel;
    if (!sel.length) return "No players found.";
    if (sel.some(a => !(a instanceof Player))) return "Can't give items to non-players.";
    const itemId = ItemIds[args[1].toUpperCase()];
    if (!itemId) return "Invalid item.";
    const amo = floor((args[2] || "1") * 1);
    if (isNaN(amo) || amo < 0) return "Invalid amount.";
    let nb = {};
    try {
        nb = JSON.parse(args.slice(3).join(" ") || "{}");
    } catch (e) {
        return "JSON Error: " + e.toString();
    }
    if (typeof nb !== "object") return "Invalid NBT.";
    const item = new Item(itemId, amo, nb);
    sel.forEach(i => i instanceof Player && i.inventory.add(item));
    return amo + " " + item.name + " has been given to " + (sel.length === 1 ? sel[0].nametag : sel.length + " players") + ".";
}, "Gives an item to a player.", "Usage: /give @selector <item> <amount> <nbt>");

registerCommand("clear", (args, target) => {
    if (args.length === 0) {
        if (!(target instanceof Player)) return "The target should be a player.";
        target.clear();
        return "Your inventory has been cleared.";
    } else if (args.length === 1) {
        const sel = parseSelector(args[0], target);
        if (sel.length === 0) return "No player was selected.";
        if (sel.some(i => !(i instanceof Player))) return "Can't clear inventories of non-players.";
        sel.forEach(i => i.clear());
        return "Cleared " + sel.length + " entities' inventories.";
    } else return false;
}, "Gives an item to a player.", "Usage: /clear <selector>");