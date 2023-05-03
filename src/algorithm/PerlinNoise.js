class PerlinNoise {
    static interpolate(a0, a1, w) {
        return (a1 - a0) * w + a0;
    };

    static randomGradient() {
        const theta = random() * 2 * PI;
        return {x:  cos(theta), y: sin(theta)};
    };

    static dotGridGradient(ix, iy, x, y) {
        const gradient = PerlinNoise.randomGradient(ix, iy);
        return ((x - ix) * gradient.x + (y - iy) * gradient.y);
    };

    static perlin(x, y) {
        const x0 = floor(x);
        const x1 = x0 + 1;
        const y0 = floor(y);
        const y1 = y0 + 1;
        const sx = x - x0;
        const sy = y - y0;
        let n0, n1, ix0, ix1, value;
        n0 = PerlinNoise.dotGridGradient(x0, y0, x, y);
        n1 = PerlinNoise.dotGridGradient(x1, y0, x, y);
        ix0 = PerlinNoise.interpolate(n0, n1, sx);
        n0 = PerlinNoise.dotGridGradient(x0, y1, x, y);
        n1 = PerlinNoise.dotGridGradient(x1, y1, x, y);
        ix1 = PerlinNoise.interpolate(n0, n1, sx);
        value = PerlinNoise.interpolate(ix0, ix1, sy);
        return value;
    };
}

const generateSeed = s => {
    let mask = 0xffffffff;
    let m_w = (123456789 + s) & mask;
    let m_z = (987654321 - s) & mask;

    return function () {
        m_z = (36969 * (m_z & 65535) + (m_z >>> 16)) & mask;
        m_w = (18000 * (m_w & 65535) + (m_w >>> 16)) & mask;
        return (((m_z << 16) + (m_w & 65535)) >>> 0) / 4294967296;
    }
};