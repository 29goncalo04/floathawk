import { useState } from "react";

export function usePopUp() {
  const [showPopup, setShowPopup] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const openPopup = () => {
    setShowPopup(true);
  };

  const closePopup = () => {
    setIsClosing(true);

    setTimeout(() => {
      setShowPopup(false);
      setIsClosing(false);
    }, 700);
  };

  return {
    showPopup,
    isClosing,
    openPopup,
    closePopup,
  };
}