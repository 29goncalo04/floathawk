import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TelegramPopUp from "../../components/TelegramPopUp/TelegramPopUp";
import Card from "../../components/Card/Card";
import CardLocked from "../../components/CardLocked/CardLocked";
import { gridVariants, cardVariants } from "./HomeAnimations";
import { useTypingText } from "../../hooks/useTypingText";
import { usePopUp } from "../../hooks/usePopUp";
import { motion } from "motion/react";
import { LuBot } from "react-icons/lu";
import { MdPriceCheck } from "react-icons/md";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";
import "./Home.css";

function Home({ hasBot }) {
  const { t } = useTranslation();
  const [pageIsReady, setPageIsReady] = useState(false);

  const words = t("home.typing_words", { returnObjects: true });
  const text = useTypingText(words, pageIsReady);

  const navigate = useNavigate();
  const { showPopup, isClosing, openPopup, closePopup } = usePopUp();

  return (
    <motion.div
      className="container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeIn" }}
      onAnimationComplete={() => setPageIsReady(true)}
    >
      <p className="subtitle">
        {t("home.subtitle")}
      </p>

      <p className="subtitle">
        {text}
        <span className="cursor"></span>
      </p>

      <motion.div
        className="grid"
        variants={gridVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={cardVariants}>
          {hasBot ? (
            <Card
              title={t("home.run_bot.title")}
              icon={<LuBot />}
              description={t("home.run_bot.description")}
              onClick={() => navigate("/run-bot")}
            />
          ) : (
            <CardLocked
              title={t("home.run_bot.title")}
              icon={<LuBot />}
              description={t("home.run_bot.description")}
              onClick={openPopup}
            />
          )}
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card
            title={t("home.calculate_price.title")}
            icon={<MdPriceCheck />}
            description={t("home.calculate_price.description")}
            onClick={() => navigate("/calculate-price")}
          />
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card
            title={t("home.update_excel.title")}
            icon={<PiMicrosoftExcelLogoFill />}
            description={t("home.update_excel.description")}
            onClick={() => navigate("/update-excel")}
          />
        </motion.div>
      </motion.div>

      {(showPopup || isClosing) && (
        <div className={`overlay ${isClosing ? "closing" : ""}`}>
          <TelegramPopUp onClose={closePopup} isClosing={isClosing} />
        </div>
      )}
    </motion.div>
  );
}

export default Home;
