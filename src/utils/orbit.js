import * as THREE from "three";

export function getOrbitPosition(orbit, angle, orbitCenter = { x: 0, y: 0, z: 0 }) {
  if (orbit.eccentricity !== undefined) {
    const a = orbit.semiMajorAxis;
    const e = orbit.eccentricity;
    const r = (a * (1 - e * e)) / (1 + e * Math.cos(angle));
    const x = r * Math.cos(angle);
    const z = r * Math.sin(angle);
    return new THREE.Vector3(
      orbitCenter.x + x,
      orbitCenter.y + (orbit.inclination ?? 0) * z * 0.1,
      orbitCenter.z + z,
    );
  }

  const x = orbit.radius * Math.cos(angle);
  const z = orbit.radius * Math.sin(angle);
  return new THREE.Vector3(
    orbitCenter.x + x,
    orbitCenter.y,
    orbitCenter.z + z,
  );
}

export function updateOrbit(mesh, orbit, delta, orbitCenter, rotation = 0) {
  if (!mesh || !orbit) return;

  if (orbit.angle !== undefined) {
    orbit.angle += orbit.speed * delta;
  }

  const pos = getOrbitPosition(orbit, orbit.angle, orbitCenter);
  mesh.position.copy(pos);
  mesh.rotation.y += rotation;
  if (orbit.inclination !== undefined && orbit.eccentricity === undefined) {
    mesh.rotation.z = orbit.inclination;
  }
}

export function updateEllipticOrbit(mesh, orbit, delta, orbitCenter) {
  if (!mesh || !orbit) return;
  orbit.angle += orbit.speed * delta;
  const pos = getOrbitPosition(orbit, orbit.angle, orbitCenter);
  mesh.position.copy(pos);
}
