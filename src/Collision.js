class Collision {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    get minX() {
        return this.x;
    };

    get maxX() {
        return this.x + this.w;
    };

    get minY() {
        return this.y;
    };

    get maxY() {
        return this.y + this.h;
    };

    collides(col, p1, p2) {
        return this.x + p1.x + this.w > col.x + p2.x &&
            col.x + p2.x + col.w > this.x + p1.x &&
            this.y + p1.y + this.h > col.y + p2.y &&
            col.y + p2.y + col.h > this.y + p1.y;
    };

    collidesPoint(p1, p2) {
        return this.x + p1.x + this.w > p2.x &&
            p2.x > this.x + p1.x &&
            this.y + p1.y + this.h > +p2.y &&
            p2.y > this.y + p1.y;
    };

    expand(sx, sy) {
        const {x, y, w, h} = this;
        //this.x = x - w/2;
        //this.w = 2*w;
        //this.y = y - h/2;
        //this.h = 2*h;
        this.x = x + w / 2 - w / 2 * sx;
        this.w = sx * w;
        this.y = y + h / 2 - h / 2 * sy;
        this.h = sy * h;
        return this;
    };

    clone() {
        return new Collision(this.x, this.y, this.w, this.h);
    };
}

const collisionPlaceholder = new Collision(0, 0, 0, 0);
const blockCollision = new Collision(-.5, -.5, 1, 1);