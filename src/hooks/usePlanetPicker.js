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
    const mouse = new THREE.Vector2();

    const handleClick = (event) => {
      if (moveState.isFlyMode) return;

      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = getSelectableMeshes();
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const data = getPlanetDataFromMesh(intersects[0].object);
        if (data) flyToPlanet(data);
      }
    };

    canvas.addEventListener("click", handleClick);
    return () => canvas.removeEventListener("click", handleClick);
  }, [
    canvasRef,
    camera,
    getSelectableMeshes,
    getPlanetDataFromMesh,
    flyToPlanet,
    moveState.isFlyMode,
  ]);
}
