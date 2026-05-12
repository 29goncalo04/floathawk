import { useTranslation } from "react-i18next";
import { FaTelegram } from "react-icons/fa";
import TutorialSlide from "../../../../components/TutorialSlide/TutorialSlide";

export default function Step1() {
  const { t } = useTranslation();
  return (
    <TutorialSlide
      icon={FaTelegram}
      bullets={[
        t("telegram.step1.bullet1"),
        t("telegram.step1.bullet2"),
      ]}
    />
  );
}
