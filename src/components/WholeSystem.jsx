import { useMemo, Fragment } from "react";
import "./styles.css";
import { Planet } from "./Planet";
import { AsteroidBelt } from "./AsteroidBelt";
import { MajorAsteroid } from "./MajorAsteroid";
import { Comet } from "./Comet";
import { OrbitPath } from "./OrbitPath";
import { StellarObjects } from "./StellarObjects";

export const System = ({
  x,
  y,
  z,
  planets,
  asteroidBelt,
  comets,
  stellarType,
  sunName,
  sunSize = 20,
}) => {
  const sunRotation = useMemo(() => Math.random() * 0.01 - 0.005, []);
  const orbitCenter = useMemo(() => ({ x, y, z }), [x, y, z]);
  const sunPosition = useMemo(() => ({ x, y, z }), [x, y, z]);
  const systemOuterRadius = useMemo(
    () =>
      planets.reduce((max, p) => Math.max(max, p.orbit?.radius ?? 0), sunSize * 4) +
      80,
    [planets, sunSize],
  );

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
        type="star"
        planetData={{
          planetId: "sun",
          name: sunName,
          type: "star",
        }}
        position={{ x, y, z }}
        rotation={sunRotation}
        size={sunSize}
        texture="sun"
      />
      {asteroidBelt && (
        <>
          <AsteroidBelt belt={asteroidBelt} orbitCenter={orbitCenter} />
          {asteroidBelt.majorAsteroids?.map((asteroid) => (
            <MajorAsteroid
              key={asteroid.planetId}
              asteroid={asteroid}
              orbitCenter={orbitCenter}
            />
          ))}
        </>
      )}

      {comets?.map((comet, i) => (
        <Comet
          key={`comet-${i}`}
          comet={comet}
          orbitCenter={orbitCenter}
          sunPosition={sunPosition}
          planets={planets}
          sunSize={sunSize}
          systemOuterRadius={systemOuterRadius}
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
