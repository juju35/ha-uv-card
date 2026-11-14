/**
 * UV Index Card for Home Assistant
 * A custom Lovelace card that shows the current UV index on a WHO-coloured gauge.
 *
 * Installable via HACS (category: plugin).
 * https://github.com/juju35/ha-uv-card
 */

const CARD_VERSION = '__VERSION__';

// SVG icons from icons/, inlined by scripts/build.mjs so the card is a single self-contained file.
// Keys "0".."11" map to the UV index; "default" is the unavailable fallback.
const ICONS = __ICONS__;

// UV risk levels per WHO classification.
// Each band defines a translation key.
// Their colours are CSS variables of ha-card (--uv-low ... --uv-extreme), each
// overridable from a theme (--uv-low-color ...).
const UV_LEVELS = [
  { max: 2, key: "low" },
  { max: 5, key: "moderate" },
  { max: 7, key: "high" },
  { max: 10, key: "very_high" },
  { max: Infinity, key: "extreme" },
];

function levelFor(value) {
  return UV_LEVELS.find((l) => value <= l.max);
}

// Translations. "name" is the default card title; the other keys are the risk
// labels and the unknown and unavailable states. English ("en") is the fallback.
const TRANSLATIONS = {
  en: { name: "UV Index", low: "Low", moderate: "Moderate", high: "High", very_high: "Very high", extreme: "Extreme", unavailable: "Unavailable", unknown: "Unknown",
        ed_entity: "UV index sensor", ed_name: "Name", ed_layout: "Layout", ed_horizontal: "Horizontal", ed_vertical: "Vertical",
        ed_align: "Alignment", ed_center: "Center", ed_top: "Top", ed_show_value: "Show the value", ed_show_title: "Show title", ed_show_label: "Show the risk level",
        ed_transparent: "Transparent background", ed_language: "Language", ed_auto: "Auto (Home Assistant)",
        max_uv: "Max", protection: "Protection", protection_now: "Protection needed", ed_max_entity: "Max UV index sensor", ed_protection_entity: "Protection window sensor",
        advice_low: "No protection needed", advice_moderate: "Sunglasses · SPF 30+ at midday", advice_high: "SPF 30+ · hat · shade at noon",
        advice_very_high: "Avoid the sun {from}–{to}", advice_extreme: "Stay inside if possible", ed_show_advice: "Show the protection advice", ed_icon: "Icon (animated by default)" },
  fr: { name: "Indice UV", low: "Faible", moderate: "Modéré", high: "Élevé", very_high: "Très élevé", extreme: "Extrême", unavailable: "Indisponible", unknown: "Inconnu",
        ed_entity: "Capteur d'indice UV", ed_name: "Nom", ed_layout: "Disposition", ed_horizontal: "Horizontale", ed_vertical: "Verticale",
        ed_align: "Alignement", ed_center: "Centré", ed_top: "En haut", ed_show_value: "Afficher la valeur", ed_show_title: "Afficher le titre", ed_show_label: "Afficher le niveau de risque",
        ed_transparent: "Fond transparent", ed_language: "Langue", ed_auto: "Automatique (Home Assistant)",
        max_uv: "Max", protection: "Protection", protection_now: "Protection nécessaire", ed_max_entity: "Capteur d'indice UV max", ed_protection_entity: "Capteur de fenêtre de protection",
        advice_low: "Aucune protection nécessaire", advice_moderate: "Lunettes de soleil · SPF 30+ à midi", advice_high: "SPF 30+ · chapeau · ombre à midi",
        advice_very_high: "Évitez le soleil {from}–{to}", advice_extreme: "Restez à l'intérieur si possible", ed_show_advice: "Afficher le conseil de protection", ed_icon: "Icône (animée par défaut)" },
  de: { name: "UV-Index", low: "Niedrig", moderate: "Mäßig", high: "Hoch", very_high: "Sehr hoch", extreme: "Extrem", unavailable: "Nicht verfügbar", unknown: "Unbekannt",
        ed_entity: "UV-Index-Sensor", ed_name: "Name", ed_layout: "Anordnung", ed_horizontal: "Horizontal", ed_vertical: "Vertikal",
        ed_align: "Ausrichtung", ed_center: "Zentriert", ed_top: "Oben", ed_show_value: "Wert anzeigen", ed_show_title: "Titel anzeigen", ed_show_label: "Risikostufe anzeigen",
        ed_transparent: "Transparenter Hintergrund", ed_language: "Sprache", ed_auto: "Automatisch (Home Assistant)",
        max_uv: "Max.", protection: "Schutz", protection_now: "Schutz nötig", ed_max_entity: "Sensor für maximalen UV-Index", ed_protection_entity: "Sensor für Schutzzeitraum",
        advice_low: "Kein Schutz nötig", advice_moderate: "Sonnenbrille · LSF 30+ mittags", advice_high: "LSF 30+ · Hut · mittags Schatten",
        advice_very_high: "Sonne meiden {from}–{to}", advice_extreme: "Möglichst drinnen bleiben", ed_show_advice: "Schutzempfehlung anzeigen", ed_icon: "Symbol (standardmäßig animiert)" },
  es: { name: "Índice UV", low: "Bajo", moderate: "Moderado", high: "Alto", very_high: "Muy alto", extreme: "Extremo", unavailable: "No disponible", unknown: "Desconocido",
        ed_entity: "Sensor de índice UV", ed_name: "Nombre", ed_layout: "Disposición", ed_horizontal: "Horizontal", ed_vertical: "Vertical",
        ed_align: "Alineación", ed_center: "Centrado", ed_top: "Arriba", ed_show_value: "Mostrar el valor", ed_show_title: "Mostrar el título", ed_show_label: "Mostrar el nivel de riesgo",
        ed_transparent: "Fondo transparente", ed_language: "Idioma", ed_auto: "Automático (Home Assistant)",
        max_uv: "Máx.", protection: "Protección", protection_now: "Protección necesaria", ed_max_entity: "Sensor de índice UV máximo", ed_protection_entity: "Sensor de ventana de protección",
        advice_low: "No se necesita protección", advice_moderate: "Gafas de sol · FPS 30+ a mediodía", advice_high: "FPS 30+ · sombrero · sombra a mediodía",
        advice_very_high: "Evite el sol {from}–{to}", advice_extreme: "Quédese en casa si es posible", ed_show_advice: "Mostrar el consejo de protección", ed_icon: "Icono (animado por defecto)" },
  it: { name: "Indice UV", low: "Basso", moderate: "Moderato", high: "Alto", very_high: "Molto alto", extreme: "Estremo", unavailable: "Non disponibile", unknown: "Sconosciuto",
        ed_entity: "Sensore indice UV", ed_name: "Nome", ed_layout: "Disposizione", ed_horizontal: "Orizzontale", ed_vertical: "Verticale",
        ed_align: "Allineamento", ed_center: "Centrato", ed_top: "In alto", ed_show_value: "Mostra il valore", ed_show_title: "Mostra il titolo", ed_show_label: "Mostra il livello di rischio",
        ed_transparent: "Sfondo trasparente", ed_language: "Lingua", ed_auto: "Automatico (Home Assistant)",
        max_uv: "Max", protection: "Protezione", protection_now: "Protezione necessaria", ed_max_entity: "Sensore indice UV massimo", ed_protection_entity: "Sensore finestra di protezione",
        advice_low: "Nessuna protezione necessaria", advice_moderate: "Occhiali da sole · SPF 30+ a mezzogiorno", advice_high: "SPF 30+ · cappello · ombra a mezzogiorno",
        advice_very_high: "Evitare il sole {from}–{to}", advice_extreme: "Restare al chiuso se possibile", ed_show_advice: "Mostra il consiglio di protezione", ed_icon: "Icona (animata per impostazione predefinita)" },
  nl: { name: "UV-index", low: "Laag", moderate: "Matig", high: "Hoog", very_high: "Zeer hoog", extreme: "Extreem", unavailable: "Niet beschikbaar", unknown: "Onbekend",
        ed_entity: "UV-indexsensor", ed_name: "Naam", ed_layout: "Indeling", ed_horizontal: "Horizontaal", ed_vertical: "Verticaal",
        ed_align: "Uitlijning", ed_center: "Gecentreerd", ed_top: "Boven", ed_show_value: "Waarde tonen", ed_show_title: "Titel tonen", ed_show_label: "Risiconiveau tonen",
        ed_transparent: "Transparante achtergrond", ed_language: "Taal", ed_auto: "Automatisch (Home Assistant)",
        max_uv: "Max.", protection: "Bescherming", protection_now: "Bescherming nodig", ed_max_entity: "Sensor maximale UV-index", ed_protection_entity: "Sensor beschermingsperiode",
        advice_low: "Geen bescherming nodig", advice_moderate: "Zonnebril · SPF 30+ rond het middaguur", advice_high: "SPF 30+ · hoed · schaduw rond het middaguur",
        advice_very_high: "Vermijd de zon {from}–{to}", advice_extreme: "Blijf zo mogelijk binnen", ed_show_advice: "Beschermingsadvies tonen", ed_icon: "Pictogram (standaard geanimeerd)" },
  pt: { name: "Índice UV", low: "Baixo", moderate: "Moderado", high: "Alto", very_high: "Muito alto", extreme: "Extremo", unavailable: "Indisponível", unknown: "Desconhecido",
        ed_entity: "Sensor de índice UV", ed_name: "Nome", ed_layout: "Disposição", ed_horizontal: "Horizontal", ed_vertical: "Vertical",
        ed_align: "Alinhamento", ed_center: "Centrado", ed_top: "Em cima", ed_show_value: "Mostrar o valor", ed_show_title: "Mostrar o título", ed_show_label: "Mostrar o nível de risco",
        ed_transparent: "Fundo transparente", ed_language: "Idioma", ed_auto: "Automático (Home Assistant)",
        max_uv: "Máx.", protection: "Proteção", protection_now: "Proteção necessária", ed_max_entity: "Sensor de índice UV máximo", ed_protection_entity: "Sensor do período de proteção",
        advice_low: "Não é necessária proteção", advice_moderate: "Óculos de sol · FPS 30+ ao meio-dia", advice_high: "FPS 30+ · chapéu · sombra ao meio-dia",
        advice_very_high: "Evite o sol {from}–{to}", advice_extreme: "Fique em casa se possível", ed_show_advice: "Mostrar o conselho de proteção", ed_icon: "Ícone (animado por predefinição)" },
  pl: { name: "Indeks UV", low: "Niski", moderate: "Umiarkowany", high: "Wysoki", very_high: "Bardzo wysoki", extreme: "Ekstremalny", unavailable: "Niedostępny", unknown: "Nieznany",
        ed_entity: "Czujnik indeksu UV", ed_name: "Nazwa", ed_layout: "Układ", ed_horizontal: "Poziomy", ed_vertical: "Pionowy",
        ed_align: "Wyrównanie", ed_center: "Wyśrodkowane", ed_top: "Do góry", ed_show_value: "Pokaż wartość", ed_show_title: "Pokaż tytuł", ed_show_label: "Pokaż poziom ryzyka",
        ed_transparent: "Przezroczyste tło", ed_language: "Język", ed_auto: "Automatycznie (Home Assistant)",
        max_uv: "Maks.", protection: "Ochrona", protection_now: "Wymagana ochrona", ed_max_entity: "Czujnik maksymalnego indeksu UV", ed_protection_entity: "Czujnik okna ochrony",
        advice_low: "Ochrona niepotrzebna", advice_moderate: "Okulary przeciwsłoneczne · SPF 30+ w południe", advice_high: "SPF 30+ · kapelusz · cień w południe",
        advice_very_high: "Unikaj słońca {from}–{to}", advice_extreme: "Zostań w domu, jeśli to możliwe", ed_show_advice: "Pokaż zalecenie ochrony", ed_icon: "Ikona (domyślnie animowana)" },
  ro: { name: "Indice UV", low: "Scăzut", moderate: "Moderat", high: "Ridicat", very_high: "Foarte ridicat", extreme: "Extrem", unavailable: "Indisponibil", unknown: "Necunoscut",
        ed_entity: "Senzor de indice UV", ed_name: "Nume", ed_layout: "Dispunere", ed_horizontal: "Orizontală", ed_vertical: "Verticală",
        ed_align: "Aliniere", ed_center: "Centrat", ed_top: "Sus", ed_show_value: "Afișează valoarea", ed_show_title: "Afișează titlul", ed_show_label: "Afișează nivelul de risc",
        ed_transparent: "Fundal transparent", ed_language: "Limbă", ed_auto: "Automat (Home Assistant)",
        max_uv: "Max.", protection: "Protecție", protection_now: "Protecție necesară", ed_max_entity: "Senzor de indice UV maxim", ed_protection_entity: "Senzor pentru intervalul de protecție",
        advice_low: "Nu este necesară protecția", advice_moderate: "Ochelari de soare · SPF 30+ la prânz", advice_high: "SPF 30+ · pălărie · umbră la prânz",
        advice_very_high: "Evitați soarele {from}–{to}", advice_extreme: "Rămâneți în casă dacă puteți", ed_show_advice: "Afișează sfatul de protecție", ed_icon: "Pictogramă (animată implicit)" },
  da: { name: "UV-indeks", low: "Lav", moderate: "Moderat", high: "Høj", very_high: "Meget høj", extreme: "Ekstrem", unavailable: "Utilgængelig", unknown: "Ukendt",
        ed_entity: "UV-indekssensor", ed_name: "Navn", ed_layout: "Layout", ed_horizontal: "Vandret", ed_vertical: "Lodret",
        ed_align: "Justering", ed_center: "Centreret", ed_top: "Øverst", ed_show_value: "Vis værdien", ed_show_title: "Vis titel", ed_show_label: "Vis risikoniveauet",
        ed_transparent: "Gennemsigtig baggrund", ed_language: "Sprog", ed_auto: "Automatisk (Home Assistant)",
        max_uv: "Maks.", protection: "Beskyttelse", protection_now: "Beskyttelse nødvendig", ed_max_entity: "Sensor for maksimalt UV-indeks", ed_protection_entity: "Sensor for beskyttelsesperiode",
        advice_low: "Ingen beskyttelse nødvendig", advice_moderate: "Solbriller · SPF 30+ midt på dagen", advice_high: "SPF 30+ · hat · skygge midt på dagen",
        advice_very_high: "Undgå solen {from}–{to}", advice_extreme: "Bliv indenfor, hvis det er muligt", ed_show_advice: "Vis beskyttelsesrådet", ed_icon: "Ikon (animeret som standard)" },
  sv: { name: "UV-index", low: "Låg", moderate: "Måttlig", high: "Hög", very_high: "Mycket hög", extreme: "Extrem", unavailable: "Ej tillgänglig", unknown: "Okänd",
        ed_entity: "UV-indexsensor", ed_name: "Namn", ed_layout: "Layout", ed_horizontal: "Horisontell", ed_vertical: "Vertikal",
        ed_align: "Justering", ed_center: "Centrerad", ed_top: "Överst", ed_show_value: "Visa värdet", ed_show_title: "Visa rubrik", ed_show_label: "Visa risknivån",
        ed_transparent: "Transparent bakgrund", ed_language: "Språk", ed_auto: "Automatiskt (Home Assistant)",
        max_uv: "Max", protection: "Skydd", protection_now: "Skydd behövs", ed_max_entity: "Sensor för maximalt UV-index", ed_protection_entity: "Sensor för skyddsperiod",
        advice_low: "Inget skydd behövs", advice_moderate: "Solglasögon · SPF 30+ mitt på dagen", advice_high: "SPF 30+ · hatt · skugga mitt på dagen",
        advice_very_high: "Undvik solen {from}–{to}", advice_extreme: "Stanna inne om möjligt", ed_show_advice: "Visa skyddsrådet", ed_icon: "Ikon (animerad som standard)" },
  bg: { name: "UV индекс", low: "Нисък", moderate: "Умерен", high: "Висок", very_high: "Много висок", extreme: "Екстремен", unavailable: "Недостъпен", unknown: "Неизвестно",
        ed_entity: "Сензор за UV индекс", ed_name: "Име", ed_layout: "Оформление", ed_horizontal: "Хоризонтално", ed_vertical: "Вертикално",
        ed_align: "Подравняване", ed_center: "Центрирано", ed_top: "Горе", ed_show_value: "Показване на стойността", ed_show_title: "Показване на заглавието", ed_show_label: "Показване на нивото на риск",
        ed_transparent: "Прозрачен фон", ed_language: "Език", ed_auto: "Автоматично (Home Assistant)",
        max_uv: "Макс.", protection: "Защита", protection_now: "Нужна е защита", ed_max_entity: "Сензор за максимален UV индекс", ed_protection_entity: "Сензор за период на защита",
        advice_low: "Не е нужна защита", advice_moderate: "Слънчеви очила · SPF 30+ по обяд", advice_high: "SPF 30+ · шапка · сянка по обяд",
        advice_very_high: "Избягвайте слънцето {from}–{to}", advice_extreme: "Останете вътре, ако е възможно", ed_show_advice: "Показване на съвета за защита", ed_icon: "Икона (анимирана по подразбиране)" },
  ru: { name: "УФ-индекс", low: "Низкий", moderate: "Умеренный", high: "Высокий", very_high: "Очень высокий", extreme: "Экстремальный", unavailable: "Недоступно", unknown: "Неизвестно",
        ed_entity: "Датчик УФ-индекса", ed_name: "Название", ed_layout: "Расположение", ed_horizontal: "Горизонтально", ed_vertical: "Вертикально",
        ed_align: "Выравнивание", ed_center: "По центру", ed_top: "Сверху", ed_show_value: "Показывать значение", ed_show_title: "Показывать заголовок", ed_show_label: "Показывать уровень риска",
        ed_transparent: "Прозрачный фон", ed_language: "Язык", ed_auto: "Автоматически (Home Assistant)",
        max_uv: "Макс.", protection: "Защита", protection_now: "Нужна защита", ed_max_entity: "Датчик максимального УФ-индекса", ed_protection_entity: "Датчик периода защиты",
        advice_low: "Защита не нужна", advice_moderate: "Солнцезащитные очки · SPF 30+ в полдень", advice_high: "SPF 30+ · шляпа · тень в полдень",
        advice_very_high: "Избегайте солнца {from}–{to}", advice_extreme: "По возможности оставайтесь в помещении", ed_show_advice: "Показывать совет по защите", ed_icon: "Значок (по умолчанию анимированный)" },
  uk: { name: "УФ-індекс", low: "Низький", moderate: "Помірний", high: "Високий", very_high: "Дуже високий", extreme: "Екстремальний", unavailable: "Недоступно", unknown: "Невідомо",
        ed_entity: "Датчик УФ-індексу", ed_name: "Назва", ed_layout: "Розташування", ed_horizontal: "Горизонтально", ed_vertical: "Вертикально",
        ed_align: "Вирівнювання", ed_center: "По центру", ed_top: "Зверху", ed_show_value: "Показувати значення", ed_show_title: "Показувати заголовок", ed_show_label: "Показувати рівень ризику",
        ed_transparent: "Прозорий фон", ed_language: "Мова", ed_auto: "Автоматично (Home Assistant)",
        max_uv: "Макс.", protection: "Захист", protection_now: "Потрібен захист", ed_max_entity: "Датчик максимального УФ-індексу", ed_protection_entity: "Датчик періоду захисту",
        advice_low: "Захист не потрібен", advice_moderate: "Сонцезахисні окуляри · SPF 30+ опівдні", advice_high: "SPF 30+ · капелюх · тінь опівдні",
        advice_very_high: "Уникайте сонця {from}–{to}", advice_extreme: "За можливості залишайтеся в приміщенні", ed_show_advice: "Показувати пораду щодо захисту", ed_icon: "Значок (типово анімований)" },
  hu: { name: "UV-index", low: "Alacsony", moderate: "Mérsékelt", high: "Magas", very_high: "Nagyon magas", extreme: "Extrém", unavailable: "Nem elérhető", unknown: "Ismeretlen",
        ed_entity: "UV-index-érzékelő", ed_name: "Név", ed_layout: "Elrendezés", ed_horizontal: "Vízszintes", ed_vertical: "Függőleges",
        ed_align: "Igazítás", ed_center: "Középre", ed_top: "Felülre", ed_show_value: "Érték megjelenítése", ed_show_title: "Cím megjelenítése", ed_show_label: "Kockázati szint megjelenítése",
        ed_transparent: "Átlátszó háttér", ed_language: "Nyelv", ed_auto: "Automatikus (Home Assistant)",
        max_uv: "Max.", protection: "Védelem", protection_now: "Védelem szükséges", ed_max_entity: "Maximális UV-index érzékelő", ed_protection_entity: "Védelmi időszak érzékelő",
        advice_low: "Nincs szükség védelemre", advice_moderate: "Napszemüveg · SPF 30+ délben", advice_high: "SPF 30+ · kalap · árnyék délben",
        advice_very_high: "Kerülje a napot {from}–{to}", advice_extreme: "Lehetőleg maradjon bent", ed_show_advice: "Védelmi tanács megjelenítése", ed_icon: "Ikon (alapértelmezés szerint animált)" },
  sk: { name: "UV index", low: "Nízky", moderate: "Mierny", high: "Vysoký", very_high: "Veľmi vysoký", extreme: "Extrémny", unavailable: "Nedostupné", unknown: "Neznáme",
        ed_entity: "Senzor UV indexu", ed_name: "Názov", ed_layout: "Rozloženie", ed_horizontal: "Vodorovné", ed_vertical: "Zvislé",
        ed_align: "Zarovnanie", ed_center: "Na stred", ed_top: "Hore", ed_show_value: "Zobraziť hodnotu", ed_show_title: "Zobraziť názov", ed_show_label: "Zobraziť úroveň rizika",
        ed_transparent: "Priehľadné pozadie", ed_language: "Jazyk", ed_auto: "Automaticky (Home Assistant)",
        max_uv: "Max.", protection: "Ochrana", protection_now: "Potrebná ochrana", ed_max_entity: "Senzor maximálneho UV indexu", ed_protection_entity: "Senzor obdobia ochrany",
        advice_low: "Ochrana nie je potrebná", advice_moderate: "Slnečné okuliare · SPF 30+ na obed", advice_high: "SPF 30+ · klobúk · tieň na obed",
        advice_very_high: "Vyhnite sa slnku {from}–{to}", advice_extreme: "Ak je to možné, zostaňte vnútri", ed_show_advice: "Zobraziť odporúčanie ochrany", ed_icon: "Ikona (predvolene animovaná)" },
  cs: { name: "UV index", low: "Nízký", moderate: "Mírný", high: "Vysoký", very_high: "Velmi vysoký", extreme: "Extrémní", unavailable: "Nedostupné", unknown: "Neznámé",
        ed_entity: "Senzor UV indexu", ed_name: "Název", ed_layout: "Rozvržení", ed_horizontal: "Vodorovné", ed_vertical: "Svislé",
        ed_align: "Zarovnání", ed_center: "Na střed", ed_top: "Nahoře", ed_show_value: "Zobrazit hodnotu", ed_show_title: "Zobrazit název", ed_show_label: "Zobrazit úroveň rizika",
        ed_transparent: "Průhledné pozadí", ed_language: "Jazyk", ed_auto: "Automaticky (Home Assistant)",
        max_uv: "Max.", protection: "Ochrana", protection_now: "Nutná ochrana", ed_max_entity: "Senzor maximálního UV indexu", ed_protection_entity: "Senzor období ochrany",
        advice_low: "Ochrana není nutná", advice_moderate: "Sluneční brýle · SPF 30+ v poledne", advice_high: "SPF 30+ · klobouk · stín v poledne",
        advice_very_high: "Vyhněte se slunci {from}–{to}", advice_extreme: "Pokud možno zůstaňte uvnitř", ed_show_advice: "Zobrazit doporučení ochrany", ed_icon: "Ikona (ve výchozím stavu animovaná)" },
  sl: { name: "UV-indeks", low: "Nizek", moderate: "Zmeren", high: "Visok", very_high: "Zelo visok", extreme: "Ekstremen", unavailable: "Ni na voljo", unknown: "Neznano",
        ed_entity: "Senzor UV-indeksa", ed_name: "Ime", ed_layout: "Postavitev", ed_horizontal: "Vodoravno", ed_vertical: "Navpično",
        ed_align: "Poravnava", ed_center: "Sredinsko", ed_top: "Zgoraj", ed_show_value: "Prikaži vrednost", ed_show_title: "Prikaži naslov", ed_show_label: "Prikaži raven tveganja",
        ed_transparent: "Prozorno ozadje", ed_language: "Jezik", ed_auto: "Samodejno (Home Assistant)",
        max_uv: "Najv.", protection: "Zaščita", protection_now: "Potrebna zaščita", ed_max_entity: "Senzor največjega UV-indeksa", ed_protection_entity: "Senzor obdobja zaščite",
        advice_low: "Zaščita ni potrebna", advice_moderate: "Sončna očala · SPF 30+ opoldne", advice_high: "SPF 30+ · klobuk · senca opoldne",
        advice_very_high: "Izogibajte se soncu {from}–{to}", advice_extreme: "Če je mogoče, ostanite v zaprtih prostorih", ed_show_advice: "Prikaži nasvet za zaščito", ed_icon: "Ikona (privzeto animirana)" },
  lv: { name: "UV indekss", low: "Zems", moderate: "Mērens", high: "Augsts", very_high: "Ļoti augsts", extreme: "Ekstrēms", unavailable: "Nav pieejams", unknown: "Nezināms",
        ed_entity: "UV indeksa sensors", ed_name: "Nosaukums", ed_layout: "Izkārtojums", ed_horizontal: "Horizontāls", ed_vertical: "Vertikāls",
        ed_align: "Līdzinājums", ed_center: "Centrēts", ed_top: "Augšā", ed_show_value: "Rādīt vērtību", ed_show_title: "Rādīt virsrakstu", ed_show_label: "Rādīt riska līmeni",
        ed_transparent: "Caurspīdīgs fons", ed_language: "Valoda", ed_auto: "Automātiski (Home Assistant)",
        max_uv: "Maks.", protection: "Aizsardzība", protection_now: "Nepieciešama aizsardzība", ed_max_entity: "Maksimālā UV indeksa sensors", ed_protection_entity: "Aizsardzības perioda sensors",
        advice_low: "Aizsardzība nav nepieciešama", advice_moderate: "Saulesbrilles · SPF 30+ pusdienlaikā", advice_high: "SPF 30+ · cepure · ēna pusdienlaikā",
        advice_very_high: "Izvairieties no saules {from}–{to}", advice_extreme: "Ja iespējams, palieciet telpās", ed_show_advice: "Rādīt aizsardzības ieteikumu", ed_icon: "Ikona (pēc noklusējuma animēta)" },
  el: { name: "Δείκτης UV", low: "Χαμηλός", moderate: "Μέτριος", high: "Υψηλός", very_high: "Πολύ υψηλός", extreme: "Ακραίος", unavailable: "Μη διαθέσιμο", unknown: "Άγνωστο",
        ed_entity: "Αισθητήρας δείκτη UV", ed_name: "Όνομα", ed_layout: "Διάταξη", ed_horizontal: "Οριζόντια", ed_vertical: "Κάθετη",
        ed_align: "Στοίχιση", ed_center: "Στο κέντρο", ed_top: "Στην κορυφή", ed_show_value: "Εμφάνιση της τιμής", ed_show_title: "Εμφάνιση τίτλου", ed_show_label: "Εμφάνιση του επιπέδου κινδύνου",
        ed_transparent: "Διαφανές φόντο", ed_language: "Γλώσσα", ed_auto: "Αυτόματα (Home Assistant)",
        max_uv: "Μέγ.", protection: "Προστασία", protection_now: "Απαιτείται προστασία", ed_max_entity: "Αισθητήρας μέγιστου δείκτη UV", ed_protection_entity: "Αισθητήρας περιόδου προστασίας",
        advice_low: "Δεν χρειάζεται προστασία", advice_moderate: "Γυαλιά ηλίου · SPF 30+ το μεσημέρι", advice_high: "SPF 30+ · καπέλο · σκιά το μεσημέρι",
        advice_very_high: "Αποφύγετε τον ήλιο {from}–{to}", advice_extreme: "Μείνετε μέσα αν είναι δυνατόν", ed_show_advice: "Εμφάνιση της συμβουλής προστασίας", ed_icon: "Εικονίδιο (κινούμενο από προεπιλογή)" },
  sr: { name: "УВ индекс", low: "Низак", moderate: "Умерен", high: "Висок", very_high: "Веома висок", extreme: "Екстреман", unavailable: "Недоступно", unknown: "Непознато",
        ed_entity: "Сензор УВ индекса", ed_name: "Назив", ed_layout: "Распоред", ed_horizontal: "Хоризонтално", ed_vertical: "Вертикално",
        ed_align: "Поравнање", ed_center: "Центрирано", ed_top: "Горе", ed_show_value: "Прикажи вредност", ed_show_title: "Прикажи наслов", ed_show_label: "Прикажи ниво ризика",
        ed_transparent: "Провидна позадина", ed_language: "Језик", ed_auto: "Аутоматски (Home Assistant)",
        max_uv: "Макс.", protection: "Заштита", protection_now: "Потребна заштита", ed_max_entity: "Сензор максималног УВ индекса", ed_protection_entity: "Сензор периода заштите",
        advice_low: "Заштита није потребна", advice_moderate: "Наочаре за сунце · ЗФ 30+ у подне", advice_high: "ЗФ 30+ · шешир · хлад у подне",
        advice_very_high: "Избегавајте сунце {from}–{to}", advice_extreme: "Останите унутра ако је могуће", ed_show_advice: "Прикажи савет за заштиту", ed_icon: "Икона (подразумевано анимирана)" },
  "sr-Latn": { name: "UV indeks", low: "Nizak", moderate: "Umeren", high: "Visok", very_high: "Veoma visok", extreme: "Ekstreman", unavailable: "Nedostupno", unknown: "Nepoznato",
        ed_entity: "Senzor UV indeksa", ed_name: "Naziv", ed_layout: "Raspored", ed_horizontal: "Horizontalno", ed_vertical: "Vertikalno",
        ed_align: "Poravnanje", ed_center: "Centrirano", ed_top: "Gore", ed_show_value: "Prikaži vrednost", ed_show_title: "Prikaži naslov", ed_show_label: "Prikaži nivo rizika",
        ed_transparent: "Providna pozadina", ed_language: "Jezik", ed_auto: "Automatski (Home Assistant)",
        max_uv: "Maks.", protection: "Zaštita", protection_now: "Potrebna zaštita", ed_max_entity: "Senzor maksimalnog UV indeksa", ed_protection_entity: "Senzor perioda zaštite",
        advice_low: "Zaštita nije potrebna", advice_moderate: "Naočare za sunce · ZF 30+ u podne", advice_high: "ZF 30+ · šešir · hlad u podne",
        advice_very_high: "Izbegavajte sunce {from}–{to}", advice_extreme: "Ostanite unutra ako je moguće", ed_show_advice: "Prikaži savet za zaštitu", ed_icon: "Ikona (podrazumevano animirana)" },
};

