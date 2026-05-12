import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { IoArrowBack, IoWarning, IoCheckmarkCircle } from "react-icons/io5";
import { MdFolderOpen, MdOpenInNew } from "react-icons/md";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";
import { updateExcel, setupExcelPath } from "../../services/api";
import "./UpdateExcel.css";

export default function UpdateExcel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [phase, setPhase] = useState("checking");
  const [storedPath, setStoredPath] = useState(null);
  const [rowsAdded, setRowsAdded] = useState(0);
  const [rowsUpdated, setRowsUpdated] = useState(0);
  const [errorCode, setErrorCode] = useState(null);

  useEffect(() => {
    async function init() {
      const config = await window.api.getConfig();
      const excelPath = config?.excelPath;
      if (!excelPath) {
        setPhase("setup");
        return;
      }
      const exists = await window.api.checkExcelPath(excelPath);
      if (!exists) {
        setStoredPath(excelPath);
        setPhase("file_missing");
        return;
      }
      setStoredPath(excelPath);
      setupExcelPath(excelPath).catch(() => {});
      setPhase("ready");
    }
    init();
  }, []);

  const runUpdate = async () => {
    setPhase("loading");
    setErrorCode(null);
    try {
      const data = await updateExcel();
      if (data._error) {
        setErrorCode(data._error);
        setPhase("error");
      } else {
        setRowsAdded(data.rows_added ?? 0);
        setRowsUpdated(data.rows_updated ?? 0);
        setPhase("success");
      }
    } catch {
      setErrorCode("network");
      setPhase("error");
    }
  };

  const resetFile = async () => {
    try {
      await window.api.resetExcelFile(storedPath);
      await runUpdate(storedPath);
    } catch {
      setErrorCode(500);
      setPhase("error");
    }
  };

  const openFile = async () => {
    const exists = await window.api.checkExcelPath(storedPath);
    if (!exists) {
      setPhase("file_missing");
      return;
    }
    window.api.openExcelFile(storedPath);
  };

  const pickAndSetup = async () => {
    try {
      const folder = await window.api.pickExcelFolder();
      if (!folder) return;
      const fullPath = await window.api.copyExcelTemplate(folder);
      await window.api.saveConfig({ excelPath: fullPath });
      await setupExcelPath(fullPath);
      setStoredPath(fullPath);
      await runUpdate();
    } catch {
      setErrorCode(500);
      setPhase("error");
    }
  };

  const successText = (() => {
    const added = rowsAdded > 0 ? t("update_excel.success.row_added", { count: rowsAdded }) : null;
    const updated = rowsUpdated > 0 ? t("update_excel.success.row_updated", { count: rowsUpdated }) : null;
    if (added && updated) return `${added}, ${updated}`;
    if (added) return added;
    if (updated) return updated;
    return t("update_excel.success.up_to_date");
  })();

  return (
    <motion.div
      className="ue_page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <AnimatePresence mode="wait">
        {phase === "checking" && (
          <motion.div
            key="checking"
            className="ue_center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="ue_spinner" />
          </motion.div>
        )}

        {phase === "setup" && (
          <motion.div
            key="setup"
            className="ue_center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PiMicrosoftExcelLogoFill className="ue_icon_excel" />
            <h1 className="ue_title">{t("update_excel.setup.title")}</h1>
            <p className="ue_subtitle">{t("update_excel.setup.subtitle")}</p>
            <button className="ue_btn_primary" onClick={pickAndSetup}>
              <MdFolderOpen />
              {t("update_excel.setup.btn")}
            </button>
          </motion.div>
        )}

        {phase === "file_missing" && (
          <motion.div
            key="file_missing"
            className="ue_center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <IoWarning className="ue_icon_warn" />
            <h1 className="ue_title">{t("update_excel.file_missing.title")}</h1>
            <p className="ue_subtitle">{t("update_excel.file_missing.subtitle")}</p>
            <p className="ue_path">{storedPath}</p>
            <button className="ue_btn_primary" onClick={pickAndSetup}>
              <MdFolderOpen />
              {t("update_excel.file_missing.btn")}
            </button>
          </motion.div>
        )}

        {phase === "ready" && (
          <motion.div
            key="ready"
            className="ue_center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PiMicrosoftExcelLogoFill className="ue_icon_excel" />
            <h1 className="ue_title">{t("update_excel.ready.title")}</h1>
            <p className="ue_path_label">{t("update_excel.ready.file_label")}</p>
            <p className="ue_path">{storedPath}</p>
            <div className="ue_btn_row">
              <button className="ue_btn_primary" onClick={runUpdate}>
                {t("update_excel.ready.run_btn")}
              </button>
              <button className="ue_btn_secondary" onClick={openFile}>
                <MdOpenInNew />
                {t("update_excel.ready.open_btn")}
              </button>
            </div>
            <button className="ue_btn_ghost" onClick={pickAndSetup}>
              {t("update_excel.ready.change_btn")}
            </button>
          </motion.div>
        )}

        {phase === "loading" && (
          <motion.div
            key="loading"
            className="ue_center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="ue_spinner" />
            <p className="ue_loading_text">{t("update_excel.loading")}</p>
          </motion.div>
        )}

        {phase === "success" && (
          <motion.div
            key="success"
            className="ue_center"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <IoCheckmarkCircle className="ue_icon_success" />
            <h1 className="ue_title">{t("update_excel.success.title")}</h1>
            <p className="ue_subtitle">{successText}</p>
            <button className="ue_btn_primary" onClick={() => storedPath && window.api.openExcelFile(storedPath)}>
              <MdOpenInNew />
              {t("update_excel.success.open_btn")}
            </button>
          </motion.div>
        )}

        {phase === "error" && errorCode && (
          <motion.div
            key="error"
            className="ue_center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <IoWarning className="ue_icon_warn" />
            <h1 className="ue_title">{t(`update_excel.error.${errorCode}.title`, { defaultValue: t("update_excel.error.default") })}</h1>
            <p className="ue_subtitle">{t(`update_excel.error.${errorCode}.body`)}</p>
            <button className="ue_btn_primary" onClick={() => setPhase(storedPath ? "ready" : "setup")}>
              {t("update_excel.error.retry_btn")}
            </button>
            {storedPath && (
              <button className="ue_btn_ghost" onClick={resetFile}>
                {t("update_excel.error.reset_btn")}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button className="ue_back_btn" onClick={() => navigate("/")}>
        <IoArrowBack />
        {t("common.back")}
      </button>
    </motion.div>
  );
}
