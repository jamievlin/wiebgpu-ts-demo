export async function isWgpuSupported() {
  return navigator.gpu;
}

export async function getWgpuAdadpterAndDevice(
  adapterReqOpts?: GPURequestAdapterOptions,
  gpuDescriptor?: GPUDeviceDescriptor,
) {
  const adapter = await navigator.gpu.requestAdapter(adapterReqOpts);
  if (adapter === null) {
    return { adapter: null, device: null };
  }

  const device = await adapter.requestDevice(gpuDescriptor);
  if (device === null) {
    return { adapter: null, device: null };
  }

  return { adapter, device };
}


export function getNotNull<T>(obj: T | null, message?: string): T {
  if (obj === null) {
    throw new Error(message || "A generic error");
  }
  return obj;
}
