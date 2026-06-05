# Editor V2 Support

These templates are designed to work well with **GameForgeJS Editors V2** (the C# + Avalonia application).

When you open any of these templates in the editor:

- The `levelType` will be displayed for each level.
- You will be able to inspect the `documents` map of each level.
- The Project Info panel will show the `resourcePrefix` and whether the project uses a workspace file.

This structure (using `game.workspace.json` + typed documents) is the recommended way to author GameForgeJS games going forward.

Feel free to add new document types as your game grows. The editor is being built to support this flexibility across different genres (platformer, top-down, isometric, tactical, etc.).
