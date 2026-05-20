/**
 * @doc Class Base
 * @namespace Root
 * @class Physic2D
 * @author Patrick Faustino Camello
 * @summary That class was made, to compose the EngineHtml5 framework.
 * @description Base class, that load all need methods
 * @Date 15/05/2019
 * @example
 *  This is a static class, is used to inheritance 
 * @returns void
 */

export class Base {
    constructor() {
        this.Next = false;
        this.Back = false;
    }
    OnStart() {}
    OnUpdate() {}
    OnFixedUpdate(dt) {}
    OnDrawn() {}
    OnGUI() {}
    OnDestroy() {}
    OnCollision() {}
}
