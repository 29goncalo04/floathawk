import { useTranslation } from "react-i18next";
import TutorialSlide from "../../../../components/TutorialSlide/TutorialSlide";
import img from "../../../../assets/Telegram/4.jpg";

export default function Step5() {
  const { t } = useTranslation();
  return (
    <TutorialSlide
      image={img}
      bullets={[
        t("telegram.step5.bullet1"),
        t("telegram.step5.bullet2"),
        t("telegram.step5.bullet3"),
      ]}
    />
  );
}
