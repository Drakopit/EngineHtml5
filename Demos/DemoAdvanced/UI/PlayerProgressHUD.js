import { ActionManager } from "../../../CoreCross/Input/ActionManager.js";

const DEFAULT_OPTIONS = {
    summaryX: 16,
    summaryY: 116,
    summaryWidth: 298,
    summaryHeight: 34,
    panelX: 330,
    panelY: 18,
    panelWidth: 292,
    panelHeight: 214,
};

const COLORS = {
    panel: "rgba(10, 15, 28, 0.9)",
    panelStroke: "rgba(233, 221, 165, 0.42)",
    selectedStroke: "#F4D26A",
    text: "#FFFFFF",
    muted: "rgba(218, 228, 255, 0.68)",
    good: "#7AE092",
    warning: "#F4D26A",
    locked: "#7C8494",
    slot: "rgba(255, 255, 255, 0.08)",
};

export class PlayerProgressHUD {
    constructor(screen, player, inventory, skillTree, options = {}) {
        this.screen = screen;
        this.player = player;
        this.inventory = inventory;
        this.skillTree = skillTree;
        this.options = { ...DEFAULT_OPTIONS, ...options };
        this.mode = null;
        this.message = "";
        this.messageTimer = 0;
    }

    OnUpdate(dt) {
        const delta = dt ?? 0.016;

        if (ActionManager.IsActionDown("INVENTORY")) {
            this.ToggleMode("inventory");
        }

        if (ActionManager.IsActionDown("SKILL_TREE")) {
            this.ToggleMode("skills");
        }

        if (this.mode && ActionManager.IsActionDown("CANCEL")) {
            this.mode = null;
        }

        if (this.mode === "inventory") {
            this.UpdateInventoryInput();
        }

        if (this.mode === "skills") {
            this.UpdateSkillInput();
        }

        this.messageTimer = Math.max(0, this.messageTimer - delta);
    }

    BlocksGameplay() {
        return this.mode !== null;
    }

    OnDrawn() {
        if (!this.screen?.Context) return;

        const ctx = this.screen.Context;
        ctx.save();
        ctx.textBaseline = "alphabetic";
        this.DrawSummary(ctx);

        if (this.mode === "inventory") {
            this.DrawInventoryPanel(ctx);
        }

        if (this.mode === "skills") {
            this.DrawSkillPanel(ctx);
        }

        ctx.restore();
    }

    ToggleMode(mode) {
        this.mode = this.mode === mode ? null : mode;
    }

    UpdateInventoryInput() {
        if (ActionManager.IsActionDown("LEFT")) this.inventory.MoveSelection(-1);
        if (ActionManager.IsActionDown("RIGHT")) this.inventory.MoveSelection(1);
        if (ActionManager.IsActionDown("UP")) this.inventory.MoveSelection(-4);
        if (ActionManager.IsActionDown("DOWN")) this.inventory.MoveSelection(4);

        if (ActionManager.IsActionDown("ATTACK")) {
            const result = this.inventory.UseSelected(this.player, this.skillTree);
            this.PushMessage(result.message);
        }
    }

    UpdateSkillInput() {
        if (ActionManager.IsActionDown("LEFT") || ActionManager.IsActionDown("UP")) {
            this.skillTree.MoveSelection(-1);
        }

        if (ActionManager.IsActionDown("RIGHT") || ActionManager.IsActionDown("DOWN")) {
            this.skillTree.MoveSelection(1);
        }

        if (ActionManager.IsActionDown("ATTACK")) {
            const result = this.skillTree.UnlockSelected(this.player);
            this.PushMessage(result.message);
        }
    }

    PushMessage(message) {
        this.message = message ?? "";
        this.messageTimer = this.message ? 1.2 : 0;
    }

