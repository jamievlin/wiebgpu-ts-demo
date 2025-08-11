@vertex
fn vertexMain(
    @location(0) pos: vec2f
) -> @builtin(position) vec4f {
    return vec4f(pos, 0, 1);
}

@group(0) @binding(0) var<uniform> colour: vec4f;

@fragment
fn fragmentMain() -> @location(0) vec4f {
    return vec4f(colour);
}