const LANGUAGE_NAMES = {
  en: "English", fr: "Français", de: "Deutsch", es: "Español", it: "Italiano", nl: "Nederlands", pt: "Português (Portugal)", pl: "Polski",
  ro: "Română", da: "Dansk", sv: "Svenska", bg: "Български", ru: "Русский", uk: "Українська", hu: "Magyar",
  sk: "Slovenčina", cs: "Čeština", sl: "Slovenščina", lv: "Latviešu", el: "Ελληνικά",
  sr: "Српски", "sr-Latn": "Srpski (latinica)",
};

// Pick the translation code for a language: the full code when it has a
// translation (e.g. "sr-Latn", matched case-insensitively), else the base code
// (e.g. "fr-CA" -> "fr"), else English.
function resolveLang(lang) {
  const code = String(lang || "en");
  const lower = code.toLowerCase();
  const full = Object.keys(TRANSLATIONS).find((k) => k.toLowerCase() === lower);
  if (full) return full;
  const base = lower.split("-")[0];
  return TRANSLATIONS[base] ? base : "en";
}

function localize(key, lang) {
  return TRANSLATIONS[resolveLang(lang)][key] || TRANSLATIONS.en[key];
}

// WHO bands on the gauge: 0 to 12 on a half circle, each band from the middle
// between two whole numbers (the displayed value is rounded), so 2 sits in the
// green band and 3 in the yellow one; 11+ takes the last stretch.
const GAUGE_MAX = 12;
const BOUNDS = [0, 2.5, 5.5, 7.5, 10.5, GAUGE_MAX];
const CX = 100;
const CY = 100;
const R = 82;

