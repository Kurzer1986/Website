// =========================================================
// GITHUB PAGES – PIN-SCHUTZ
// =========================================================

const PIN_HASH = "9a20ae78840d1a444686d7ef12f62082888b1f764151438badc3f5e0122f1429";

async function pinPruefen() {
  const eingabe = document.getElementById("pin-input").value;
  const daten = new TextEncoder().encode(eingabe);
  const hashBuffer = await crypto.subtle.digest("SHA-256", daten);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");

  if (hash === PIN_HASH) {
    sessionStorage.setItem("pinFreigegeben", "1");
    document.getElementById("pin-view").style.display = "none";
  } else {
    document.getElementById("pin-fehler").textContent =
      "Falscher PIN · PIN incorrecto.";
    document.getElementById("pin-input").value = "";
    document.getElementById("pin-input").focus();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const pinView = document.getElementById("pin-view");
  const pinButton = document.getElementById("pin-button");
  const pinInput = document.getElementById("pin-input");

  if (sessionStorage.getItem("pinFreigegeben") === "1") {
    pinView.style.display = "none";
    return;
  }

  pinButton.addEventListener("click", pinPruefen);

  pinInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      pinPruefen();
    }
  });
});

// =========================================================
// GRUNDEINSTELLUNGEN
// =========================================================

let sprache = localStorage.getItem("sprache") || "de";
let ansicht = "clock";
let meetingMoment = new Date();
let wetterFehler = false;
let ehefrauBegruessung = false;
let aktuelleBriefseite = 0;
let briefseiten = [];
const wetter = {};

// =========================================================
// REISE – BUDGET
// =========================================================

const reiseZiel = 5000;

let euroCopKurs = null;

let reiseGespart =
  Number(
    localStorage.getItem(
      "reiseGespart"
    )
  ) || 0;

// Die Kosten der Reise in der Reihenfolge
// der Liste
const reiseKosten = [
  {
    id: "reise-reisepass",
    betrag: 70
  },
  {
    id: "reise-versicherung",
    betrag: 100
  },
  {
    id: "reise-abflug-kolumbien",
    betrag: 150
  },
  {
    id: "reise-flug-deutschland",
    betrag: 700
  },
  {
    id: "reise-rudolstadt",
    betrag: 140
  },
  {
    id: "reise-verpflegung",
    betrag: 1000
  },
  {
    id: "reise-flughafen-rueckflug",
    betrag: 140
  },
  {
    id: "reise-flug-kolumbien",
    betrag: 700
  },
  {
    id: "reise-ankunft-kolumbien",
    betrag: 150
  },
  {
    id: "reise-reserve",
    betrag: 850
  }
];

// =========================================================
// REISE – WECHSELKURS
// =========================================================

async function reiseWechselkursLaden() {

  try {

    const antwort =
      await fetch(
        "https://api.frankfurter.dev/v2/rate/eur/cop"
      );

    const daten =
      await antwort.json();

    if (
      daten &&
      Number.isFinite(
        Number(daten.rate)
      )
    ) {

      euroCopKurs =
        Number(daten.rate);

      reiseBudgetAnzeigen();

    }

  } catch (fehler) {

    console.log(
      "Wechselkurs konnte nicht geladen werden."
    );

  }

}

// =========================================================
// REISE – BUDGET ANZEIGEN
// =========================================================

function reiseBudgetAnzeigen() {

  const t =
    texte[sprache];

  const gespart =
    Math.min(
      Math.max(
        0,
        reiseGespart
      ),
      reiseZiel
    );

  const rest =
    Math.max(
      0,
      reiseZiel - gespart
    );

  const prozent =
    (gespart / reiseZiel) * 100;

  // =======================================================
  // COP ANZEIGEN
  // =======================================================

  function copAnzeigen(euro) {

    if (!euroCopKurs) {
      return "";
    }

    const cop =
      Math.round(
        euro * euroCopKurs
      );

    return `≈ $${cop.toLocaleString("es-CO")}`;

  }

  // =======================================================
  // GESPART
  // =======================================================

  const betragElement =
    document.getElementById(
      "reise-budget-betrag"
    );

  if (betragElement) {

    betragElement.innerHTML =
      `${gespart.toLocaleString(
        t.locale
      )} €`;

    if (
      sprache === "es" &&
      euroCopKurs
    ) {

      betragElement.innerHTML +=
        `<small class="reise-cop">` +
        `${copAnzeigen(gespart)}` +
        `</small>`;

    }

  }

  // =======================================================
  // REST
  // =======================================================

  const restElement =
    document.getElementById(
      "reise-budget-rest"
    );

  if (restElement) {

    restElement.innerHTML =
      `${rest.toLocaleString(
        t.locale
      )} €`;

    if (
      sprache === "es" &&
      euroCopKurs
    ) {

      restElement.innerHTML +=
        `<small class="reise-cop">` +
        `${copAnzeigen(rest)}` +
        `</small>`;

    }

  }

  // =======================================================
  // FORTSCHRITTSBALKEN
  // =======================================================

  const fortschritt =
    document.getElementById(
      "reise-budget-fortschritt"
    );

  if (fortschritt) {

    fortschritt.style.width =
      `${prozent}%`;

  }

  // =======================================================
  // GELDSCHEINE
  // =======================================================

  document
    .querySelectorAll(
      ".reise-schein"
    )
    .forEach(
      (button) => {

        const euro =
          Number(
            button.dataset.euro
          );

        const cop =
          Number(
            button.dataset.cop
          );

        // Deutschland:
        // alle Euro-Scheine anzeigen
        if (sprache === "de") {

          button.style.display =
            "";

          button.innerHTML =
            `${euro} €`;

          return;

        }

        // Spanien:
        // nur die drei kolumbianischen
        // Scheine anzeigen
        if (!cop) {

          button.style.display =
            "none";

          return;

        }

        button.style.display =
          "";

        button.innerHTML =
            `<span>$${cop.toLocaleString(
            "es-CO"
          )}</span>`;

        if (euroCopKurs) {

          button.innerHTML +=
            `<small class="reise-cop">` +
            `≈ ${euro.toLocaleString("de-DE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })} €` +
            `</small>`;

        }

      }
    );

  // =======================================================
  // BESCHRIFTUNGEN
  // =======================================================

  const label =
    document.getElementById(
      "reise-budget-label"
    );

  if (label) {

    label.textContent =
      sprache === "de"
        ? "Bereits zurückgelegt"
        : "Ya ahorrado";

  }

  const restLabel =
    document.getElementById(
      "reise-budget-rest-label"
    );

  if (restLabel) {

    restLabel.textContent =
      sprache === "de"
        ? "Noch benötigt"
        : "Falta por reunir";

  }

  const herausnehmen =
    document.getElementById(
      "reise-geld-herausnehmen"
    );

  if (herausnehmen) {

    herausnehmen.textContent =
      sprache === "de"
        ? "− Geld herausnehmen"
        : "− Sacar dinero";

  }

  // =======================================================
  // REISEPOSTEN ABHAKEN
  // =======================================================

  let verbleibend =
    gespart;

  reiseKosten.forEach(
    (posten) => {

      const element =
        document.getElementById(
          posten.id
        );

      if (!element) {
        return;
      }

      const item =
        element.closest(
          ".reise-item"
        );

      if (!item) {
        return;
      }

      const erledigt =
        verbleibend >=
        posten.betrag;

      item.classList.toggle(
        "reise-erledigt",
        erledigt
      );

      // Alten COP-Betrag entfernen
      const alterCop =
        item.querySelector(
          ".reise-posten-cop"
        );

      if (alterCop) {
        alterCop.remove();
      }

      // Alten Haken entfernen
      const alterHaken =
        item.querySelector(
          ".reise-erledigt-haken"
        );

      if (alterHaken) {
        alterHaken.remove();
      }

      // =====================================================
      // SPANISCHE COP-ANZEIGE
      // =====================================================

      if (
        sprache === "es" &&
        euroCopKurs
      ) {

        const kosten =
          item.querySelector(
            ".reise-kosten"
          );

        if (kosten) {

          const cop =
            document.createElement(
              "small"
            );

          cop.className =
            "reise-posten-cop";

          cop.textContent =
            copAnzeigen(
              posten.betrag
            );

          kosten.appendChild(
            cop
          );

        }

      }

      // =====================================================
      // ERLEDIGT
      // =====================================================

      if (erledigt) {

        verbleibend -=
          posten.betrag;

        const haken =
          document.createElement(
            "span"
          );

        haken.className =
          "reise-erledigt-haken";

        haken.textContent =
          "✓";

        const kosten =
          item.querySelector(
            ".reise-kosten"
          );

        if (kosten) {

          kosten.appendChild(
            haken
          );

        }

      }

    }
  );

}

