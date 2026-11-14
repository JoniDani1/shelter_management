"use client";
import { cn } from "@/lib/utils";
import {
  motion,
  SpringOptions,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";
import { useEffect } from "react";

export type AnimatedNumberProps = {
  value: number;
  className?: string;
  springOptions?: SpringOptions;
  as?: React.ElementType;
};

export function AnimatedNumber({
  value,
  className,
  springOptions,
  as = "span",
}: AnimatedNumberProps) {
  const MotionComponent = motion.create(as as keyof JSX.IntrinsicElements);

  const reduced = useReducedMotion();
  const spring = useSpring(value, springOptions);
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString("en-GB"),
  );

  useEffect(() => {
    if (reduced) spring.jump(value);
    else spring.set(value);
  }, [spring, value, reduced]);

  return (
    <MotionComponent className={cn("tabular-nums", className)}>
      {display}
    </MotionComponent>
  );
}
