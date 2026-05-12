const API_URL = "http://localhost:8000";

let _apiToken = null;

async function _getToken() {
  if (_apiToken === null) {
    _apiToken = (await window.api?.getApiToken?.()) ?? "";
  }
  return _apiToken;
}

async function _headers() {
  const token = await _getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { "X-Api-Token": token } : {}),
  };
}

export const getBotEventsUrl = async () => {
  const token = await _getToken();
  return token ? `${API_URL}/bot-events?token=${token}` : `${API_URL}/bot-events`;
};

export const validateTelegram = async (botToken) => {
  const res = await fetch(`${API_URL}/setup/validate`, {
    method: "POST",
    headers: await _headers(),
    body: JSON.stringify({ bot_token: botToken }),
  });
  return res.json();
};

export const confirmTelegram = async (botToken) => {
  const res = await fetch(`${API_URL}/setup/confirm`, {
    method: "POST",
    headers: await _headers(),
    body: JSON.stringify({ bot_token: botToken }),
  });
  return res.json();
};

export const pushBotCredentials = async (botToken, chatId) => {
  const res = await fetch(`${API_URL}/setup/push-bot-credentials`, {
    method: "POST",
    headers: await _headers(),
    body: JSON.stringify({ bot_token: botToken, chat_id: String(chatId) }),
  });
  return res.json();
};

export const pushCsfloatKey = async (apiKey) => {
  const res = await fetch(`${API_URL}/setup/push-csfloat-key`, {
    method: "POST",
    headers: await _headers(),
    body: JSON.stringify({ api_key: apiKey }),
  });
  return res.json();
};

export const validateCsfloatApiKey = async (apiKey) => {
  const res = await fetch(`${API_URL}/setup/validate-csfloat`, {
    method: "POST",
    headers: await _headers(),
    body: JSON.stringify({ api_key: apiKey }),
  });
  return res.json();
};

export const getSellPrice = async (skinId) => {
  const res = await fetch(`${API_URL}/sell-price/${skinId}`, {
    headers: await _headers(),
  });
  const data = await res.json();
  if (!res.ok) return { _error: res.status, detail: data.detail ?? "Unknown error" };
  return data;
};

export const getBalance = async () => {
  const res = await fetch(`${API_URL}/balance`, {
    headers: await _headers(),
  });
  if (!res.ok) return { _error: res.status };
  return res.json();
};

export const startBot = async ({ min_float, max_float, min_price, max_price, max_price_is_current_balance }) => {
  const res = await fetch(`${API_URL}/run-bot-endpoint`, {
    method: "POST",
    headers: await _headers(),
    body: JSON.stringify({ min_float, max_float, min_price, max_price, max_price_is_current_balance }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { _error: res.status, detail: data.detail ?? "unknown_error" };
  }
  return res.json();
};

export const stopBot = async () => {
  const res = await fetch(`${API_URL}/bot-stop`, {
    method: "POST",
    headers: await _headers(),
  });
  if (!res.ok) return { _error: res.status };
  return res.json();
};

export const getBotStatus = async () => {
  const res = await fetch(`${API_URL}/bot-status`, {
    headers: await _headers(),
  });
  if (!res.ok) return { _error: res.status };
  return res.json();
};

export const setupExcelPath = async (filePath) => {
  const res = await fetch(`${API_URL}/setup/excel-path`, {
    method: "POST",
    headers: await _headers(),
    body: JSON.stringify({ file_path: filePath }),
  });
  return res.json();
};

export const updateExcel = async () => {
  const res = await fetch(`${API_URL}/update-excel`, {
    method: "POST",
    headers: await _headers(),
  });
  if (!res.ok) {
    const data = await res.json();
    return { _error: res.status, detail: data.detail };
  }
  return res.json();
};
