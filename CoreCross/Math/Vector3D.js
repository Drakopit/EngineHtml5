/**
 * @doc Class Vector3D
 * @namespace Math
 * @class Vector3D
 * @author Patrick Faustino Camello
 * @summary That class was made, to compose the EngineHtml5 framework.
 * @Date 15/05/2019
 * @example
 *  var vector3D = new Vector3D(0, 0, 0);
 * @returns {Object}
 */

export class Vector3D {
    constructor(x, y, z) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
    }

    static FromArray(values = [0, 0, 0]) {
        return new Vector3D(values[0], values[1], values[2]);
    }

    /**
     * @doc Method
     * @description Get value x, y and z of Vector
     * @example
     *  var position = vector3D.Value();
     * @returns new Vector3D(x, y, z)
     */
    GetValue() {
        return new Vector3D(this.x, this.y, this.z);
    }

    ToArray() {
        return [this.x, this.y, this.z];
    }

    /**
     * @doc Method
     * @description Set value x, y and z of Vector
     * @example
     *  vector3D.Value(100, 150);
     * @returns void
     */
    SetValue(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    AddValue(vector3D) {
        return new Vector3D(this.x + vector3D.GetValue().x, this.y + vector3D.GetValue().y, this.z + vector3D.GetValue().z);
    }

    SubtractValue(vector3D) {
        return new Vector3D(this.x - vector3D.GetValue().x, this.y - vector3D.GetValue().y, this.z - vector3D.GetValue().z);
    }

    DistanceTo(vector3D) {
        const difference = this.SubtractValue(vector3D);
        return Math.hypot(difference.x, difference.y, difference.z);
    }
}