    DrawSummary(ctx) {
        const { summaryX: x, summaryY: y, summaryWidth: width, summaryHeight: height } = this.options;
        this.RoundRect(ctx, x, y, width, height, 6);
        ctx.fillStyle = COLORS.panel;
        ctx.fill();
        ctx.strokeStyle = COLORS.panelStroke;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = "700 11px Arial";
        ctx.fillStyle = COLORS.warning;
        ctx.fillText("BAG", x + 12, y + 21);

        ctx.fillStyle = COLORS.text;
        ctx.fillText(`${this.inventory.items.length}/${this.inventory.maxSlots}`, x + 46, y + 21);

        ctx.fillStyle = COLORS.warning;
        ctx.fillText("SKILLS", x + 112, y + 21);

        ctx.fillStyle = COLORS.text;
        ctx.fillText(`SP ${this.skillTree.points}`, x + 166, y + 21);

        if (this.messageTimer > 0) {
            ctx.textAlign = "right";
            ctx.fillStyle = COLORS.good;
            ctx.fillText(this.message, x + width - 12, y + 21);
            ctx.textAlign = "left";
        }
    }

    DrawInventoryPanel(ctx) {
        const { panelX: x, panelY: y, panelWidth: width, panelHeight: height } = this.options;
        this.DrawPanelBase(ctx, x, y, width, height, "INVENTORY");

        const slotSize = 58;
        const gap = 8;
        const startX = x + 18;
        const startY = y + 48;

        for (let i = 0; i < this.inventory.maxSlots; i++) {
            const sx = startX + (i % 4) * (slotSize + gap);
            const sy = startY + Math.floor(i / 4) * (slotSize + gap);
            const selected = i === this.inventory.selectedIndex;
            const item = this.inventory.items[i];

            this.RoundRect(ctx, sx, sy, slotSize, slotSize, 5);
            ctx.fillStyle = COLORS.slot;
            ctx.fill();
            ctx.strokeStyle = selected ? COLORS.selectedStroke : "rgba(255, 255, 255, 0.16)";
            ctx.lineWidth = selected ? 2 : 1;
            ctx.stroke();

            if (!item) continue;

            ctx.fillStyle = COLORS.text;
            ctx.font = "700 10px Arial";
            ctx.fillText(item.name, sx + 6, sy + 24, slotSize - 10);
            ctx.fillStyle = COLORS.warning;
            ctx.fillText(`x${item.quantity}`, sx + 6, sy + 44);
        }
    }

    DrawSkillPanel(ctx) {
        const { panelX: x, panelY: y, panelWidth: width, panelHeight: height } = this.options;
        this.DrawPanelBase(ctx, x, y, width, height, "SKILL TREE");

        ctx.font = "700 11px Arial";
        ctx.fillStyle = COLORS.warning;
        ctx.fillText(`SP ${this.skillTree.points}`, x + width - 54, y + 29);

        const startY = y + 52;
        const rowHeight = 46;
        this.skillTree.nodes.forEach((node, index) => {
            const rowY = startY + index * rowHeight;
            const state = this.skillTree.GetState(node);
            const selected = index === this.skillTree.selectedIndex;

            this.RoundRect(ctx, x + 16, rowY, width - 32, 36, 5);
            ctx.fillStyle = state === "locked" ? "rgba(255, 255, 255, 0.045)" : COLORS.slot;
            ctx.fill();
            ctx.strokeStyle = selected ? COLORS.selectedStroke : this.SkillStateColor(state);
            ctx.lineWidth = selected ? 2 : 1;
            ctx.stroke();

            ctx.fillStyle = this.SkillStateColor(state);
            ctx.font = "700 12px Arial";
            ctx.fillText(node.name ?? node.id, x + 28, rowY + 15);

            ctx.fillStyle = state === "locked" ? COLORS.locked : COLORS.muted;
            ctx.font = "10px Arial";
            ctx.fillText(`${node.description ?? ""} | Cost ${node.cost ?? 1}`, x + 28, rowY + 29);
        });
    }

    DrawPanelBase(ctx, x, y, width, height, title) {
        this.RoundRect(ctx, x, y, width, height, 7);
        ctx.fillStyle = COLORS.panel;
        ctx.fill();
        ctx.strokeStyle = COLORS.panelStroke;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = COLORS.text;
        ctx.font = "700 14px Arial";
        ctx.fillText(title, x + 16, y + 29);
    }

    SkillStateColor(state) {
        if (state === "unlocked") return COLORS.good;
        if (state === "ready") return COLORS.warning;
        if (state === "available") return COLORS.muted;
        return COLORS.locked;
    }

    RoundRect(ctx, x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}
