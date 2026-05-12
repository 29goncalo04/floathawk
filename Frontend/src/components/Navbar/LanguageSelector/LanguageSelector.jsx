import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import "./LanguageSelector.css"
import flagPt from "../../../assets/flags/pt.png";
import flagGb from "../../../assets/flags/gb.png";
import flagEs from "../../../assets/flags/es.png";
import flagFr from "../../../assets/flags/fr.png";

const languages = [
  { code: "pt", name: "PT", flag: flagPt },
  { code: "en", name: "EN", flag: flagGb },
  { code: "es", name: "ES", flag: flagEs },
  { code: "fr", name: "FR", flag: flagFr },
];

function LanguageSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const selectorRef = useRef(null);

  const currentLang =
    languages.find((l) => l.code === i18n.language) || languages[1];

  const changeLang = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="language-selector" ref={selectorRef}>
      <button className={`lang-trigger ${open ? "active" : ""}`} onClick={() => setOpen(!open)}>
        <img src={currentLang.flag} alt={currentLang.name} width={18} />
        <span>{currentLang.name}</span>
        <svg
          className={`chevron ${open ? "rotated" : ""}`}
          width="12" height="12" viewBox="0 0 12 12" fill="none"
        >
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className={`lang-dropdown ${open ? "open" : ""}`}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            className={`lang-option ${lang.code === currentLang.code ? "selected" : ""}`}
            onClick={() => changeLang(lang.code)}
          >
            <img src={lang.flag} alt={lang.name} width={18} />
            <span>{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default LanguageSelector;