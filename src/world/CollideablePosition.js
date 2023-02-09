class CollideablePosition extends Position {
    collision = collisionPlaceholder;

    /*** @param {CollideablePosition} col */
    collides(col) {
        return this.collision.collides(col.collision, this, col);
    };

    /*** @param {Vector} vector */
    collidesPoint(vector) {
        return this.collision.collidesPoint(this, vector);
    };
}