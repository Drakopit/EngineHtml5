/**
 * @doc Class Vector2D
 * @namespace Math
 * @class Vector2D
 * @author Patrick Faustino Camello
 * @summary That class was made, to compose the EngineHtml5 framework.
 * @Date 15/05/2019
 * @example
 *  var vector2D = new Vector2D(0, 0);
 * @returns {Object}
 */

export class Vector2D {
    constructor(x, y) {
        this.x = (x !== undefined) ? x : 0;
        this.y = (y !== undefined) ? y : 0;
    }

    /**
     * @doc Method
     * @description Get value x and y of Vector
     * @example
     *  var position = vector2D.Value();
     * @returns Vector2D(x, y)
     */
    GetValue() {
        return new Vector2D(this.x, this.y);
    }

    /**
     * @doc Method
     * @description Set value in Vector
     * @example
     *  vector2D.Value(100, 150);
     * @returns void
     */
    SetValue(x, y) {
        this.x = x;
        this.y = y;
    }

    AddValue(vector2D) {
        return new Vector2D(this.x + vector2D.GetValue().x, this.y + vector2D.GetValue().y);
    }

    SubtractValue(vector2D) {
        return new Vector2D(this.x - vector2D.GetValue().x, this.y - vector2D.GetValue().y);
    }
}