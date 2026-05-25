import { Vector2D } from "../Math/Vector2D.js";

/**
 * @doc Class Touch
 * @namespace Input
 * @class Touch
 * @author Patrick Faustino Camello
 * @summary Manages touch input for the game framework.
 * @Date 15/05/2019
 * @example
 * const touch = new Touch();
 * // Touch event listeners are automatically added
 * @returns {Object}
 */
export class Touch {
    constructor() {
        this.touchStartPosition = new Vector2D(0, 0);
        this.touchEndPosition = new Vector2D(0, 0);

        this.touchStartHandler = this.touchStartHandler.bind(this);
        this.touchEndHandler = this.touchEndHandler.bind(this);
        this.touchMoveHandler = this.touchMoveHandler.bind(this);

        window.addEventListener('touchstart', this.touchStartHandler);
        window.addEventListener('touchend', this.touchEndHandler);
        window.addEventListener('touchmove', this.touchMoveHandler);

        if (!Touch.instance) Touch.instance = this;
        return Touch.instance;
    }

    /**
     * @doc Method
     * @description Handles the touch start event and updates the start position.
     * @param {TouchEvent} event - The touch start event
     * @example
     * // Automatically handled by the class
     */
    touchStartHandler(event) {
        const touch = event.touches[0];
        this.touchStartPosition.x = touch.clientX;
        this.touchStartPosition.y = touch.clientY;
    }

    /**
     * @doc Method
     * @description Handles the touch end event and updates the end position.
     * @param {TouchEvent} event - The touch end event
     * @example
     * // Automatically handled by the class
     */
    touchEndHandler(event) {
        const touch = event.changedTouches[0];
        this.touchEndPosition.x = touch.clientX;
        this.touchEndPosition.y = touch.clientY;
    }

    /**
     * @doc Method
     * @description Handles the touch move event and updates the position.
     * @param {TouchEvent} event - The touch move event
     * @example
     * // Automatically handled by the class
     */
    touchMoveHandler(event) {
        const touch = event.touches[0];
        this.touchStartPosition.x = touch.clientX;
        this.touchStartPosition.y = touch.clientY;
    }

    /**
     * @doc Method
     * @description Gets the touch start position.
     * @returns {Vector2D} - The start position of the last touch
     * @example
     * const startPosition = touch.getTouchStartPosition();
     * console.log(startPosition.x, startPosition.y);
     */
    getTouchStartPosition() {
        return this.touchStartPosition;
    }

    /**
     * @doc Method
     * @description Gets the touch end position.
     * @returns {Vector2D} - The end position of the last touch
     * @example
     * const endPosition = touch.getTouchEndPosition();
     * console.log(endPosition.x, endPosition.y);
     */
    getTouchEndPosition() {
        return this.touchEndPosition;
    }
}
