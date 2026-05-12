import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { LuBellRing, LuTriangleAlert } from "react-icons/lu";
import { playDealSound } from "../../utils/sound";
import { getBotEventsUrl } from "../../services/api";
import { translateBotError } from "../../utils/botErrors";

export default function GlobalDealBanner() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);
  const [botError, setBotError] = useState(null);
  const timerRef = useRef(null);
  const pathnameRef = useRef(location.pathname);
  const skipErrorClearRef = useRef(false);

  useEffect(() => {
    pathnameRef.current = location.pathname;
    if (skipErrorClearRef.current) {
      skipErrorClearRef.current = false;
      return;
    }
    setBotError(null);
  }, [location.pathname]);

  useEffect(() => {
    let source = null;
    let cancelled = false;

    getBotEventsUrl().then((url) => {
      if (cancelled) return;
      source = new EventSource(url);
      source.onmessage = (e) => {
        if (pathnameRef.current === "/bot-running") return;
        const data = JSON.parse(e.data);
        playDealSound();
        setDeal(data);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setDeal(null), 3500);
      };
      source.addEventListener("bot_error", (e) => {
        const data = JSON.parse(e.data);
        if (pathnameRef.current === "/bot-running") {
          skipErrorClearRef.current = true;
          navigate("/run-bot");
        }
        setBotError(data.reason);
      });
    });

    return () => {
      cancelled = true;
      source?.close();
      clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {deal && (
          <motion.div
            className="global_deal_banner"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <LuBellRing size={14} />
            <span>{t("app.deal_banner", { skin_name: "" })}<strong>{deal.skin_name}</strong></span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {botError && (
          <motion.div
            className="global_bot_error_banner"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <LuTriangleAlert size={14} />
            <span>{t("app.bot_stopped", { reason: "" })}<strong>{translateBotError(botError, t)}</strong></span>
            <button className="global_bot_error_close" onClick={() => setBotError(null)}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
