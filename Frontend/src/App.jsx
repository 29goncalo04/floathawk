import { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import TelegramBotCreation from "./pages/TelegramBotCreation/TelegramBotCreation";
import CsfloatGate from "./pages/CsfloatGate/CsfloatGate";
import CalculatePrice from "./pages/CalculatePrice/CalculatePrice";
import UpdateExcel from "./pages/UpdateExcel/UpdateExcel";
import RunBot from "./pages/RunBot/RunBot";
import BotRunning from "./pages/BotRunning/BotRunning";
import Navbar from "./components/Navbar/Navbar";
import Background from "./components/Background/Background";
import SettingsModal from "./components/SettingsModal/SettingsModal";
import GlobalDealBanner from "./components/GlobalDealBanner/GlobalDealBanner";

import "./styles/global.css";

function App() {
  const [hasCsfloat, setHasCsfloat] = useState(null);
  const [hasBot, setHasBot] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    async function checkConfig() {
      const config = await window.api.getConfig();
      setHasCsfloat(config?.hasCsfloat ?? false);
      setHasBot(config?.hasBot ?? false);
    }

    checkConfig();
  }, []);

  return (
    <Router>
      <Background />
      <Navbar onSettingsClick={hasCsfloat ? () => setSettingsOpen(true) : undefined} />

      {hasCsfloat === null ? null : !hasCsfloat ? (
        <CsfloatGate onSuccess={() => setHasCsfloat(true)} />
      ) : (
        <>
        <GlobalDealBanner />
        <Routes>
          <Route
            path="/"
            element={<Home hasBot={hasBot} />}
          />

          <Route
            path="/tutorial"
            element={
              <TelegramBotCreation
                onFinish={() => setHasBot(true)}
              />
            }
          />

          <Route path="/calculate-price" element={<CalculatePrice />} />
          <Route path="/update-excel" element={<UpdateExcel />} />
          <Route path="/run-bot" element={<RunBot />} />
          <Route path="/bot-running" element={<BotRunning />} />
        </Routes>
        </>
      )}

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        hasBot={hasBot}
        onBotReset={() => setHasBot(false)}
      />
    </Router>
  );
}

export default App;
