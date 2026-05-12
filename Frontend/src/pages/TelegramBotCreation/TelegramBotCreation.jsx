import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { validateTelegram, confirmTelegram, pushBotCredentials } from "../../services/api";

import Stepper from "../../components/Stepper/Stepper";
import Step1 from "./Steps/Step1_Account/Step1";
import Step2 from "./Steps/Step2_BotFather/Step2";
import Step3 from "./Steps/Step3_Start/Step3";
import Step4 from "./Steps/Step4_NewBot/Step4";
import Step5 from "./Steps/Step5_CopyToken/Step5";
import Step6 from "./Steps/Step6_PasteToken/Step6";
import "./TelegramBotCreation.css";

const STEP_COMPONENTS = [Step1, Step2, Step3, Step4, Step5, Step6];
const TELEGRAM_TOKEN_STEP = 5;

const variants = {
  enter: (dir) => ({ x: dir > 0 ? 560 : -560, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir < 0 ? 560 : -560, opacity: 0 }),
};

export default function TelegramBotCreation({ onFinish }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const [token, setToken] = useState("");
  const [phase, setPhase] = useState("idle"); // "idle"|"validating"|"validated"|"fetchingChatId"|"error"
  const [botUsername, setBotUsername] = useState("");
  const [validationError, setValidationError] = useState("");
  const [chatIdError, setChatIdError] = useState("");

  const STEPS = STEP_COMPONENTS.map((component, i) => ({
    component,
    title: t(`telegram.steps.${i}`),
  }));

  const goToStep = (index) => {
    setDirection(index > step ? 1 : -1);
    setStep(index);
  };

  const next = () => goToStep(Math.min(step + 1, STEPS.length - 1));
  const prev = () => goToStep(Math.max(step - 1, 0));

  const isFirst = step === 0;
  const CurrentStep = STEPS[step].component;

  const isTelegramAsync = phase === "validating" || phase === "fetchingChatId";

  const handleTelegramStep = async () => {
    if (phase === "idle" || phase === "error") {
      if (!token.trim()) return;
      setPhase("validating");
      setValidationError("");
      setChatIdError("");
      const result = await validateTelegram(token.trim());
      if (result.error) {
        setPhase("error");
        setValidationError(result.error);
        return;
      }
      setBotUsername(result.bot_username);
      setPhase("validated");
      return;
    }

    if (phase === "validated") {
      setPhase("fetchingChatId");
      setChatIdError("");
      const result = await confirmTelegram(token.trim());
      if (result.error) {
        setPhase("validated");
        setChatIdError(result.error);
        return;
      }
      await window.api.saveConfig({ botToken: token.trim(), chatId: result.chat_id });
      await pushBotCredentials(token.trim(), result.chat_id);
      setPhase("idle");
      onFinish?.();
      navigate("/");
    }
  };

  const handleClick = () => {
    if (step === TELEGRAM_TOKEN_STEP) return handleTelegramStep();
    return next();
  };

  const isDisabled = () => {
    if (step === TELEGRAM_TOKEN_STEP) return !token.trim() || isTelegramAsync;
    return false;
  };

  const buttonLabel = () => {
    if (step === TELEGRAM_TOKEN_STEP) {
      if (phase === "validating") return t("telegram.nav.validating");
      if (phase === "fetchingChatId") return t("telegram.nav.connecting");
      if (phase === "validated") return t("telegram.nav.finish");
      return t("telegram.nav.validate");
    }
    return t("telegram.nav.next");
  };

  return (
    <div className="tutorial_page">
      <div className="tutorial_stepper_wrap">
        <Stepper currentStep={step} steps={STEPS} onStepClick={goToStep} />
      </div>

      <div className="carousel_wrapper">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="carousel_slide"
          >
            <CurrentStep
              token={token}
              setToken={setToken}
              phase={phase}
              botUsername={botUsername}
              validationError={validationError}
              chatIdError={chatIdError}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="carousel_nav">
        <button
          className="nav_btn nav_btn--prev"
          onClick={prev}
          disabled={isFirst || isTelegramAsync}
        >
          {t("telegram.nav.prev")}
        </button>
        <button
          className="nav_btn nav_btn--next"
          onClick={handleClick}
          disabled={isDisabled()}
        >
          {buttonLabel()}
        </button>
      </div>
    </div>
  );
}
