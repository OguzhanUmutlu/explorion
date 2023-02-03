class Perlin {
    gradients = {};
    memory = {};

    static vec() {
        const theta = Math.random() * 2 * Math.PI;
        return {x: Math.cos(theta), y: Math.sin(theta)};
    };

    dot(x, y, vx, vy) {
        const vec = this.gradients[[vx, vy]] || Perlin.vec();
        if (!this.gradients[[vx, vy]]) this.gradients[[vx, vy]] = vec;
        return (x - vx) * vec.x + (y - vy) * vec.y;
    };

    static interpolate(x, a, b) {
        return a + 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3 * (b - a);
    };

    get(x, y) {
        if (this.memory[[x, y]]) return this.memory[[x, y]];
        let xf = Math.floor(x);
        let yf = Math.floor(y);
        let tl = this.dot(x, y, xf, yf);
        let tr = this.dot(x, y, xf + 1, yf);
        let bl = this.dot(x, y, xf, yf + 1);
        let br = this.dot(x, y, xf + 1, yf + 1);
        let xt = Perlin.interpolate(x - xf, tl, tr);
        let xb = Perlin.interpolate(x - xf, bl, br);
        let v = Perlin.interpolate(y - yf, xt, xb);
        this.memory[[x, y]] = v;
        return v;
    };
}