// =========================================================
// GELD EINZAHLEN
// =========================================================

document
  .querySelectorAll(
    ".reise-schein"
  )
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          let betrag;

          // Deutschland:
          // Euro direkt übernehmen
          if (sprache === "de") {

            betrag =
              Number(
                button.dataset.euro
              );

          }

          // Kolumbien:
          // COP in EUR umrechnen
          else {

            if (!euroCopKurs) {

              alert(
                "El tipo de cambio todavía se está cargando."
              );

              return;

            }

            const cop =
              Number(
                button.dataset.cop
              );

            betrag =
              cop /
              euroCopKurs;

          }

          if (
            !Number.isFinite(
              betrag
            ) ||
            betrag <= 0
          ) {

            return;

          }

          reiseGespart +=
            betrag;

          reiseGespart =
            Math.min(
              reiseGespart,
              reiseZiel
            );

          localStorage.setItem(
            "reiseGespart",
            reiseGespart
          );

          reiseBudgetAnzeigen();

        }
      );

    }
  );

// =========================================================
// GELD HERAUSNEHMEN
// =========================================================

const geldHerausnehmen =
  document.getElementById(
    "reise-geld-herausnehmen"
  );

if (geldHerausnehmen) {

  geldHerausnehmen.addEventListener(
    "click",
    () => {

      if (
        reiseGespart <= 0
      ) {

        alert(
          sprache === "de"
            ? "In der Reisekasse ist noch kein Geld."
            : "Todavía no hay dinero en la caja del viaje."
        );

        return;

      }

      const eingabe =
        prompt(
          sprache === "de"
            ? `Wie viel möchtest du herausnehmen?\n\nAktuell: ${reiseGespart.toLocaleString("de-DE")} €`
            : `¿Cuánto quieres sacar?\n\nActualmente: ${reiseGespart.toLocaleString("de-DE")} €`
        );

      if (
        eingabe === null ||
        eingabe.trim() === ""
      ) {

        return;

      }

      const betrag =
        Number(
          eingabe.replace(
            ",",
            "."
          )
        );

      if (
        !Number.isFinite(
          betrag
        ) ||
        betrag <= 0
      ) {

        alert(
          sprache === "de"
            ? "Bitte gib einen gültigen Betrag ein."
            : "Por favor, introduce una cantidad válida."
        );

        return;

      }

      if (
        betrag >
        reiseGespart
      ) {

        alert(
          sprache === "de"
            ? "Du kannst nicht mehr Geld herausnehmen, als aktuell in der Reisekasse ist."
            : "No puedes sacar más dinero del que hay actualmente en la caja del viaje."
        );

        return;

      }

      reiseGespart -=
        betrag;

      localStorage.setItem(
        "reiseGespart",
        reiseGespart
      );

      reiseBudgetAnzeigen();

    }
  );

}

// =========================================================
// TEXTE
// =========================================================

