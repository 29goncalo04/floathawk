import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import "./Step6.css";

function resolveError(error, t) {
  const key = `telegram.step6.${error}`;
  const translated = t(key);
  return translated !== key ? translated : error;
}

export default function Step6({ token, setToken, phase, botUsername, validationError, chatIdError }) {
  const { t } = useTranslation();
  const showInput = phase === "idle" || phase === "validating" || phase === "error";
  const showPrompt = phase === "validated" || phase === "fetchingChatId";

  return (
    <div className="step6">
      <AnimatePresence mode="wait">

        {showInput && (
          <motion.div
            key="input-state"
            className="step6_state"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
          >
            <div className="step6_header">
              <h2 className="step6_title">{t("telegram.step6.title")}</h2>
              <p className="step6_subtitle">{t("telegram.step6.subtitle")}</p>
            </div>

            <input
              className={`step6_input${validationError ? " step6_input--error" : ""}`}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={t("telegram.step6.placeholder")}
              spellCheck={false}
              autoComplete="off"
              disabled={phase === "validating"}
            />

            {phase === "validating" && (
              <div className="step6_spinner_row">
                <div className="step6_spinner" />
                <span className="step6_hint">{t("telegram.step6.checking")}</span>
              </div>
            )}

            {phase === "error" && validationError && (
              <motion.p
                className="step6_error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {resolveError(validationError, t)}
              </motion.p>
            )}
          </motion.div>
        )}

        {showPrompt && (
          <motion.div
            key="prompt-state"
            className="step6_state"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
          >
            <div className="step6_success_badge">
              <span className="step6_check">✓</span>
              <span>{t("telegram.step6.connected_to")}<strong>@{botUsername}</strong></span>
            </div>

            <div className="step6_prompt_card">
              <p className="step6_prompt_title">{t("telegram.step6.one_last_step")}</p>
              <p className="step6_prompt_text">
                {t("telegram.step6.prompt_1")}
                <strong>@{botUsername}</strong>
                {t("telegram.step6.prompt_2")}
                <em>{t("telegram.step6.prompt_example")}</em>
                {t("telegram.step6.prompt_3")}
                <strong>&ldquo;{t("telegram.nav.finish")}&rdquo;</strong>
                {t("telegram.step6.prompt_4")}
              </p>
            </div>

            {phase === "fetchingChatId" && (
              <div className="step6_spinner_row">
                <div className="step6_spinner" />
                <span className="step6_hint">{t("telegram.step6.connecting")}</span>
              </div>
            )}

            {phase === "validated" && chatIdError && (
              <motion.p
                className="step6_error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {resolveError(chatIdError, t)}
              </motion.p>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
