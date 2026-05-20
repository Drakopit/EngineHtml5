/**
 * @doc Class MathExt
 * @namespace Math
 * @class MathExt
 * @author Patrick Faustino Camello
 * @summary That class was made, to compose the EngineHtml5 framework.
 * @Date 15/05/2019
 * @example
 *  This is a static class, you can just use his functions 
 * @returns void
 */

import { Vector2D } from "./Vector2D.js";

export class MathExt {
    constructor() {}

    static Distance(p1, p2) {
        let distX = p1.position.GetValue().x - p2.position.GetValue().x
        let distY = p1.position.GetValue().y - p2.position.GetValue().y;
        return this.Module(distX + distY);
    }

    static DistanceVector(p1, p2) {
        let distX = (p1.position.GetValue().x - p2.position.GetValue().x);
        let distY = (p1.position.GetValue().y - p2.position.GetValue().y);
        return new Vector2D(this.Module(distX), this.Module(distY));
    }

    static Module(value) {
        return (value < 0) ? value * -1 : value;
    }

    /**
     * @doc Method
     * @description Interpolação linear entre dois valores.
     * @param {number} a - Valor inicial.
     * @param {number} b - Valor final.
     * @param {number} t - Fator de interpolação (0..1).
     * @returns {number}
     */
    static Lerp(a, b, t) {
        return a + (b - a) * Math.min(Math.max(t, 0), 1);
    }

    /**
     * @doc Method
     * @description Lerp com snap: quando a diferença for menor que threshold, retorna b diretamente.
     *              Evita oscilação infinita no final da animação.
     * @param {number} a
     * @param {number} b
     * @param {number} t
     * @param {number} threshold
     * @returns {number}
     */
    static LerpSnap(a, b, t, threshold = 0.5) {
        const result = this.Lerp(a, b, t);
        return Math.abs(result - b) < threshold ? b : result;
    }
}