// Angle (0 = left end, 180 = right end) of a rounded UV value on the gauge.
function gaugeAngle(value) {
  return (Math.min(Math.max(value, 0), 11.5) / GAUGE_MAX) * 180;
}

// A point of the arc at a fraction t (0 left .. 1 right) of the half circle.
function arcPoint(t) {
  const a = Math.PI * t;
  return `${(CX - R * Math.cos(a)).toFixed(2)} ${(CY - R * Math.sin(a)).toFixed(2)}`;
}

// The gauge drawing: five band segments (a small gap between them), the day's
// max tick and the marker, both turned around the centre by CSS (--uv-angle,
// --uv-max-angle on ha-card) so their moves are transitions, not redraws.
const GAP = 0.006;
const GAUGE_SVG = `<svg viewBox="0 0 200 112" aria-hidden="true">${UV_LEVELS.map((l, i) => {
  const t0 = BOUNDS[i] / GAUGE_MAX + (i ? GAP : 0);
  const t1 = BOUNDS[i + 1] / GAUGE_MAX - (i < UV_LEVELS.length - 1 ? GAP : 0);
  return `<path class="seg s${i}" style="stroke: var(--uv-${l.key.replace("_", "-")})" d="M ${arcPoint(t0)} A ${R} ${R} 0 0 1 ${arcPoint(t1)}"/>`;
}).join("")}<g class="tick"><line x1="${CX - R - 11}" y1="${CY}" x2="${CX - R + 11}" y2="${CY}"/></g><g class="marker"><circle class="halo" cx="${CX - R}" cy="${CY}" r="9"/><circle class="dot" cx="${CX - R}" cy="${CY}" r="9"/></g></svg>`;

