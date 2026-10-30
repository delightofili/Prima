import { useI18n } from "../i18n";

// For the Phone check page: does this phone draw the letters of every language properly, and does it format dates, numbers and naira
// the way each language writes them? Look for empty squares, "?" marks, and tone marks that touch or overlap the dot under a letter.
export function LettersTest() {
  const { lang, date, number, money } = useI18n();
  return (
    <section className="card space-y-3">
      <h2 className="text-lg font-bold">Letters and formats</h2>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-subtext">Igbo</p>
        <p lang="ig" className="text-2xl font-semibold tracking-wide">
          ị ọ ụ ṅ &nbsp; Ị Ọ Ụ Ṅ
        </p>
        <p lang="ig" className="text-lg">
          Ụlọ · Ndị ọrịa · Ọnwa · Ahụ ọkụ · Ụkwara
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-subtext">Hausa</p>
        <p lang="ha" className="text-2xl font-semibold tracking-wide">
          ɓ ɗ ƙ ƴ &nbsp; Ɓ Ɗ Ƙ Ƴ &nbsp; ʼ
        </p>
        <p lang="ha" className="text-lg">
          Marasa lafiya · Ƙauye · Buɗe · Ɗora · Ɓoye · Ma&apos;aikaci
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-subtext">Yoruba</p>
        <p lang="yo" className="text-2xl font-semibold tracking-wide">
          ẹ ọ ṣ &nbsp; Ẹ Ọ Ṣ &nbsp; ẹ̀ ẹ́ ọ̀ ọ́ &nbsp; à á è é ì í ò ó ù ú ń
        </p>
        <p lang="yo" className="text-lg">
          Àwọn aláìsàn · Ọjọ́ ìbí · Ọ̀rọ̀ · Ṣí · Fóònù · Àwọsánmà
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-subtext">
          Formats in the language now selected ({lang})
        </p>
        <p className="text-lg">
          {date(new Date(2026, 9, 29), "long")} · {number(1234567.5)} ·{" "}
          {money(2500)}
        </p>
      </div>

      <p className="text-sm text-subtext">
        Empty box or "?" means this phone lacks that letter. A tone mark that
        touches or hides the dot under ẹ or ọ means the font stacks them badly.
        Tell us the phone model and send a screenshot.
      </p>
    </section>
  );
}