const texte = {

  de: {

    titel: "",
    deutschland: "Deutschland",
    kolumbien: "Kolumbien",
    wetter: "Wetter jetzt",
    laedt: "Wetter wird geladen …",
    fehler: "⚠️ Wetter nicht verfügbar",
    uhr: "🕐",
    wir: "🫶",
    meetingTitel: "Zeitrechner",
    meetingHinweis: "Ändere eine Zeit – die andere Seite passt sich an.",
    zusammen: "Zusammen seit",
    tage: "Tage",
    stunden: "Stunden",
    minuten: "Minuten",
    naechsterTag: "Nächster besonderer Tag",
    inTagen: "in",
    tagen: "Tagen",
    heute: "Heute",
    locale: "de-DE",
    hour12: false,

    reise: {

      titel: "🛫 Marias Weg zu mir",

      intro:
        "Alles, was wir brauchen, damit aus 9.000 km endlich eine echte Reise wird. ❤️",

      reisepass: "Reisepass",

      reisepassText:
        "Der erste Schritt für die Reise.",

      versicherung:
        "Auslandskrankenversicherung",

      versicherungText:
        "Damit Maria während der Reise abgesichert ist.",

      abflugKolumbien:
        "Manizales → Abflughafen",

      abflugKolumbienText:
        "Die Reise zum Flughafen in Kolumbien.",

      flugDeutschland:
        "Flug Kolumbien → Deutschland",

      flugDeutschlandText:
        "Der große Schritt über den Atlantik.",

      rudolstadt:
        "Flughafen → Rudolstadt",

      rudolstadtText:
        "Die letzte Strecke bis zu mir.",

      verpflegung:
        "Verpflegung",

      verpflegungText:
        "Für die Zeit, in der wir endlich zusammen sind.",

      flughafenRueckflug:
        "Rudolstadt → Flughafen",

      flughafenRueckflugText:
        "Damit Maria wieder sicher zum Rückflug kommt.",

      flugKolumbien:
        "Flug Deutschland → Kolumbien",

      flugKolumbienText:
        "Der Rückflug nach Hause.",

      ankunftKolumbien:
        "Flughafen → Manizales",

      ankunftKolumbienText:
        "Der letzte Weg zurück nach Hause.",

      reserve:
        "Sicherheitsreserve",

      reserveText:
        "Für alles, was man besser hat, bevor man es braucht."

    }

  },

  es: {

    titel: "❤️ Hola mi Vida ❤️",
    deutschland: "Alemania",
    kolumbien: "Colombia",
    wetter: "Tiempo actual",
    laedt: "Cargando el tiempo …",
    fehler: "⚠️ Tiempo no disponible",
    uhr: "🕐",
    wir: "🫶",
    meetingTitel: "Conversor de hora",
    meetingHinweis: "Cambia una hora y la otra se actualizará.",
    zusammen: "Juntos desde",
    tage: "Días",
    stunden: "Horas",
    minutos: "Minutos",
    naechsterTag: "Próximo día especial",
    inTagen: "en",
    tagen: "días",
    heute: "Hoy",
    locale: "es-CO",
    hour12: true,

    reise: {

      titel:
        "🛫 El camino de María hacia mí",

      intro:
        "Todo lo que necesitamos para convertir por fin estos 9.000 km en un viaje real. ❤️",

      reisepass:
        "Pasaporte",

      reisepassText:
        "El primer paso para hacer realidad este viaje.",

      versicherung:
        "Seguro médico de viaje",

      versicherungText:
        "Para que María esté protegida durante el viaje.",

      abflugKolumbien:
        "Manizales → Aeropuerto de salida",

      abflugKolumbienText:
        "El viaje hasta el aeropuerto en Colombia.",

      flugDeutschland:
        "Vuelo Colombia → Alemania",

      flugDeutschlandText:
        "El gran paso para cruzar el Atlántico.",

      rudolstadt:
        "Aeropuerto → Rudolstadt",

      rudolstadtText:
        "El último tramo del camino hasta mí.",

      verpflegung:
        "Alimentación",

      verpflegungText:
        "Para el tiempo que por fin vamos a estar juntos.",

      flughafenRueckflug:
        "Rudolstadt → Aeropuerto",

      flughafenRueckflugText:
        "Para que María pueda llegar de nuevo al aeropuerto para su vuelo de regreso.",

      flugKolumbien:
        "Vuelo Alemania → Colombia",

      flugKolumbienText:
        "El vuelo de regreso a casa.",

      ankunftKolumbien:
        "Aeropuerto → Manizales",

      ankunftKolumbienText:
        "El último camino de regreso a casa.",

      reserve:
        "Reserva de seguridad",

      reserveText:
        "Para todo aquello que es mejor tener antes de necesitarlo."

    }

  }

};

// =========================================================
// ORTE
// =========================================================

const orte = {

  rudolstadt: {

    zeitzone: "Europe/Berlin",
    latitude: 50.7204,
    longitude: 11.3405

  },

  manizales: {

    zeitzone: "America/Bogota",
    latitude: 5.0703,
    longitude: -75.5138

  }

};

// =========================================================
// BEZIEHUNG
// =========================================================

const zusammenSeit =
  new Date("2025-08-09T19:57:00+02:00");

const besondereTage = [

  {

    id: "kennengelernt",

    datum: "2024-08-05",

    name: {

      de: "Kennengelernt",
      es: "Nos conocimos"

    }

  },

  {

    id: "paar",

    datum: "2025-08-09",

    name: {

      de: "Paar seit",
      es: "Pareja desde"

    }

  },

  {

    id: "geburtstag-ich",

    datum: "1986-09-03",

    name: {

      de: "Christoph Geburtstag",
      es: "Christoph cumpleaños"

    }

  },

  {

    id: "geburtstag-sie",

    datum: "2002-06-12",

    name: {

      de: "Maria Geburtstag",
      es: "Maria cumpleaños"

    }

  }

];

// =========================================================
// HILFSFUNKTIONEN – ZEIT / DATUM
// =========================================================

function pad(n) {

  return String(n).padStart(2, "0");

}

function zeit(d, tz, sek = false) {

  return new Intl.DateTimeFormat(
    texte[sprache].locale,
    {

      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      second: sek ? "2-digit" : undefined,
      hour12: texte[sprache].hour12

    }
  ).format(d);

}

function datum(d, tz) {

  return new Intl.DateTimeFormat(
    texte[sprache].locale,
    {

      timeZone: tz,
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"

    }
  ).format(d);

}

function teile(d, tz, mitZeit = false) {

  const optionen = {

    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"

  };

  if (mitZeit) {

    optionen.hour = "2-digit";
    optionen.minute = "2-digit";
    optionen.second = "2-digit";
    optionen.hourCycle = "h23";

  }

  return Object.fromEntries(

    new Intl.DateTimeFormat(
      "en-CA",
      optionen
    )
      .formatToParts(d)
      .filter(
        p => p.type !== "literal"
      )
      .map(
        p => [p.type, p.value]
      )

  );

}

function offset(d, tz) {

  const t =
    teile(
      d,
      tz,
      true
    );

  return Date.UTC(
    +t.year,
    +t.month - 1,
    +t.day,
    +t.hour,
    +t.minute,
    +t.second
  ) - d.getTime();

}

function datumAusOrtszeit(
  uhr,
  tz
) {

  const [h, m] =
    uhr
      .split(":")
      .map(Number);

  const heute =
    teile(
      new Date(),
      tz
    );

  const utc =
    Date.UTC(
      +heute.year,
      +heute.month - 1,
      +heute.day,
      h,
      m
    );

  return new Date(
    utc -
    offset(
      new Date(utc),
      tz
    )
  );

}

function heuteInZeitzone(
  zeitzone
) {

  const jetzt =
    new Date();

  const teile =
    new Intl.DateTimeFormat(
      "en-CA",
      {

        timeZone: zeitzone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"

      }
    ).formatToParts(
      jetzt
    );

  const jahr =
    teile.find(
      x => x.type === "year"
    ).value;

  const monat =
    teile.find(
      x => x.type === "month"
    ).value;

  const tag =
    teile.find(
      x => x.type === "day"
    ).value;

  return new Date(
    `${jahr}-${monat}-${tag}T00:00:00`
  );

}

