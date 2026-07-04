import * as THREE from "three";

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform sampler2D tDiffuse;
  uniform float vignetteStrength;
  uniform float grainStrength;
  uniform float chromaticAberration;
  uniform float exposure;
  uniform float time;
  varying vec2 vUv;

  float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;
    vec2 dir = uv - 0.5;
    float dist = length(dir);

    vec2 offset = dir * chromaticAberration * dist;
    float r = texture2D(tDiffuse, uv + offset).r;
    float g = texture2D(tDiffuse, uv).g;
    float b = texture2D(tDiffuse, uv - offset).b;
    vec3 color = vec3(r, g, b);

    color *= exposure;

    float vignette = smoothstep(0.85, 0.25, dist);
    color *= mix(1.0 - vignetteStrength, 1.0, vignette);

    float grain = (rand(uv * time) - 0.5) * grainStrength;
    color += grain;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function createCinematicPost() {
  const uniforms = {
    tDiffuse: { value: null },
    vignetteStrength: { value: 0.25 },
    grainStrength: { value: 0.04 },
    chromaticAberration: { value: 0.0 },
    exposure: { value: 1.0 },
    time: { value: 0 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    depthTest: false,
    depthWrite: false,
  });

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(quad);

  return {
    uniforms,
    scene,
    camera,
    quad,
    dispose() {
      material.dispose();
      quad.geometry.dispose();
    },
  };
}

export function updateCinematicUniforms(uniforms, opts = {}) {
  if (!uniforms) return;
  const {
    vignetteStrength = 0.25,
    grainStrength = 0.04,
    chromaticAberration = 0,
    exposure = 1.0,
    time = 0,
  } = opts;
  uniforms.vignetteStrength.value = vignetteStrength;
  uniforms.grainStrength.value = grainStrength;
  uniforms.chromaticAberration.value = chromaticAberration;
  uniforms.exposure.value = exposure;
  uniforms.time.value = time;
}
