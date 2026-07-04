import { useContext, useEffect, useRef } from "react";
import * as THREE from "three";
import { PlanetContext } from "../context/PlanetContext";
import { utils } from "../utils/utils";

const SPRITE_COLS = 4;
const SPRITE_ROWS = 4;

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

export const Nebula = ({ count = 3 }) => {
  const { scene } = useContext(PlanetContext);
  const spritesRef = useRef([]);

  useEffect(() => {
    if (!scene) return;

    const baseTexture = new THREE.TextureLoader().load("/textures/neb.jpg");
    baseTexture.colorSpace = THREE.SRGBColorSpace;
    const sprites = [];

    for (let i = 0; i < count; i++) {
      const spriteTexture = baseTexture.clone();
      pickSpriteRegion(spriteTexture);

      const material = new THREE.SpriteMaterial({
        map: spriteTexture,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        color: new THREE.Color(utils.getRandomHexColor()),
      });
      const sprite = new THREE.Sprite(material);
      const distance = utils.randomBetween(800, 1500);
      const theta = utils.randomBetween(0, Math.PI * 2);
      const phi = Math.acos(utils.randomBetween(-1, 1));
      sprite.position.set(
        distance * Math.sin(phi) * Math.cos(theta),
        distance * Math.sin(phi) * Math.sin(theta) * 0.4,
        distance * Math.cos(phi),
      );
      const scale = utils.randomBetween(200, 500);
      sprite.scale.set(scale, scale * 0.6, 1);
      scene.add(sprite);
      sprites.push(sprite);
    }

    spritesRef.current = sprites;

    return () => {
      sprites.forEach((sprite) => {
        scene.remove(sprite);
        disposeSprite(sprite);
      });
      baseTexture.dispose();
      spritesRef.current = [];
    };
  }, [scene, count]);

  return null;
};