function zeitpunktInZeitzone(
  jahr,
  monat,
  tag,
  zeitzone
) {

  const utc =
    new Date(

      Date.UTC(
        jahr,
        monat - 1,
        tag,
        0,
        0,
        0
      )

    );

  const teile =
    new Intl.DateTimeFormat(
      "en-US",
      {

        timeZone: zeitzone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"

      }
    ).formatToParts(
      utc
    );

  const wert =
    typ =>
      teile.find(
        x => x.type === typ
      ).value;

  const lokaleZeit =
    Date.UTC(

      Number(
        wert("year")
      ),

      Number(
        wert("month")
      ) - 1,

      Number(
        wert("day")
      ),

      Number(
        wert("hour")
      ),

      Number(
        wert("minute")
      ),

      Number(
        wert("second")
      )

    );

  const offset =
    lokaleZeit -
    utc.getTime();

  return new Date(
    utc.getTime() -
    offset
  );

}

function naechstesVorkommen(
  datumStr,
  zeitzone
) {

  const [, monat, tag] =
    datumStr
      .split("-")
      .map(Number);

  const heute =
    heuteInZeitzone(
      zeitzone
    );

  let kandidat =
    zeitpunktInZeitzone(
      heute.getFullYear(),
      monat,
      tag,
      zeitzone
    );

  if (
    kandidat < heute
  ) {

    kandidat =
      zeitpunktInZeitzone(
        heute.getFullYear() + 1,
        monat,
        tag,
        zeitzone
      );

  }

  return kandidat;

}

// =========================================================
// BESONDERE TAGE
// =========================================================

function countdownText(diff) {

  const gesamtMinuten =
    Math.floor(
      diff / 60000
    );

  const stunden =
    Math.floor(
      gesamtMinuten / 60
    );

  const minuten =
    gesamtMinuten % 60;

  if (
    sprache === "es"
  ) {

    if (
      stunden === 1 &&
      minuten === 1
    )
      return "en 1 hora y 1 minuto";

    if (
      stunden === 1 &&
      minuten > 1
    )
      return `en 1 hora y ${minuten} minutos`;

    if (
      stunden > 1 &&
      minuten === 1
    )
      return `en ${stunden} horas y 1 minuto`;

    if (
      stunden > 1 &&
      minuten > 1
    )
      return `en ${stunden} horas y ${minuten} minutos`;

    if (
      stunden === 1
    )
      return "en 1 hora";

    if (
      stunden > 1
    )
      return `en ${stunden} horas`;

    if (
      minuten === 1
    )
      return "en 1 minuto";

    return `en ${minuten} minutos`;

  }

  if (
    stunden === 1 &&
    minuten === 1
  )
    return "in 1 Stunde und 1 Minute";

  if (
    stunden === 1 &&
    minuten > 1
  )
    return `in 1 Stunde und ${minuten} Minuten`;

  if (
    stunden > 1 &&
    minuten === 1
  )
    return `in ${stunden} Stunden und 1 Minute`;

  if (
    stunden > 1 &&
    minuten > 1
  )
    return `in ${stunden} Stunden und ${minuten} Minuten`;

  if (
    stunden === 1
  )
    return "in 1 Stunde";

  if (
    stunden > 1
  )
    return `in ${stunden} Stunden`;

  if (
    minuten === 1
  )
    return "in 1 Minute";

  return `in ${minuten} Minuten`;

}

function naechstenBesonderenTagFinden() {

  let best = null;
  let minDiff = Infinity;

  const zeitzone =
    sprache === "de"
      ? "Europe/Berlin"
      : "America/Bogota";

  const heute =
    heuteInZeitzone(
      zeitzone
    );

  for (
    const tag of besondereTage
  ) {

    const next =
      naechstesVorkommen(
        tag.datum,
        zeitzone
      );

    const diff =
      next - heute;

    if (
      diff >= 0 &&
      diff < minDiff
    ) {

      minDiff =
        diff;

      best = {

        ...tag,

        naechstesDatum:
          next,

        tage:
          Math.round(
            diff /
            86400000
          )

      };

    }

  }

  return best;

}

function besonderenTagAnzeigen() {

  const next =
    naechstenBesonderenTagFinden();

  const t =
    texte[sprache];

  if (!next) {

    document
      .getElementById(
        "next-special"
      )
      .style.display =
        "none";

    return;

  }

  document
    .getElementById(
      "next-special"
    )
    .style.display =
      "block";

  document
    .getElementById(
      "next-special-label"
    )
    .textContent =
      t.naechsterTag;

  document
    .getElementById(
      "next-special-title"
    )
    .textContent =
      next.name[sprache];

  const zeitzone =
    sprache === "de"
      ? "Europe/Berlin"
      : "America/Bogota";

  const datumText =
    new Intl.DateTimeFormat(
      t.locale,
      {

        timeZone:
          zeitzone,

        day: "numeric",
        month: "long",
        year: "numeric"

      }
    ).format(
      next.naechstesDatum
    );

  if (
    next.tage === 0
  ) {

    document
      .getElementById(
        "next-special-meta"
      )
      .textContent =
        `${datumText} · ${t.heute}`;

  } else if (
    next.tage === 1
  ) {

    const jetzt =
      new Date();

    const diff =
      next.naechstesDatum -
      jetzt;

    document
      .getElementById(
        "next-special-meta"
      )
      .textContent =
        `${datumText} · ${countdownText(diff)}`;

  } else {

    document
      .getElementById(
        "next-special-meta"
      )
      .textContent =
        `${datumText} · ${t.inTagen} ${next.tage} ${t.tagen}`;

  }

}

// =========================================================
// BEZIEHUNGSANZEIGE
// =========================================================

function beziehungAnzeigen() {

  const diff =
    Math.max(
      0,
      Date.now() -
      zusammenSeit.getTime()
    );

  const tage =
    Math.floor(
      diff / 86400000
    );

  const stunden =
    Math.floor(
      diff / 3600000
    );

  const minuten =
    Math.floor(
      diff / 60000
    );

  const tz =
    sprache === "de"
      ? "Europe/Berlin"
      : "America/Bogota";

  const d =
    new Intl.DateTimeFormat(
      texte[sprache].locale,
      {

        timeZone: tz,
        dateStyle: "long"

      }
    ).format(
      zusammenSeit
    );

  document
    .getElementById(
      "relationship-date"
    )
    .textContent =
      `${d} · ${zeit(
        zusammenSeit,
        tz
      )}`;

  document
    .getElementById(
      "relationship-days"
    )
    .textContent =
      tage.toLocaleString(
        texte[sprache].locale
      );

  document
    .getElementById(
      "relationship-hours"
    )
    .textContent =
      stunden.toLocaleString(
        texte[sprache].locale
      );

  document
    .getElementById(
      "relationship-minutes"
    )
    .textContent =
      minuten.toLocaleString(
        texte[sprache].locale
      );

}

function zufallsSatzAnzeigen() {

  const liste =
    saetze[sprache];

  document
    .getElementById(
      "relationship-quote"
    )
    .textContent =
      `"${liste[
        Math.floor(
          Math.random() *
          liste.length
        )
      ]}"`;

}

