import { Draw } from "../Graphics/Draw.js";
import { Rectangle } from "../Graphics/Rectangle.js";
import { Mouse } from "../../CoreCross/Input/Mouse.js";
import { TextBox } from "./TextBox.js";

export class ChatWindow {
    constructor(screen, {
        x = 12,
        y = 292,
        width = 350,
        height = 176,
        title = "Chat",
        maxMessages = 6,
        maxLength = 120,
    } = {}) {
        this.screen = screen;
        this.draw = new Draw(screen);
        this.mouse = Mouse.instance ?? new Mouse();
        this.rect = new Rectangle(x, y, width, height);
        this.title = title;
        this.maxMessages = maxMessages;
        this.messages = [];
        this.submitListeners = [];
        this.input = new TextBox(screen);
        this.input.SetBox(new Rectangle(x + 10, y + height - 36, width - 20, 26));
        this.input.SetPlaceholder("Message");
        this.input.SetMaxLength(maxLength);
        this.handleKeyDown = event => this.HandleKeyDown(event);
        globalThis.addEventListener?.("keydown", this.handleKeyDown);
    }

    get IsTyping() {
        return this.input.isActive;
    }

    onMessageSubmitted(callback) {
        this.submitListeners.push(callback);
        return () => {
            this.submitListeners = this.submitListeners.filter(listener => listener !== callback);
        };
    }

    addMessage(message) {
        if (!message?.text) return;
        this.messages.push(message);
        if (this.messages.length > this.maxMessages * 3) {
            this.messages.splice(0, this.messages.length - this.maxMessages * 3);
        }
    }

    OnUpdate() {
        if (!this.mouse.buttonsDown?.[0]) return;
        const position = this.mouse.getPositionRelative(this.screen.Canvas);
        const insideInput = this.ContainsPoint(position, this.input.rect);
        this.input.SetActive(insideInput);
    }

    OnDrawn() {
        const ctx = this.screen.Context;
        ctx.save();
        this.draw.Color = "rgba(6, 12, 22, 0.86)";
        this.draw.Style = this.draw.TYPES.FILLED;
        this.draw.DrawRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height);
        this.draw.Color = "rgba(190, 213, 237, 0.32)";
        this.draw.Style = this.draw.TYPES.STROKED;
        this.draw.DrawRect(this.rect.x + 0.5, this.rect.y + 0.5, this.rect.width - 1, this.rect.height - 1);

        this.draw.Style = this.draw.TYPES.FILLED;
        this.draw.Color = "#F4D26A";
        this.draw.FontSize = "13px";
        this.draw.Font = "Arial";
        ctx.textBaseline = "alphabetic";
        this.draw.DrawText(this.title, this.rect.x + 10, this.rect.y + 20);

        this.DrawMessages(ctx);
        this.input.DrawCursor();
        ctx.restore();
    }

    DrawMessages(ctx) {
        const visible = this.messages.slice(-this.maxMessages);
        this.draw.FontSize = "12px";
        ctx.textBaseline = "alphabetic";

        visible.forEach((message, index) => {
            const prefix = message.system ? "" : `${message.playerName}: `;
            const text = `${prefix}${message.text}`;
            this.draw.Color = message.system ? "#8FC7A4" : "#DCE8FF";
            this.draw.DrawText(
                this.TrimToWidth(text, this.rect.width - 20),
                this.rect.x + 10,
                this.rect.y + 42 + (index * 15)
            );
        });
    }

    HandleKeyDown(event) {
        if (event.code === "Enter") {
            event.preventDefault();
            if (!this.input.isActive) {
                this.input.SetActive(true);
                return;
            }

            const text = this.input.GetText().trim();
            if (text) {
                this.submitListeners.forEach(listener => listener(text));
                this.input.SetText("");
            }
            return;
        }

        if (!this.input.isActive) return;

        if (event.code === "Escape") {
            this.input.SetActive(false);
            event.preventDefault();
            return;
        }

        if (event.key === "Backspace" || event.key.length === 1) {
            this.input.HandleInput(event);
            event.preventDefault();
        }
    }

    ContainsPoint(point, rect = this.rect) {
        return point.x >= rect.x
            && point.x <= rect.x + rect.width
            && point.y >= rect.y
            && point.y <= rect.y + rect.height;
    }

    IsPointerOver() {
        const position = this.mouse.getPositionRelative(this.screen.Canvas);
        return this.ContainsPoint(position);
    }

    TrimToWidth(text, width) {
        const ctx = this.screen.Context;
        if (ctx.measureText(text).width <= width) return text;

        let trimmed = text;
        while (trimmed.length > 1 && ctx.measureText(`${trimmed}...`).width > width) {
            trimmed = trimmed.slice(0, -1);
        }
        return `${trimmed}...`;
    }

    Dispose() {
        globalThis.removeEventListener?.("keydown", this.handleKeyDown);
        this.submitListeners = [];
    }
}
