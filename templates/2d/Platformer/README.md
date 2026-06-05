# Platformer Example

This is a minimal starter project following the **DemoAdvanced** pattern (recommended for side-view platformers and action games).

## Structure

```
Platformer/
├── game.workspace.json          # Main project definition
├── resources.json
├── mygame.config.json
├── main.js
├── Levels/
│   └── PlatformerLevel.js
└── Assets/
    └── Manifests/
        └── level1/
            ├── stage.json       # Platforms, world size, parallax
            ├── player.json      # Player spawn, movement stats
            └── enemies.json     # Enemy definitions
```

## Key Concepts

- Use `levelType: "platformer"` in your workspace for this genre.
- The `documents` map defines what data your level needs.
- Different levels can share common documents (e.g. `stage-default.json`).

## How to Extend for Your Game

1. Add new keys to the `documents` map (e.g. `collectibles`, `triggers`, `boss`).
2. Create corresponding JSON manifests.
3. Load them in your Level class.

This structure is designed to be editable by GameForgeJS Editors V2.
