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
}

const DEFAULT_MAGNIFICATION = 60;
const DEFAULT_DISTANCE = 140;
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
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        style={style}
        className={cn("mx-auto w-max flex items-center justify-center overflow-visible rounded-full", className)}
      >
        {children}
      </motion.div>
    </DockContext.Provider>
  );
};

const DockIcon = ({ className, children }: DockIconProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const context = useContext(DockContext);

  if (!context) {
    throw new Error("DockIcon must be used within a Dock component");
  }

  const { mouseX, magnification, distance } = context;

  const distanceCalc = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0, left: 0 };
    const x = bounds.x ?? bounds.left ?? 0;
    return val - x - bounds.width / 2;
  });

  const containerSize = useSpring(
    useTransform(distanceCalc, [-distance, 0, distance], [BASE_SIZE, magnification, BASE_SIZE], { clamp: true }),
    SPRING
  );
  const iconSize = useSpring(
    useTransform(distanceCalc, [-distance, 0, distance], [BASE_ICON_SIZE, magnification * ICON_SIZE_RATIO, BASE_ICON_SIZE], { clamp: true }),
    SPRING
  );
  const lift = useSpring(
    useTransform(distanceCalc, [-distance, 0, distance], [0, -8, 0], { clamp: true }),
    SPRING
  );
  const zIndex = useTransform(distanceCalc, (d: number) => {
    if (Math.abs(d) >= distance) return 1;
    return Math.round(50 - (Math.abs(d) / distance) * 40);
  });

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const isDirectClick = e.target === e.currentTarget || (e.target as HTMLElement).parentElement === e.currentTarget;
    if (isDirectClick && !((e.target as HTMLElement).closest("a, button"))) {
      const clickable = e.currentTarget.querySelector<HTMLElement>("a, button");
      if (clickable) {
        clickable.click();
      }
    }
  };

  return (
    <div
      ref={ref}
      style={{ width: BASE_SIZE, height: BASE_SIZE }}
      className="relative flex items-center justify-center shrink-0"
    >
      <motion.div
        onClick={handleCardClick}
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          x: "-50%",
          y: lift,
          width: containerSize,
          height: containerSize,
          zIndex,
        }}
        className={cn(
          "group/tooltip flex aspect-square items-center justify-center rounded-full shrink-0 will-change-transform",
          className
        )}
      >
        <motion.div
          style={{ width: iconSize, height: iconSize }}
          className="flex items-center justify-center"
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
};

export { Dock, DockIcon };
export type { DockProps, DockIconProps };