// Static stylesheet, injected once. The per-render values are driven by the
// --uv-color / --uv-angle / --uv-max-angle variables and the data-layout,
// data-align, data-transparent, data-level, data-unavailable, data-max and
// data-paused attributes set on ha-card.
const STYLE = `
  /* Sections view: the grid stretches the host to the rows the card asked
     for; ha-card fills it, so "center" centers and "top" sticks to the top. */
  :host {
    display: block;
    height: 100%;
  }
  /* Natural width in a parent that sizes to its content (inline-block, grid
     "auto" column, layout-card, button-card): ha-card is a size container, so
     its content no longer gives the card a width, and this empty grid does
     instead. Its min-content width is 0: in a "1fr 1fr" grid the card still
     shrinks to its cell, also when a wrapping <div> (min-width: auto) takes
     its min-content width. No height, so it takes no room. */
  :host::before {
    content: "";
    display: grid;
    grid-template-columns: minmax(0, 240px);
    height: 0;
  }
  ha-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
    padding: 12px;
    box-sizing: border-box;
    cursor: pointer;
    /* Size container for the narrow-card rules below. Inline-size containment
       leaves the content out of the intrinsic width: :host::before gives the
       card its width in a shrink-to-fit parent. */
    container-type: inline-size;
    /* WHO band colours, themable. */
    --uv-low: var(--uv-low-color, #558b2f);
    --uv-moderate: var(--uv-moderate-color, #f9a825);
    --uv-high: var(--uv-high-color, #ef6c00);
    --uv-very-high: var(--uv-very-high-color, #b71c1c);
    --uv-extreme: var(--uv-extreme-color, #6a1b9a);
    /* Band colors stay on the tinted backgrounds and the gauge; text and the
       badge icon use them half-mixed with the theme text color, which keeps
       the hue and reaches 4.5:1 in HA's light and dark themes (bright yellow
       on white and deep purple on dark were under 2:1). */
    --uv-text-color: color-mix(in srgb, var(--uv-color) 50%, var(--primary-text-color, #212121));
  }
  ha-card[data-align="top"] {
    justify-content: flex-start;
  }
  /* Keyboard focus (the card is a role="button"), drawn inside the rounded card. */
  ha-card:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: -2px;
  }
  ha-card[data-transparent] {
    background: none;
    box-shadow: none;
    border: none;
  }
  [hidden] {
    display: none !important;
  }
  /* Header: badge, title + subtitle, status pill on the title line. */
  .header {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .badge {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    flex: none;
    background: color-mix(in srgb, var(--uv-color) 16%, transparent);
    color: var(--uv-text-color);
    --mdc-icon-size: 24px;
    transition: background-color 0.6s ease;
  }
  /* The animated Meteocons icon fills the badge (its drawing has a margin). */
  .icon {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
  }
  .icon svg {
    width: 100%;
    height: 100%;
    display: block;
  }
  /* The title takes the room left by the badge and the pill, keeps at least
     4 characters, then is cut with an ellipsis. */
  .titles {
    flex: 1 1 0;
    min-width: 4ch;
  }
  .name {
    font-size: 16px;
    font-weight: 500;
    line-height: 1.25;
    color: var(--primary-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sub {
    font-size: 12px;
    line-height: 16px;
    color: var(--secondary-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* With a subtitle the pill stays on the title's line. */
  .header[data-sub] > .label {
    align-self: flex-start;
    margin-top: 1px;
  }
  .label {
    flex: 0 1 auto;
    padding: 1px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    line-height: 18px;
    color: var(--uv-text-color);
    background: color-mix(in srgb, var(--uv-color) 15%, transparent);
    /* One line inside the card: a long level (pl "Bardzo wysoki", nl "Niet
       beschikbaar") is cut with an ellipsis, its full text in the tooltip. */
    white-space: nowrap;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    box-sizing: border-box;
  }
  /* A level that does not fit even so (measured by the card) shows as its
     colored dot; the text stays in the DOM, the tooltip and the label. */
  .label[data-dot] {
    font-size: 0;
    width: 10px;
    height: 10px;
    padding: 0;
    flex: none;
    border-radius: 50%;
    background: var(--uv-text-color);
  }
  /* Body, vertical (default): the gauge, the value in its centre, the advice
     under it. Horizontal: the gauge on the left, value and advice on the right. */
  .body {
    display: grid;
    grid-template-areas: "gauge" "advice";
    justify-items: center;
    row-gap: 4px;
    min-width: 0;
  }
  .gauge {
    grid-area: gauge;
    width: min(100%, 220px);
  }
  .gauge svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }
  .seg {
    fill: none;
    stroke-width: 14;
    transition: opacity 0.6s ease;
  }
  /* Bands above the current level are dimmed. */
  ha-card[data-level="0"] :is(.s1, .s2, .s3, .s4),
  ha-card[data-level="1"] :is(.s2, .s3, .s4),
  ha-card[data-level="2"] :is(.s3, .s4),
  ha-card[data-level="3"] .s4 {
    opacity: 0.22;
  }
  /* No value: the whole gauge dimmed, without a marker. */
  ha-card[data-unavailable] .seg {
    opacity: 0.3;
  }
  /* The marker and the max tick turn around the gauge centre. */
  .marker,
  .tick {
    transform-box: view-box;
    transform-origin: 100px 100px;
    transition: transform 0.9s cubic-bezier(0.3, 0.7, 0.3, 1), opacity 0.4s ease;
  }
  .marker {
    transform: rotate(var(--uv-angle, 0deg));
  }
  .tick {
    transform: rotate(var(--uv-max-angle, 0deg));
    opacity: 0;
  }
  ha-card[data-max] .tick {
    opacity: 1;
  }
  .tick line {
    stroke: var(--primary-text-color, #212121);
    stroke-width: 2.5;
    stroke-linecap: round;
  }
  .dot {
    fill: var(--uv-color);
    stroke: var(--card-background-color, #fff);
    stroke-width: 3;
    transition: fill 0.6s ease;
  }
  .halo {
    fill: var(--uv-color);
    opacity: 0;
    transform-box: fill-box;
    transform-origin: center;
  }
  /* Very high and Extreme: a gentle pulse around the marker. */
  ha-card:is([data-level="3"], [data-level="4"]) .halo {
    animation: uv-pulse 3s ease-out infinite;
  }
  ha-card[data-paused] .halo {
    animation-play-state: paused;
  }
  @keyframes uv-pulse {
    0% { opacity: 0.45; transform: scale(1); }
    70%, 100% { opacity: 0; transform: scale(2.1); }
  }
  ha-card[data-unavailable] .marker {
    opacity: 0;
  }
  .value {
    grid-area: gauge;
    align-self: end;
    font-size: 40px;
    font-weight: 400;
    line-height: 1;
    color: var(--uv-text-color);
    transition: color 0.6s ease;
    font-variant-numeric: tabular-nums;
  }
  .advice {
    grid-area: advice;
    font-size: 13px;
    line-height: 18px;
    text-align: center;
    color: var(--secondary-text-color);
    min-width: 0;
    max-width: 100%;
    overflow-wrap: anywhere;
  }
  ha-card[data-layout="horizontal"] .body {
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas: "gauge value" "gauge advice";
    grid-template-rows: 1fr 1fr;
    justify-items: start;
    column-gap: 16px;
    row-gap: 2px;
  }
  ha-card[data-layout="horizontal"] .gauge {
    width: 160px;
    align-self: center;
  }
  ha-card[data-layout="horizontal"] .value {
    grid-area: value;
  }
  ha-card[data-layout="horizontal"] .advice {
    text-align: left;
    align-self: start;
  }
  /* Footer: the sun protection window, highlighted while it is on. */
  .extra {
    display: flex;
    justify-content: center;
    font-size: 12px;
    line-height: 16px;
    color: var(--secondary-text-color);
  }
  .protection {
    min-width: 0;
    padding: 4px 10px;
    border-radius: 12px;
    text-align: center;
    overflow-wrap: anywhere;
    border: 1px solid transparent;
  }
  .protection[data-active] {
    color: var(--uv-text-color);
    font-weight: 500;
    background: color-mix(in srgb, var(--uv-color) 10%, transparent);
    border-color: color-mix(in srgb, var(--uv-color) 30%, transparent);
  }
  .protection[data-active]::before {
    content: "";
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 6px;
    border-radius: 50%;
    background: var(--uv-text-color);
  }
  @media (prefers-reduced-motion: reduce) {
    .marker, .tick, .seg, .dot, .value, .badge { transition: none; }
    .halo { animation: none !important; }
  }
  /* A horizontal card too narrow for the gauge and a text column side by side
     stacks them like the vertical layout. */
  @container (max-width: 299px) {
    ha-card[data-layout="horizontal"] .body {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas: "gauge" "advice";
      grid-template-rows: auto;
      justify-items: center;
      row-gap: 4px;
    }
    ha-card[data-layout="horizontal"] .gauge {
      width: min(100%, 220px);
    }
    ha-card[data-layout="horizontal"] .value {
      grid-area: gauge;
    }
    ha-card[data-layout="horizontal"] .advice {
      text-align: center;
    }
  }
  /* Narrow card: a smaller value, the advice on smaller text. */
  @container (max-width: 160px) {
    .value {
      font-size: 30px;
    }
    .advice {
      font-size: 12px;
      line-height: 16px;
    }
    .header {
      gap: 8px;
    }
  }
  /* Very narrow card (3 columns of a phone section): the badge, its gap, 4
     characters of title and the pill no longer fit, the badge goes (the gauge
     stays) so the title stays inside the card. */
  @container (max-width: 89px) {
    .badge {
      display: none;
    }
  }
`;

