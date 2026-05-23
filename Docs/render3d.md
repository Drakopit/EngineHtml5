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
  Shader/      Shader e shaders internos
  Texture/     Texture

Core3D/
  Level/       Level3D oficial e base 3D legada
  Model/       Model3D e ModelMeshFactory
  Physics/     Rigidbody3D, SphereCollider3D, BoxCollider3D, PhysicsWorld3D
  Shaders/     Shaders GLSL legados
```

## Recursos Atuais

- WebGL2 renderer com `Scene3D`.
- `PerspectiveCamera`.
- `Mesh` com transform, material, shadow flags e visibilidade.
- Primitivas: cubo, plano e esfera.
- `StandardMaterial` com albedo, normal map, roughness, metallic, AO e emissive.
- Luz ambiente, hemisferica, direcional, ponto e spot.
- Shadow map direcional simples com PCF 3x3.
- Shader procedural `CelestialBodyMaterial` para planetas/estrelas.
- Fisica 3D basica com gravidade, rigidbody, esfera e caixa AABB.
- Overlay 2D/UI continua funcionando por cima do canvas 3D.

## Exemplo

```js
import {
    DirectionalLight,
    HemisphereLight,
    Mesh,
    PerspectiveCamera,
    PrimitiveMesh,
    Scene3D,
    StandardMaterial,
    Texture,
    WebGL3DRenderer,
} from "../Core3D/index.js";

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
    roughness: 0.85,
    metallic: 0.0,
});

const cube = Mesh.FromGeometry(PrimitiveMesh.Cube(1), material);
scene.Add(cube);

function loop() {
    cube.transform.rotation.y += 0.01;
    renderer.Render(scene, camera);
    requestAnimationFrame(loop);
}

loop();
```

## Proximas Camadas

- `ModelLoader` integrado ao novo `Mesh`.
- `RenderPass`, `ShadowPass` e `ForwardRenderPass` como classes separadas.
- Skybox dentro do pipeline novo.
- Post-processing: tone mapping, bloom e FXAA.
- PBR mais completo com environment map.
