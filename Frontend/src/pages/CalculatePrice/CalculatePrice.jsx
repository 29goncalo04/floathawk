import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { IoArrowBack } from "react-icons/io5";
import { MdInfoOutline } from "react-icons/md";
import { IoWarning } from "react-icons/io5";
import { getSellPrice } from "../../services/api";
import { FLOAT_ZONES } from "../../constants/floatZones";
import "./CalculatePrice.css";

function getZone(floatValue) {
  return FLOAT_ZONES.find((z) => floatValue < z.max) ?? FLOAT_ZONES[4];
}

function FloatBar({ value }) {
  const activeZone = getZone(value);
  return (
    <div className="cp_floatbar_wrap">
      <div className="cp_floatbar_track">
        {FLOAT_ZONES.map((zone, i) => {
          const span = zone.max - zone.min;
          return (
            <div
              key={zone.label}
              className="cp_floatbar_segment"
              style={{ flex: span, background: zone.color, opacity: zone.label === activeZone.label ? 1 : 0.25 }}
            />
          );
        })}
        <div
          className="cp_floatbar_marker"
          style={{ left: `${value * 100}%` }}
        />
      </div>
      <div className="cp_floatbar_labels">
        {FLOAT_ZONES.map((zone, i) => {
          const span = zone.max - zone.min;
          return (
            <div
              key={zone.label}
              className={`cp_floatbar_label${zone.label === activeZone.label ? " active" : ""}`}
              style={{ flex: span, ...(zone.label === activeZone.label ? { color: zone.color } : {}) }}
            >
              {zone.label}
            </div>
          );
        })}
      </div>
      <p className="cp_float_value">{value.toFixed(5)} — <span style={{ color: activeZone.color }}>{activeZone.label}</span></p>
    </div>
  );
}

function ProfitClass(min, max) {
  if (min >= 0) return "pos";
  if (max < 0) return "neg";
  return "mixed";
}

