const store = require("./Store");

function saveConfig(botToken, chatId) {
  store.set("config", {
    botToken,
    chatId,
    hasBot: true
  });
}

function getConfig() {
  return store.get("config");
}

function isBotConfigured() {
  const config = store.get("config");
  return !!(config && config.hasBot);
}

module.exports = {
  saveConfig,
  getConfig,
  isBotConfigured
};