// For the Phone check page: do this phone's own fonts draw the Igbo letters properly?
// Every letter below should look like a clear letter with a dot or a mark. A square box or a "?" means the font is missing it.
export function IgboFontTest() {
  return (
    <section className="card space-y-2">
      <h2 className="text-lg font-bold">Igbo letters</h2>
      <p lang="ig" className="text-2xl font-semibold tracking-wide">
        ị ọ ụ ṅ &nbsp; Ị Ọ Ụ Ṅ
      </p>
      <p lang="ig" className="text-xl">
        Ụlọ · Ndị ọrịa · Ọnwa · Ahụ ọkụ · Ụkwara · Nwanyị · Nwoke
      </p>
      <p className="text-sm text-subtext">
        If any letter shows as an empty box or a question mark, tell us the
        phone model.
      </p>
    </section>
  );
}
