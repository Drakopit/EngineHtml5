export class ComboController {
    constructor(owner, attacks = [], options = {}) {
        this.owner = owner;
        this.attacks = attacks;
        this.inputBufferTime = options.inputBufferTime ?? 0.35;
        this.Reset();
    }

    Start() {
        this.active = true;
        this.index = 0;
        this.queued = false;
        this.bufferTimer = 0;
        return this.CurrentAnimation();
    }

    Update(dt) {
        if (!this.queued) return;

        this.bufferTimer -= dt;
        if (this.bufferTimer <= 0) {
            this.queued = false;
        }
    }

    QueueNext() {
        if (!this.active || this.index >= this.attacks.length - 1) return false;

        this.queued = true;
        this.bufferTimer = this.inputBufferTime;
        return true;
    }

    ConsumeNextIfReady(frame) {
        const current = this.Current();
        if (!this.queued || !current || frame < (current.chainFromFrame ?? 0)) {
            return null;
        }

        this.index++;
        this.queued = false;
        this.bufferTimer = 0;
        this.owner?.boxes?.ResetHitMemory?.();
        return this.CurrentAnimation();
    }

    Current() {
        return this.attacks[this.index] ?? null;
    }

    CurrentAnimation() {
        return this.Current()?.animation ?? null;
    }

    Reset() {
        this.active = false;
        this.index = 0;
        this.queued = false;
        this.bufferTimer = 0;
    }
}
