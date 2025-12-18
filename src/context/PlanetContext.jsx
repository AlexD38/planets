import { createContext, useState, useEffect } from "react";
import { utils } from "../utils/utils";
import { texturesArr } from "../config/config";

export const PlanetContext = createContext();

export const PlanetProvider = ({ children }) => {
  const [planetInfos, setPlanetInfos] = useState(null);
  const [planetObj, setPlanetObj] = useState(null);
  const [planetObj2, setPlanetObj2] = useState(null);
  const [planetSize, setPlanetSize] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [scene, setScene] = useState(null);
  const [stars1, setStars1] = useState(null);
  const [stars2, setStars2] = useState(null);
  const [stars3, setStars3] = useState(null);
  const [stars4, setStars4] = useState(null);
  const [stars5, setStars5] = useState(null);
  const [moons, setMoons] = useState(null);
  const [moons6, setMoons6] = useState(null);
  const [camera, setCamera] = useState(null);
  const [renderer, setRenderer] = useState(null);
  const [universe, setUniverse] = useState(null);

  useEffect(() => {
    const planetsToGenerate = utils.randomBetween(0, 3);
    const generatedUniverse = [];
    for (let index = 0; index < planetsToGenerate; index++) {
      const planetSettings = {
        name: utils.generatePlanetInfos()?.name,
        rotation: utils.randomBetween(-0.005, 0.005),
        x: utils.randomBetween(-20, 20),
        y: utils.randomBetween(-0, 0),
        z: utils.randomBetween(-20, 20),
        size: utils.randomBetween(2, 6),
        texture: utils.getRandomElement(texturesArr),
      };
      generatedUniverse.push(planetSettings);
    }
    setUniverse(generatedUniverse);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const generateNewPlanet = () => {
    const newPlanet = utils.generatePlanetInfos();
    setPlanetInfos(newPlanet);
    setPlanetSize(newPlanet?.size);
  };

  useEffect(() => {
    generateNewPlanet();
  }, []);

  return (
    <PlanetContext.Provider
      value={{
        planetInfos,
        generateNewPlanet,
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
        universe,
      }}
    >
      {children}
    </PlanetContext.Provider>
  );
};
