import { useI18n } from "../i18n";

export const PregnantBadge = () => {
  const { t } = useI18n();
  return (
    <span className="rounded-full bg-pregnant px-3 py-1 text-sm font-semibold text-white">
      {t("patient.pregnant")}
    </span>
  );
};

export const Under5Badge = () => {
  const { t } = useI18n();
  return (
    <span className="rounded-full bg-accent-500 px-3 py-1 text-sm font-semibold text-black">
      {t("badge.under5")}
    </span>
  );
};
