import { useContext, useEffect, useRef } from "react";
import * as THREE from "three";
import { PlanetContext } from "../context/PlanetContext";
import { utils } from "../utils/utils";

const POOL_SIZE = 5;

export const SpaceDebris = () => {
  const { scene, camera, timeScale } = useContext(PlanetContext);
  const poolRef = useRef([]);

  useEffect(() => {
    if (!scene || !camera) return;

    const pool = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      const geometry = new THREE.SphereGeometry(0.08, 4, 4);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      mesh.userData = {
        velocity: new THREE.Vector3(),
        life: 0,
      };
      scene.add(mesh);
      pool.push(mesh);
    }
    poolRef.current = pool;

    let spawnTimer = 0;
    let frameId;

    const spawnMeteor = () => {
      const meteor = pool.find((m) => !m.visible);
      if (!meteor || !camera) return;

      const offset = new THREE.Vector3(
        utils.randomBetween(-200, 200),
        utils.randomBetween(-100, 100),
        utils.randomBetween(-200, 200),
      );
      meteor.position.copy(camera.position).add(offset);

      const dir = new THREE.Vector3(
        utils.randomBetween(-1, 1),
        utils.randomBetween(-0.3, 0.3),
        utils.randomBetween(-1, 1),
      ).normalize();
      meteor.userData.velocity.copy(dir).multiplyScalar(utils.randomBetween(2, 6));
      meteor.userData.life = 120 + Math.random() * 80;
      meteor.material.opacity = 0.9;
      meteor.visible = true;
    };

    const animate = () => {
      spawnTimer += 1;
      if (spawnTimer > 300) {
        spawnMeteor();
        spawnTimer = 0;
      }

      pool.forEach((meteor) => {
        if (!meteor.visible) return;
        meteor.position.addScaledVector(meteor.userData.velocity, timeScale);
        meteor.userData.life -= timeScale;
        meteor.material.opacity = Math.min(1, meteor.userData.life / 60);
        if (meteor.userData.life <= 0) {
          meteor.visible = false;
        }
      });

      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      pool.forEach((mesh) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
      poolRef.current = [];
    };
  }, [scene, camera, timeScale]);

  return null;
};
