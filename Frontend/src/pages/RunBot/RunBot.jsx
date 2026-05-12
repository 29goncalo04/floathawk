import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import Slider from "@mui/material/Slider";
import { IoArrowBack } from "react-icons/io5";
import { LuBot, LuTimer, LuShieldCheck } from "react-icons/lu";
import { FiLock } from "react-icons/fi";
import { RiWallet3Line } from "react-icons/ri";
import { FaTelegram } from "react-icons/fa";
import { getBalance, startBot, getBotStatus } from "../../services/api";
import { FLOAT_ZONES, zoneActive } from "../../constants/floatZones";
import "./RunBot.css";

const MAX_FLOAT = 1.0;

export default function RunBot() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [floatRange, setFloatRange] = useState([0.0, 1.0]);
  const [minFloatText, setMinFloatText] = useState("0.000");
  const [maxFloatText, setMaxFloatText] = useState("1.000");

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [useBalance, setUseBalance] = useState(false);
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState(false);

  const [errors, setErrors] = useState({});
  const [checking, setChecking] = useState(true);
  const [starting, setStarting] = useState(false);

  const FEATURES = [
    { icon: <LuTimer size={15} />, label: t("run_bot.features.scan_rate") },
    { icon: <FaTelegram size={15} />, label: t("run_bot.features.alerts") },
    { icon: <LuShieldCheck size={15} />, label: t("run_bot.features.filter") },
  ];

  useEffect(() => {
    getBotStatus()
      .then((data) => { if (data?.is_running) navigate("/bot-running"); })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const activeZones = FLOAT_ZONES.filter((z) => zoneActive(z, floatRange[0], floatRange[1]));

  const handleSliderChange = (_, v) => {
    setFloatRange(v);
    setMinFloatText(v[0].toFixed(3));
    setMaxFloatText(v[1].toFixed(3));
  };

  const commitMinFloat = () => {
    const val = parseFloat(minFloatText);
    if (!isNaN(val)) {
      const clamped = Math.max(0, Math.min(val, floatRange[1] - 0.001));
      const rounded = Math.round(clamped * 1000) / 1000;
      setFloatRange([rounded, floatRange[1]]);
      setMinFloatText(rounded.toFixed(3));
    } else {
      setMinFloatText(floatRange[0].toFixed(3));
    }
  };

  const commitMaxFloat = () => {
    const val = parseFloat(maxFloatText);
    if (!isNaN(val)) {
      const clamped = Math.max(floatRange[0] + 0.001, Math.min(val, MAX_FLOAT));
      const rounded = Math.round(clamped * 1000) / 1000;
      setFloatRange([floatRange[0], rounded]);
      setMaxFloatText(rounded.toFixed(3));
    } else {
      setMaxFloatText(floatRange[1].toFixed(3));
    }
  };

  const handleToggleBalance = async (e) => {
    const checked = e.target.checked;
    if (!checked) {
      setUseBalance(false);
      setBalance(null);
      setMaxPrice("");
      setBalanceError(false);
      return;
    }
    setUseBalance(true);
    setBalanceLoading(true);
    setBalanceError(false);
    try {
      const data = await getBalance();
      if (data._error || data.balance === undefined) {
        setBalanceError(true);
        setUseBalance(false);
      } else {
        setBalance(data.balance);
        setMaxPrice(Math.floor(data.balance / 100).toString());
      }
    } catch {
      setBalanceError(true);
      setUseBalance(false);
    } finally {
      setBalanceLoading(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (floatRange[0] >= floatRange[1]) {
      errs.float = { key: "run_bot.validation.float_order" };
    }
    if (minPrice !== "" && (!/^\d+$/.test(minPrice) || parseInt(minPrice, 10) < 0)) {
      errs.minPrice = { key: "run_bot.validation.valid_price" };
    }
    if (!useBalance) {
      if (!maxPrice || !/^\d+$/.test(maxPrice) || parseInt(maxPrice, 10) <= 0) {
        errs.maxPrice = { key: "run_bot.validation.valid_max" };
      } else if (minPrice !== "" && parseInt(minPrice, 10) >= parseInt(maxPrice, 10)) {
        errs.maxPrice = { key: "run_bot.validation.max_gt_min" };
      }
    } else if (balance !== null && minPrice !== "") {
      if (balance < parseInt(minPrice, 10) * 100) {
        errs.maxPrice = { key: "run_bot.validation.balance_below", params: { balance: (balance / 100).toFixed(2) } };
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleStartBot = async () => {
    if (!validate()) return;
    setStarting(true);
    const params = {
      min_float: floatRange[0],
      max_float: floatRange[1],
      min_price: minPrice !== "" ? parseInt(minPrice, 10) : 0,
      max_price: useBalance ? 0 : parseInt(maxPrice, 10),
      max_price_is_current_balance: useBalance,
    };
    const result = await startBot(params);
    if (result?._error) {
      if (result.detail === "bot_already_running") navigate("/bot-running");
      setStarting(false);
      return;
    }
    navigate("/bot-running");
  };

  if (checking) return null;

  return (
    <motion.div
      className="rb_page"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: "easeOut" }}
    >
      <div className="rb_header">
        <div className="rb_title_row">
          <LuBot className="rb_title_icon" />
          <h1 className="rb_title">{t("run_bot.page_title")}</h1>
        </div>
        <p className="rb_subtitle">{t("run_bot.subtitle")}</p>
      </div>

      <div className="rb_cards">
        {/* ── Float Range ─────────────────────────────── */}
        <motion.div
          className="rb_card"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <p className="rb_card_title">{t("run_bot.float_range.title")}</p>

          <div className="rb_slider_wrap">
            <Slider
              value={floatRange}
              onChange={handleSliderChange}
              min={0}
              max={MAX_FLOAT}
              step={0.001}
              disableSwap
              sx={{
                color: "#6366f1",
                padding: "11px 0",
                "& .MuiSlider-thumb": {
                  width: 26,
                  height: 26,
                  backgroundColor: "#6366f1",
                  border: "2px solid rgba(165,180,252,0.5)",
                  boxShadow: "0 0 0 5px rgba(99,102,241,0.18)",
                  transition: "box-shadow 0.15s ease",
                  "&:hover, &.Mui-focusVisible": {
                    boxShadow: "0 0 0 9px rgba(99,102,241,0.28)",
                  },
                },
                "& .MuiSlider-track": {
                  background: "linear-gradient(90deg, #6366f1, #818cf8)",
                  border: "none",
                  height: 8,
                  borderRadius: 4,
                },
                "& .MuiSlider-rail": {
                  backgroundColor: "rgba(99,102,241,0.14)",
                  height: 8,
                  borderRadius: 4,
                },
              }}
            />
          </div>

          <div className="rb_zones">
            {FLOAT_ZONES.map((zone) => {
              const pct = ((zone.max - zone.min) / MAX_FLOAT) * 100;
              const active = zoneActive(zone, floatRange[0], floatRange[1]);
              return (
                <div key={zone.label} className="rb_zone" style={{ width: `${pct}%` }}>
                  <div
                    className="rb_zone_bar"
                    style={{ background: zone.color, opacity: active ? 1 : 0.15 }}
                  />
                  <span
                    className="rb_zone_label"
                    style={{ color: active ? zone.color : "#334155" }}
                  >
                    {zone.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="rb_float_inputs">
            <div className="rb_input_group">
              <label className="rb_input_label">{t("run_bot.float_range.min")}</label>
              <input
                className="rb_input rb_input_mono"
                value={minFloatText}
                onChange={(e) => setMinFloatText(e.target.value)}
                onBlur={commitMinFloat}
                onKeyDown={(e) => e.key === "Enter" && commitMinFloat()}
                spellCheck={false}
              />
            </div>
            <div className="rb_float_sep">–</div>
            <div className="rb_input_group">
              <label className="rb_input_label">{t("run_bot.float_range.max")}</label>
              <input
                className="rb_input rb_input_mono"
                value={maxFloatText}
                onChange={(e) => setMaxFloatText(e.target.value)}
                onBlur={commitMaxFloat}
                onKeyDown={(e) => e.key === "Enter" && commitMaxFloat()}
                spellCheck={false}
              />
            </div>
          </div>

          {errors.float && <p className="rb_field_error">{t(errors.float.key, errors.float.params)}</p>}

          <div className="rb_card_divider" />

          <div className="rb_conditions_row">
            <span className="rb_conditions_label">{t("run_bot.scanning_label")}</span>
            <div className="rb_condition_pills">
              <AnimatePresence mode="popLayout">
                {activeZones.map((zone) => (
                  <motion.span
                    key={zone.label}
                    className="rb_condition_pill"
                    style={{
                      color: zone.color,
                      borderColor: zone.color + "44",
                      background: zone.color + "14",
                    }}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.18 }}
                  >
                    {zone.label}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ── Price Range ──────────────────────────────── */}
        <motion.div
          className="rb_card"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18 }}
        >
          <p className="rb_card_title">{t("run_bot.price_range.title")}</p>

          <div className="rb_price_inputs">
            <div className="rb_input_group rb_input_group">
              <label className="rb_input_label">{t("run_bot.price_range.min")}</label>
              <div className="rb_prefix_wrap">
                <span className="rb_prefix">$</span>
                <input
                  className="rb_input"
                  type="text"
                  inputMode="numeric"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                />
              </div>
              {errors.minPrice && <p className="rb_field_error">{t(errors.minPrice.key, errors.minPrice.params)}</p>}
            </div>

            <div className="rb_input_group rb_input_group">
              <label className="rb_input_label">{t("run_bot.price_range.max")}</label>
              <div className="rb_prefix_wrap">
                <span className="rb_prefix">$</span>
                <input
                  className={`rb_input${useBalance ? " rb_input--locked" : ""}`}
                  type="text"
                  inputMode="numeric"
                  value={maxPrice}
                  onChange={(e) => !useBalance && setMaxPrice(e.target.value.replace(/\D/g, ""))}
                  placeholder={useBalance && balance !== null ? Math.floor(balance / 100).toString() : "500"}
                  disabled={useBalance}
                />
                {useBalance && <FiLock className="rb_lock_icon" />}
              </div>
              {errors.maxPrice && <p className="rb_field_error">{t(errors.maxPrice.key, errors.maxPrice.params)}</p>}
            </div>
          </div>

          <div className="rb_card_divider" />

          <div className="rb_balance_section">
            <label className="rb_toggle_wrap">
              <div className={`rb_toggle${useBalance ? " rb_toggle--on" : ""}${balanceLoading ? " rb_toggle--loading" : ""}`}>
                <input
                  type="checkbox"
                  className="rb_toggle_input"
                  checked={useBalance}
                  onChange={handleToggleBalance}
                  disabled={balanceLoading}
                />
                <span className="rb_toggle_knob" />
              </div>
              <div className="rb_toggle_text_group">
                <span className="rb_toggle_label">{t("run_bot.balance.toggle_label")}</span>
                <span className="rb_toggle_hint">{t("run_bot.balance.toggle_hint")}</span>
              </div>
            </label>

            <div className="rb_balance_feedback">
              {balanceLoading && (
                <span className="rb_balance_status rb_balance_status--loading">
                  <span className="rb_spinner" />
                  {t("run_bot.balance.fetching")}
                </span>
              )}

              {useBalance && balance !== null && !balanceLoading && (
                <motion.span
                  className="rb_balance_badge"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <RiWallet3Line size={13} />
                  ${(balance / 100).toFixed(2)}
                </motion.span>
              )}

              {balanceError && !balanceLoading && (
                <span className="rb_balance_status rb_balance_status--error">
                  {t("run_bot.balance.error")}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.button
        className={`rb_start_btn${starting ? " rb_start_btn--loading" : ""}`}
        onClick={handleStartBot}
        disabled={starting}
        whileHover={starting ? {} : { scale: 1.025 }}
        whileTap={starting ? {} : { scale: 0.975 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.28 }}
      >
        {starting ? (
          <>
            <span className="rb_start_spinner" />
            {t("run_bot.starting_btn")}
          </>
        ) : (
          <>
            <LuBot size={20} />
            {t("run_bot.start_btn")}
          </>
        )}
      </motion.button>

      <motion.div
        className="rb_features"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.38 }}
      >
        {FEATURES.map((f, i) => (
          <div key={i} className="rb_feature">
            {f.icon}
            <span>{f.label}</span>
          </div>
        ))}
      </motion.div>

      <button className="rb_back_btn" onClick={() => navigate("/")}>
        <IoArrowBack />
        {t("common.back")}
      </button>
    </motion.div>
  );
}
