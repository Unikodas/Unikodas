export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-slate-900">
      <h1 className="mb-6 text-3xl font-bold">Naudojimosi taisyklės</h1>

      <p className="mb-4">
        Naudodamiesi unikodas.lt, jūs sutinkate su šiomis taisyklėmis.
      </p>

      <ol className="list-decimal space-y-3 pl-6">
        <li>Platforma suteikia galimybę vartotojams skelbti ir ieškoti valstybinių numerių.</li>
        <li>Už skelbimų turinį, tikslumą ir teisingumą atsako pats vartotojas.</li>
        <li>unikodas.lt nėra sandorio šalis ir neprisiima atsakomybės už vartotojų tarpusavio susitarimus.</li>
        <li>Draudžiama skelbti neteisėtą, klaidinančią, apgaulingą ar įžeidžiančią informaciją.</li>
        <li>Administracija pasilieka teisę pašalinti skelbimus ar apriboti vartotojų prieigą be išankstinio įspėjimo.</li>
        <li>Vartotojų duomenys naudojami tik platformos veikimui, saugumui ir komunikacijai užtikrinti.</li>
      </ol>
    </main>
  );
}