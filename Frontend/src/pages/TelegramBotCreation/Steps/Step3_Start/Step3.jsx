import { useTranslation } from "react-i18next";
import TutorialSlide from "../../../../components/TutorialSlide/TutorialSlide";
import img from "../../../../assets/Telegram/2.jpg";

export default function Step3() {
  const { t } = useTranslation();
  return (
    <TutorialSlide
      image={img}
      bullets={[
        t("telegram.step3.bullet1"),
      ]}
    />
  );
}