function iconSvg(index) {
  return ICONS[String(index)] || ICONS.default;
}

// The UV index text of an entity: a sensor's state, or the uv_index attribute
// of a weather entity (Met.no, OpenWeatherMap...), whose state is the condition.
function uvText(entityId, stateObj) {
  if (!stateObj) return "";
  if (String(entityId).startsWith("weather.")) {
    if (stateObj.state === "unavailable" || stateObj.state === "unknown") return "";
    const uv = stateObj.attributes?.uv_index;
    return uv === undefined || uv === null ? "" : String(uv).trim();
  }
  return String(stateObj.state).trim();
}

// Time format options following Home Assistant's 12/24 h setting.
function timeOptions(hass) {
  const options = { hour: "2-digit", minute: "2-digit" };
  const tf = hass?.locale?.time_format;
  if (tf === "12") options.hour12 = true;
  else if (tf === "24") options.hour12 = false;
  return options;
}

function formatWith(lang, options, date) {
  try {
    return new Intl.DateTimeFormat(lang, options).format(date);
  } catch {
    // An unknown language tag or time zone: the browser's language, local time.
    delete options.timeZone;
    return new Intl.DateTimeFormat(undefined, options).format(date);
  }
}

// A time of day ("13:20" / "1:20 PM") in the card language, following Home
// Assistant's 12/24 h setting and, when the profile asks for it, the server time zone.
function formatTime(value, hass, lang) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  const options = timeOptions(hass);
  if (hass?.locale?.time_zone === "server" && hass.config?.time_zone) options.timeZone = hass.config.time_zone;
  return formatWith(lang, options, date);
}

