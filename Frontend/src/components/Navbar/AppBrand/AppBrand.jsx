import { LuBird } from "react-icons/lu";
import { useNavigate, useLocation } from "react-router-dom";
import "./AppBrand.css"

export default function AppBrand(){
    const navigate = useNavigate();
    const location = useLocation();

    const handleClick = () => {
        if (location.pathname === "/bot-running") {
            window.dispatchEvent(new CustomEvent("appBrandClick"));
            return;
        }
        navigate("/");
    };

    return (
        <div className="app-brand" onClick={handleClick}>
            <LuBird className="app-icon" />
            <span className="app-name">FloatHawk</span>
        </div>
    );
}