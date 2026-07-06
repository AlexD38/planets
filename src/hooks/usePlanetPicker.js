import { useContext, useEffect } from "react";
import * as THREE from "three";
import { PlanetContext } from "../context/PlanetContext";

export function usePlanetPicker(canvasRef) {
  const {
    camera,
    getSelectableMeshes,
    getPlanetDataFromMesh,
    flyToPlanet,
    moveState,
  } = useContext(PlanetContext);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !camera) return;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const pickAt = (clientX, clientY) => {
      if (moveState.isFlyMode) return;

      const rect = canvas.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const meshes = getSelectableMeshes();
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const data = getPlanetDataFromMesh(intersects[0].object);
        if (data) flyToPlanet(data);
      }
    };

    const handleClick = (event) => {
      pickAt(event.clientX, event.clientY);
    };

    const handleTouchEnd = (event) => {
      if (event.changedTouches.length !== 1) return;
      const touch = event.changedTouches[0];
      pickAt(touch.clientX, touch.clientY);
    };

    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    canvasRef,
    camera,
    getSelectableMeshes,
    getPlanetDataFromMesh,
    flyToPlanet,
    moveState.isFlyMode,
  ]);
}
