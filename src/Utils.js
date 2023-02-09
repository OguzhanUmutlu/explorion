const {sqrt, floor, ceil, round, sin, cos, atan2, random, PI, min, max, abs} = Math;
const rand = (min, max) => floor(random() * (max - min + 1)) + min;
const randFloat = (min, max) => random() * (max - min) + min;
const calcRenderX = x => BLOCK_SIZE * (x - player.x) + canvas.width / 2;
const calcRenderY = y => BLOCK_SIZE * -(y - player.y - player.size + 1) + canvas.height / 2;

// TODO: when loading chunks and block enhancements save grass blocks and make them spread in random ticks, make a list like World.randomTickBlocks and Block.randomUpdate
// TODO: blast resistance
// TODO: custom cursor, make it red when there is an enemy, make it green when there is a block
// TODO: blocks shouldn't be hovered when mouse is focused on an enemy
// TODO: ignite TNTs when other TNTs explode
// TODO: tiles
// TODO: sounds, walking sounds, hitting sounds, breaking sounds, placing sounds
/**
 * TODO
 * player.inventory.add(new Item(ItemIds.STONE));player.inventory.add(new Item(ItemIds.STONE));
 * gives two separate stone items
 */
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