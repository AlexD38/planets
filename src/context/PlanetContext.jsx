import { createContext, useState, useEffect } from "react";
import { utils } from "../utils/utils";

export const PlanetContext = createContext();

export const PlanetProvider = ({ children }) => {
  const [planetInfos, setPlanetInfos] = useState(null);
  const [planetObj, setPlanetObj] = useState(null);
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

  useEffect(() => {
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
      }}
    >
      {children}
    </PlanetContext.Provider>
  );
};
