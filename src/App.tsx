import "./App.css";
import { InnerWgpuApp } from "./InnerWgpuApp";
import { isWgpuSupported } from "./webgpu/wgpuutils";
export default function App() {
  const drawingCanv = isWgpuSupported() ? (
    <InnerWgpuApp width={500} height={500}></InnerWgpuApp>
  ) : (
    <>
      <p>Sorry, webgpu not supported :(</p>
    </>
  );

  return (
    <>
      {drawingCanv}
      <br />
      <p>hi hello</p>
    </>
  );
}
