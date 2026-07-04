import { useContext, useEffect, useRef } from "react";
import * as THREE from "three";
import { PlanetContext } from "../context/PlanetContext";
import { utils } from "../utils/utils";

const DEFAULT_COLOR1 = new THREE.Color(0xffa500);
const DEFAULT_COLOR2 = new THREE.Color(0xff4500);
const DEFAULT_TILT = { x: Math.PI / 2.2, y: 0, z: 0 };
const DEFAULT_POSITION = { x: 0, y: 0, z: 0 };

export const BlackHole = ({
  envMap,
  position = DEFAULT_POSITION,
  color1 = DEFAULT_COLOR1,
  color2 = DEFAULT_COLOR2,
  tilt = DEFAULT_TILT,
  size = 2,
  variant = "full",
  numArms = 4,
}) => {
  const { scene, camera, lowQuality } = useContext(PlanetContext);
  const initRef = useRef(false);
  const blackHoleGroupRef = useRef(null);
  const accretionDiskRef = useRef(null);
  const particleSystemRef = useRef(null);
  const particleVelocitiesRef = useRef(null);
  const particleCountRef = useRef(0);
  const animationFrameRef = useRef(null);
  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  const isBackground = variant === "background";

  useEffect(() => {
    if (!scene || initRef.current) return;
    initRef.current = true;

    const group = new THREE.Group();
    const scale = isBackground ? size / 10 : 1;
    group.position.set(position.x, position.y, position.z);
    group.scale.setScalar(scale);
    scene.add(group);
    blackHoleGroupRef.current = group;

    const geometry = new THREE.SphereGeometry(2, 64, 64);
    const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    group.add(new THREE.Mesh(geometry, material));

    const disposableGeometries = [geometry];
    const disposableMaterials = [material];
    const disposableTextures = [];

    if (!isBackground) {
      const accretionDiskGeometry = new THREE.RingGeometry(2.1, 6, 128);
      const accretionDiskMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0.0 },
          color1: { value: color1.clone() },
          color2: { value: color2.clone() },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform float time;
          uniform vec3 color1;
          uniform vec3 color2;

          float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
          }

          float noise(vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
          }

          void main() {
            float radius = length(vUv - 0.5) * 2.0;
            float n = noise(vUv * 5.0 + time * 0.1);
            float intensity = pow(1.0 - radius, 2.0);
            vec3 color = mix(color1, color2, smoothstep(0.0, 1.0, radius + n * 0.1));
            gl_FragColor = vec4(color * intensity, intensity);
          }
        `,
        side: THREE.DoubleSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
      });

      const accretionDisk = new THREE.Mesh(
        accretionDiskGeometry,
        accretionDiskMaterial,
      );
      accretionDiskRef.current = accretionDisk;
      group.add(accretionDisk);
      disposableGeometries.push(accretionDiskGeometry);
      disposableMaterials.push(accretionDiskMaterial);
    }

    if (envMap && !isBackground) {
      const lensingGeometry = new THREE.SphereGeometry(2.05, 64, 64);
      const lensingMaterial = new THREE.ShaderMaterial({
        uniforms: {
          refractionRatio: { value: 1.02 },
          fresnelBias: { value: 0.1 },
          fresnelScale: { value: 4.0 },
          fresnelPower: { value: 2.0 },
          envMap: { value: envMap },
        },
        vertexShader: `
          varying vec3 vReflect;
          varying vec3 vRefract[3];
          varying float vFresnel;
          uniform float refractionRatio;
          uniform float fresnelBias;
          uniform float fresnelScale;
          uniform float fresnelPower;
          void main() {
            vec4 mPosition = modelMatrix * vec4(position, 1.0);
            vec3 nWorld = normalize(mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz) * normal);
            vec3 vI = normalize(mPosition.xyz - cameraPosition);
            vReflect = reflect(vI, nWorld);
            vRefract[0] = refract(vI, nWorld, refractionRatio);
            vRefract[1] = refract(vI, nWorld, refractionRatio * 0.99);
            vRefract[2] = refract(vI, nWorld, refractionRatio * 0.98);
            vFresnel = fresnelBias + fresnelScale * pow(1.0 + dot(vI, nWorld), fresnelPower);
            gl_Position = projectionMatrix * viewMatrix * mPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vReflect;
          varying vec3 vRefract[3];
          varying float vFresnel;
          uniform samplerCube envMap;
          void main() {
            vec4 reflectedColor = textureCube(envMap, vec3(-vReflect.x, vReflect.yz));
            vec4 refractedColor = vec4(1.0);
            refractedColor.r = textureCube(envMap, vec3(-vRefract[0].x, vRefract[0].yz)).r;
            refractedColor.g = textureCube(envMap, vec3(-vRefract[1].x, vRefract[1].yz)).g;
            refractedColor.b = textureCube(envMap, vec3(-vRefract[2].x, vRefract[2].yz)).b;
            gl_FragColor = mix(refractedColor, reflectedColor, clamp(vFresnel, 0.0, 1.0));
          }
        `,
        transparent: true,
      });
      group.add(new THREE.Mesh(lensingGeometry, lensingMaterial));
      disposableGeometries.push(lensingGeometry);
      disposableMaterials.push(lensingMaterial);
    }

    const particleCount = isBackground
      ? lowQuality
        ? 1200
        : 2500
      : lowQuality
        ? 2500
        : 4000;
    particleCountRef.current = particleCount;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const particleTexture = new THREE.TextureLoader().load("/textures/star_glow.png");
    disposableTextures.push(particleTexture);

    const numOfColors = Math.floor(utils.randomBetween(1, 10));
    const colorPalette = Array.from({ length: numOfColors }, () =>
      new THREE.Color(utils.getRandomHexColor()),
    );

    const arms = isBackground ? numArms : 4;
    const armSeparation = (2 * Math.PI) / arms;
    const spread = 4.5;
    const a = 6;
    const b = 0.2;

    for (let i = 0; i < particleCount; i++) {
      const armIndex = i % arms;
      const angle = (i / particleCount) * Math.PI * 10;
      const radius = a * Math.exp(b * angle);
      const randomX = (Math.random() - 0.5) * spread;
      const randomY = (Math.random() - 0.5) * spread * 0.5;
      const randomZ = (Math.random() - 0.5) * spread;
      const armAngle = armIndex * armSeparation + angle;

      positions[i * 3] = Math.cos(armAngle) * radius + randomX;
      positions[i * 3 + 1] = randomY;
      positions[i * 3 + 2] = Math.sin(armAngle) * radius + randomZ;

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      const boost = isBackground ? 1.8 : 1;
      colors[i * 3] = Math.min(1, color.r * boost);
      colors[i * 3 + 1] = Math.min(1, color.g * boost);
      colors[i * 3 + 2] = Math.min(1, color.b * boost);

      velocities[i * 3] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }

    particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particles.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    particleVelocitiesRef.current = velocities;

    const particleMaterial = new THREE.PointsMaterial({
      size: isBackground ? 1.6 : 0.2,
      map: particleTexture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      sizeAttenuation: isBackground,
    });
    const particleSystem = new THREE.Points(particles, particleMaterial);
    particleSystem.rotation.set(tilt.x, tilt.y, tilt.z);
    particleSystemRef.current = particleSystem;
    group.add(particleSystem);
    disposableGeometries.push(particles);
    disposableMaterials.push(particleMaterial);

    const animate = () => {
      const cam = cameraRef.current;
      if (accretionDiskRef.current && cam) {
        accretionDiskRef.current.material.uniforms.time.value += 0.02;
        accretionDiskRef.current.lookAt(cam.position);
      }
      if (particleSystemRef.current && particleVelocitiesRef.current) {
        particleSystemRef.current.rotation.y += 0.001;
        const posArray =
          particleSystemRef.current.geometry.attributes.position.array;
        const count = particleCountRef.current;
        for (let i = 0; i < count; i++) {
          posArray[i * 3] += particleVelocitiesRef.current[i * 3];
          posArray[i * 3 + 1] += particleVelocitiesRef.current[i * 3 + 1];
          posArray[i * 3 + 2] += particleVelocitiesRef.current[i * 3 + 2];
        }
        particleSystemRef.current.geometry.attributes.position.needsUpdate = true;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      scene.remove(group);
      disposableGeometries.forEach((g) => g.dispose());
      disposableMaterials.forEach((m) => m.dispose());
      disposableTextures.forEach((t) => t.dispose());
      initRef.current = false;
      blackHoleGroupRef.current = null;
      accretionDiskRef.current = null;
      particleSystemRef.current = null;
      particleVelocitiesRef.current = null;
    };
    // Init once per scene — props captured at mount, updates via separate effects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  useEffect(() => {
    if (accretionDiskRef.current) {
      accretionDiskRef.current.material.uniforms.color1.value.copy(color1);
      accretionDiskRef.current.material.uniforms.color2.value.copy(color2);
    }
  }, [color1, color2]);

  useEffect(() => {
    if (particleSystemRef.current) {
      particleSystemRef.current.rotation.set(tilt.x, tilt.y, tilt.z);
    }
  }, [tilt.x, tilt.y, tilt.z]);

  return null;
};
