import { ActionManager } from "./Input/ActionManager.js";

/**
 * Base attachable behavior unit for composing lightweight game entities.
 *
 * @param {Object} [options] - Component settings.
 * @param {boolean} [options.enabled=true] - Whether the owner should update this component.
 */
export class Component {
    constructor({ enabled = true } = {}) {
        this.owner = null;
        this.enabled = enabled;
    }

    Attach(owner) {
        this.owner = owner;
        if (typeof this.OnAttach === "function") this.OnAttach(owner);
        return this;
    }

    Detach() {
        if (typeof this.OnDetach === "function") this.OnDetach(this.owner);
        this.owner = null;
    }
}

/**
 * Stores 2D position, rotation and scale and can mirror them onto its owner.
 */
export class TransformComponent extends Component {
    constructor({
        x = null,
        y = null,
        rotation = 0,
        scaleX = 1,
        scaleY = 1,
        syncOwner = true,
    } = {}) {
        super();
        this.x = x ?? 0;
        this.y = y ?? 0;
        this.rotation = rotation;
        this.scaleX = scaleX;
        this.scaleY = scaleY;
        this.syncOwner = syncOwner;
        this.hasInitialPosition = x !== null || y !== null;
    }

    OnAttach(owner) {
        if (!this.syncOwner) return;

        if (!this.hasInitialPosition) {
            const pos = ReadOwnerPosition(owner);
            this.x = pos.x;
            this.y = pos.y;
            return;
        }

        WriteOwnerPosition(owner, this.x, this.y);
    }

    SetPosition(x, y) {
        this.x = x;
        this.y = y;
        if (this.syncOwner) WriteOwnerPosition(this.owner, this.x, this.y);
        return this;
    }

    Translate(dx, dy) {
        return this.SetPosition(this.x + dx, this.y + dy);
    }

    CopyFromOwner() {
        const pos = ReadOwnerPosition(this.owner);
        this.x = pos.x;
        this.y = pos.y;
        return this;
    }

    ApplyToOwner() {
        WriteOwnerPosition(this.owner, this.x, this.y);
        return this;
    }
}

/**
 * Applies velocity, gravity and friction to an owner's 2D position.
 */
export class VelocityComponent extends Component {
    constructor({
        vx = 0,
        vy = 0,
        gravity = 0,
        friction = 0,
        maxSpeedX = Infinity,
        maxSpeedY = Infinity,
        useFixedUpdate = false,
    } = {}) {
        super();
        this.vx = vx;
        this.vy = vy;
        this.gravity = gravity;
        this.friction = friction;
        this.maxSpeedX = maxSpeedX;
        this.maxSpeedY = maxSpeedY;
        this.useFixedUpdate = useFixedUpdate;
    }

    SetVelocity(vx, vy) {
        this.vx = vx;
        this.vy = vy;
        return this;
    }

    AddImpulse(ix, iy) {
        this.vx += ix;
        this.vy += iy;
        return this;
    }

    OnUpdate(dt) {
        if (!this.useFixedUpdate) this._integrate(dt);
    }

    OnFixedUpdate(dt) {
        if (this.useFixedUpdate) this._integrate(dt);
    }

    _integrate(dt) {
        if (!this.owner || !dt) return;

        this.vy += this.gravity * dt;
        this.vx = ApplyFriction(this.vx, this.friction, dt);
        this.vy = ApplyFriction(this.vy, this.friction, dt);
        this.vx = Clamp(this.vx, -this.maxSpeedX, this.maxSpeedX);
        this.vy = Clamp(this.vy, -this.maxSpeedY, this.maxSpeedY);

        MoveOwner(this.owner, this.vx * dt, this.vy * dt);
    }
}

/**
 * Supplies a reusable AABB for collision tests and pointer selection.
 */
export class BoundsComponent extends Component {
    constructor({
        width = null,
        height = null,
        offsetX = 0,
        offsetY = 0,
        solid = true,
        syncOwnerSize = true,
    } = {}) {
        super();
        this.width = width ?? 0;
        this.height = height ?? 0;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.solid = solid;
        this.syncOwnerSize = syncOwnerSize;
        this.hasInitialSize = width !== null || height !== null;
    }

    OnAttach(owner) {
        const size = ReadOwnerSize(owner);

        if (!this.hasInitialSize) {
            this.width = size.x;
            this.height = size.y;
            return;
        }

        if (this.syncOwnerSize) WriteOwnerSize(owner, this.width, this.height);
    }

    GetAABB() {
        const pos = ReadOwnerPosition(this.owner);
        return {
            x: pos.x + this.offsetX,
            y: pos.y + this.offsetY,
            width: this.width,
            height: this.height,
        };
    }

    ContainsPoint(x, y) {
        const box = this.GetAABB();
        return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
    }

    Intersects(other) {
        const a = this.GetAABB();
        const b = typeof other?.GetAABB === "function" ? other.GetAABB() : other;
        if (!b) return false;

        return a.x < b.x + b.width
            && a.x + a.width > b.x
            && a.y < b.y + b.height
            && a.y + a.height > b.y;
    }
}

