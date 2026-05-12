export const BOT_ERROR_MAP = {
  "Balance is too low to continue scanning": "balance_too_low",
  "Invalid API key": "invalid_api_key",
};

export function translateBotError(error, t) {
  if (!error) return t("common.unknown_error");
  const key = BOT_ERROR_MAP[error];
  return key ? t(`bot_running.bot_errors.${key}`) : error;
}
