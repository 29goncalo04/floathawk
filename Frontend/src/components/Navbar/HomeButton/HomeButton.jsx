import { useNavigate } from "react-router-dom";
import "./HomeButton.css"

export default function HomeButton() {
  const navigate = useNavigate();

  return (
    <button className="home_button" onClick={() => navigate("/")}>
      🏠︎
    </button>
  );
}