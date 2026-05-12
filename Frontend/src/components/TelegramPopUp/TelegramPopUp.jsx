import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { FaTelegram } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import "./TelegramPopUp.css"

function TelegramPopUp({ onClose, isClosing }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <motion.div
      className="telegram-popup"
      initial={{ opacity: 0, y: -20, scale: 0.97 }}
      animate={isClosing
        ? { opacity: 0, y: -20, scale: 0.97 }
        : { opacity: 1, y: 0, scale: 1 }
      }
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <button className="popup-close" onClick={onClose}>
        <IoClose />
      </button>

      <div className="popup-icon">
        <FaTelegram />
      </div>

      <h2 className="popup-title">{t("telegram_popup.title")}</h2>

      <p className="popup-description">{t("telegram_popup.description")}</p>

      <button className="popup-cta" onClick={() => navigate("/tutorial")}>
        {t("telegram_popup.btn")}
      </button>
    </motion.div>
  );
}

export default TelegramPopUp;
