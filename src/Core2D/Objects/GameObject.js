/**
 * @doc Class GameObjects
 * @namespace Root
 * @class GameObjects
 * @author Patrick Faustino Camello
 * @summary That class was made, to compose the EngineHtml5 framework.
 * @Date 15/05/2019
 * @example
 *  Is used to inheritance. Normaly to dynamic game objects 
 * @returns void
 */

import { Sprite } from "../Graphics/Sprite.js";
import { Vector2D } from "../../CoreCross/Math/Vector2D.js";
import { Collide2D } from "../Collision/Collide2D.js";
import { Base } from "../../CoreCross/Base.js";
import { Util } from "../../CoreCross/Utils.js";
import { DEBUG } from "../../CoreCross/Engine.js";

/**
 * Base movable 2D entity with sprite, collision and component support.
 *
 * Extend it for game-specific players, enemies and interactive objects.
 */
export class GameObject extends Base {
    constructor() {
        super();
        this.id = Util.NewUUIDv4();
        this.hspeed = 64;
        this.vspeed = 64;
        this.solid = true;
        this.position = new Vector2D(0, 0);
        this.previousPosition = this.position;
        this.startPosition = this.position;
        this.size = new Vector2D(0, 0);
        this.direction = 90;
        this.friction = 0.5;
        this.gravity = 9.80665; // Força da gravidade
        this.gravityDirection = 180;
        this.deth = null;
        this.danping = 0.5;
        this.mass = null;

        this.sprite = new Sprite();
        this.components = [];

        this.Tag = "Entity";
        this.name = "Drako";
    }

    AddComponent(component) {
        if (!component) return null;

        component.Attach?.(this);
        component.owner ??= this;
        this.components.push(component);
        return component;
    }

    GetComponent(typeOrName) {
        return this.components.find(component => {
            if (typeof typeOrName === "string") return component.constructor.name === typeOrName;
            return component instanceof typeOrName;
        }) ?? null;
    }

    RemoveComponent(typeOrInstance) {
        const index = this.components.findIndex(component => (
            component === typeOrInstance
            || (typeof typeOrInstance === "string" && component.constructor.name === typeOrInstance)
            || (typeof typeOrInstance === "function" && component instanceof typeOrInstance)
        ));

        if (index < 0) return null;

        const [component] = this.components.splice(index, 1);
        component.Detach?.();
        return component;
    }

    OnStart() {
        super.OnStart(); // Call standardized Base lifecycle
        this.components.forEach(c => { if (c.enabled !== false) c.OnStart?.(); });
    }

    OnUpdate(deltaTime) {
        this.isMoving ? this.sprite.Update(deltaTime) : this.sprite.Reset();
        this.components.forEach(c => { if (c.enabled !== false) c.OnUpdate?.(deltaTime); });
    }

    OnFixedUpdate(deltaTime) {
        this.components.forEach(c => { if (c.enabled !== false) c.OnFixedUpdate?.(deltaTime); });
    }

    OnDrawn() {
        this.components.forEach(c => { if (c.enabled !== false) c.OnDrawn?.(); });
    }

    OnCollision(other, callback) {
        if (other instanceof GameObject && Collide2D.isCollidingAABB(this, other)) {
            return () => callback;
        }
    };

    _debugRect(x, y, width, height, color = "#00FF00") {
        if (DEBUG()) {
            this.draw.Style = this.draw.TYPES.STROKED;
            this.draw.Color = color;
            this.draw.DrawRect(x, y, width, height);
            this.draw.Color = "#FFFFFF";
            this.draw.Style = this.draw.TYPES.FILLED;
        }
    }
}
