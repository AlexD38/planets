import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { utils } from "../utils/utils";
import {
  generateUniverse,
  generateSystemExtras,
  createPlanet,
  aggregateSystems,
  SYSTEM_POSITIONS,
  computeFirstOrbitRadius,
  ORBIT_GAP_MIN,
  ORBIT_GAP_MAX,
  SUN_SIZE_MIN,
  SUN_SIZE_MAX,
} from "../utils/generateSystem";
import { getOrbitPosition } from "../utils/orbit";
import { approachPlanetMessage, systemLoadedMessage } from "../utils/logMessages";
import {
  setSeed,
  getSeedFromUrl,
  createRandomSeed,
} from "../utils/seededRandom";

export const PlanetContext = createContext();

function buildSystems() {
  return SYSTEM_POSITIONS.map((pos) => {
    const sunSize = utils.randomBetween(SUN_SIZE_MIN, SUN_SIZE_MAX);
    const orbitGap = utils.randomBetween(ORBIT_GAP_MIN, ORBIT_GAP_MAX);
    const baseRadius = computeFirstOrbitRadius(sunSize);
    const planets = generateUniverse({ baseRadius, orbitGap });
    const extras = generateSystemExtras(planets, sunSize);
    return {
      ...pos,
      planets,
      orbitGap,
      ...extras,
    };
  });
}

function buildStateFromSeed(seedInput) {
  const seed = setSeed(seedInput);
  const systems = buildSystems();
  const aggregated = aggregateSystems(systems.map((s) => s.planets));
  const sunName = systems[0]?.sunName;
  const systemInfos = aggregated
    ? { ...aggregated, name: sunName ?? aggregated.name }
    : null;
  return {
    seed,
    systems,
    systemInfos,
    planetInfos: systemInfos
      ? { ...utils.generatePlanetInfos(), name: systemInfos.name }
      : utils.generatePlanetInfos(),
  };
}

function getInitialState() {
  const urlSeed = getSeedFromUrl();
  const seed = urlSeed != null ? urlSeed : createRandomSeed();
  return buildStateFromSeed(seed);
}

