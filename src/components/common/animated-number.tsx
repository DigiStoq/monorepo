import { useEffect, useRef } from "react";
import { motion, useSpring, useTransform, useInView } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatValue?: (value: number) => string;
  className?: string;
  animateOnView?: boolean;
}

export function AnimatedNumber({
  value,
  duration = 1,
  formatValue = (v) => v.toLocaleString(),
  className,
  animateOnView = true,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (current) => formatValue(Math.round(current)));

  useEffect(() => {
    if (animateOnView) {
      if (isInView) {
        spring.set(value);
      }
    } else {
      spring.set(value);
    }
  }, [spring, value, isInView, animateOnView]);

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  );
}
