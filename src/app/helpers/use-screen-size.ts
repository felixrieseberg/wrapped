import { useState, useEffect } from "react";

export default function useScreenWidth() {
  const isWindow = typeof window !== "undefined";

  const [windowWidth, setWindowWidth] = useState<null | number>(null);
  const [windowHeight, setWindowHeight] = useState<null | number>(null);

  const getWidth = () => (isWindow ? window.innerWidth : windowWidth);
  const getHeight = () => (isWindow ? window.innerHeight : windowHeight);
  const resize = () => {
    setWindowHeight(getHeight());
    setWindowWidth(getWidth());
  };

  useEffect(() => {
    if (isWindow) {
      const width = getWidth();
      const height = getHeight();

      if (width && height) {
        setWindowWidth(width);
        setWindowHeight(height);

        window.addEventListener("resize", resize);
      }

      return () => window.removeEventListener("resize", resize);
    }
  }, [getHeight, getWidth, isWindow, resize]);

  return { windowWidth, windowHeight };
}
