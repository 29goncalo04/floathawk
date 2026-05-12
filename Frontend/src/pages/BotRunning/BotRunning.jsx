import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { LuBot, LuBellRing } from "react-icons/lu";
import { IoArrowBack } from "react-icons/io5";
import { MdStop } from "react-icons/md";
import { getBotStatus, stopBot } from "../../services/api";
import { playDealSound } from "../../utils/sound";
import { translateBotError } from "../../utils/botErrors";
import { FLOAT_ZONES, zoneActive } from "../../constants/floatZones";
import PriceList from "../../components/PriceList/PriceList";
import "./BotRunning.css";

const REASON_MAP = {
  "Not enough profit (final)": "not_enough_profit_final",
  "No similar listings in range": "no_similar_listings",
  "Rate limited (similar check)": "rate_limited_check",
  "Not enough profit (pre-check)": "not_enough_profit_pre",
  "Profit too small (absolute)": "profit_too_small_absolute",
  "Lower floats sold cheaper": "lower_floats_cheaper",
  "Not in good price range": "not_good_price_range",
  "Downward price trend": "downward_trend",
  "No recent sales in float range": "no_recent_sales",
  "Too many stickers/charms": "too_many_stickers",
  "Sells too slowly": "sells_too_slowly",
  "Too recent collection": "too_recent_collection",
};

function translateReason(reason, t) {
  const key = REASON_MAP[reason];
  return key ? t(`bot_running.rejection_reasons.${key}`) : reason;
}

