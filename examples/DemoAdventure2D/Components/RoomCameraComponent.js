import { Component } from "../../../src/CoreCross/Component.js";
import { RoomOrigin } from "../AdventureConstants.js";

export class RoomCameraComponent extends Component {
    constructor({ roomWidth, roomHeight, duration = 0.72 } = {}) {
        super();
        this.roomWidth = roomWidth;
        this.roomHeight = roomHeight;
        this.duration = duration;
        this.x = 0;
        this.y = 0;
        this.from = { x: 0, y: 0 };
        this.to = { x: 0, y: 0 };
        this.timer = 0;
        this.transitioning = false;
        this.currentRoom = null;
        this.targetRoom = null;
        this.onComplete = null;
    }

    SetRoom(room) {
        this.currentRoom = room;
        const origin = RoomOrigin(room);
        this.x = origin.x;
        this.y = origin.y;
        this.from = { ...origin };
        this.to = { ...origin };
        this.transitioning = false;
        this.timer = 0;
    }

    StartTransition(targetRoom, onComplete = null) {
        if (!targetRoom || this.transitioning) return false;

        this.from = { x: this.x, y: this.y };
        this.to = RoomOrigin(targetRoom);
        this.timer = 0;
        this.targetRoom = targetRoom;
        this.transitioning = true;
        this.onComplete = onComplete;
        return true;
    }

    OnUpdate(dt) {
        if (!this.transitioning) return;

        this.timer = Math.min(this.duration, this.timer + dt);
        const t = this.duration <= 0 ? 1 : this.timer / this.duration;
        const eased = EaseInOutCubic(t);
        this.x = Lerp(this.from.x, this.to.x, eased);
        this.y = Lerp(this.from.y, this.to.y, eased);

        if (this.timer < this.duration) return;

        this.x = this.to.x;
        this.y = this.to.y;
        this.currentRoom = this.targetRoom;
        this.targetRoom = null;
        this.transitioning = false;
        const callback = this.onComplete;
        this.onComplete = null;
        callback?.(this.currentRoom);
    }

    IsTransitioning() {
        return this.transitioning;
    }

    Begin(screen) {
        screen.Context.save();
        screen.Context.translate(-Math.round(this.x), -Math.round(this.y));
    }

    End(screen) {
        screen.Context.restore();
    }
}

function Lerp(a, b, t) {
    return a + (b - a) * t;
}

function EaseInOutCubic(t) {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
