# Render3D

`Core3D` concentra a camada 3D da GameForgeJS. Ela fica separada do core 2D atual e usa WebGL2 puro, sem `three.js`, `gl-matrix` ou CDN externa.

## Estrutura

```txt
Core3D/Render3D/
  Camera/      PerspectiveCamera
  Core/        Color, Transform3D
  Light/       Ambient, Hemisphere, Directional, Point, Spot
  Material/    StandardMaterial, UnlitMaterial
  Mesh/        Mesh, Geometry3D, PrimitiveMesh
  Renderer/    WebGL3DRenderer
  Scene/       Scene3D e SceneManifest3D
  Skybox/      Skybox para imagens cross convertidas em cubemap
  Shader/      Shader e shaders internos
  Texture/     Texture

Core3D/
  Level/       Level3D oficial
  Model/       Model3D e ModelMeshFactory
  Physics/     Rigidbody3D, SphereCollider3D, BoxCollider3D, PhysicsWorld3D
  Legacy/      Compatibilidade obsoleta para projetos antigos
```

## Recursos Atuais

- WebGL2 renderer com `Scene3D`.
- `PerspectiveCamera`.
- `Mesh` com transform, material, shadow flags e visibilidade.
- Primitivas: cubo, cubo chanfrado, plano, esfera e anel.
- `StandardMaterial` com albedo, normal map, ARM/ORM, height/parallax, tiling UV, roughness, metallic, AO e emissive.
- Luz ambiente, hemisferica, direcional, ponto e spot.
- Shadow map direcional simples com PCF 3x3.
- `Skybox` com cubemap criado a partir de uma imagem em formato cross.
- Shader procedural `CelestialBodyMaterial` para planetas/estrelas.
- Fisica 3D basica com gravidade, rigidbody, esfera, caixa AABB e contato de piso para plataformas moveis.
- Overlay 2D/UI continua funcionando por cima do canvas 3D.
- `SceneManifest3D` para instanciar cenas JSON exportadas pelo Scene Editor 3D.

## Exemplo

```js
import {
    DirectionalLight,
    HemisphereLight,
    Mesh,
    PerspectiveCamera,
    PrimitiveMesh,
    Scene3D,
    Skybox,
    StandardMaterial,
    Texture,
    WebGL3DRenderer,
} from "../Core3D/index.js";
import { AssetManager } from "../CoreCross/index.js";

const renderer = new WebGL3DRenderer(canvas);
const scene = new Scene3D();

const camera = new PerspectiveCamera({
    fov: 60,
    aspect: canvas.width / canvas.height,
    near: 0.1,
    far: 1000,
    position: [0, 4, 10],
    target: [0, 0, 0],
});

scene.Add(camera);
scene.Add(new HemisphereLight({
    skyColor: [0.5, 0.7, 1.0],
    groundColor: [0.35, 0.25, 0.18],
    intensity: 0.6,
}));
scene.Add(new DirectionalLight({
    direction: [-0.5, -1, -0.4],
    intensity: 2.2,
    castShadow: true,
    shadowMapSize: 1024,
}));

const material = new StandardMaterial({
    albedoMap: Texture.Load("Assets/rock_albedo.png"),
    normalMap: Texture.Load("Assets/rock_normal.png"),
    ormMap: Texture.Load("Assets/rock_arm.png"),
    heightMap: Texture.Load("Assets/rock_height.png"),
    uvScale: [2, 2],
    normalScale: 1.05,
    heightScale: 0.035,
    roughness: 0.9,
    metallic: 0.0,
});

const cube = Mesh.FromGeometry(PrimitiveMesh.BeveledCube(0.075), material);
scene.Add(cube);

// A imagem deve estar carregada; por exemplo, por um resources.json da demo.
scene.Add(Skybox.FromImage(AssetManager.instance.GetImage("sky_cross")));

function loop() {
    cube.transform.rotation.y += 0.01;
    renderer.Render(scene, camera);
    requestAnimationFrame(loop);
}

loop();
```

## Cenas Por Manifest

O editor em `Tools/SceneEditor3D/index.html` exporta um documento com camera, luzes e objetos primitivos. Em um `Level3D`, ele pode ser usado assim:

```js
import { AssetManager } from "../CoreCross/index.js";
import { Level3D, SceneManifest3D } from "../Core3D/index.js";

export class MyLevel3D extends Level3D {
    BuildScene() {
        const document = AssetManager.instance.GetJson("my_scene");
        this.scene.backgroundColor = [...document.backgroundColor];
        this.camera = SceneManifest3D.CreateCamera(document.camera, this.width / this.height);
        this.scene.Add(this.camera);
        SceneManifest3D.Populate(this.scene, document);
    }
}
```

## API Legada

`LegacyLevel3D`, `LegacyTransform3D`, `GameObject3D`, `Camera3D`, `DirectionalLight3D`, `Shapes3D`, `Mesh3D` e `Skybox3D` permanecem exportados apenas para nao quebrar projetos antigos. Eles possuem JSDoc `@deprecated` e exibem um aviso unico no console quando instanciados. A engine nao usa a sintaxe experimental `@Deprecated`: JSDoc e aviso em runtime funcionam no JavaScript nativo do navegador sem bundler ou transpiler.

Nao use essa API em demos novas:

| Legado | Render3D atual |
| --- | --- |
| `LegacyLevel3D` | `Level3D` |
| `LegacyTransform3D` | `Transform3D` |
| `GameObject3D` | `Mesh`, `Model3D` ou entidade propria sobre Render3D |
| `Camera3D` | `PerspectiveCamera` |
| `DirectionalLight3D` | `DirectionalLight` |
| `Shapes3D` | `Mesh` + `PrimitiveMesh` + materiais |
| `Mesh3D` | `Mesh` + `ModelMeshFactory` |
| `Skybox3D` | `Skybox` |

## Proximas Camadas

- `ModelLoader` integrado ao novo `Mesh`.
- `RenderPass`, `ShadowPass` e `ForwardRenderPass` como classes separadas.
- Materiais de ambiente adicionais e cubemaps de reflexao.
- Post-processing: tone mapping, bloom e FXAA.
- PBR mais completo com environment map.
