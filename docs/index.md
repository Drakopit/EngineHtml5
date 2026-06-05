# GameForgeJS Documentation

This directory contains the official GameForgeJS guides and generated API
reference. Start with a small demo tutorial, then follow the module guide that
matches the game you are building.

## Getting Started

- [New project format](./getting-started/new-project.md)
- [Creating 2D and 3D demos](./getting-started/tutorial-demos-2d-3d.md)
- [Input configuration per game](./getting-started/input-config.md)
- [Gamepad aliases and polling reference](./getting-started/gamepad.md)

## Guides

- [Component-based entities](./guides/components.md)
- [CoreNetwork and online games](./guides/network.md)
- [Render3D](./guides/render3d.md)

## Data And Tools

- [Advanced stage manifest](./manifests/advanced-stage-manifest.md)
- [2D hitbox manifest](./manifests/hitbox-manifest.md)
- [Scene Editor 3D](./tools/scene-editor-3d.md)
- [WorldEditor / WorldMaker](./tools/world-editor-v4.md)

## API Reference

The API pages are generated from JSDoc on the public exports of `CoreCross`,
`Core2D`, `Core3D` and `CoreNetwork`:

- [Generated API home](./helper/index.md)
- [CoreCross API](./helper/CoreCross.md)
- [Core2D API](./helper/Core2D.md)
- [Core3D API](./helper/Core3D.md)
- [CoreNetwork API](./helper/CoreNetwork.md)

After documenting or changing a public API, regenerate the reference:

```sh
npm run docs
```

Keep public JSDoc immediately above its exported class, function or constant.
Use a short purpose statement, document public parameters and return values,
and add `@deprecated` with the supported replacement for compatibility APIs.