export default function BotRunning() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [newDealFlash, setNewDealFlash] = useState(false);
  const [showTelegramBanner, setShowTelegramBanner] = useState(false);
  const [showBackModal, setShowBackModal] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState(0);
  const previousDealCount = useRef(null);
  const flashTimerRef = useRef(null);
  const bannerTimerRef = useRef(null);
  const [, forceRender] = useState(0);

  const fetchStatus = async () => {
    const data = await getBotStatus().catch(() => null);
    if (!data || data._error) return;
    setStatus(data);
    const newCount = data.deals_this_session?.length ?? 0;
    if (previousDealCount.current === null) {
      previousDealCount.current = newCount;
      return;
    }
    if (newCount > previousDealCount.current) {
      playDealSound();
      setNewDealFlash(true);
      setShowTelegramBanner(true);
      setExpandedIdx(0);
      clearTimeout(flashTimerRef.current);
      clearTimeout(bannerTimerRef.current);
      flashTimerRef.current = setTimeout(() => setNewDealFlash(false), 1800);
      bannerTimerRef.current = setTimeout(() => setShowTelegramBanner(false), 3500);
    }
    previousDealCount.current = newCount;
  };

  useEffect(() => {
    fetchStatus();
    const poll = setInterval(fetchStatus, 4000);
    const tick = setInterval(() => forceRender((n) => n + 1), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
      clearTimeout(flashTimerRef.current);
      clearTimeout(bannerTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handler = () => handleBack();
    window.addEventListener("appBrandClick", handler);
    return () => window.removeEventListener("appBrandClick", handler);
  }, [status]);

  const handleStop = async () => {
    await stopBot();
    navigate("/run-bot");
  };

  const handleBack = () => {
    if (status?.is_running) {
      setShowBackModal(true);
    } else {
      navigate("/");
    }
  };

  const getRemainingTime = () => {
    if (!status?.rate_limit_resume) return null;
    const remaining = Math.max(0, (new Date(status.rate_limit_resume) - new Date()) / 1000);
    const mins = Math.floor(remaining / 60).toString().padStart(2, "0");
    const secs = Math.floor(remaining % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const isRateLimited = status?.status === "rate_limited";
  const isError = status?.status === "error";
  const deals = status?.deals_this_session ?? [];
  const rejected = status?.rejected_recent ?? [];

  return (
    <motion.div
      className="br_page"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: "easeOut" }}
    >
      <div className="br_header">
        <div className="br_title_row">
          <div className="br_title_left">
            <LuBot className="br_title_icon" />
            <div>
              <h1 className="br_title">{t("bot_running.title")}</h1>
              <p className="br_subtitle">{t("bot_running.subtitle")}</p>
            </div>
          </div>
          <button className="br_stop_btn" onClick={handleStop}>
            <MdStop size={15} />
            {t("bot_running.stop_btn")}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showTelegramBanner && (
          <motion.div
            className="br_telegram_banner"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <LuBellRing size={14} />
            {t("bot_running.deal_banner")}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="br_body">

        <div className="br_sidebar">

          <div className={`br_status_pill ${isRateLimited ? "br_status_pill--limited" : isError ? "br_status_pill--error" : "br_status_pill--scanning"}`}>
            <span className={`br_status_dot ${!isRateLimited && !isError ? "br_status_dot--pulse" : ""}`} />
            {isRateLimited
              ? t("bot_running.status.rate_limited", { time: getRemainingTime() ?? "--:--" })
              : isError
              ? t("bot_running.status.stopped", { reason: translateBotError(status?.error, t) })
              : t("bot_running.status.scanning")}
          </div>

          {status?.params && (() => {
            const p = status.params;
            const activeZones = FLOAT_ZONES.filter((z) => zoneActive(z, p.min_float, p.max_float));
            return (
              <motion.div
                className="br_card br_filters_card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
              >
                <p className="br_card_title">{t("bot_running.filters.title")}</p>
                <div className="br_filters_content">
                  <div className="br_filter_group">
                    <span className="br_filter_label">{t("bot_running.filters.float")}</span>
                    <span className="br_filter_value">{p.min_float.toFixed(3)} – {p.max_float.toFixed(3)}</span>
                    <div className="br_filter_zones">
                      {activeZones.map((z) => (
                        <span key={z.label} className="br_zone_pill" style={{ color: z.color, borderColor: z.color + "55", background: z.color + "18" }}>
                          {z.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="br_filter_divider_h" />
                  <div className="br_filter_group">
                    <span className="br_filter_label">{t("bot_running.filters.price")}</span>
                    <span className="br_filter_value">
                      ${p.min_price} – {p.max_price_is_current_balance ? t("bot_running.filters.balance") : `$${p.max_price}`}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })()}

          <motion.div
            className="br_card br_card--rejected"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.16 }}
          >
            <p className="br_card_title">{t("bot_running.rejected.title")}</p>
            {rejected.length === 0 ? (
              <p className="br_empty br_empty--dim">{t("bot_running.rejected.empty")}</p>
            ) : (
              <div className="br_rej_list">
                {[...rejected].reverse().slice(0, 7).map((item, i) => (
                  <div key={i} className="br_rej_row">
                    <div className="br_rej_top">
                      <span className="br_rej_name" title={item.skin_name}>{item.skin_name}</span>
                      <span className="br_rej_price">${item.price?.toFixed(2)}</span>
                    </div>
                    <span className="br_rej_reason">{translateReason(item.reason, t)}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

        </div>

        <div className="br_main">
          <motion.div
            className={`br_card br_deals_card ${newDealFlash ? "br_card--flash" : ""}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
          >
            <p className="br_card_title">
              {t("bot_running.deals.title")}
              {deals.length > 0 && <span className="br_count_badge">{deals.length}</span>}
            </p>
            {deals.length === 0 ? (
              <p className="br_empty">{t("bot_running.deals.empty")}</p>
            ) : (
              <div className="br_accordion">
                {[...deals].reverse().map((deal, i) => {
                  const isOpen = expandedIdx === i;
                  return (
                    <div
                      key={i}
                      className={`br_acc_item ${isOpen ? "br_acc_item--open" : ""}`}
                      onClick={() => setExpandedIdx(isOpen ? -1 : i)}
                    >
                      <div className="br_acc_header">
                        <span className="br_acc_name">{deal.skin_name}</span>
                        <div className="br_acc_header_right">
                          <span className="br_acc_price">${deal.price?.toFixed(2)}</span>
                          <span className={`br_acc_chevron ${isOpen ? "br_acc_chevron--open" : ""}`}>›</span>
                        </div>
                      </div>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            className="br_acc_body"
                            key="body"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            style={{ overflow: "hidden" }}
                          >
                            <div className="br_acc_body_inner">
                              <div className="br_acc_row">
                                <div className="br_acc_stat">
                                  <span className="br_acc_stat_label">{t("bot_running.deals.buy_price")}</span>
                                  <span className="br_acc_stat_value">${deal.price?.toFixed(2)}</span>
                                </div>
                                <div className="br_acc_stat">
                                  <span className="br_acc_stat_label">{t("bot_running.deals.float")}</span>
                                  <span className="br_acc_stat_value br_mono">{deal.float_val?.toFixed(5)}</span>
                                </div>
                              </div>

                              <span className="br_acc_section_label">{t("bot_running.deals.before_section")}</span>
                              <div className="br_acc_indented">
                                <div className="br_acc_row">
                                  <div className="br_acc_stat">
                                    <span className="br_acc_stat_label">{t("bot_running.deals.sell_range")}</span>
                                    <span className="br_acc_stat_value">${deal.sell_min?.toFixed(2)} – ${deal.sell_max?.toFixed(2)}</span>
                                  </div>
                                  <div className="br_acc_stat">
                                    <span className="br_acc_stat_label">{t("bot_running.deals.profit")}</span>
                                    <span className="br_acc_stat_value br_profit">${deal.profit_min?.toFixed(2)} – ${deal.profit_max?.toFixed(2)}</span>
                                  </div>
                                  <div className="br_acc_stat">
                                    <span className="br_acc_stat_label">{t("bot_running.deals.profit_pct")}</span>
                                    <span className="br_acc_stat_value br_profit">+{deal.profit_pct_min?.toFixed(1)}% – +{deal.profit_pct_max?.toFixed(1)}%</span>
                                  </div>
                                </div>
                              </div>

                              <span className="br_acc_section_label">{t("bot_running.deals.after_section")}</span>
                              <div className="br_acc_indented">
                                <div className="br_acc_row">
                                  <div className="br_acc_stat">
                                    <span className="br_acc_stat_label">{t("bot_running.deals.sell_range")}</span>
                                    <span className="br_acc_stat_value">${deal.sell_min_after?.toFixed(2)} – ${deal.sell_max_after?.toFixed(2)}</span>
                                  </div>
                                  <div className="br_acc_stat">
                                    <span className="br_acc_stat_label">{t("bot_running.deals.profit")}</span>
                                    <span className="br_acc_stat_value br_profit">${deal.profit_min_after?.toFixed(2)} – ${deal.profit_max_after?.toFixed(2)}</span>
                                  </div>
                                  <div className="br_acc_stat">
                                    <span className="br_acc_stat_label">{t("bot_running.deals.profit_pct")}</span>
                                    <span className="br_acc_stat_value br_profit">+{deal.profit_pct_min_after?.toFixed(1)}% – +{deal.profit_pct_max_after?.toFixed(1)}%</span>
                                  </div>
                                </div>
                              </div>

                              <div className="br_acc_price_lists">
                                <PriceList label={t("bot_running.deals.float_range_prices")} values={deal.prices_filtered} />
                                <PriceList label={t("bot_running.deals.lower_float")} values={deal.prices_lower_floats} />
                                <PriceList label={t("bot_running.deals.higher_float")} values={deal.prices_higher_floats} />
                              </div>

                              {deal.similar_listed?.length > 0 && (
                                <div className="br_acc_similar">
                                  <span className="br_acc_section_label">{t("bot_running.deals.similar_listed")}</span>
                                  {deal.similar_listed.map((s, j) => (
                                    <div key={j} className="br_acc_similar_row">
                                      <span>{t("bot_running.deals.similar_float")}<span className="br_mono">{s.float_val?.toFixed(5)}</span></span>
                                      <span>{t("bot_running.deals.similar_price")}${s.price?.toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

      </div>

      <button className="br_back_btn" onClick={handleBack}>
        <IoArrowBack />
        {t("common.back")}
      </button>

      <AnimatePresence>
        {showBackModal && (
          <motion.div
            className="br_modal_overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setShowBackModal(false)}
          >
            <motion.div
              className="br_modal"
              initial={{ opacity: 0, scale: 0.93, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="br_modal_title">{t("bot_running.modal.title")}</p>
              <p className="br_modal_body">{t("bot_running.modal.body")}</p>
              <div className="br_modal_actions">
                <button className="br_modal_cancel" onClick={() => setShowBackModal(false)}>
                  {t("bot_running.modal.stay")}
                </button>
                <button className="br_modal_confirm" onClick={() => navigate("/")}>
                  {t("bot_running.modal.go_menu")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