/**
 * Tracks hit points, invulnerability time and owner damage/death callbacks.
 */
export class HealthComponent extends Component {
    constructor({ hp = 1, maxHp = hp, invulnerability = 0 } = {}) {
        super();
        this.maxHp = maxHp;
        this.hp = Math.min(hp, maxHp);
        this.invulnerability = invulnerability;
        this.invulnerabilityTimer = 0;
        this.alive = this.hp > 0;
    }

    OnUpdate(dt) {
        if (this.invulnerabilityTimer > 0) {
            this.invulnerabilityTimer = Math.max(0, this.invulnerabilityTimer - dt);
        }
    }

    Damage(amount, source = null) {
        if (!this.alive || this.invulnerabilityTimer > 0) return 0;

        const applied = Math.max(0, amount);
        this.hp = Math.max(0, this.hp - applied);
        if (this.invulnerability > 0) this.invulnerabilityTimer = this.invulnerability;

        this.owner?.OnDamage?.(applied, source);

        if (this.hp <= 0) {
            this.alive = false;
            this.owner?.OnDeath?.(source);
        }

        return applied;
    }

    Heal(amount) {
        if (!this.alive) return 0;

        const previous = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + Math.max(0, amount));
        return this.hp - previous;
    }

    Reset(hp = this.maxHp) {
        this.maxHp = Math.max(this.maxHp, hp);
        this.hp = Math.min(hp, this.maxHp);
        this.alive = this.hp > 0;
        this.invulnerabilityTimer = 0;
    }

    IsAlive() {
        return this.alive && this.hp > 0;
    }
}

/**
 * Disables or removes short-lived owner objects after an elapsed duration.
 */
export class LifetimeComponent extends Component {
    constructor({ duration = 1, mode = "disable", onExpire = null } = {}) {
        super();
        this.duration = duration;
        this.remaining = duration;
        this.mode = mode;
        this.onExpire = onExpire;
        this.expired = false;
    }

    OnUpdate(dt) {
        if (this.expired) return;

        this.remaining -= dt;
        if (this.remaining <= 0) this.Expire();
    }

    Reset(duration = this.duration) {
        this.duration = duration;
        this.remaining = duration;
        this.expired = false;
    }

    Expire() {
        if (this.expired) return;

        this.expired = true;
        this.onExpire?.(this.owner, this);

        if (this.mode === "destroy") {
            this.owner?.OnDestroy?.();
            return;
        }

        if (this.mode === "disable" && this.owner) {
            this.owner.active = false;
            this.owner.enabled = false;
        }
    }
}

/**
 * Exposes configured `ActionManager` values to a composed game entity.
 */
export class ActionInputComponent extends Component {
    constructor({ actions = {} } = {}) {
        super();
        this.actions = actions;
    }

    Map(alias, actionName) {
        this.actions[alias] = actionName;
        return this;
    }

    IsDown(aliasOrActionName) {
        return ActionManager.IsActionDown(this.actions[aliasOrActionName] ?? aliasOrActionName);
    }

    IsHeld(aliasOrActionName) {
        return ActionManager.IsAction(this.actions[aliasOrActionName] ?? aliasOrActionName);
    }
}

function ReadOwnerPosition(owner) {
    const transform = owner?.GetComponent?.(TransformComponent);
    if (transform && transform.owner === owner) return { x: transform.x, y: transform.y };
    if (owner?.position) return { x: owner.position.x ?? 0, y: owner.position.y ?? 0 };
    return { x: owner?.x ?? 0, y: owner?.y ?? 0 };
}

function WriteOwnerPosition(owner, x, y) {
    if (!owner) return;

    const transform = owner.GetComponent?.(TransformComponent);
    if (transform && transform.owner === owner && (transform.x !== x || transform.y !== y)) {
        transform.x = x;
        transform.y = y;
    }

    if (owner.position?.SetValue) {
        owner.position.SetValue(x, y);
        return;
    }

    if (owner.position) {
        owner.position.x = x;
        owner.position.y = y;
        return;
    }

    owner.x = x;
    owner.y = y;
}

function MoveOwner(owner, dx, dy) {
    const pos = ReadOwnerPosition(owner);
    WriteOwnerPosition(owner, pos.x + dx, pos.y + dy);
}

function ReadOwnerSize(owner) {
    if (owner?.size) return { x: owner.size.x ?? 0, y: owner.size.y ?? 0 };
    return { x: owner?.width ?? 0, y: owner?.height ?? 0 };
}

function WriteOwnerSize(owner, width, height) {
    if (!owner) return;

    if (owner.size?.SetValue) {
        owner.size.SetValue(width, height);
        return;
    }

    if (owner.size) {
        owner.size.x = width;
        owner.size.y = height;
        return;
    }

    owner.width = width;
    owner.height = height;
}

function ApplyFriction(value, friction, dt) {
    if (!friction) return value;
    return value * Math.max(0, 1 - friction * dt);
}

function Clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
