import { useContext, useEffect, useRef } from "react";
import { PlanetContext } from "../context/PlanetContext";
import cockpitImg from "../assets/cockpit.png";

const MAX_SHIFT_X = 16;
const MAX_SHIFT_Y = 12;
const MAX_ROLL = 1.6;
const THRUST_SHIFT = 8;
const SMOOTH = 0.14;

export const CockpitOverlay = () => {
  const { moveState } = useContext(PlanetContext);
  const imgRef = useRef(null);
  const offset = useRef({ x: 0, y: 0, r: 0 });
  const moveStateRef = useRef(moveState);
  moveStateRef.current = moveState;

  useEffect(() => {
    if (!moveState.isFlyMode) {
      if (imgRef.current) {
        imgRef.current.style.transform = "";
      }
      offset.current = { x: 0, y: 0, r: 0 };
      return;
    }

    let frame = 0;

    const tick = () => {
      const {
        pitchUp,
        pitchDown,
        rollLeft,
        rollRight,
        thrust,
        thrustReverse,
      } = moveStateRef.current;

      const pitch = pitchDown - pitchUp;
      const roll = rollLeft - rollRight;
      const accel = thrust - thrustReverse;

      const targetX = -roll * MAX_SHIFT_X;
      const targetY = -(pitch * MAX_SHIFT_Y + accel * THRUST_SHIFT);
      const targetR = -roll * MAX_ROLL;

      const o = offset.current;
      o.x += (targetX - o.x) * SMOOTH;
      o.y += (targetY - o.y) * SMOOTH;
      o.r += (targetR - o.r) * SMOOTH;

      if (imgRef.current) {
        imgRef.current.style.transform = `translate3d(${o.x}px, ${o.y}px, 0) rotate(${o.r}deg)`;
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [moveState.isFlyMode]);

  if (!moveState.isFlyMode) return null;

  return (
    <img
      ref={imgRef}
      src={cockpitImg}
      alt=""
      className="cockpit-overlay"
      aria-hidden
    />
  );
};
