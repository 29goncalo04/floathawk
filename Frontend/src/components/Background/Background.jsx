import { motion } from "framer-motion";
import "./Background.css";

export default function Background() {
  return (
    <div className="background">
      <motion.div
        className="blob blob1"
				initial={{ opacity: 0, scale: 0.8 }}
        animate={{
  				opacity: 0.3,
          scale: [0.8, 1.2, 0.9, 1, 0.8],
          x: [0, 100, -50, 0],
          y: [0, -50, 100, 0],
        }}
        transition={{
          opacity: { duration: 2 },
          scale: {
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          },
          x: {
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          },
          y: {
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
      />

      <motion.div
        className="blob blob2"
				initial={{ opacity: 0, scale: 0.8 }}
        animate={{
					opacity: 0.3,
          x: [0, -80, 60, 0],
          y: [0, 60, -80, 0],
          scale: [0.8, 1.1, 1.3, 1, 0.8],
        }}
        transition={{
          opacity: { duration: 2 },
          scale: {
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          },
          x: {
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          },
          y: {
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
      />
    </div>
  );
}