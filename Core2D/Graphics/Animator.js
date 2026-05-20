import { Vector2D } from "../../CoreCross/Math/Vector2D.js";

/**
 * @doc Class Animator
 * @namespace Graphic
 * @class Animator
 * @summary Controla a transição de diferentes animações para um mesmo Sprite.
 */
export class Animator {
    constructor(sprite) {
        this.sprite = sprite;
        this.animations = {};
        this.currentAnimation = null;
        this.currentAnimationName = null;
        this.onEvent = null;
        this.lastFrame = -1; // guarda último frame processado

        this.nextAnimation = null;
        this.transitionTime = 0;
        this.transitionDuration = 0;
    }

    /**
     * @description Registra uma nova animação
     * @param {string} name - Nome da animação (ex: "Idle", "Run")
     * @param {number} row - Linha na spritesheet
     * @param {number} frameCount - Quantidade de frames
     * @param {number} speed - Velocidade da animação (updatesPerFrame)
     */
    AddAnimation(name, image, row, totalFrames, speed, pivotX = 0.5, pivotY = 1, groundOffset = 0, events = null, options = {}) {
        this.animations[name] = {
            image,
            row,
            totalFrames,
            speed,
            pivotX,
            pivotY,
            groundOffset,
            events,
            loop: options.loop ?? true
        };
    }

    Transition(name, duration = 0.15) {

        let anim = this.animations[name];
        if (!anim) return;

        // Se não tem animação atual ainda
        if (!this.currentAnimation) {
            this.Play(name);
            return;
        }

        if (this.currentAnimationName === name) return;

        this.nextAnimation = anim;
        this.transitionDuration = duration;
        this.transitionTime = 0;
    }

    Update(dt) {

        if (!this.currentAnimation) return;

        if (this.nextAnimation) {

            this.transitionTime += dt;

            if (this.transitionTime >= this.transitionDuration) {

                let anim = this.nextAnimation;

                this.currentAnimation = anim;
                this.currentAnimationName = Object.keys(this.animations)
                    .find(k => this.animations[k] === anim);

                this.sprite.sprite = anim.image;
                this.sprite.row = anim.row;
                this.sprite.frameCount = anim.totalFrames;
                this.sprite.updatesPerFrame = anim.speed;
                this.sprite.loop = anim.loop;
                this.sprite.size = new Vector2D(
                    anim.image.width / anim.totalFrames,
                    anim.image.height
                );

                this.sprite.Reset();

                this.nextAnimation = null;
                this.lastFrame = -1;
            }
        }

        let frame = this.sprite.index;

        if (frame !== this.lastFrame) {

            this.lastFrame = frame;

            let anim = this.currentAnimation;

            if (anim.events && anim.events[frame]) {

                if (this.onEvent) {
                    this.onEvent(anim.events[frame]);
                }

            }
        }
    }

    /**
     * @description Toca a animação se ela já não estiver tocando
     */
    Play(name) {
        if (this.currentAnimationName === name) return;

        let anim = this.animations[name];
        if (!anim) return;

        this.currentAnimationName = name;
        this.currentAnimation = anim;

        this.sprite.sprite = anim.image;
        this.sprite.row = anim.row;
        this.sprite.frameCount = anim.totalFrames;
        this.sprite.updatesPerFrame = anim.speed;
        this.sprite.loop = anim.loop;

        let frameWidth = anim.image.width / anim.totalFrames;
        let frameHeight = anim.image.height;

        this.sprite.size = new Vector2D(frameWidth, frameHeight);

        this.sprite.Reset();
        this.lastFrame = -1;
    }
}
