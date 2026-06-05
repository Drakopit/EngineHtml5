# Basic GameForgeJS Template

This is the most minimal starting point for a new GameForgeJS project.

**For more complete genre-specific starters**, see the sibling folders inside `templates/2d/` (platformer, topdown, isometric, tactical).

## How to use

1. Copy this folder somewhere.
2. Update `mygame.config.json` with your game name and settings.
3. Create your levels in the `Levels/` folder.
4. Run using the main GameForgeJS server or your own setup.

Example entry point:

```js
import { BootstrapGame } from "../../packages/core/index.js";
import { MyFirstLevel } from "./Levels/MyFirstLevel.js";

BootstrapGame({
    configPath: ["mygame.config.json"],
    levels: [ new MyFirstLevel() ],
});
```
