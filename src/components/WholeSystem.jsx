import { useMemo, Fragment } from "react";
import "./styles.css";
import { Planet } from "./Planet";
import { AsteroidBelt } from "./AsteroidBelt";
import { Comet } from "./Comet";
import { OrbitPath } from "./OrbitPath";
import { StellarObjects } from "./StellarObjects";
import { utils } from "../utils/utils";

export const System = ({
  x,
  y,
  z,
  planets,
  asteroidBelt,
  comets,
  stellarType,
}) => {
  const sunSize = useMemo(() => utils.randomBetween(10, 40), []);
  const sunRotation = useMemo(() => utils.randomBetween(-0.005, 0.005), []);
  const orbitCenter = useMemo(() => ({ x, y, z }), [x, y, z]);
  const sunPosition = useMemo(() => ({ x, y, z }), [x, y, z]);

  return (
    <>
      {planets.map((p) => (
        <Fragment key={p.planetId}>
          <OrbitPath orbit={p.orbit} orbitCenter={orbitCenter} />
          <Planet
            name={p.name}
            type={p.type}
            planetData={p}
            position={{
              x: p.x + x,
              y: p.y + y,
              z: p.z + z,
            }}
            orbitCenter={orbitCenter}
            rotation={p.rotation}
            size={p.size}
            texture={p.texture}
            color={p.color}
            orbit={p.orbit}
            hasRing={p.hasRing}
            hasAtmosphere={p.hasAtmosphere}
            hasClouds={p.hasClouds}
            cityLights={p.cityLights}
            moons={p.moons}
            hasSatellite={p.hasSatellite}
          />
        </Fragment>
      ))}

      <Planet
        name="sun"
        position={{ x, y, z }}
        rotation={sunRotation}
        size={sunSize}
        texture="sun"
      />
      {asteroidBelt && (
        <AsteroidBelt belt={asteroidBelt} orbitCenter={orbitCenter} />
      )}

      {comets?.map((comet, i) => (
        <Comet
          key={`comet-${i}`}
          comet={comet}
          orbitCenter={orbitCenter}
          sunPosition={sunPosition}
        />
      ))}

      <StellarObjects
        stellarType={stellarType}
        orbitCenter={orbitCenter}
        sunSize={sunSize}
      />
    </>
  );
};
