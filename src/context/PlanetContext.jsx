import { createContext, useState, useEffect } from "react";
import { utils } from "../utils/utils";

export const PlanetContext = createContext();

export const PlanetProvider = ({ children }) => {
  const [planetInfos, setPlanetInfos] = useState(null);
  const [planetObj, setPlanetObj] = useState(null);
  const [planetSize, setPlanetSize] = useState(null);

  const generateNewPlanet = () => {
    const newPlanet = utils.generatePlanetInfos();
    setPlanetInfos(newPlanet);
    setPlanetSize(newPlanet?.size);
  };

  useEffect(() => {
    const planetInfos = generateNewPlanet();
  }, []);

  return (
    <PlanetContext.Provider
      value={{ planetInfos, generateNewPlanet, planetSize, setPlanetSize }}
    >
      {children}
    </PlanetContext.Provider>
  );
};
