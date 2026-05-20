export class SkillTreeSystem {
    constructor(config = {}) {
        this.points = config.points ?? 0;
        this.nodes = config.nodes ?? [];
        this.unlocked = new Set(config.unlocked ?? []);
        this.selectedIndex = 0;
        this.lastMessage = "";
        this.dirty = false;
    }

    MoveSelection(delta) {
        if (this.nodes.length === 0) return;
        this.selectedIndex = (this.selectedIndex + delta + this.nodes.length) % this.nodes.length;
    }

    AddPoints(amount = 0) {
        if (amount <= 0) return;

        this.points += amount;
        this.lastMessage = `SP +${amount}`;
        this.dirty = true;
    }

    UnlockSelected(player) {
        const node = this.nodes[this.selectedIndex];
        if (!node) return { unlocked: false, message: "No Skill" };

        if (this.unlocked.has(node.id)) {
            this.lastMessage = "Already Unlocked";
            return { unlocked: false, message: this.lastMessage };
        }

        if (!this.RequirementsMet(node)) {
            this.lastMessage = "Locked";
            return { unlocked: false, message: this.lastMessage };
        }

        const cost = node.cost ?? 1;
        if (this.points < cost) {
            this.lastMessage = "Need SP";
            return { unlocked: false, message: this.lastMessage };
        }

        this.points -= cost;
        this.unlocked.add(node.id);
        this.ApplyEffects(player, node.effects ?? []);
        this.lastMessage = `${node.name ?? node.id} Unlocked`;
        this.dirty = true;
        return { unlocked: true, message: this.lastMessage };
    }

    RequirementsMet(node) {
        const requirements = node.requires ?? [];
        return requirements.every(id => this.unlocked.has(id));
    }

    GetState(node) {
        if (this.unlocked.has(node.id)) return "unlocked";
        if (!this.RequirementsMet(node)) return "locked";
        if (this.points < (node.cost ?? 1)) return "available";
        return "ready";
    }

    ApplyEffects(player, effects) {
        effects.forEach(effect => {
            if (effect.type === "maxHp") {
                player?.IncreaseMaxHP(effect.amount ?? 0, effect.heal ?? false);
                return;
            }

            if (effect.type === "attack") {
                player?.AddAttack(effect.amount ?? 0);
                return;
            }

            if (effect.type === "defense") {
                player?.AddDefense(effect.amount ?? 0);
            }
        });
    }

    ApplyUnlockedEffects(player) {
        this.nodes
            .filter(node => this.unlocked.has(node.id))
            .forEach(node => this.ApplyEffects(player, node.effects ?? []));
    }

    Restore(state = null) {
        if (!state) return;

        this.points = state.points ?? this.points;
        this.unlocked = new Set(state.unlocked ?? []);
        this.selectedIndex = Math.max(0, Math.min(state.selectedIndex ?? 0, Math.max(0, this.nodes.length - 1)));
        this.dirty = false;
    }

    ToState() {
        return {
            points: this.points,
            unlocked: [...this.unlocked],
            selectedIndex: this.selectedIndex,
        };
    }
}
