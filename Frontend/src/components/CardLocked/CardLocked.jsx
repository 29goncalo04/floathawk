import { motion } from "framer-motion";
import { useState } from "react";
import { TbLock } from "react-icons/tb";
import "./CardLocked.css"

function CardLocked({ title, icon, description, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div 
      className="card_locked" 
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{ y: hovered ? -5 : 0 }}
      whileTap={{ scale: 0.99, y: 0 }}
      transition={{ duration: 0.1 }}
    >
      <div className="card-icon">
        {icon}
      </div>
      <div className="lock-icon"><TbLock /></div>
      <div className="card-title">
        {title}
      </div>

      <motion.div
        initial={false}
        animate={{
          height: hovered ? "auto" : 0,
          opacity: hovered ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        style={{ overflow: "hidden" }}
      >
        <div className="description">
          {description}
        </div>
      </motion.div>

    </motion.div>
  );
}

export default CardLocked;