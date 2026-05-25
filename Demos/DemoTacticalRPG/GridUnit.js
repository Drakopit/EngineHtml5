export class GridUnit {
    constructor(col, row, config = {}) {
        this.col = col;
        this.row = row;
        this.startCol = col;
        this.startRow = row;
        this.name = config.name ?? "Unit";
        this.color = config.color ?? "#FFFFFF";
        this.hp = config.hp ?? 20;
        this.maxHp = this.hp;
        this.attack = config.attack ?? 8;
        this.defense = config.defense ?? 2;
        this.moveRange = config.moveRange ?? 3;
        this.attackRange = config.attackRange ?? 1;
        this.asset = config.asset ?? null;
        this.runAsset = config.runAsset ?? null;
        this.frame = config.frame ?? null;
        this.scale = config.scale ?? 1;
        this.bodySize = config.bodySize ?? null;
        this.team = config.team ?? null;
        this.active = true;
    }

    TakeDamage(attacker) {
        const roll = Math.floor(Math.random() * 4);
        const dmg = Math.max(1, attacker.attack - this.defense + roll);
        this.hp = Math.max(0, this.hp - dmg);
        if (this.hp <= 0) this.active = false;
        return dmg;
    }

    IsAlive() {
        return this.active && this.hp > 0;
    }

    IsAt(col, row) {
        return this.col === col && this.row === row;
    }

    DistanceTo(other) {
        return Math.abs(this.col - other.col) + Math.abs(this.row - other.row);
    }

    MoveTo(col, row) {
        this.col = col;
        this.row = row;
    }

    Reset() {
        this.hp = this.maxHp;
        this.active = true;
        this.MoveTo(this.startCol, this.startRow);
    }
}
