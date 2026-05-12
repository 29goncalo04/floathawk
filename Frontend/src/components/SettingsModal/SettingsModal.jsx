import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { FaKey, FaTelegram } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { validateCsfloatApiKey } from "../../services/api";
import { resolveError } from "../../utils/errorResolver";
import "./SettingsModal.css";

export default function SettingsModal({ open, onClose, hasBot, onBotReset }) {
  const { t } = useTranslation();
  const [apiKey, setApiKey] = useState("");
  const [csPhase, setCsPhase] = useState("idle"); // idle | validating | error | done
  const [csError, setCsError] = useState("");

  const handleCsSubmit = async () => {
    if (!apiKey.trim()) return;
    setCsPhase("validating");
    setCsError("");
    const result = await validateCsfloatApiKey(apiKey.trim());
    if (result.error) {
      setCsPhase("error");
      setCsError(result.error);
      return;
    }
    await window.api.saveConfig({ csfloatApiKey: apiKey.trim() });
    setCsPhase("done");
    setApiKey("");
  };

  const handleBotReset = async () => {
    await window.api.clearBot();
    onBotReset();
    handleClose();
  };

  const handleClose = () => {
    setApiKey("");
    setCsPhase("idle");
    setCsError("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="settings_overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            className="settings_modal"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="settings_header">
              <h2 className="settings_title">{t("settings_modal.title")}</h2>
              <button className="settings_close" onClick={handleClose}>
                <IoClose />
              </button>
            </div>

            <div className="settings_section">
              <div className="settings_section_header">
                <FaKey className="settings_section_icon" />
                <span className="settings_section_label">{t("settings_modal.csfloat.label")}</span>
              </div>
              <p className="settings_section_desc">{t("settings_modal.csfloat.description")}</p>
              <div className="settings_row">
                <input
                  className={`settings_input${csPhase === "error" ? " settings_input--error" : ""}${csPhase === "done" ? " settings_input--done" : ""}`}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    if (csPhase !== "idle") setCsPhase("idle");
                  }}
                  placeholder={t("settings_modal.csfloat.placeholder")}
                  spellCheck={false}
                  autoComplete="off"
                  disabled={csPhase === "validating"}
                />
                <button
                  className="settings_btn settings_btn--primary"
                  onClick={handleCsSubmit}
                  disabled={csPhase === "validating" || !apiKey.trim()}
                >
                  {csPhase === "validating"
                    ? t("settings_modal.csfloat.btn_checking")
                    : csPhase === "done"
                    ? t("settings_modal.csfloat.btn_done")
                    : t("settings_modal.csfloat.btn_idle")}
                </button>
              </div>
              {csPhase === "error" && csError && (
                <p className="settings_error">{resolveError(csError, t)}</p>
              )}
            </div>

            <div className="settings_divider" />

            <div className="settings_section">
              <div className="settings_section_header">
                <FaTelegram className="settings_section_icon" />
                <span className="settings_section_label">{t("settings_modal.telegram.label")}</span>
                <span className={`settings_badge ${hasBot ? "settings_badge--ok" : "settings_badge--off"}`}>
                  {hasBot ? t("settings_modal.telegram.badge_configured") : t("settings_modal.telegram.badge_not")}
                </span>
              </div>
              <p className="settings_section_desc">{t("settings_modal.telegram.description")}</p>
              <button
                className="settings_btn settings_btn--danger"
                onClick={handleBotReset}
                disabled={!hasBot}
              >
                {t("settings_modal.telegram.btn")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
