class Perlin {
    static interpolate(a0, a1, w) {
        return (a1 - a0) * w + a0;
    };

    static randomGradient(ix, iy) {
        const theta = Math.random() * 2 * Math.PI;
        return { x: Math.cos(theta), y: Math.sin(theta) };
    };

    static dotGridGradient(ix, iy, x, y) {
        const gradient = Perlin.randomGradient(ix, iy);
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
        n0 = Perlin.dotGridGradient(x0, y0, x, y);
        n1 = Perlin.dotGridGradient(x1, y0, x, y);
        ix0 = Perlin.interpolate(n0, n1, sx);
        n0 = Perlin.dotGridGradient(x0, y1, x, y);
        n1 = Perlin.dotGridGradient(x1, y1, x, y);
        ix1 = Perlin.interpolate(n0, n1, sx);
        value = Perlin.interpolate(ix0, ix1, sy);
        return value;
    };
}