export const PlanetProvider = ({ children }) => {
  const [initialState] = useState(getInitialState);
  const [systems, setSystems] = useState(initialState.systems);

  const selectableMeshesRef = useRef(new Map());

  const [planetInfos, setPlanetInfos] = useState(initialState.planetInfos);
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [flyToTarget, setFlyToTarget] = useState(null);
  const [planetObj, setPlanetObj] = useState(null);
  const [planetObj2, setPlanetObj2] = useState(null);
  const [planetSize, setPlanetSize] = useState(null);
  const [planetInfosDisplay, setPlanetInfosDisplay] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [scene, setScene] = useState(null);
  const [stars1, setStars1] = useState(null);
  const [sun, setSun] = useState(null);
  const [stars2, setStars2] = useState(null);
  const [stars3, setStars3] = useState(null);
  const [stars4, setStars4] = useState(null);
  const [stars5, setStars5] = useState(null);
  const [moons, setMoons] = useState(null);
  const [moons6, setMoons6] = useState(null);
  const [camera, setCamera] = useState(null);
  const [renderer, setRenderer] = useState(null);
  const [systemInfos, setSystemInfos] = useState(initialState.systemInfos);
  const [stopOrbits, setStopOrbits] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  const [showOrbitPaths, setShowOrbitPaths] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [bloomEnabled, setBloomEnabled] = useState(true);
  const [lowQuality, setLowQuality] = useState(window.innerWidth < 768);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [logEntries, setLogEntries] = useState([]);
  const [showCaptainLog, setShowCaptainLog] = useState(false);
  const [simulatedTime, setSimulatedTime] = useState(0);
  const [activeEvent, setActiveEvent] = useState(null);
  const [auroraPlanetId, setAuroraPlanetId] = useState(null);
  const [pulsarSurgeActive, setPulsarSurgeActive] = useState(false);
  const logIdRef = useRef(0);
  const systemLoggedRef = useRef(false);
  const simulatedTimeRef = useRef(0);
  const [moveState, setMoveState] = useState({
    thrust: 0,
    thrustReverse: 0,
    pitchUp: 0,
    pitchDown: 0,
    rollLeft: 0,
    rollRight: 0,
    isFlyMode: false,
  });
  const registerSelectable = useCallback((mesh, planetData) => {
    selectableMeshesRef.current.set(mesh.uuid, { mesh, planetData });
  }, []);

  const unregisterSelectable = useCallback((mesh) => {
    selectableMeshesRef.current.delete(mesh.uuid);
  }, []);

  const getSelectableMeshes = useCallback(() => {
    return Array.from(selectableMeshesRef.current.values()).map((e) => e.mesh);
  }, []);

  const getPlanetDataFromMesh = useCallback((mesh) => {
    return selectableMeshesRef.current.get(mesh.uuid)?.planetData ?? null;
  }, []);

  const addLogEntry = useCallback((text) => {
    if (!text) return;
    setLogEntries((prev) => {
      const entry = {
        id: `log-${++logIdRef.current}`,
        text,
        ts: simulatedTimeRef.current,
      };
      return [entry, ...prev].slice(0, 8);
    });
  }, []);

  const flyToPlanet = useCallback((planet, systemIndex = 0) => {
    if (!planet?.orbit) return;
    const system = systems[systemIndex];
    if (!system) return;
    const orbitCenter = { x: system.x, y: system.y, z: system.z };
    setSelectedPlanet(planet);
    setFlyToTarget({ planet, orbitCenter });
    addLogEntry(approachPlanetMessage(planet));
  }, [systems, addLogEntry]);

  const addPlanet = useCallback(() => {
    let newPlanet = null;
    let orbitCenter = null;
    let updatedPlanets = null;

    setSystems((prev) => {
      const current = prev[0];
      if (!current) return prev;

      const maxRadius = current.planets.reduce(
        (max, p) => Math.max(max, p.orbit?.radius ?? 0),
        computeFirstOrbitRadius(current.sunSize ?? SUN_SIZE_MIN),
      );
      const gap = current.orbitGap ?? utils.randomBetween(ORBIT_GAP_MIN, ORBIT_GAP_MAX);
      newPlanet = createPlanet({
        orbitRadius: maxRadius + gap,
        index: current.planets.length,
      });
      updatedPlanets = [...current.planets, newPlanet];
      orbitCenter = { x: current.x, y: current.y, z: current.z };

      return [{ ...current, planets: updatedPlanets }, ...prev.slice(1)];
    });

    if (!newPlanet || !orbitCenter || !updatedPlanets) return;

    setSystemInfos(aggregateSystems(updatedPlanets));
    setSelectedPlanet(newPlanet);
    setPlanetInfos(newPlanet);
    setFlyToTarget({ planet: newPlanet, orbitCenter });
  }, []);

  const removePlanet = useCallback(() => {
    if (!selectedPlanet?.planetId) return;

    const planetId = selectedPlanet.planetId;
    let updatedPlanets = null;

    setSystems((prev) => {
      const current = prev[0];
      if (!current || current.planets.length <= 1) return prev;

      updatedPlanets = current.planets.filter((p) => p.planetId !== planetId);
      if (updatedPlanets.length === current.planets.length) return prev;

      return [{ ...current, planets: updatedPlanets }, ...prev.slice(1)];
    });

    if (!updatedPlanets) return;

    const aggregated = aggregateSystems(updatedPlanets);
    setSystemInfos(aggregated);
    setSelectedPlanet(null);
    setFlyToTarget(null);
    setPlanetInfos(
      aggregated
        ? { ...utils.generatePlanetInfos(), name: aggregated.name }
        : utils.generatePlanetInfos(),
    );
  }, [selectedPlanet]);

  const toggleFlyMode = useCallback(() => {
    setMoveState((prev) => ({ ...prev, isFlyMode: !prev.isFlyMode }));
  }, []);

  useEffect(() => {
    if (selectedPlanet) {
      setPlanetInfos(selectedPlanet);
    }
  }, [selectedPlanet]);

  useEffect(() => {
    if (systemLoggedRef.current || !systems[0]) return;
    systemLoggedRef.current = true;
    const sys = systems[0];
    setLogEntries([
      {
        id: "log-init",
        text: systemLoadedMessage(sys.sunName, sys.planets.length),
        ts: 0,
      },
    ]);
  }, [systems]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === "Space") event.preventDefault();

      if (event.code === "BracketLeft") {
        setTimeScale((prev) => Math.max(0, prev - 0.5));
        return;
      }
      if (event.code === "BracketRight") {
        setTimeScale((prev) => Math.min(50, prev + 0.5));
        return;
      }

      setMoveState((prev) => {
        const newMoveState = { ...prev };
        switch (event.code) {
          case "Space":
            newMoveState.thrust = 1;
            break;
          case "ArrowUp":
            newMoveState.pitchUp = 1;
            break;
          case "ArrowDown":
            newMoveState.pitchDown = 1;
            break;
          case "ArrowLeft":
            newMoveState.rollLeft = 1;
            break;
          case "ArrowRight":
            newMoveState.rollRight = 1;
            break;
          case "ShiftLeft":
          case "ShiftRight":
            newMoveState.thrustReverse = 1;
            break;
        }
        return newMoveState;
      });
    };

    const handleKeyUp = (event) => {
      setMoveState((prev) => {
        const newMoveState = { ...prev };
        switch (event.code) {
          case "Space":
            newMoveState.thrust = 0;
            break;
          case "ArrowUp":
            newMoveState.pitchUp = 0;
            break;
          case "ArrowDown":
            newMoveState.pitchDown = 0;
            break;
          case "ArrowLeft":
            newMoveState.rollLeft = 0;
            break;
          case "ArrowRight":
            newMoveState.rollRight = 0;
            break;
          case "ShiftLeft":
          case "ShiftRight":
            newMoveState.thrustReverse = 0;
            break;
        }
        return newMoveState;
      });
    };

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setLowQuality(mobile);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      planetInfos,
      setPlanetInfos,
      selectedPlanet,
      setSelectedPlanet,
      flyToTarget,
      setFlyToTarget,
      flyToPlanet,
      addPlanet,
      removePlanet,
      planetSize,
      setPlanetSize,
      isMobile,
      scene,
      setScene,
      planetObj,
      setPlanetObj,
      planetObj2,
      setPlanetObj2,
      stars1,
      setStars1,
      stars2,
      setStars2,
      stars3,
      setStars3,
      stars4,
      setStars4,
      stars5,
      setStars5,
      camera,
      setCamera,
      renderer,
      setRenderer,
      moons,
      setMoons,
      moons6,
      setMoons6,
      systems,
      systemInfos,
      planetInfosDisplay,
      setPlanetInfosDisplay,
      sun,
      setSun,
      stopOrbits,
      setStopOrbits,
      timeScale,
      setTimeScale,
      showOrbitPaths,
      setShowOrbitPaths,
      showLabels,
      setShowLabels,
      showMinimap,
      setShowMinimap,
      bloomEnabled,
      setBloomEnabled,
      lowQuality,
      setLowQuality,
      audioEnabled,
      setAudioEnabled,
      logEntries,
      addLogEntry,
      showCaptainLog,
      setShowCaptainLog,
      simulatedTime,
      setSimulatedTime,
      simulatedTimeRef,
      activeEvent,
      setActiveEvent,
      auroraPlanetId,
      setAuroraPlanetId,
      pulsarSurgeActive,
      setPulsarSurgeActive,
      registerSelectable,
      unregisterSelectable,
      getSelectableMeshes,
      getPlanetDataFromMesh,
      moveState,
      toggleFlyMode,
      getOrbitPosition,
    }),
    [
      planetInfos,
      selectedPlanet,
      flyToTarget,
      flyToPlanet,
      addPlanet,
      removePlanet,
      planetSize,
      isMobile,
      scene,
      planetObj,
      planetObj2,
      stars1,
      stars2,
      stars3,
      stars4,
      stars5,
      camera,
      renderer,
      moons,
      moons6,
      systems,
      systemInfos,
      planetInfosDisplay,
      sun,
      stopOrbits,
      timeScale,
      showOrbitPaths,
      showLabels,
      showMinimap,
      bloomEnabled,
      lowQuality,
      audioEnabled,
      logEntries,
      addLogEntry,
      showCaptainLog,
      simulatedTime,
      activeEvent,
      auroraPlanetId,
      pulsarSurgeActive,
      registerSelectable,
      unregisterSelectable,
      getSelectableMeshes,
      getPlanetDataFromMesh,
      moveState,
      toggleFlyMode,
    ],
  );

  return (
    <PlanetContext.Provider value={contextValue}>
      {children}
    </PlanetContext.Provider>
  );
};
