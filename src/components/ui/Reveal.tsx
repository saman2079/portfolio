"use client";

import { motion, type Variants } from "framer-motion";

import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;

  delay?: number;

  className?: string;

  /** Distance (px) the content travels in from — direction is always upward. */

  y?: number;

  once?: boolean;
}

const variants: Variants = {
  hidden: { opacity: 0, y: 32, filter: "blur(8px)" },

  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

/**

 * A soft fade + blur + slide-up reveal, triggered once an element enters the

 * viewport. This is the single motion primitive reused by every section

 * (About, Skills, Projects, Contact, GitHub) so the whole site feels like one

 * consistent, deliberate motion language instead of a grab-bag of effects.

 */

export function Reveal({
  children,
  delay = 0,
  className,
  y = 32,
  once = true,
}: RevealProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.25 }}
      variants={{
        hidden: { opacity: 0, y, filter: "blur(8px)" },

        visible: { opacity: 1, y: 0, filter: "blur(0px)" },
      }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
