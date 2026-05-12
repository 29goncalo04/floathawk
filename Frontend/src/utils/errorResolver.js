export function resolveError(error, t) {
  const key = `csfloat_gate.${error}`;
  const translated = t(key);
  return translated !== key ? translated : error;
}
