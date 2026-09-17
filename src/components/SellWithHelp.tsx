const contactHref = 'https://t.me/unikodas';

export function SellWithHelp() {
  return (
    <section className="app-card my-6 p-5 sm:p-7" aria-label="Pagalba parduodant numerį">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">Pradinis pasiūlymas pirmiesiems 5 pardavėjams</p>
          <h2 className="mt-2 text-2xl font-bold text-[var(--foreground)]">Norite pagalbos parduodant numerį?</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
            Padėsime pristatyti jūsų numerį pirkėjams, pasirūpinsime sklaida,
            užklausomis ir pardavimo koordinavimu.
          </p>
          <p className="mt-3 font-bold text-[var(--foreground)]">Jokio išankstinio mokesčio · Nedidelis komisinis tik sėkmingai pardavus</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Komisinio dydį sutarsime kartu prieš pradėdami.</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Nepardavus – jokio paslaugos mokesčio.</p>
        </div>
        <a href={contactHref} className="app-button-primary inline-flex min-h-12 shrink-0 items-center justify-center px-5 py-3 text-sm">
          Parašyti per Telegram
        </a>
      </div>
      <details className="mt-5 border-t border-[var(--border)] pt-4 text-sm text-[var(--muted-foreground)]">
        <summary className="cursor-pointer font-semibold text-[var(--foreground)]">Kaip pradėti ir kada taikomas mokestis?</summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 leading-6">
          <li>Parašykite mums per Telegram <a className="font-semibold text-[var(--primary)] underline" href={contactHref}>@unikodas</a>: atsiųskite numerio derinį, norimą kainą ir miestą. Jei turite skelbimą, pridėkite jo nuorodą.</li>
          <li>Peržiūrėsime užklausą ir Telegram žinutėmis sutarsime dėl pardavimo kainos, komisinio dydžio, paslaugos trukmės, sklaidos bei konkrečių sąlygų, kada pardavimas laikomas įvykusiu su mūsų pagalba. Paslauga prasideda tik abiem pusėms susitarus; vien užklausa mokėti neįpareigoja.</li>
          <li>Sutartas komisinis mokamas tik sėkmingai pardavus numerį su mūsų pagalba pagal iš anksto suderintas sąlygas. Įprastą skelbimą ir toliau galite įkelti savarankiškai nemokamai.</li>
        </ol>
        <p className="mt-3 leading-6">Pardavimo ir jo termino negarantuojame. Numerio perleidimo bei registravimo išlaidos į paslaugos mokestį neįskaičiuotos.</p>
      </details>
    </section>
  );
}
