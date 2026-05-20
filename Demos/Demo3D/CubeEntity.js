import { GameObject3D } from "../../Core3D/Objects/GameObject3D.js";
import { Shapes3D } from "../../Core3D/Graphics/Shape3D.js";
import { AssetManager } from "../../CoreCross/Assets/AssetManager.js";

export class CubeEntity extends GameObject3D {
	constructor(screen3D) {
		super();
		this.name = "CuboGiratorio";

		// Inicia o cubo 7 unidades para frente da câmera
		this.transform.position = [0.0, 0.0, -7.0];
		this.transform.scale = [1.0, 1.0, 1.0];

		// Puxa os shaders e buffers
		this.shapes = new Shapes3D(screen3D);
		const htmlImage = AssetManager.instance.GetImage("textura_player");

		if (htmlImage) {
			this.myTexture = this.shapes.CreateTexture(htmlImage);
		}

		this.rotationSpeed = 1.0;
	}

	OnUpdate(dt) {
		const delta = dt || 0.016;

		// Gira o cubo nos eixos X e Y
		this.transform.rotation.x += this.rotationSpeed * delta;
		this.transform.rotation.y += this.rotationSpeed * delta;
	}

	OnDrawn(camera) {
		// Envia as coordenadas para o WebGL desenhar
		this.shapes.DrawCube(
			this.transform.position,
			this.transform.rotation,
			this.transform.scale,
			camera,
			this.myTexture
		);
	}
}