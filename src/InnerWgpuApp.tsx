import { useEffect, useRef } from "react";
import { WebgpuEngine } from "./webgpu/WebgpuEngine";
import { getWgpuAdadpterAndDevice } from "./webgpu/wgpuutils";

export function InnerWgpuApp(args: { width: number; height: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const asyncInit = async (canvasElem: HTMLCanvasElement) => {
      const { adapter, device } = await getWgpuAdadpterAndDevice();

      if (device === null) {
        throw new Error("Webpgu not supported");
      }

      const engine = new WebgpuEngine(canvasElem, device);
      engine.startEngine();
    };

    if (canvasRef.current === null) {
      throw new Error("Canvas reference not fetched");
    }

    asyncInit(canvasRef.current);
  }, []);

  return (
    <>
      <canvas width={args.width} height={args.height} ref={canvasRef}></canvas>
    </>
  );
}
