import { getNotNull } from "./wgpuutils.ts";

import baseShader from "../shaders/baseshader.wgsl?raw";

export class WebgpuEngine {
  private readonly context: GPUCanvasContext;
  private readonly buffers: { [key: string]: GPUBuffer } = {};
  private readonly bufferLayouts: { [key: string]: GPUVertexBufferLayout } = {};
  private readonly shaderModules: { [key: string]: GPUShaderModule } = {};
  private readonly canvasFormat: GPUTextureFormat;

  private readonly gpuRenderPipelines: { [key: string]: GPURenderPipeline } =
    {};

  private readonly bindGroups: { [key: string]: GPUBindGroup } = {};

  private totalTime: number = 0;
  private programRunning: boolean = true;

  private engineData: {
    color: Float32Array;
  } = {
    color: new Float32Array([0, 0, 0, 0]),
  };

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
    this.shaderModules["base"] = this.device.createShaderModule({
      label: "base",
      code: baseShader,
    });
  }

  createRenderPipeline() {
    return this.device.createRenderPipeline({
      label: "base pipeline",
      layout: "auto",
      vertex: {
        module: this.shaderModules["base"],
        entryPoint: "vertexMain",
        buffers: [this.bufferLayouts["base"]],
      },

      fragment: {
        module: this.shaderModules["base"],
        entryPoint: "fragmentMain",
        targets: [
          {
            format: this.canvasFormat,
          },
        ],
      },
    });
  }

  createCommandBuffer(
    drawFunction: (pass: GPURenderPassEncoder) => void,
  ): GPUCommandBuffer {
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          loadOp: "clear",
          clearValue: { a: 1, r: 0, b: 0, g: 0 },
          storeOp: "store",
        },
      ],
    });

    drawFunction(pass);

    pass.end();
    return encoder.finish();
  }

  tickEngine(deltaTime: number) {
    this.totalTime += deltaTime;
    this.engineData.color[0] = (Math.sin(this.totalTime / 1000) + 1) / 2;
    console.log(deltaTime);
  }

  drawFrame() {
    this.device.queue.writeBuffer(
      this.buffers["uniform"],
      0,
      this.engineData.color.buffer,
    );

    const buffer = this.createCommandBuffer((pass) => {
      pass.setPipeline(this.gpuRenderPipelines["base"]);
      pass.setVertexBuffer(0, this.buffers["tri"]);
      pass.setBindGroup(0, this.bindGroups["bg1"]);
      pass.draw(3);
    });
    this.device.queue.submit([buffer]);
  }

  private async runAsync() {
    let lastEngineTick = Date.now();
    while (this.programRunning) {
      const currentTick = Date.now();
      this.tickEngine(currentTick - lastEngineTick);
      this.drawFrame();
      await new Promise((resolve) => setTimeout(resolve, 3));
      lastEngineTick = currentTick;
    }
  }

  public startEngine() {
    const verts = new Float32Array([-0.8, -0.8, 0.8, -0.8, 0.8, 0.8]);

    this.buffers["tri"] = this.device.createBuffer({
      label: "tri",
      size: verts.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.buffers["tri"], 0, verts);

    this.bufferLayouts["base"] = {
      arrayStride: 8,
      attributes: [
        {
          format: "float32x2",
          offset: 0,
          shaderLocation: 0,
        },
      ],
    };

    // uniforms
    this.buffers["uniform"] = this.device.createBuffer({
      label: "uniform",
      size: this.engineData.color.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.loadShaderModules();
    this.gpuRenderPipelines["base"] = this.createRenderPipeline();

    this.bindGroups["bg1"] = this.device.createBindGroup({
      label: "base renderer uniform",
      layout: this.gpuRenderPipelines["base"].getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: this.buffers["uniform"] },
        },
      ],
    });

    this.runAsync();
  }
}
