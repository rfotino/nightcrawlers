import { Polar } from '../math/polar';

export class PolarRectMesh extends PIXI.mesh.Mesh {
  protected _rect: Polar.Rect;

  public constructor(texture: PIXI.Texture, rect: Polar.Rect) {
    super(texture);
    this._rect = rect.clone();
    this.drawMode = PIXI.mesh.Mesh.DRAW_MODES.TRIANGLE_MESH;
    texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;

    // Create points for the mesh
    // Set up constants and containers used for the calculation
    const SEGMENT_LENGTH = 30 + (rect.r / 20);
    const numSegments = Math.max(
      1,
      Math.round(rect.r * rect.width / SEGMENT_LENGTH)
    );
    const verts = [];
    const uvs = [];
    const indices = [];
    const texWidth = this.texture.baseTexture.width;
    const texHeight = this.texture.baseTexture.height;

    // Calculate vertices, uvs, indices. For each segment create a 2-triangle
    // quad out of 4 vertices
    for (let i = 0; i < numSegments; i++) {
      const theta1 = rect.theta + (rect.width * i / numSegments);
      const theta2 = rect.theta + (rect.width * (i + 1) / numSegments);
      // Vertex for top left
      const x1 = rect.r * Math.cos(theta1);
      const y1 = rect.r * Math.sin(theta1);
      // Vertex for bottom left
      const x2 = (rect.r - rect.height) * Math.cos(theta1);
      const y2 = (rect.r - rect.height) * Math.sin(theta1);
      // Vertex for top right
      const x3 = rect.r * Math.cos(theta2);
      const y3 = rect.r * Math.sin(theta2);
      // Vertex for bottom right
      const x4 = (rect.r - rect.height) * Math.cos(theta2);
      const y4 = (rect.r - rect.height) * Math.sin(theta2);
      // Add vertices
      verts.push(x1, y1, x2, y2, x3, y3, x4, y4);
      // Add texture UV coordinates
      const pixelX1 = rect.r * rect.width * i / numSegments;
      const pixelX2 = rect.r * rect.width * (i + 1) / numSegments;
      const pixelY = rect.height;
      const textureX1 = pixelX1 / texWidth;
      const textureX2 = pixelX2 / texWidth;
      const textureY = pixelY / texHeight;
      const texCoordDiff = textureX2 - textureX1;
      const uvX1 = textureX1 - Math.floor(textureX1);
      const uvX2 = uvX1 + texCoordDiff;
      // Hack - slightly more than 0 to prevent weird jaggies at transparent
      // top edges
      const uvY1 = 0.01;
      const uvY2 = textureY;
      uvs.push(uvX1, uvY1, uvX1, uvY2, uvX2, uvY1, uvX2, uvY2);
      // Add indices for two triangles between a pair of segments
      const i0 = i * 4;
      const i1 = i0 + 1;
      const i2 = i0 + 2;
      const i3 = i0 + 3;
      indices.push(
        i0, i1, i2,
        i1, i3, i2
      );
    }

    // Assign new attributes
    this.vertices = new Float32Array(verts);
    this.uvs = new Float32Array(uvs);
    this.indices = new Uint16Array(indices);
  }

  /**
   * Gets a copy of the current polar rectangle.
   */
  public getRect(): Polar.Rect {
    return this._rect.clone();
  }
}