// A wall-clock hour ("11:00" / "11:00 AM") for the advice: no time zone, it is
// the local midday window the WHO advice speaks of.
function formatHour(hour, hass, lang) {
  return formatWith(lang, timeOptions(hass), new Date(2000, 0, 1, hour, 0));
}

function reducedMotion() {
  return !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

class UvIndexCard extends HTMLElement {
  // Visual editor: Home Assistant's native form.
  static getConfigForm() {
    const ha = document.querySelector("home-assistant");
    const lang = (ha?.hass?.language) || "en";
    const t = (key) => localize(key, lang);
    return {
      schema: [
        { name: "entity", required: true, selector: { entity: { domain: ["sensor", "weather"] } } },
        { name: "name", selector: { text: {} } },
        { name: "max_entity", selector: { entity: { domain: "sensor" } } },
        { name: "protection_entity", selector: { entity: { domain: "binary_sensor" } } },
        {
          type: "grid",
          name: "",
          schema: [
            { name: "layout", selector: { select: { mode: "dropdown", options: [
              { value: "vertical", label: t("ed_vertical") },
              { value: "horizontal", label: t("ed_horizontal") },
            ] } } },
            { name: "align", selector: { select: { mode: "dropdown", options: [
              { value: "center", label: t("ed_center") },
              { value: "top", label: t("ed_top") },
            ] } } },
          ],
        },
        { name: "icon", selector: { icon: {} } },
        { name: "show_title", default: true, selector: { boolean: {} } },
        { name: "show_value", default: true, selector: { boolean: {} } },
        { name: "show_label", default: true, selector: { boolean: {} } },
        { name: "show_advice", default: true, selector: { boolean: {} } },
        { name: "transparent", default: false, selector: { boolean: {} } },
        // Leading "auto" option (empty value) lets the editor revert to
        // following the Home Assistant language once a language was picked.
        { name: "language", selector: { select: { mode: "dropdown", options: [
          { value: "", label: t("ed_auto") },
          ...Object.entries(LANGUAGE_NAMES).map(([value, label]) => ({ value, label })),
        ] } } },
      ],
      computeLabel: (schema) => (schema.name ? t(`ed_${schema.name}`) : ""),
    };
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("You need to define an 'entity'");
    }
    this._config = {
      ...config,
      show_title: config.show_title !== false,
      show_label: config.show_label !== false,
      show_value: config.show_value !== false,
      show_advice: config.show_advice !== false,
      // "vertical" = value inside the gauge, advice under it (default);
      // "horizontal" = gauge on the left, value and advice on the right.
      layout: config.layout === "horizontal" ? "horizontal" : "vertical",
      // Drop the card background, border and shadow for a transparent look.
      transparent: config.transparent === true,
      // "center" (default) or "top": vertical alignment inside the card,
      // useful to line the card up with others in a horizontal-stack.
      align: config.align === "top" ? "top" : "center",
    };
    this._configSig = JSON.stringify(this._config);
    this._sig = null; // force a re-render on the next paint
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  connectedCallback() {
    this._observe();
    this._watchView();
    this._onVisibility ||= () => this._syncAnimation();
    document.addEventListener?.("visibilitychange", this._onVisibility);
  }

  disconnectedCallback() {
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    if (this._fitFrame) cancelAnimationFrame(this._fitFrame);
    this._fitFrame = 0;
    this._viewObserver?.disconnect();
    this._viewObserver = null;
    this._offscreen = false;
    if (this._onVisibility) document.removeEventListener?.("visibilitychange", this._onVisibility);
  }

  // The SMIL rays and the marker pulse keep the page repainting even where
  // nobody sees them: pause them while the card is scrolled out of view (or in
  // a hidden view / closed stack) and while the browser tab is hidden.
  _watchView() {
    if (this._viewObserver || !this._els || typeof IntersectionObserver !== "function") return;
    this._viewObserver = new IntersectionObserver((entries) => {
      this._offscreen = !entries[entries.length - 1]?.isIntersecting;
      this._syncAnimation();
    });
    this._viewObserver.observe(this._els.card);
  }

  _animationPaused() {
    return this._offscreen === true || document.visibilityState === "hidden";
  }

  // Pause or resume the animations. With reduced motion the icon stays frozen
  // (the pulse is turned off by the stylesheet).
  _syncAnimation() {
    if (!this._els) return;
    this._els.card.toggleAttribute("data-paused", this._animationPaused());
    const svg = this._els.icon.querySelector("svg");
    if (!svg || reducedMotion()) return;
    if (this._animationPaused()) svg.pauseAnimations?.();
    else svg.unpauseAnimations?.();
  }

  // Re-fit the risk level when the card width changes (sections resize,
  // phone rotation, editor preview). Only a width change counts, and the fit
  // runs in the next animation frame, not in the callback: without a fixed
  // height (masonry, stacks) the text <-> dot switch changes the card height,
  // and resizing the observed card inside its own callback is a "ResizeObserver
  // loop completed with undelivered notifications" error.
  _observe() {
    if (this._resizeObserver || !this._els || typeof ResizeObserver !== "function") return;
    this._fitWidth = undefined;
    this._resizeObserver = new ResizeObserver((entries) => {
      const width = entries[entries.length - 1]?.contentRect.width;
      if (width !== undefined && width === this._fitWidth) return;
      this._fitWidth = width;
      if (this._fitFrame) cancelAnimationFrame(this._fitFrame);
      this._fitFrame = requestAnimationFrame(() => {
        this._fitFrame = 0;
        this._fitLabel();
      });
    });
    this._resizeObserver.observe(this._els.card);
  }

  // The level shows in full when it fits, and as its colored dot when it does
  // not (a long level on a narrow card), instead of a cut "M…".
  // Measured with fractional widths: scrollWidth / clientWidth are rounded and
  // miss a text cut by less than a pixel (still drawn with an ellipsis).
  _fitLabel() {
    const { label } = this._els;
    label.toggleAttribute("data-dot", false);
    label.removeAttribute("role");
    label.removeAttribute("aria-label");
    if (label.hidden || !label.getBoundingClientRect) return;
    const have = label.getBoundingClientRect().width;
    label.style.maxWidth = "none";
    label.style.width = "max-content";
    label.style.flex = "none";
    const need = label.getBoundingClientRect().width;
    label.style.maxWidth = "";
    label.style.width = "";
    label.style.flex = "";
    const dot = need > have + 0.01;
    label.toggleAttribute("data-dot", dot);
    // A dot is an image named by the level; the text names itself otherwise.
    if (dot) {
      label.setAttribute("role", "img");
      label.setAttribute("aria-label", label.textContent);
    }
  }

  // Cheap fingerprint of everything that affects the rendered output, so we
  // only touch the DOM when it changes.
  _signature(stateObj, text) {
    const states = this._hass?.states || {};
    const max = states[this._config.max_entity];
    const protection = states[this._config.protection_entity];
    const locale = this._hass?.locale;
    return JSON.stringify([
      this._configSig,
      text,
      stateObj ? stateObj.state : null,
      stateObj ? stateObj.attributes.friendly_name : null,
      this._hass ? this._hass.language : null,
      max ? [max.state, max.attributes?.time] : null,
      protection ? [protection.state, protection.attributes?.start_time, protection.attributes?.end_time] : null,
      locale ? [locale.time_format, locale.time_zone] : null,
    ]);
  }

  // The optional protection window footer.
  _hasExtra() {
    return !!this._config?.protection_entity;
  }

  getCardSize() {
    const size = this._config && this._config.layout === "horizontal" ? 4 : 5;
    return size + (this._hasExtra() ? 1 : 0);
  }

  getGridOptions() {
    const horizontal = this._config && this._config.layout === "horizontal";
    const extra = this._hasExtra();
    // Horizontal: the gauge beside its text fits 3 rows, the footer takes a
    // 4th; vertical: the gauge with the value inside and the advice take 4.
    const rows = horizontal ? (extra ? 4 : 3) : extra ? 5 : 4;
    return horizontal
      ? { columns: 9, min_columns: 6, rows, min_rows: rows }
      : { columns: 6, min_columns: 4, rows, min_rows: rows };
  }

  static getStubConfig(hass) {
    const ids = hass ? Object.keys(hass.states) : [];
    const uv =
      ids.find((id) => id.startsWith("sensor.") && /(^|_|\.)uv(_|$)/.test(id)) ||
      ids.find((id) => id.startsWith("weather.") && hass.states[id].attributes?.uv_index !== undefined);
    return { entity: uv || "sensor.uv_index" };
  }

  // Builds the card once: the static stylesheet and the DOM skeleton. Later
  // renders only update text, attributes and the card's variables, so the
  // marker glides to its new place and the icon (and its SMIL animation) is
  // only swapped when the UV index changes.
  _build() {
    const root = this.shadowRoot;
    const el = (tag, cls, parent) => {
      const node = document.createElement(tag);
      if (cls) node.className = cls;
      parent.appendChild(node);
      return node;
    };
    const style = el("style", "", root);
    style.textContent = STYLE;
    const card = el("ha-card", "", root);
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    const header = el("div", "header", card);
    const icon = el("div", "icon", el("div", "badge", header));
    const titles = el("div", "titles", header);
    const name = el("div", "name", titles);
    const sub = el("div", "sub", titles);
    const label = el("div", "label", header);
    const body = el("div", "body", card);
    const gauge = el("div", "gauge", body);
    gauge.innerHTML = GAUGE_SVG;
    const value = el("div", "value", body);
    const advice = el("div", "advice", body);
    const extra = el("div", "extra", card);
    const protection = el("span", "protection", extra);
    // The entity is read when the event fires, so a config change needs no rebind.
    card.addEventListener("click", () => this._openMoreInfo(this._config.entity));
    // Keyboard: Enter or Space opens the entity dialog, like a button
    card.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      this._openMoreInfo(this._config.entity);
    });
    this._els = { card, header, name, sub, icon, label, gauge, value, advice, extra, protection };
    this._iconKey = null;
    if (this.isConnected) {
      this._observe();
      this._watchView();
    }
  }

  // The badge: the animated Meteocons icon of the index, or the `icon` option.
  _renderIcon(index) {
    const { icon } = this._els;
    const custom = this._config.icon;
    const iconKey = custom ? `icon:${custom}` : String(index);
    if (iconKey === this._iconKey) return;
    this._iconKey = iconKey;
    if (custom) {
      icon.innerHTML = "";
      icon.appendChild(document.createElement("ha-icon")).setAttribute("icon", custom);
      return;
    }
    icon.innerHTML = iconSvg(index);
    // SMIL ignores CSS media queries: honour prefers-reduced-motion by
    // freezing the rays' rotation on its first frame.
    const svg = icon.querySelector("svg");
    if (reducedMotion()) {
      svg?.pauseAnimations?.();
      svg?.setCurrentTime?.(0);
    } else if (this._animationPaused()) {
      // A new icon starts animating: keep it paused off-screen.
      svg?.pauseAnimations?.();
    }
  }

  _render() {
    if (!this._config) return;

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
    if (!this._els) this._build();

    const entityId = this._config.entity;
    const stateObj = this._hass ? this._hass.states[entityId] : undefined;

    // Skip the update if nothing visible changed (avoids touching the DOM on
    // every Home Assistant state tick).
    const text = uvText(entityId, stateObj);
    const sig = this._signature(stateObj, text);
    if (sig === this._sig) return;
    this._sig = sig;

    // Number("") and Number(" ") are 0: an empty state is unavailable, not "0".
    const raw = text !== "" ? Number(text) : NaN;
    const available = !!stateObj && Number.isFinite(raw);

    // Round the UV index; a negative reading is shown as 0. The icons stop at 11.
    const rounded = available ? Math.max(0, Math.round(raw)) : NaN;
    const index = available ? Math.min(rounded, 11) : NaN;

    // Language: explicit config wins, otherwise follow the Home Assistant UI.
    const lang =
      this._config.language || (this._hass?.language) || "en";
    const t = (key) => localize(key, lang);

    // WHO bands are defined on whole numbers: use the value that is displayed.
    const level = available ? levelFor(rounded) : null;
    const levelIndex = level ? UV_LEVELS.indexOf(level) : -1;
    const name =
      this._config.name ||
      (stateObj?.attributes.friendly_name) ||
      t("name");

    // A sensor that has not reported yet ("unknown") is told apart from one
    // that is offline ("unavailable").
    const labelText = level ? t(level.key) : t(stateObj?.state === "unknown" ? "unknown" : "unavailable");

    const { card, label, value, advice, gauge } = this._els;
    card.setAttribute("data-layout", this._config.layout);
    card.setAttribute("data-align", this._config.align);
    card.toggleAttribute("data-transparent", this._config.transparent);
    card.toggleAttribute("data-unavailable", !level);
    if (level) {
      card.setAttribute("data-level", String(levelIndex));
      card.style.setProperty("--uv-angle", `${gaugeAngle(rounded).toFixed(2)}deg`);
    } else {
      card.removeAttribute("data-level");
    }
    card.style.setProperty("--uv-color", level ? `var(--uv-${level.key.replace("_", "-")})` : "var(--secondary-text-color)");
    this._els.name.textContent = name;
    this._els.name.hidden = !this._config.show_title;
    this._renderIcon(index);
    this._els.icon.setAttribute("title", labelText);
    gauge.setAttribute("title", labelText);

    value.textContent = available ? String(rounded) : "—";
    value.hidden = !this._config.show_value;
    label.textContent = labelText;
    label.setAttribute("title", labelText);
    label.hidden = !this._config.show_label;

    advice.textContent = level
      ? t(`advice_${level.key}`).replace("{from}", formatHour(11, this._hass, lang)).replace("{to}", formatHour(16, this._hass, lang))
      : "";
    advice.hidden = !this._config.show_advice || !level;

    this._renderMax(lang);
    this._renderProtection(lang);
    card.toggleAttribute("data-paused", this._animationPaused());
    this._fitLabel();
  }

  // "Max 8 · 13:20" under the title from a max UV sensor (OpenUV: its "time"
  // attribute), and the max tick on the gauge.
  _renderMax(lang) {
    const { card, sub, header } = this._els;
    const maxObj = this._hass?.states?.[this._config.max_entity];
    const maxText = maxObj ? String(maxObj.state).trim() : "";
    const maxRaw = maxText !== "" ? Number(maxText) : NaN;
    const has = !!this._config.max_entity && Number.isFinite(maxRaw);
    if (has) {
      const rounded = Math.max(0, Math.round(maxRaw));
      const at = formatTime(maxObj.attributes?.time, this._hass, lang);
      sub.textContent = `${localize("max_uv", lang)} ${rounded}${at ? ` · ${at}` : ""}`;
      card.style.setProperty("--uv-max-angle", `${gaugeAngle(rounded).toFixed(2)}deg`);
    } else {
      sub.textContent = "";
    }
    sub.hidden = !has;
    header.toggleAttribute("data-sub", has);
    card.toggleAttribute("data-max", has);
  }

  // "Protection 10:45–16:30" from a protection window binary sensor (OpenUV:
  // start_time / end_time), highlighted while the window is on.
  _renderProtection(lang) {
    const { extra, protection } = this._els;
    const t = (key) => localize(key, lang);
    const protObj = this._hass?.states?.[this._config.protection_entity];
    const on = protObj?.state === "on";
    const start = formatTime(protObj?.attributes?.start_time, this._hass, lang);
    const end = formatTime(protObj?.attributes?.end_time, this._hass, lang);
    if (this._config.protection_entity && protObj && start && end) {
      protection.textContent = `${t("protection")} ${start}–${end}`;
    } else if (this._config.protection_entity && on) {
      protection.textContent = t("protection_now");
    } else {
      protection.textContent = "";
    }
    protection.hidden = protection.textContent === "";
    protection.toggleAttribute("data-active", on && !protection.hidden);
    extra.hidden = protection.hidden;
  }

  _openMoreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }
}

// Guarded: the resource may be loaded twice (HACS and /local/, or two ?v= URLs).
if (!customElements.get("ha-uv-card")) {
  customElements.define("ha-uv-card", UvIndexCard);

  // Register the card so it shows up in the dashboard card picker.
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "ha-uv-card",
    name: "UV Index Card",
    description: "Displays the current UV index on a WHO-coloured gauge, with the risk level and protection advice.",
    preview: true,
    documentationURL: "https://github.com/juju35/ha-uv-card",
  });

  console.info(
    `%c HA-UV-CARD %c v${CARD_VERSION} `,
    "color: white; background: #f9a825; font-weight: 700;",
    "color: #f9a825; background: white; font-weight: 700;"
  );
}
