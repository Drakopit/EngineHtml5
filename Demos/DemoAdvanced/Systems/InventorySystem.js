const DEFAULT_INVENTORY_CONFIG = {
    maxSlots: 8,
    items: [],
    enemyDefeatReward: null,
};

export class InventorySystem {
    constructor(config = {}) {
        this.config = { ...DEFAULT_INVENTORY_CONFIG, ...config };
        this.maxSlots = this.config.maxSlots;
        this.items = [];
        this.selectedIndex = 0;
        this.defeatedEnemies = 0;
        this.lastMessage = "";
        this.dirty = false;

        this.config.items.forEach(item => this.AddItem(item, item.quantity ?? 1));
        this.dirty = false;
    }

    AddItem(item, quantity = 1) {
        if (!item?.id || quantity <= 0) return false;

        const normalized = this.NormalizeItem(item, quantity);
        const existing = this.items.find(slot => slot.id === normalized.id && slot.quantity < slot.maxStack);

        if (existing) {
            const room = existing.maxStack - existing.quantity;
            const added = Math.min(room, normalized.quantity);
            existing.quantity += added;
            this.lastMessage = `${existing.name} +${added}`;
            this.dirty = true;
            return added > 0;
        }

        if (this.items.length >= this.maxSlots) {
            this.lastMessage = "Inventory Full";
            return false;
        }

        this.items.push(normalized);
        this.lastMessage = `${normalized.name} +${normalized.quantity}`;
        this.dirty = true;
        return true;
    }

    UseSelected(player, skillTree = null) {
        const item = this.items[this.selectedIndex];
        if (!item) return { used: false, message: "Empty Slot" };

        const result = this.ApplyEffect(item.effect, player, skillTree);
        if (!result.used) {
            this.lastMessage = result.message;
            return result;
        }

        item.quantity -= 1;
        if (item.quantity <= 0) {
            this.items.splice(this.selectedIndex, 1);
            this.selectedIndex = Math.max(0, Math.min(this.selectedIndex, this.items.length - 1));
        }

        this.lastMessage = result.message;
        this.dirty = true;
        return result;
    }

    MoveSelection(delta) {
        if (this.maxSlots <= 0) return;
        this.selectedIndex = (this.selectedIndex + delta + this.maxSlots) % this.maxSlots;
    }

    OnEnemyDefeated(skillTree = null) {
        const reward = this.config.enemyDefeatReward;
        if (!reward) return;

        this.defeatedEnemies += 1;

        const skillPointEvery = reward.skillPointEvery ?? 1;
        if (reward.skillPoints > 0 && skillTree && this.defeatedEnemies % skillPointEvery === 0) {
            skillTree.AddPoints(reward.skillPoints);
        }

        const itemEvery = reward.itemEvery ?? 0;
        if (itemEvery > 0 && this.defeatedEnemies % itemEvery === 0) {
            this.AddItem(reward.item, reward.item?.quantity ?? 1);
        }
    }

    Restore(state = null) {
        if (!state) return;

        this.items = Array.isArray(state.items)
            ? state.items.map(item => this.NormalizeItem(item, item.quantity ?? 1))
            : [];
        this.selectedIndex = Math.max(0, Math.min(state.selectedIndex ?? 0, this.maxSlots - 1));
        this.defeatedEnemies = state.defeatedEnemies ?? 0;
        this.dirty = false;
    }

    ToState() {
        return {
            items: this.items.map(item => ({ ...item })),
            selectedIndex: this.selectedIndex,
            defeatedEnemies: this.defeatedEnemies,
        };
    }

    NormalizeItem(item, quantity) {
        return {
            id: item.id,
            name: item.name ?? item.id,
            quantity,
            maxStack: item.maxStack ?? 1,
            effect: item.effect ?? null,
        };
    }

    ApplyEffect(effect, player, skillTree) {
        if (!effect) return { used: false, message: "No Effect" };

        if (effect.type === "heal") {
            const healed = player?.Heal(effect.amount ?? 0);
            return healed
                ? { used: true, message: `HP +${effect.amount}` }
                : { used: false, message: "HP Full" };
        }

        if (effect.type === "skillPoint") {
            skillTree?.AddPoints(effect.amount ?? 0);
            return { used: true, message: `SP +${effect.amount ?? 0}` };
        }

        return { used: false, message: "No Effect" };
    }
}
