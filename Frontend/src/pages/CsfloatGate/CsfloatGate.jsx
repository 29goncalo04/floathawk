import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { FaKey } from "react-icons/fa";
import { validateCsfloatApiKey, pushCsfloatKey } from "../../services/api";
import { resolveError } from "../../utils/errorResolver";
import "./CsfloatGate.css";

export default function CsfloatGate({ onSuccess }) {
  const { t } = useTranslation();
  const [apiKey, setApiKey] = useState("");
  const [phase, setPhase] = useState("idle"); // "idle" | "validating" | "error" | "done"
  const [apiKeyError, setApiKeyError] = useState("");

  const handleSubmit = async () => {
    if (phase === "done") {
      onSuccess();
      return;
    }
    if (!apiKey.trim()) return;
    setPhase("validating");
    setApiKeyError("");
    const result = await validateCsfloatApiKey(apiKey.trim());
    if (result.error) {
      setPhase("error");
      setApiKeyError(result.error);
      return;
    }
    await window.api.saveConfig({ csfloatApiKey: apiKey.trim() });
    await pushCsfloatKey(apiKey.trim());
    setPhase("done");
  };

  const buttonLabel = () => {
    if (phase === "validating") return t("csfloat_gate.btn_validating");
    if (phase === "done") return t("csfloat_gate.btn_done");
    return t("csfloat_gate.btn_idle");
  };

  const showInput = phase === "idle" || phase === "validating" || phase === "error";

  return (
    <div className="csgate_page">
      <motion.div
        className="csgate_card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="csgate_icon_wrap">
          <FaKey className="csgate_icon" />
        </div>

        <div className="csgate_header">
          <h1 className="csgate_title">{t("csfloat_gate.title")}</h1>
          <p className="csgate_subtitle">{t("csfloat_gate.subtitle")}</p>
        </div>

        <AnimatePresence mode="wait">
          {showInput && (
            <motion.div
              key="input-state"
              className="csgate_state"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              <ul className="csgate_bullets">
                <li>{t("csfloat_gate.step_login")}</li>
                <li>{t("csfloat_gate.step_avatar")}</li>
                <li>{t("csfloat_gate.step_developers_1")}<strong>{t("csfloat_gate.step_developers_2")}</strong></li>
                <li>{t("csfloat_gate.step_api_key")}</li>
              </ul>

              <input
                className={`csgate_input${phase === "error" ? " csgate_input--error" : ""}`}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={t("csfloat_gate.placeholder")}
                spellCheck={false}
                autoComplete="off"
                disabled={phase === "validating"}
              />

              {phase === "validating" && (
                <div className="csgate_spinner_row">
                  <div className="csgate_spinner" />
                  <span className="csgate_hint">{t("csfloat_gate.checking")}</span>
                </div>
              )}

              {phase === "error" && apiKeyError && (
                <motion.p
                  className="csgate_error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {resolveError(apiKeyError, t)}
                </motion.p>
              )}
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div
              key="done-state"
              className="csgate_state"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <motion.div
                className="csgate_done_icon"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
              >
                ✓
              </motion.div>
              <p className="csgate_done_text">{t("csfloat_gate.saved")}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          className="csgate_btn"
          onClick={handleSubmit}
          disabled={phase === "validating" || (phase !== "done" && !apiKey.trim())}
        >
          {buttonLabel()}
        </button>
      </motion.div>
    </div>
  );
}
