import { useContext, useEffect, useRef } from "react";
import * as THREE from "three";
import { PlanetContext } from "../context/PlanetContext";
import { utils } from "../utils/utils";

const SPRITE_COLS = 4;
const SPRITE_ROWS = 4;
const SKY_DISTANCE = 11000;
const LUMINOUS_TINTS = [0xfff8f0, 0xffeedd, 0xe8f4ff, 0xffe8f8, 0xfff0c8, 0xf0fff8];

function applyLuminousStyle(material, entry, baseOpacity) {
  entry.isLuminous = Math.random() < 0.22;
  if (!entry.isLuminous) {
    material.color.setHex(utils.getRandomHexColor());
    return baseOpacity;
  }

  const tint = new THREE.Color(
    LUMINOUS_TINTS[Math.floor(Math.random() * LUMINOUS_TINTS.length)],
  );
  tint.multiplyScalar(utils.randomBetween(1.5, 2.4));
  material.color.copy(tint);
  return Math.min(0.95, baseOpacity * utils.randomBetween(1.55, 2.3));
}

function pickSpriteRegion(texture) {
  const col = Math.floor(Math.random() * SPRITE_COLS);
  const row = Math.floor(Math.random() * SPRITE_ROWS);

  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1 / SPRITE_COLS, 1 / SPRITE_ROWS);
  texture.offset.set(col / SPRITE_COLS, 1 - (row + 1) / SPRITE_ROWS);
  texture.needsUpdate = true;

  return texture;
}

function disposeSprite(sprite) {
  if (!sprite) return;
  if (sprite.material?.map) sprite.material.map.dispose();
  sprite.material?.dispose();
}

function applyBackgroundScale(sprite, entry) {
  const roll = Math.random();
  let aspect;
  let scale;

  if (roll < 0.3) {
    entry.sizeTier = "small";
    scale = utils.randomBetween(350, 900);
    aspect = utils.randomBetween(0.35, 0.62);
  } else if (roll < 0.72) {
    entry.sizeTier = "medium";
    scale = utils.randomBetween(950, 2100);
    aspect = utils.randomBetween(0.45, 0.72);
  } else {
    entry.sizeTier = "large";
    scale = utils.randomBetween(2200, 4800);
    aspect = utils.randomBetween(0.5, 0.85);
  }

  const sizeRoll = Math.random();
  if (sizeRoll < 0.1) entry.sizeMultiplier = 9;
  else if (sizeRoll < 0.22) entry.sizeMultiplier = 3;
  else if (sizeRoll < 0.47) entry.sizeMultiplier = 2;
  else entry.sizeMultiplier = 1;

  scale *= entry.sizeMultiplier;
  sprite.scale.set(scale, scale * aspect, 1);
}

function backgroundOpacity(sizeTier, sizeMultiplier = 1) {
  if (sizeMultiplier === 9) return utils.randomBetween(0.06, 0.14);
  if (sizeMultiplier === 3) return utils.randomBetween(0.1, 0.24);
  if (sizeMultiplier === 2) return utils.randomBetween(0.18, 0.36);
  if (sizeTier === "small") return utils.randomBetween(0.42, 0.68);
  if (sizeTier === "large") return utils.randomBetween(0.28, 0.48);
  return utils.randomBetween(0.35, 0.58);
}

function placeBackgroundNebula(sprite, material, entry) {
  const theta = utils.randomBetween(0, Math.PI * 2);
  const phi = Math.acos(utils.randomBetween(-0.92, 0.92));
  entry.direction.set(
    Math.sin(phi) * Math.cos(theta),
    Math.sin(phi) * Math.sin(theta) * 0.4,
    Math.cos(phi),
  );
  applyBackgroundScale(sprite, entry);
  entry.staticOpacity = applyLuminousStyle(
    material,
    entry,
    backgroundOpacity(entry.sizeTier, entry.sizeMultiplier),
  );
}

export const Nebula = ({ count = 3 }) => {
  const { scene, camera } = useContext(PlanetContext);
  const poolRef = useRef([]);
  const frameRef = useRef(null);
  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  useEffect(() => {
    if (!scene) return;

    const baseTexture = new THREE.TextureLoader().load("/textures/neb.jpg");
    baseTexture.colorSpace = THREE.SRGBColorSpace;

    const pool = [];

    for (let i = 0; i < count; i++) {
      const spriteTexture = baseTexture.clone();
      pickSpriteRegion(spriteTexture);

      const material = new THREE.SpriteMaterial({
        map: spriteTexture,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        color: new THREE.Color(0xffffff),
      });

      const sprite = new THREE.Sprite(material);
      sprite.renderOrder = -40;

      const entry = {
        sprite,
        material,
        direction: new THREE.Vector3(),
        sizeTier: "medium",
        sizeMultiplier: 1,
        isLuminous: false,
        staticOpacity: 0,
      };

      placeBackgroundNebula(sprite, material, entry);
      material.opacity = entry.staticOpacity;
      scene.add(sprite);
      pool.push(entry);
    }

    poolRef.current = pool;

    const tick = () => {
      const cam = cameraRef.current;
      const skyOffset = new THREE.Vector3();

      pool.forEach((entry) => {
        const { sprite, material, direction, staticOpacity } = entry;
        material.opacity = staticOpacity;
        if (cam) {
          skyOffset.copy(direction).multiplyScalar(SKY_DISTANCE).add(cam.position);
          sprite.position.copy(skyOffset);
        }
      });

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameRef.current);
      pool.forEach(({ sprite }) => {
        scene.remove(sprite);
        disposeSprite(sprite);
      });
      baseTexture.dispose();
      poolRef.current = [];
    };
  }, [scene, count]);

  return null;
};
