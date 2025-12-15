import { createContext, useState, useEffect } from "react";
import { utils } from "../utils/utils";

export const PlanetContext = createContext();

export const PlanetProvider = ({ children }) => {
  const [planetInfos, setPlanetInfos] = useState(null);
  const [planetObj, setPlanetObj] = useState(null);
  const [planetSize, setPlanetSize] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
      }}
    >
      {children}
    </PlanetContext.Provider>
  );
};
