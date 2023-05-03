class CustomGenerator extends ChunkGenerator {
    preset = {};

    generate(chunk, chunkX) {
        const {setBlock, getBlock, addEntity, addTile} = super.generate(chunk, chunkX);
        for (let x = 0; x < 16; x++) {
            const worldX = chunkX * 16 + x;
            let p = 0;
            const rn = () => sin(this.seed * worldX * (++p)) / 2 + 0.5;
            Object.keys(this.preset).forEach(y => {
                const v = this.preset[y];
                let id;
                if (typeof v === "number") {
                    id = v;
                } else if (typeof v === "object") {
                    if (rn() > v[1]) {
                        if (!v[2]) return;
                        id = v[2];
                    }
                    id = v[0];
                }
                if (id) setBlock(x, y * 1, id);
            });
        }
        return {setBlock, getBlock, addEntity, addTile};
    };
}