function formatProfit(value) {
  return value >= 0 ? `+$${value.toFixed(2)}` : `-$${Math.abs(value).toFixed(2)}`;
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export default function CalculatePrice() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [skinId, setSkinId] = useState("");
  const [phase, setPhase] = useState("idle");
  const [result, setResult] = useState(null);
  const [errorType, setErrorType] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const handleCalculate = async () => {
    const id = skinId.trim();
    if (!id || !/^\d+$/.test(id)) {
      setErrorType("invalid_id");
      setPhase("error");
      return;
    }
    setPhase("loading");
    setResult(null);
    setErrorType(null);
    try {
      const data = await getSellPrice(id);
      if (data._error) {
        const map = { 422: "invalid_id", 429: "rate_limited", 404: "no_similar_listed" };
        setErrorType(map[data._error] ?? "network");
        setPhase("error");
      } else {
        setResult(data);
        setPhase("success");
      }
    } catch {
      setErrorType("network");
      setPhase("error");
    }
  };

  return (
    <motion.div
      className="cp_page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <h1 className="cp_title">{t("calculate_price.title")}</h1>
      <p className="cp_subtitle">{t("calculate_price.subtitle")}</p>

      <div className="cp_input_section">
        <div className="cp_input_row">
          <input
            className="cp_input"
            value={skinId}
            onChange={(e) => setSkinId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
            placeholder={t("calculate_price.input_placeholder")}
            spellCheck={false}
            autoComplete="off"
            disabled={phase === "loading"}
          />
          <button
            className="cp_calc_btn"
            onClick={handleCalculate}
            disabled={phase === "loading" || !skinId.trim()}
          >
            {phase === "loading" ? "…" : t("calculate_price.calculate_btn")}
          </button>
        </div>

        <button className="cp_help_toggle" onClick={() => setHelpOpen((o) => !o)}>
          <MdInfoOutline size={15} />
          {t("calculate_price.how_to_find")}
          <span className={`cp_help_chevron${helpOpen ? " open" : ""}`}>▾</span>
        </button>

        <AnimatePresence>
          {helpOpen && (
            <motion.div
              className="cp_help_panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{ overflow: "hidden" }}
            >
              <ul className="cp_help_list">
                <li>
                  <strong>{t("calculate_price.help.from_excel")}</strong>
                  {t("calculate_price.help.excel_text")}
                  <code>{t("calculate_price.help.id_column")}</code>
                  {t("calculate_price.help.excel_suffix")}
                </li>
                <li>
                  <strong>{t("calculate_price.help.from_csfloat")}</strong>
                  {t("calculate_price.help.csfloat_text")}
                  <code>csfloat.com/item/<strong>1234567890</strong></code>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {phase === "loading" && (
          <motion.div
            key="loading"
            className="cp_loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="cp_spinner" />
            <span>{t("calculate_price.calculating")}</span>
          </motion.div>
        )}

        {phase === "error" && errorType && (
          <motion.div
            key="error"
            className="cp_error_card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <IoWarning className="cp_error_icon" />
            <p className="cp_error_title">{t(`calculate_price.errors.${errorType}.title`)}</p>
            <p className="cp_error_msg">{t(`calculate_price.errors.${errorType}.body`)}</p>
          </motion.div>
        )}

        {phase === "success" && result && (
          <motion.div
            key="success"
            className="cp_results"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <motion.div className="cp_skin_card" variants={fadeUp} initial="hidden" animate="visible">
              <p className="cp_skin_name">{result.skin_name}</p>
              <p className="cp_skin_meta">ID {result.skin_id} &nbsp;·&nbsp; {t("calculate_price.result.purchased_for")}<strong>${result.purchase_price.toFixed(2)}</strong></p>
              <FloatBar value={result.float_value} />
            </motion.div>

            <motion.div
              className="cp_metrics_row"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div className="cp_metric_card" variants={fadeUp}>
                <span className="cp_metric_label">{t("calculate_price.result.sell_range")}</span>
                <span className="cp_metric_value">
                  ${result.sell_min.toFixed(2)} → ${result.sell_max.toFixed(2)}
                </span>
              </motion.div>

              <motion.div className="cp_metric_card" variants={fadeUp}>
                <span className="cp_metric_label">{t("calculate_price.result.profit")}</span>
                <span className={`cp_metric_value cp_metric_value--profit-${ProfitClass(result.profit_min, result.profit_max)}`}>
                  {formatProfit(result.profit_min)} → {formatProfit(result.profit_max)}
                </span>
              </motion.div>

              <motion.div className="cp_metric_card" variants={fadeUp}>
                <span className="cp_metric_label">{t("calculate_price.result.profit_pct")}</span>
                <span className={`cp_metric_value cp_metric_value--profit-${ProfitClass(result.profit_pct_min, result.profit_pct_max)}`}>
                  {result.profit_pct_min.toFixed(2)}% → {result.profit_pct_max.toFixed(2)}%
                </span>
              </motion.div>
            </motion.div>

            {result.similar_listed.length > 0 && (
              <motion.div
                className="cp_similar_section"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.2, ease: "easeOut" }}
              >
                <p className="cp_similar_title">{t("calculate_price.result.similar_listings")}</p>
                <div className="cp_similar_header">
                  <span className="cp_similar_name cp_similar_col_label">{t("calculate_price.result.col_name")}</span>
                  <span className="cp_similar_float cp_similar_col_label">{t("calculate_price.result.col_float")}</span>
                  <span className="cp_similar_price cp_similar_col_label">{t("calculate_price.result.col_price")}</span>
                </div>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {result.similar_listed.map((item, i) => {
                    const zone = getZone(item.float_value);
                    return (
                      <motion.div
                        key={item.id ?? i}
                        className="cp_similar_row"
                        variants={{
                          hidden: { opacity: 0, x: -10 },
                          visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
                        }}
                      >
                        <span className="cp_similar_name">{item.name}</span>
                        <span className="cp_similar_float" style={{ color: zone.color }}>
                          {item.float_value.toFixed(5)}
                        </span>
                        <span className="cp_similar_price">${item.price.toFixed(2)}</span>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button className="cp_back_btn" onClick={() => navigate("/")}>
        <IoArrowBack />
        {t("common.back")}
      </button>
    </motion.div>
  );
}
