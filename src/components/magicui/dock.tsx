"use client";

import { cn } from "@/lib/utils";
import { motion, type MotionValue, useMotionValue, useSpring, useTransform } from "motion/react";
import { createContext, useContext, useRef, type ReactNode } from "react";

interface DockProps {
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
  iconMagnification?: number;
  iconDistance?: number;
}

interface DockIconProps {
  className?: string;
  children?: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const DEFAULT_MAGNIFICATION = 60;
const DEFAULT_DISTANCE = 100;
const BASE_SIZE = 40;
const BASE_ICON_SIZE = 20;
const ICON_SIZE_RATIO = 0.5;
const SPRING = { mass: 0.1, stiffness: 150, damping: 12 };

interface DockContextValue {
  mouseX: MotionValue<number>;
  magnification: number;
  distance: number;
}

const DockContext = createContext<DockContextValue | null>(null);

const Dock = ({ className, style, children, iconMagnification = DEFAULT_MAGNIFICATION, iconDistance = DEFAULT_DISTANCE }: DockProps) => {
  const mouseX = useMotionValue(Infinity);

  return (
    <DockContext.Provider value={{ mouseX, magnification: iconMagnification, distance: iconDistance }}>
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        style={style}
        className={cn("mx-auto w-max flex items-end justify-center overflow-visible rounded-full", className)}
      >
        {children}
      </motion.div>
    </DockContext.Provider>
  );
};

const DockIcon = ({ className, children, onClick }: DockIconProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const boundsRef = useRef<{ x: number; width: number } | null>(null);
  const context = useContext(DockContext);

  if (!context) {
    throw new Error("DockIcon must be used within a Dock component");
  }

  const { mouseX, magnification, distance } = context;

  const distanceCalc = useTransform(mouseX, (val: number) => {
    if (val === Infinity) {
      boundsRef.current = null;
      return Infinity;
    }
    if (!boundsRef.current && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      boundsRef.current = { x: rect.x, width: rect.width };
    }
    const bounds = boundsRef.current ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const containerSize = useSpring(
    useTransform(distanceCalc, [-distance, 0, distance], [BASE_SIZE, magnification, BASE_SIZE]),
    SPRING
  );
  const iconSize = useSpring(
    useTransform(distanceCalc, [-distance, 0, distance], [BASE_ICON_SIZE, magnification * ICON_SIZE_RATIO, BASE_ICON_SIZE]),
    SPRING
  );

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      onClick(e);
      return;
    }
    const target = e.target as HTMLElement;
    const interactive = ref.current?.querySelector<HTMLElement>('a, button');
    if (interactive && !interactive.contains(target)) {
      interactive.click();
    }
  };

  return (
    <motion.div
      ref={ref}
      onClick={handleClick}
      style={{ width: containerSize, height: containerSize }}
      className={cn("relative flex aspect-square items-center justify-center rounded-full shrink-0", className)}
    >
      <motion.div
        style={{ width: iconSize, height: iconSize }}
        className="flex items-center justify-center"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

export { Dock, DockIcon };
export type { DockProps, DockIconProps };
