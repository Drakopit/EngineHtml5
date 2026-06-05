# Top-Down Example

This is a minimal starter for **Top-Down** games (RPGs, action-adventures, etc.).

## Key Differences from Platformer

- `levelType: "topdown"`
- Uses a `map` document instead of `stage` + platforms
- Has `collisions` document (walkable areas)
- Player movement is usually 4 or 8 direction without gravity

## Recommended Documents for Top-Down

- `map` - Tilemap data
- `player`
- `npcs`
- `collisions` or `walkable`
- `interactions`
- `heightMap` (optional, for pseudo-3D feel)

## How to Extend

You can freely invent new document names in the `documents` map according to your game needs.

This structure is designed to be used with GameForgeJS Editors V2.
