import { useTranslation } from "react-i18next";
import TutorialSlide from "../../../../components/TutorialSlide/TutorialSlide";
import img from "../../../../assets/Telegram/1.jpg";

export default function Step2() {
  const { t } = useTranslation();
  return (
    <TutorialSlide
      image={img}
      bullets={[
        t("telegram.step2.bullet1"),
        t("telegram.step2.bullet2"),
      ]}
    />
  );
}