// =========================================================
// BEGRÜSSUNG
// =========================================================

function begruessungAnzeigen() {

  const tz =
    sprache === "de"
      ? "Europe/Berlin"
      : "America/Bogota";

  const h =
    +teile(
      new Date(),
      tz,
      true
    ).hour;

  const anrede =
    ehefrauBegruessung
      ? "mi futura esposa"
      : "mi Mujer";

  let text = "";

  if (
    sprache === "de"
  ) {

    if (
      h >= 5 &&
      h < 12
    )

      text =
        `Guten Morgen, ${anrede}`;

    else if (
      h >= 12 &&
      h < 18
    )

      text =
        `Hallo, ${anrede}`;

    else if (
      h >= 18 &&
      h < 22
    )

      text =
        `Guten Abend, ${anrede}`;

    else

      text =
        `Gute Nacht, ${anrede}`;

  } else {

    if (
      h >= 5 &&
      h < 12
    )

      text =
        `Buenos días, ${anrede}`;

    else if (
      h >= 12 &&
      h < 19
    )

      text =
        `Buenas tardes, ${anrede}`;

    else

      text =
        `Buenas noches, ${anrede}`;

  }

  const herz =
    document.getElementById(
      "secret-letter-button"
    );

  if (herz) {

    herz.style.display =
      ehefrauBegruessung
        ? "inline-block"
        : "none";

  }

  document
    .getElementById(
      "welcome-message"
    )
    .textContent =
      text;

}

// =========================================================
// UHREN
// =========================================================

function uhrenAktualisieren() {

  const jetzt =
    new Date();

  document
    .getElementById(
      "rudolstadt-time"
    )
    .textContent =
      zeit(
        jetzt,
        "Europe/Berlin",
        true
      );

  document
    .getElementById(
      "rudolstadt-date"
    )
    .textContent =
      datum(
        jetzt,
        "Europe/Berlin"
      );

  document
    .getElementById(
      "manizales-time"
    )
    .textContent =
      zeit(
        jetzt,
        "America/Bogota",
        true
      );

  document
    .getElementById(
      "manizales-date"
    )
    .textContent =
      datum(
        jetzt,
        "America/Bogota"
      );

  beziehungAnzeigen();
  begruessungAnzeigen();
  besonderenTagAnzeigen();

}

// =========================================================
// WETTER
// =========================================================

function wetterText(code) {

  if (code === 0)

    return sprache === "de"
      ? "☀️ Klar"
      : "☀️ Despejado";

  if (code === 1)

    return sprache === "de"
      ? "🌤️ Überwiegend klar"
      : "🌤️ Mayormente despejado";

  if (code === 2)

    return sprache === "de"
      ? "⛅ Teilweise bewölkt"
      : "⛅ Parcialmente nublado";

  if (code === 3)

    return sprache === "de"
      ? "☁️ Bedeckt"
      : "☁️ Cubierto";

  if (
    code >= 45 &&
    code <= 48
  )

    return sprache === "de"
      ? "🌫️ Nebel"
      : "🌫️ Niebla";

  if (
    code >= 51 &&
    code <= 55
  )

    return sprache === "de"
      ? "🌦️ Nieselregen"
      : "🌦️ Llovizna";

  if (
    code >= 56 &&
    code <= 57
  )

    return sprache === "de"
      ? "🌧️ Gefrierender Nieselregen"
      : "🌧️ Llovizna helada";

  if (
    code >= 61 &&
    code <= 65
  )

    return sprache === "de"
      ? "🌧️ Regen"
      : "🌧️ Lluvia";

  if (
    code >= 66 &&
    code <= 67
  )

    return sprache === "de"
      ? "🌧️ Gefrierender Regen"
      : "🌧️ Lluvia helada";

  if (
    code >= 71 &&
    code <= 75
  )

    return sprache === "de"
      ? "❄️ Schnee"
      : "❄️ Nieve";

  if (code === 77)

    return sprache === "de"
      ? "🌨️ Schneekörner"
      : "🌨️ Granos de nieve";

  if (
    code >= 80 &&
    code <= 82
  )

    return sprache === "de"
      ? "🌦️ Regenschauer"
      : "🌦️ Chubascos";

  if (
    code >= 85 &&
    code <= 86
  )

    return sprache === "de"
      ? "🌨️ Schneeschauer"
      : "🌨️ Chubascos de nieve";

  if (
    code >= 95 &&
    code <= 99
  )

    return sprache === "de"
      ? "⛈️ Gewitter"
      : "⛈️ Tormenta";

  return sprache === "de"
    ? "❓ Unbekannt"
    : "❓ Desconocido";

}

function wetterZeit(
  zeitString
) {

  const stunde =
    parseInt(
      zeitString.substring(
        11,
        13
      )
    );

  const minuten =
    zeitString.substring(
      14,
      16
    );

  if (
    sprache === "de"
  ) {

    return `${
      String(
        stunde
      ).padStart(
        2,
        "0"
      )
    }:${minuten}`;

  }

  const ampm =
    stunde >= 12
      ? "PM"
      : "AM";

  const stunde12 =
    stunde % 12 || 12;

  return `${stunde12}:${minuten} ${ampm}`;

}

function wetterAnzeigen() {

  for (
    const ort of Object.keys(
      orte
    )
  ) {

    const el =
      document.getElementById(
        `${ort}-weather`
      );

    if (wetterFehler) {

      el.textContent =
        texte[sprache].fehler;

    } else if (
      !wetter[ort]
    ) {

      el.textContent =
        texte[sprache].laedt;

    } else {

      el.textContent =
        `${wetterText(
          wetter[ort].weather_code
        )} · ` +
        `${Math.round(
          wetter[ort].temperature_2m
        )} °C`;

    }

  }

}

