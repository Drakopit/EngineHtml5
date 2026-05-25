# GameForgeJS Documentation

This directory contains the official GameForgeJS guides and generated API
reference. Start with a small demo tutorial, then follow the module guide that
matches the game you are building.

## Getting Started

- [New project format](./GettingStarted/new-project.md)
- [Creating 2D and 3D demos](./GettingStarted/tutorial-demos-2d-3d.md)
- [Input configuration per game](./GettingStarted/input-config.md)
- [Gamepad aliases and polling reference](./GettingStarted/gamepad.md)

## Guides

- [Component-based entities](./Guides/components.md)
- [CoreNetwork and online games](./Guides/network.md)
- [Render3D](./Guides/render3d.md)

## Data And Tools

- [Advanced stage manifest](./Manifests/advanced-stage-manifest.md)
- [2D hitbox manifest](./Manifests/hitbox-manifest.md)
- [Scene Editor 3D](./Tools/scene-editor-3d.md)
- [WorldEditor / WorldMaker](./Tools/world-editor-v4.md)

## API Reference

The API pages are generated from JSDoc on the public exports of `CoreCross`,
`Core2D`, `Core3D` and `CoreNetwork`:

- [Generated API home](./Helper/index.md)
- [CoreCross API](./Helper/CoreCross.md)
- [Core2D API](./Helper/Core2D.md)
- [Core3D API](./Helper/Core3D.md)
- [CoreNetwork API](./Helper/CoreNetwork.md)

After documenting or changing a public API, regenerate the reference:

```sh
npm run docs
```

Keep public JSDoc immediately above its exported class, function or constant.
Use a short purpose statement, document public parameters and return values,
and add `@deprecated` with the supported replacement for compatibility APIs.
