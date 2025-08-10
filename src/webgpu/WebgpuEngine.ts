import { getNotNull } from "./wgpuutils.ts";

import baseShader from "../shaders/baseshader.wgsl?raw";

export class WebgpuEngine {
  private readonly context: GPUCanvasContext;
  private readonly buffers: { [key: string]: GPUBuffer } = {}
  private readonly bufferLayouts: { [key: string]: GPUVertexBufferLayout } = {}
  private readonly shaderModules: { [key: string]: GPUShaderModule } = {}
  private readonly canvasFormat: GPUTextureFormat;

  private readonly gpuRenderPipelines: { [key: string]: GPURenderPipeline } = {};

  constructor(
    canvas: HTMLCanvasElement,
    private readonly device: GPUDevice,
  ) {
    this.context = getNotNull(
      canvas.getContext("webgpu"),
      "Cannot get webgpu context",
    );

    this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: this.canvasFormat,
    });
  }

  loadShaderModules() {
    this.shaderModules['base'] = this.device.createShaderModule({
      label: 'base',
      code: baseShader
    });
  }

  createRenderPipeline() {
    return this.device.createRenderPipeline({
      label: 'base pipeline',
      layout: 'auto',
      vertex: {
        module: this.shaderModules['base'],
        entryPoint: 'vertexMain',
        buffers: [this.bufferLayouts['base']]
      },

      fragment: {
        module: this.shaderModules['base'],
        entryPoint: 'fragmentMain',
        targets: [{
          format: this.canvasFormat
        }]
      }
    })
  }

  createCommandBuffer(): GPUCommandBuffer {
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.context.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: { a: 1, r: 0.5, b: 0.9, g: 0.33 },
        storeOp: "store",
      }]
    });

    pass.setPipeline(this.gpuRenderPipelines['base'])
    pass.setVertexBuffer(0, this.buffers['tri'])
    pass.draw(3);

    pass.end();
    return encoder.finish();
  }

  private async runAsync() {
    const buffer = this.createCommandBuffer();
    this.device.queue.submit([buffer]);
  }

  public startEngine() {
    const verts = new Float32Array([
      -0.8, -0.8,
      0.8, -0.8,
      0.8, 0.8
    ]);

    this.buffers['tri'] = this.device.createBuffer({
      label: 'tri',
      size: verts.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.buffers['tri'], 0, verts)

    this.bufferLayouts['base'] = {
      arrayStride: 8,
      attributes: [{
        format: "float32x2",
        offset: 0,
        shaderLocation: 0
      }]
    };

    this.loadShaderModules();
    this.gpuRenderPipelines['base'] = this.createRenderPipeline();


    this.runAsync().then(_r => {});
  }
}