async function wetterLaden() {

  try {

    await Promise.all(

      Object.entries(
        orte
      ).map(

        async (
          [name, ort]
        ) => {

          const url =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${ort.latitude}` +
            `&longitude=${ort.longitude}` +
            `&current=temperature_2m,weather_code` +
            `&hourly=temperature_2m,weather_code` +
            `&timezone=auto`;

          const response =
            await fetch(
              url
            );

          const daten =
            await response.json();

          const aktuelleStunde =
            daten.hourly.time.findIndex(
              zeit => {

                return (
                  zeit.substring(
                    11,
                    13
                  ) ===
                  daten.current.time.substring(
                    11,
                    13
                  )
                );

              }
            );

          const stunden = [];

          for (
            let i = 0;
            i < 12;
            i++
          ) {

            const index =
              aktuelleStunde +
              i;

            stunden.push({

              zeit:
                daten.hourly.time[
                  index
                ],

              temperatur:
                daten.hourly.temperature_2m[
                  index
                ],

              wettercode:
                daten.hourly.weather_code[
                  index
                ]

            });

          }

          const ortWeather =
            document.getElementById(
              `${name}-weather-details`
            );

          ortWeather.innerHTML += `

            <img
              class="wappen"
              src="images/${name.toLowerCase()}.svg"
            >

            <div>
              ${wetterZeit(
                daten.current.time
              )}
            </div>

            <div>
              ${wetterText(
                daten.current.weather_code
              )}
              –
              ${daten.current.temperature_2m} °C
            </div>

          `;

          let stundenHTML =
            `<div class="wetter-stunden">`;

          for (
            let i = 0;
            i < 12;
            i++
          ) {

            stundenHTML += `

              <div class="wetter-stunde">

                <div>

                  ${
                    i === 0

                      ? (
                          sprache === "de"
                            ? "Jetzt"
                            : "Ahora"
                        )

                      : wetterZeit(
                          stunden[i].zeit
                        )

                  }

                </div>

                <div>

                  ${wetterText(
                    stunden[i].wettercode
                  )}

                </div>

                <div>

                  ${stunden[i].temperatur} °C

                </div>

              </div>

            `;

          }

          stundenHTML +=
            `</div>`;

          ortWeather.innerHTML +=
            stundenHTML;

          wetter[name] =
            daten.current;

        }

      )

    );

  } catch (
    fehler
  ) {

    console.log(
      fehler
    );

    wetterFehler =
      true;

  }

  wetterAnzeigen();

}

// =========================================================
// ZEITRECHNER
// =========================================================

function optionenFuellen(
  el,
  werte,
  selected
) {

  el.replaceChildren();

  werte.forEach(
    v => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        v;

      option.textContent =
        v;

      el.appendChild(
        option
      );

    }
  );

  el.value =
    selected;

}

function meetingAnzeigen() {

  for (
    const [
      name,
      ort
    ]
    of Object.entries(
      orte
    )
  ) {

    const t =
      teile(
        meetingMoment,
        ort.zeitzone,
        true
      );

    const h24 =
      +t.hour;

    const stunden =
      sprache === "de"

        ? Array.from(
            {
              length: 24
            },
            (_, i) =>
              pad(i)
          )

        : Array.from(
            {
              length: 12
            },
            (_, i) =>
              String(
                i + 1
              )
          );

    const stunde =
      sprache === "de"

        ? pad(h24)

        : String(
            (h24 % 12) || 12
          );

    optionenFuellen(

      document.getElementById(
        `${name}-hour`
      ),

      stunden,

      stunde

    );

    optionenFuellen(

      document.getElementById(
        `${name}-minute`
      ),

      Array.from(
        {
          length: 60
        },
        (_, i) =>
          pad(i)
      ),

      t.minute

    );

    const periode =
      document.getElementById(
        `${name}-period`
      );

    periode.hidden =
      sprache === "de";

    periode.value =
      h24 >= 12
        ? "PM"
        : "AM";

    document
      .getElementById(
        `${name}-meeting-day`
      )
      .textContent =
      datum(
        meetingMoment,
        ort.zeitzone
      );

  }

}

function meetingAendern(
  name
) {

  let h =
    +document.getElementById(
      `${name}-hour`
    ).value;

  const m =
    document.getElementById(
      `${name}-minute`
    ).value;

  const p =
    document.getElementById(
      `${name}-period`
    ).value;

  if (
    sprache === "es"
  ) {

    if (
      p === "AM" &&
      h === 12
    )
      h = 0;

    if (
      p === "PM" &&
      h !== 12
    )
      h += 12;

  }

  meetingMoment =
    datumAusOrtszeit(
      `${pad(h)}:${m}`,
      orte[name].zeitzone
    );

  meetingAnzeigen();

}

// =========================================================
// GEHEIME BRIEFE
// =========================================================

function briefInSeitenAufteilen(
  text
) {

  const abschnitte =
    text
      .split("⸻")
      .map(
        abschnitt =>
          abschnitt.trim()
      )
      .filter(
        abschnitt =>
          abschnitt.length > 0
      );

  const seiten = [];

  const maximaleZeichen =
    500;

  abschnitte.forEach(
    abschnitt => {

      let rest =
        abschnitt;

      while (
        rest.length >
        maximaleZeichen
      ) {

        let schnitt =
          rest.lastIndexOf(
            " ",
            maximaleZeichen
          );

        if (
          schnitt === -1
        ) {

          schnitt =
            maximaleZeichen;

        }

        seiten.push(
          rest
            .slice(
              0,
              schnitt
            )
            .trim()
        );

        rest =
          rest
            .slice(
              schnitt
            )
            .trim();

      }

      if (
        rest.length > 0
      ) {

        seiten.push(
          rest
        );

      }

    }
  );

  return seiten;

}

function briefSeiteAnzeigen() {

  document
    .getElementById(
      "letter-message"
    )
    .textContent =
      briefseiten[
        aktuelleBriefseite
      ];

  document
    .getElementById(
      "letter-page"
    )
    .textContent =
      `${
        aktuelleBriefseite + 1
      } / ${
        briefseiten.length
      }`;

}

function geheimenBriefOeffnen() {

  const overlay =
    document.getElementById(
      "letter-overlay"
    );

  const nachricht =
    geheimeNachrichten[
      Math.floor(
        Math.random() *
        geheimeNachrichten.length
      )
    ];

  briefseiten =
    briefInSeitenAufteilen(
      nachricht.text
    );

  aktuelleBriefseite =
    0;

  document
    .getElementById(
      "letter-date"
    )
    .textContent =
      nachricht.datum;

  briefSeiteAnzeigen();

  overlay.style.display =
    "flex";

  setTimeout(
    () => {

      overlay.classList.add(
        "open"
      );

    },
    300
  );

}

function geheimenBriefSchliessen() {

  const overlay =
    document.getElementById(
      "letter-overlay"
    );

  overlay.classList.remove(
    "open"
  );

  setTimeout(
    () => {

      overlay.style.display =
        "none";

    },
    800
  );

}

// =========================================================
// WILLKOMMEN
// =========================================================

function willkommenAblauf() {

  const frage =
    document.getElementById(
      "mood-question"
    );

  const auswahl =
    document.querySelector(
      ".mood-options"
    );

  setTimeout(
    () => {

      frage.style.opacity =
        "1";

    },
    2000
  );

  setTimeout(
    () => {

      auswahl.style.opacity =
        "1";

    },
    4000
  );

}

// =========================================================
// ANSICHTEN / NAVIGATION
// =========================================================

function ansichtSetzen(
  neue
) {

  ansicht =
    neue;

  document
    .getElementById(
      "clock-view"
    )
    .classList.toggle(
      "active",
      neue === "clock"
    );

  document
    .getElementById(
      "relationship-view"
    )
    .classList.toggle(
      "active",
      neue === "relationship"
    );

  document
    .getElementById(
      "weather-view"
    )
    .classList.toggle(
      "active",
      neue === "weather"
    );

  document
    .getElementById(
      "marias-reise-view"
    )
    .classList.toggle(
      "active",
      neue === "marias-reise"
    );

  document
    .getElementById(
      "clock-view-button"
    )
    .classList.toggle(
      "active",
      neue === "clock"
    );

  document
    .getElementById(
      "relationship-view-button"
    )
    .classList.toggle(
      "active",
      neue === "relationship"
    );

  document
    .getElementById(
      "weather-view-button"
    )
    .classList.toggle(
      "active",
      neue === "weather"
    );

  document
    .getElementById(
      "marias-reise-view-button"
    )
    .classList.toggle(
      "active",
      neue === "marias-reise"
    );

  if (
    neue === "relationship"
  ) {

    begruessungAnzeigen();
    zufallsSatzAnzeigen();
    besonderenTagAnzeigen();

  }

}

// =========================================================
// SPRACHE
// =========================================================

function spracheSetzen(
  neue
) {

  sprache =
    neue;

  localStorage.setItem(
    "sprache",
    sprache
  );

  const t =
    texte[sprache];

  document.documentElement.lang =
    sprache;

  document.body.classList.toggle(
    "spanish",
    sprache === "es"
  );

  // =======================================================
  // REISE
  // =======================================================

  document
    .getElementById(
      "reise-titel"
    )
    .textContent =
      t.reise.titel;

  document
    .getElementById(
      "reise-intro"
    )
    .textContent =
      t.reise.intro;

  document
    .getElementById(
      "reise-reisepass"
    )
    .textContent =
      t.reise.reisepass;

  document
    .getElementById(
      "reise-versicherung"
    )
    .textContent =
      t.reise.versicherung;

  document
    .getElementById(
      "reise-abflug-kolumbien"
    )
    .textContent =
      t.reise.abflugKolumbien;

  document
    .getElementById(
      "reise-flug-deutschland"
    )
    .textContent =
      t.reise.flugDeutschland;

  document
    .getElementById(
      "reise-rudolstadt"
    )
    .textContent =
      t.reise.rudolstadt;

  document
    .getElementById(
      "reise-verpflegung"
    )
    .textContent =
      t.reise.verpflegung;

  document
    .getElementById(
      "reise-flughafen-rueckflug"
    )
    .textContent =
      t.reise.flughafenRueckflug;

  document
    .getElementById(
      "reise-flug-kolumbien"
    )
    .textContent =
      t.reise.flugKolumbien;

  document
    .getElementById(
      "reise-ankunft-kolumbien"
    )
    .textContent =
      t.reise.ankunftKolumbien;

  document
    .getElementById(
      "reise-reserve"
    )
    .textContent =
      t.reise.reserve;

  // Reise-Beschreibungen

  document
    .getElementById(
      "reise-reisepass-text"
    )
    .textContent =
      t.reise.reisepassText;

  document
    .getElementById(
      "reise-versicherung-text"
    )
    .textContent =
      t.reise.versicherungText;

  document
    .getElementById(
      "reise-abflug-kolumbien-text"
    )
    .textContent =
      t.reise.abflugKolumbienText;

  document
    .getElementById(
      "reise-flug-deutschland-text"
    )
    .textContent =
      t.reise.flugDeutschlandText;

  document
    .getElementById(
      "reise-rudolstadt-text"
    )
    .textContent =
      t.reise.rudolstadtText;

  document
    .getElementById(
      "reise-verpflegung-text"
    )
    .textContent =
      t.reise.verpflegungText;

  document
    .getElementById(
      "reise-flughafen-rueckflug-text"
    )
    .textContent =
      t.reise.flughafenRueckflugText;

  document
    .getElementById(
      "reise-flug-kolumbien-text"
    )
    .textContent =
      t.reise.flugKolumbienText;

  document
    .getElementById(
      "reise-ankunft-kolumbien-text"
    )
    .textContent =
      t.reise.ankunftKolumbienText;

  document
    .getElementById(
      "reise-reserve-text"
    )
    .textContent =
      t.reise.reserveText;

  // =======================================================
  // BEGRÜSSUNGSFRAGE
  // =======================================================

  const moodFrage =
    document.getElementById(
      "mood-question"
    );

  if (moodFrage) {

    moodFrage.textContent =
      sprache === "de"
        ? "Wie geht es dir heute?"
        : "¿Cómo te sientes hoy?";

  }

  const weiterButton =
    document.getElementById(
      "welcome-continue"
    );

  if (weiterButton) {

    weiterButton.textContent =
      sprache === "de"
        ? "Weiter"
        : "Continuar";

  }

  // =======================================================
  // STIMMUNG
  // =======================================================

  const moodTexte = {

    "mood-happy": [
      "Glücklich",
      "Feliz"
    ],

    "mood-sad": [
      "Traurig",
      "Triste"
    ],

    "mood-love": [
      "Liebesbedürftig",
      "Necesito cariño"
    ],

    "mood-tired": [
      "Müde",
      "Cansada"
    ],

    "mood-playful": [
      "Verspielt",
      "Juguetona"
    ],

    "mood-simple": [
      "Einfach so",
      "Solo porque sí"
    ]

  };

  for (
    const [
      id,
      textePaar
    ]
    of Object.entries(
      moodTexte
    )
  ) {

    const element =
      document.getElementById(
        id
      );

    if (element) {

      element.textContent =
        sprache === "de"
          ? textePaar[0]
          : textePaar[1];

    }

  }

  // =======================================================
  // SPRACHBUTTON
  // =======================================================

  document
    .getElementById(
      "lang-button"
    )
    .textContent =
      sprache === "de"
        ? "🇨🇴"
        : "🇩🇪";

  // =======================================================
  // ALLGEMEINE TEXTE
  // =======================================================

  document
    .getElementById(
      "page-title"
    )
    .textContent =
      t.titel;

  document
    .getElementById(
      "rudolstadt-country"
    )
    .textContent =
      t.deutschland;

  document
    .getElementById(
      "manizales-country"
    )
    .textContent =
      t.kolumbien;

  document
    .getElementById(
      "rudolstadt-weather-label"
    )
    .textContent =
      t.wetter;

  document
    .getElementById(
      "manizales-weather-label"
    )
    .textContent =
      t.wetter;

  document
    .getElementById(
      "meeting-title"
    )
    .textContent =
      t.meetingTitel;

  document
    .getElementById(
      "meeting-note"
    )
    .textContent =
      t.meetingHinweis;

  document
    .getElementById(
      "relationship-title"
    )
    .textContent =
      t.zusammen;

  document
    .getElementById(
      "relationship-days-label"
    )
    .textContent =
      t.tage;

  document
    .getElementById(
      "relationship-hours-label"
    )
    .textContent =
      t.stunden;

  document
    .getElementById(
      "relationship-minutes-label"
    )
    .textContent =
      t.minuten;

  document
    .getElementById(
      "clock-view-button"
    )
    .textContent =
      t.uhr;

  document
    .getElementById(
      "relationship-view-button"
    )
    .textContent =
      t.wir;

  document
    .getElementById(
      "weather-view-button"
    )
    .textContent =
      "🌤️";

  // =======================================================
  // AKTUALISIEREN
  // =======================================================

  uhrenAktualisieren();

  wetterAnzeigen();

  document
    .getElementById(
      "rudolstadt-weather-details"
    )
    .innerHTML = "";

  document
    .getElementById(
      "manizales-weather-details"
    )
    .innerHTML = "";

  wetterLaden();

  meetingAnzeigen();

  // Reisekasse aktualisieren
  reiseBudgetAnzeigen();

  if (
    ansicht === "relationship"
  ) {

    begruessungAnzeigen();
    zufallsSatzAnzeigen();
    besonderenTagAnzeigen();

  }

}

// =========================================================
// EVENT LISTENER
// =========================================================

// Sprache

document
  .getElementById(
    "lang-button"
  )
  .addEventListener(
    "click",
    () => {

      spracheSetzen(
        sprache === "de"
          ? "es"
          : "de"
      );

    }
  );

// =========================================================
// ANSICHTEN
// =========================================================

document
  .getElementById(
    "clock-view-button"
  )
  .addEventListener(
    "click",
    () =>
      ansichtSetzen(
        "clock"
      )
  );

document
  .getElementById(
    "relationship-view-button"
  )
  .addEventListener(
    "click",
    () =>
      ansichtSetzen(
        "relationship"
      )
  );

document
  .getElementById(
    "weather-view-button"
  )
  .addEventListener(
    "click",
    () =>
      ansichtSetzen(
        "weather"
      )
  );

document
  .getElementById(
    "marias-reise-view-button"
  )
  .addEventListener(
    "click",
    () =>
      ansichtSetzen(
        "marias-reise"
      )
  );

// =========================================================
// ZEITRECHNER
// =========================================================

for (
  const ort of Object.keys(
    orte
  )
) {

  for (
    const teil
    of [
      "hour",
      "minute",
      "period"
    ]
  ) {

    document
      .getElementById(
        `${ort}-${teil}`
      )
      .addEventListener(
        "change",
        () =>
          meetingAendern(
            ort
          )
      );

  }

}

// =========================================================
// GEHEIMER BRIEF
// =========================================================

document
  .getElementById(
    "secret-letter-button"
  )
  .addEventListener(
    "click",
    geheimenBriefOeffnen
  );

document
  .getElementById(
    "letter-prev"
  )
  .addEventListener(
    "click",
    () => {

      if (
        aktuelleBriefseite > 0
      ) {

        aktuelleBriefseite--;

        briefSeiteAnzeigen();

      }

    }
  );

document
  .getElementById(
    "letter-next"
  )
  .addEventListener(
    "click",
    () => {

      if (
        aktuelleBriefseite <
        briefseiten.length - 1
      ) {

        aktuelleBriefseite++;

        briefSeiteAnzeigen();

      }

    }
  );

document
  .getElementById(
    "letter-close"
  )
  .addEventListener(
    "click",
    geheimenBriefSchliessen
  );

// =========================================================
// STIMMUNG
// =========================================================

document
  .querySelectorAll(
    ".mood-option"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const mood =
            button.dataset.mood;

          const antworten = {

            happy: {

              de:
                "Schön. 🧡",

              es:
                "Qué bonito. 🧡"

            },

            sad: {

              de:
                "Komm her. 🫂",

              es:
                "Ven aquí. 🫂"

            },

            love: {

              de:
                "Immer. ❤️",

              es:
                "Siempre. ❤️"

            },

            tired: {

              de:
                "Dann ruh dich aus. 💤",

              es:
                "Entonces descansa. 💤"

            },

            playful: {

              de:
                "Ohh... 😏",

              es:
                "Ohh... 😏"

            },

            simple: {

              de:
                "Für dich. 🤍",

              es:
                "Para ti. 🤍"

            }

          };

          document
            .getElementById(
              "mood-question"
            )
            .style.opacity =
              "0";

          document
            .querySelector(
              ".mood-options"
            )
            .style.opacity =
              "0";

          setTimeout(
            () => {

              document
                .querySelector(
                  ".mood-options"
                )
                .style.display =
                  "none";

              document
                .getElementById(
                  "mood-question"
                )
                .style.display =
                  "none";

              document
                .getElementById(
                  "mood-response"
                )
                .textContent =
                  antworten[
                    mood
                  ][
                    sprache
                  ];

              document
                .getElementById(
                  "mood-response"
                )
                .style.opacity =
                  "1";

              document
                .getElementById(
                  "welcome-continue"
                )
                .style.opacity =
                  "1";

            },
            800
          );

        }
      );

    }
  );

// =========================================================
// WEITER
// =========================================================

document
  .getElementById(
    "welcome-continue"
  )
  .addEventListener(
    "click",
    () => {

      document
        .getElementById(
          "welcome-view"
        )
        .style.display =
          "none";

      ansichtSetzen(
        "clock"
      );

    }
  );

// =========================================================
// START – KOLUMBIEN
// =========================================================

document
  .getElementById(
    "start-colombia"
  )
  .onclick =
    function () {

      spracheSetzen(
        "es"
      );

      ehefrauBegruessung =
        Math.random() < 0.2;

      document
        .getElementById(
          "secret-letter-button"
        )
        .classList.toggle(
          "visible",
          ehefrauBegruessung
        );

      document
        .getElementById(
          "start-view"
        )
        .style.display =
          "none";

      begruessungAnzeigen();

      document
        .getElementById(
          "welcome-view"
        )
        .style.display =
          "flex";

      willkommenAblauf();

    };

// =========================================================
// START – DEUTSCHLAND
// =========================================================

document
  .getElementById(
    "start-germany"
  )
  .onclick =
    function () {

      spracheSetzen(
        "de"
      );

      ehefrauBegruessung =
        false;

      document
        .getElementById(
          "start-view"
        )
        .style.display =
          "none";

      begruessungAnzeigen();

      document
        .getElementById(
          "welcome-view"
        )
        .style.display =
          "flex";

      willkommenAblauf();

    };

// =========================================================
// START
// =========================================================

spracheSetzen(
  sprache
);

ansichtSetzen(
  "clock"
);

setInterval(
  uhrenAktualisieren,
  1000
);

setInterval(
  besonderenTagAnzeigen,
  60000
);

// Wechselkurs laden
reiseWechselkursLaden();