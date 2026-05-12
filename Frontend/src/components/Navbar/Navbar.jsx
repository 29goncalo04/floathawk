import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector/LanguageSelector";
import AppBrand from "./AppBrand/AppBrand";
import { IoSettingsOutline } from "react-icons/io5";
import "./Navbar.css"

function Navbar({ onSettingsClick }) {
  const { t } = useTranslation();
  return (
    <div className="navbar">
      <div className="navbar-left">
        <AppBrand />
      </div>

      <div className="navbar-right">
        <LanguageSelector />
        {onSettingsClick && (
          <button className="navbar-settings-btn" onClick={onSettingsClick} title={t("navbar.settings")}>
            <IoSettingsOutline />
          </button>
        )}
      </div>
    </div>
  );
}

export default Navbar;