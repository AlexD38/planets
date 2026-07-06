import { useContext, useEffect, useRef } from "react";
import { PlanetContext } from "../context/PlanetContext";
import { createAmbientLogScheduler } from "../utils/ambientLogEntries";

export const AmbientCaptainLog = () => {
  const {
    systems,
    timeScale,
    stopOrbits,
    addLogEntry,
    simulatedTimeRef,
  } = useContext(PlanetContext);

  const schedulerRef = useRef(null);

  useEffect(() => {
    schedulerRef.current = createAmbientLogScheduler({
      onLog: addLogEntry,
    });
    return () => schedulerRef.current?.reset();
  }, [addLogEntry]);

  useEffect(() => {
    if (!systems[0] || !schedulerRef.current) return;

    let frameId;
    let lastTime = performance.now();

    const tick = (now) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      const deltaSim = stopOrbits ? 0 : delta * timeScale;

      schedulerRef.current.tick({
        deltaSim,
        simTime: simulatedTimeRef.current,
        system: systems[0],
      });

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [systems, timeScale, stopOrbits, simulatedTimeRef]);

  return null;
};
