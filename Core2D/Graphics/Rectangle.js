/**
 * Axis-aligned 2D rectangle used for canvas layout and collision bounds.
 *
 * @param {number} x - Left coordinate.
 * @param {number} y - Top coordinate.
 * @param {number} width - Rectangle width.
 * @param {number} height - Rectangle height.
 */
export class Rectangle {
    constructor(_x, _y, _width, _height) {
        this.x = _x;
        this.y = _y;
        this.width = _width;
        this.height = _height;
    }
}
