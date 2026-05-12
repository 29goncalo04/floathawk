import { useTranslation } from "react-i18next";
import TutorialSlide from "../../../../components/TutorialSlide/TutorialSlide";
import img from "../../../../assets/Telegram/3.jpg";

export default function Step4() {
  const { t } = useTranslation();
  return (
    <TutorialSlide
      image={img}
      bullets={[
        t("telegram.step4.bullet1"),
      ]}
    />
  );
}
