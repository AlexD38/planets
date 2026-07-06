import { useContext, useEffect, useRef } from "react";
import { PlanetContext } from "../context/PlanetContext";
import { createRareEventScheduler } from "../utils/rareEvents";
import { playRadarPing } from "../utils/spaceAudio";

export const RareEvents = () => {
  const {
    systems,
    camera,
    timeScale,
    stopOrbits,
    addLogEntry,
    setActiveEvent,
    setAuroraPlanetId,
    setPulsarSurgeActive,
    simulatedTimeRef,
    setSimulatedTime,
    audioEnabled,
  } = useContext(PlanetContext);

  const schedulerRef = useRef(null);

  useEffect(() => {
    schedulerRef.current = createRareEventScheduler({
      onEvent: (event, message) => {
        addLogEntry(message, { beep: false });
        setActiveEvent(event);
        if (event.type === "aurora") setAuroraPlanetId(event.planetId);
        if (event.type === "pulsarSurge") setPulsarSurgeActive(true);
        if (audioEnabled) playRadarPing();
      },
      onEventEnd: (event) => {
        setActiveEvent(null);
        if (event.type === "aurora") setAuroraPlanetId(null);
        if (event.type === "pulsarSurge") setPulsarSurgeActive(false);
      },
    });
  }, [addLogEntry, setActiveEvent, setAuroraPlanetId, setPulsarSurgeActive, audioEnabled]);

  useEffect(() => {
    if (!camera || !systems[0] || !schedulerRef.current) return;

    let frameId;
    let lastTime = performance.now();

    const tick = (now) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      const deltaSim = delta * timeScale;

      const result = schedulerRef.current.tick({
        deltaSim,
        camera,
        system: systems[0],
        stopOrbits,
      });

      if (result?.simTime != null) {
        simulatedTimeRef.current = result.simTime;
        setSimulatedTime(result.simTime);
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [camera, systems, timeScale, stopOrbits, simulatedTimeRef, setSimulatedTime]);

  return null;
};
