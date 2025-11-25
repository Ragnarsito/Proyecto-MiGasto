// src/i18n.js
import es from "./locales/es.json";
import en from "./locales/en.json";

const translations = {
  es,
  en,
};

// helper que soporta "dashboard.totalIncome"
export function t(lang, key, vars = {}) {
  const langObj = translations[lang] || translations.es;

  const parts = key.split(".");
  let current = langObj;

  for (const part of parts) {
    if (current && Object.prototype.hasOwnProperty.call(current, part)) {
      current = current[part];
    } else {
      // si no lo encuentra, devolvemos la key
      return key;
    }
  }

  let text = typeof current === "string" ? current : key;

  // Reemplazo muy simple de variables tipo {{name}}
  Object.entries(vars).forEach(([k, v]) => {
    text = text.replace(`{{${k}}}`, v);
  });

  return text;
}
