import "./App.css";
import { useEffect, useRef } from "react";
import { getWgpuAdadpterAndDevice, isWgpuSupported } from "./webgpu/wgpuutils.ts";
import { WebgpuEngine } from "./webgpu/WebgpuEngine.ts";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const asyncFn = async () => {
      const {adapter, device} = await getWgpuAdadpterAndDevice();
      if (!device) {
        throw new Error("cannot get webgpu device")
      }
      return new WebgpuEngine(canvasRef.current!, device);
    }
    asyncFn().then((engine) => {
      engine.startEngine()
    })

    }, []);

  return (
    <>
      <canvas width={500} height={500} ref={canvasRef}></canvas>
      <br />
      <p>hi hello</p>
    </>
  );
}
