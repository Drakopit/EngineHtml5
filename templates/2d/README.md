# 2D Game Templates

This folder contains starter project structures for different 2D game genres.

These are designed to be used as starting points when creating new games with GameForgeJS.

## Available Templates

| Folder        | levelType    | Recommended For                     | Key Characteristics |
|---------------|--------------|-------------------------------------|---------------------|
| `platformer`  | `platformer` | Side-view platformers, action games | Gravity, platforms, parallax |
| `topdown`     | `topdown`    | Top-down RPGs, action-adventures    | Grid or free movement, collisions |
| `isometric`   | `isometric`  | Strategy, city builders, RPGs       | Height maps, special rendering |
| `tactical`    | `tactical`   | Turn-based tactics, grid RPGs       | Grid system, terrain costs |

## How to Use

1. Copy the desired folder to your project location.
2. Rename the folder and update `mygame.config.json`.
3. Customize the documents inside `Assets/Manifests/` according to your game needs.
4. Update `game.workspace.json` with your levels.

## Important Notes

- All templates use the modern `game.workspace.json` + `documents` pattern.
- The `levelType` field is used to identify the genre of each level.
- Different genres use completely different sets of documents in the map.

These templates are also great for testing the **GameForgeJS Editors V2**.
