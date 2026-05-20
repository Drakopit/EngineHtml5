/**
 * @doc Class Camera
 * @namespace Root
 * @class Camera
 * @author Patrick Faustino Camello
 * @summary Represents the camera in the game world.
 * @description Manages the view of the game world, including zoom, position, and screen translation.
 * @Date 15/05/2019
 * @example
 *  const camera = new Camera(new Vector2D(0, 0), new Vector2D(800, 600)); 
 * @returns {void}
 */

import { Draw } from "../Graphics/Draw.js";
import { Vector2D } from "../../CoreCross/Math/Vector2D.js";
import { Base } from "../../CoreCross/Base.js";

export class Camera extends Base {
    /**
     * @doc Constructor
     * @param {Vector2D} position - Initial position of the camera.
     * @param {Vector2D} size - Size of the camera view.
     * @description Initializes the camera with a given position and size.
     */
    constructor(position, size) {
        super();
        this.position = position;
        this.size = size;
        this.zoom = 1;
        this.GameWorld = null;
        this.screen = null;
        this.draw = null;
        this.shake = {
            remaining: 0,
            duration: 0,
            intensity: 0,
            frequency: 36,
            elapsed: 0,
            offset: new Vector2D(0, 0),
        };
    }

    /**
     * @doc Method
     * @param {Object} screen - The screen or canvas where the game is rendered.
     * @param {Object} GameWorld - The game world object.
     * @description Initializes the camera with screen and game world.
     */
    Init(screen, GameWorld) {
        this.GameWorld = GameWorld;
        this.screen = screen;
        this.draw = new Draw(this.screen);
    }

    /**
     * @doc Method
     * @param {Object} Obj - The object to center the camera on.
     * @description Centers the camera view on the given object.
     */
    LookAt(Obj) {
        this.position = Obj.position.SubtractValue(new Vector2D(
            (this.size.GetValue().x * 0.5) * this.zoom,
            (this.size.GetValue().y * 0.5) * this.zoom
        ));
    }

    /**
     * @doc Method
     * @param {number} value - Zoom factor.
     * @description Zooms in by a given factor.
     */
    ZoomIn(value) {
        this.zoom *= value;
        this.size = new Vector2D(
            this.size.GetValue().x * this.zoom,
            this.size.GetValue().y * this.zoom
        );
    }

    /**
     * @doc Method
     * @param {number} value - Zoom factor.
     * @description Zooms out by a given factor.
     */
    ZoomOut(value) {
        this.zoom /= value;
        this.size = new Vector2D(
            this.size.GetValue().x / this.zoom,
            this.size.GetValue().y / this.zoom
        );
    }

    /**
     * @doc Method
     * @description Constrains the camera within the game world boundaries.
     */
    StrictLimit() {
        const worldWidth = this.GameWorld.width;
        const worldHeight = this.GameWorld.height;
        const cameraWidth = this.size.GetValue().x;
        const cameraHeight = this.size.GetValue().y;

        // Clamp the position to ensure the camera stays within the world bounds
        this.position.x = Math.max(0, Math.min(this.position.x, worldWidth - cameraWidth));
        this.position.y = Math.max(0, Math.min(this.position.y, worldHeight - cameraHeight));
    }

    /**
     * @doc Method
     * @description Begins camera transformation for rendering.
     */
    Begin() {
        if (this.screen && this.screen.Context) {
            this.screen.Context.save();
            this.screen.Context.translate(
                -this.position.x + this.shake.offset.x,
                -this.position.y + this.shake.offset.y
            );
        }
    }

    /**
     * @doc Method
     * @description Ends camera transformation after rendering.
     */
    End() {
        if (this.screen && this.screen.Context) {
            this.screen.Context.restore();
        }
    }

    /**
     * @doc Method
     * @param {Object} char - The character or object to focus the camera on.
     * @description Updates the camera position and zoom based on the given object.
     */
    Update(char, deltaTime = 1 / 60) {
        this.LookAt(char);
        this.StrictLimit();
        this.UpdateShake(deltaTime);
    }

    Shake(duration = 0.1, intensity = 4, frequency = 36) {
        const normalizedDuration = Math.max(0, duration);
        if (normalizedDuration <= 0 || intensity <= 0) return;

        this.shake.remaining = Math.max(this.shake.remaining, normalizedDuration);
        this.shake.duration = Math.max(this.shake.duration, normalizedDuration);
        this.shake.intensity = Math.max(this.shake.intensity, intensity);
        this.shake.frequency = frequency;
        this.ApplyShakeOffset();
    }

    UpdateShake(deltaTime = 1 / 60) {
        if (this.shake.remaining <= 0) {
            this.shake.offset.x = 0;
            this.shake.offset.y = 0;
            this.shake.duration = 0;
            this.shake.intensity = 0;
            return;
        }

        this.shake.elapsed += deltaTime;
        this.shake.remaining = Math.max(0, this.shake.remaining - deltaTime);
        this.ApplyShakeOffset();
    }

    ApplyShakeOffset() {
        const progress = this.shake.duration > 0
            ? this.shake.remaining / this.shake.duration
            : 0;
        const strength = this.shake.intensity * progress;
        const wave = this.shake.elapsed * this.shake.frequency;

        this.shake.offset.x = Math.sin(wave) * strength;
        this.shake.offset.y = Math.cos(wave * 1.37) * strength * 0.65;
    }

    /**
     * @doc Method
     * @returns {number} - The left edge position of the camera view.
     */
    LeftEdge() {
        return this.size.GetValue().x * 0.25;
    }

    /**
     * @doc Method
     * @returns {number} - The right edge position of the camera view.
     */
    RightEdge() {
        return this.size.GetValue().x * 0.75;
    }

    /**
     * @doc Method
     * @returns {number} - The top edge position of the camera view.
     */
    TopEdge() {
        return this.size.GetValue().y * 0.25;
    }

    /**
     * @doc Method
     * @returns {number} - The bottom edge position of the camera view.
     */
    BottomEdge() {
        return this.size.GetValue().y * 0.75;
    }
}
