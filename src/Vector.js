class Vector {
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    };

    get len() {
        return sqrt(this.x ** 2 + this.y ** 2);
    };

    distance(vector) {
        return sqrt((vector.x - this.x) ** 2 + (vector.y - this.y) ** 2);
    };

    add(vector) {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    };

    sub(vector) {
        this.x -= vector.x;
        this.y -= vector.y;
        return this;
    };

    mul(scale) {
        this.x *= scale;
        this.y *= scale;
        return this;
    };

    div(scale) {
        this.x /= scale;
        this.y /= scale;
        return this;
    };

    ceil() {
        this.x = ceil(this.x);
        this.y = ceil(this.y);
        return this;
    };

    floor() {
        this.x = floor(this.x);
        this.y = floor(this.y);
        return this;
    };

    round() {
        this.x = round(this.x);
        this.y = round(this.y);
        return this;
    };

    set(vector) {
        this.x = vector.x;
        this.y = vector.y;
        return this;
    };

    getDirectionVectorTo(vector) {
        const theta = atan2(vector.y - this.y, vector.x - this.x);
        return new Vector(cos(theta), sin(theta));
    };

    clone() {
        return new Vector(this.x, this.y);
    };
}