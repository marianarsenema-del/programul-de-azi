// Traduceri, texte, etichete — extrase din server.js (fișier de peste 2MB,
// problemă reală de arhitectură: Cold Start pe Vercel, GitHub nu mai randa
// fișierul). Fiecare export e identic ca structură cu ce era în server.js,
// doar mutat aici.

// Duplicat intenționat din server.js — folosit direct în textele de mai jos

const TRAVEL_GUIDES_MONETIZATION_READY = true;

// Duplicate intenționate din server.js — bug real, descoperit chiar acum:
// activarea TRAVEL_GUIDES_MONETIZATION_READY de mai sus a scos la iveală
// că aceste funcții NU existau deloc în acest fișier (locales.js e un
// modul SEPARAT de server.js — o funcție definită acolo nu e automat
// vizibilă aici doar pentru că server.js face require la acest fișier).
// Cât timp steagul era `false`, ramura care le apela nu se executa
// NICIODATĂ, deci lipsa lor a rămas nedescoperită — ar fi picat tot
// site-ul la prima încărcare, dacă activam steagul fără asta.
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
const linkGetTransferAffiliate = "https://gettransfer.tpk.lu/XPrEGhpT";
const linkOmioAffiliate = "";
function getTransferLinkFor() {
  return linkGetTransferAffiliate || "https://getransfer.com/";
}
function omioLinkFor() {
  return linkOmioAffiliate || "https://www.omio.com/";
}
const linkParkviaAffiliate = "";
function parkviaLinkFor(place) {
  return linkParkviaAffiliate || `https://www.parkvia.com/search?q=${encodeURIComponent(place)}`;
}
const linkTheForkAffiliate = "";
const linkOpenTableAffiliate = "";

function comingSoonTextFor(lang) {
  return exports.COMING_SOON_TEXTS[lang] || exports.COMING_SOON_TEXTS.uk;
}

exports.COMING_SOON_TEXTS = {
  ro: "🔜 Ghiduri de transport, parcare și restaurante — urmează în curând.",
  uk: "🔜 Transport, parking, and restaurant guides — coming soon.",
  de: "🔜 Reiseführer für Transport, Parken und Restaurants — demnächst verfügbar.",
  es: "🔜 Guías de transporte, aparcamiento y restaurantes — próximamente.",
  fr: "🔜 Guides de transport, stationnement et restaurants — bientôt disponibles.",
  it: "🔜 Guide su trasporti, parcheggi e ristoranti — in arrivo.",
  pl: "🔜 Przewodniki po transporcie, parkingach i restauracjach — wkrótce.",
  nl: "🔜 Gidsen voor vervoer, parkeren en restaurants — binnenkort beschikbaar.",
  da: "🔜 Guider til transport, parkering og restauranter — kommer snart.",
  se: "🔜 Guider för transport, parkering och restauranger — kommer snart.",
  pt: "🔜 Guias de transporte, estacionamento e restaurantes — brevemente.",
  cz: "🔜 Průvodce dopravou, parkováním a restauracemi — již brzy.",
  fi: "🔜 Oppaat liikenteeseen, pysäköintiin ja ravintoloihin — tulossa pian.",
  gr: "🔜 Οδηγοί μεταφοράς, στάθμευσης και εστιατορίων — σύντομα διαθέσιμοι.",
  hu: "🔜 Útmutatók közlekedéshez, parkoláshoz és éttermekhez — hamarosan.",
  hr: "🔜 Vodiči za prijevoz, parkiranje i restorane — uskoro.",
  sk: "🔜 Sprievodcovia dopravou, parkovaním a reštauráciami — už čoskoro.",
  si: "🔜 Vodniki za prevoz, parkiranje in restavracije — kmalu na voljo.",
  lt: "🔜 Transporto, parkavimo ir restoranų gidai — netrukus.",
  lv: "🔜 Ceļveži par transportu, stāvvietām un restorāniem — drīzumā.",
  ee: "🔜 Transpordi-, parkimis- ja restoranijuhised — peagi saadaval.",
}

exports.ITINERARY_LABELS = {
  ro: { title: "Creează un itinerar turistic", description: "Generează automat un itinerar turistic pe zile, pentru orice oraș din România, din cele 500 de obiective verificate.", breadcrumbCurrent: "Creează itinerar", h1: "🗺️ Creează-ți itinerarul", intro: "Spune-ne orașul sau județul și câte zile ai la dispoziție — construim un traseu logic, din obiectivele turistice verificate pe care le avem deja.", placeholder: "Oraș sau județ (ex: Brașov, Sibiu, Maramureș)", daysLabel: "Număr de zile:", submitBtn: "Generează itinerarul", loadingMessages: ["Se calculează traseul...", "Verificăm obiectivele din zonă...", "Aranjăm zilele logic...", "Aproape gata..."], errorUnexpected: "Răspuns neașteptat. Încearcă din nou.", errorNetwork: "A apărut o eroare de rețea. Încearcă din nou.", errorGeneric: "Nu am putut genera itinerarul. Încearcă din nou.", resetBtn: "🗑️ Șterge și creează un itinerar nou", footer: "itinerarii generate automat, din obiectivele turistice verificate deja de noi. Verifică mereu programul live al fiecărui loc înainte de vizită.", dayPrefix: "Ziua", morning: "🌅 Dimineața", lunch: "🍽️ Prânz", evening: "🌙 Seara", googleMapsLabel: "🗺️ Deschide traseul în Google Maps", icalLabel: "📅 Adaugă în calendar (.ics)", warningClosedThatDay: "⚠️ S-ar putea să fie deja închis în acest interval", warningMayCloseBefore: "⚠️ Se închide de obicei la {time} — s-ar putea să nu mai apuci", rainPlanNote: "🌧️ Se prognozează ploaie mâine — am preferat obiective de interior pentru Ziua 1.", aiLangName: "română" },
  uk: { title: "Create a travel itinerary", description: "Automatically generate a day-by-day travel itinerary for any city in Romania, from our 500 verified attractions.", breadcrumbCurrent: "Create itinerary", h1: "🗺️ Create your itinerary", intro: "Tell us the city or county and how many days you have — we'll build a logical route, from the tourist attractions we've already verified.", placeholder: "City or county (e.g. Brașov, Sibiu, Maramureș)", daysLabel: "Number of days:", submitBtn: "Generate itinerary", loadingMessages: ["Calculating the route...", "Checking nearby attractions...", "Organizing the days...", "Almost done..."], errorUnexpected: "Unexpected response. Please try again.", errorNetwork: "A network error occurred. Please try again.", errorGeneric: "We couldn't generate the itinerary. Please try again.", resetBtn: "🗑️ Clear and create a new itinerary", footer: "automatically generated itineraries, from tourist attractions we've already verified. Always check the live hours of each place before visiting.", dayPrefix: "Day", morning: "🌅 Morning", lunch: "🍽️ Lunch", evening: "🌙 Evening", googleMapsLabel: "🗺️ Open route in Google Maps", icalLabel: "📅 Add to calendar (.ics)", warningClosedThatDay: "⚠️ It might already be closed during this time slot", warningMayCloseBefore: "⚠️ Usually closes at {time} — you might not make it", rainPlanNote: "🌧️ Rain is forecast tomorrow — we favored indoor attractions for Day 1.", aiLangName: "English" },
  de: { title: "Reiseroute erstellen", description: "Erstelle automatisch eine tägliche Reiseroute für jede Stadt in Rumänien, aus unseren 500 geprüften Sehenswürdigkeiten.", breadcrumbCurrent: "Reiseroute erstellen", h1: "🗺️ Erstelle deine Reiseroute", intro: "Sag uns die Stadt oder den Landkreis und wie viele Tage du hast — wir erstellen eine logische Route, aus den bereits geprüften Sehenswürdigkeiten.", placeholder: "Stadt oder Landkreis (z.B. Brașov, Sibiu, Maramureș)", daysLabel: "Anzahl der Tage:", submitBtn: "Reiseroute erstellen", loadingMessages: ["Route wird berechnet...", "Sehenswürdigkeiten werden geprüft...", "Tage werden organisiert...", "Fast fertig..."], errorUnexpected: "Unerwartete Antwort. Bitte versuche es erneut.", errorNetwork: "Ein Netzwerkfehler ist aufgetreten. Bitte versuche es erneut.", errorGeneric: "Die Reiseroute konnte nicht erstellt werden. Bitte versuche es erneut.", resetBtn: "🗑️ Löschen und neue Reiseroute erstellen", footer: "automatisch erstellte Reiserouten, aus bereits geprüften Sehenswürdigkeiten. Prüfe immer die aktuellen Öffnungszeiten vor deinem Besuch.", dayPrefix: "Tag", morning: "🌅 Morgen", lunch: "🍽️ Mittag", evening: "🌙 Abend", googleMapsLabel: "🗺️ Route in Google Maps öffnen", icalLabel: "📅 Zum Kalender hinzufügen (.ics)", warningClosedThatDay: "⚠️ Könnte in diesem Zeitraum bereits geschlossen sein", warningMayCloseBefore: "⚠️ Schließt normalerweise um {time} — du kommst vielleicht nicht mehr rein", rainPlanNote: "🌧️ Für morgen ist Regen vorhergesagt — für Tag 1 haben wir Innenräume bevorzugt.", aiLangName: "Deutsch" },
  es: { title: "Crea un itinerario turístico", description: "Genera automáticamente un itinerario turístico diario para cualquier ciudad de Rumanía, a partir de nuestras 500 atracciones verificadas.", breadcrumbCurrent: "Crear itinerario", h1: "🗺️ Crea tu itinerario", intro: "Dinos la ciudad o el condado y cuántos días tienes — construiremos una ruta lógica, a partir de las atracciones turísticas ya verificadas.", placeholder: "Ciudad o condado (ej: Brașov, Sibiu, Maramureș)", daysLabel: "Número de días:", submitBtn: "Generar itinerario", loadingMessages: ["Calculando la ruta...", "Comprobando atracciones cercanas...", "Organizando los días...", "Casi listo..."], errorUnexpected: "Respuesta inesperada. Inténtalo de nuevo.", errorNetwork: "Se produjo un error de red. Inténtalo de nuevo.", errorGeneric: "No pudimos generar el itinerario. Inténtalo de nuevo.", resetBtn: "🗑️ Borrar y crear un nuevo itinerario", footer: "itinerarios generados automáticamente, a partir de atracciones turísticas ya verificadas. Comprueba siempre el horario en vivo de cada lugar antes de visitarlo.", dayPrefix: "Día", morning: "🌅 Mañana", lunch: "🍽️ Mediodía", evening: "🌙 Noche", googleMapsLabel: "🗺️ Abrir ruta en Google Maps", icalLabel: "📅 Añadir al calendario (.ics)", warningClosedThatDay: "⚠️ Podría estar ya cerrado en este horario", warningMayCloseBefore: "⚠️ Suele cerrar a las {time} — puede que no llegues a tiempo", rainPlanNote: "🌧️ Se prevé lluvia mañana — priorizamos lugares interiores para el Día 1.", aiLangName: "español" },
  fr: { title: "Créez un itinéraire touristique", description: "Générez automatiquement un itinéraire touristique jour par jour pour n'importe quelle ville de Roumanie, à partir de nos 500 attractions vérifiées.", breadcrumbCurrent: "Créer un itinéraire", h1: "🗺️ Créez votre itinéraire", intro: "Indiquez-nous la ville ou le comté et le nombre de jours dont vous disposez — nous construirons un itinéraire logique, à partir des attractions déjà vérifiées.", placeholder: "Ville ou comté (ex: Brașov, Sibiu, Maramureș)", daysLabel: "Nombre de jours :", submitBtn: "Générer l'itinéraire", loadingMessages: ["Calcul de l'itinéraire...", "Vérification des attractions à proximité...", "Organisation des jours...", "Presque terminé..."], errorUnexpected: "Réponse inattendue. Veuillez réessayer.", errorNetwork: "Une erreur réseau s'est produite. Veuillez réessayer.", errorGeneric: "Nous n'avons pas pu générer l'itinéraire. Veuillez réessayer.", resetBtn: "🗑️ Effacer et créer un nouvel itinéraire", footer: "itinéraires générés automatiquement, à partir d'attractions touristiques déjà vérifiées. Vérifiez toujours les horaires en direct de chaque lieu avant votre visite.", dayPrefix: "Jour", morning: "🌅 Matin", lunch: "🍽️ Midi", evening: "🌙 Soir", googleMapsLabel: "🗺️ Ouvrir l'itinéraire dans Google Maps", icalLabel: "📅 Ajouter au calendrier (.ics)", warningClosedThatDay: "⚠️ Pourrait déjà être fermé à ce moment-là", warningMayCloseBefore: "⚠️ Ferme généralement à {time} — vous pourriez ne pas arriver à temps", rainPlanNote: "🌧️ De la pluie est prévue demain — nous avons privilégié des lieux intérieurs pour le Jour 1.", aiLangName: "français" },
  it: { title: "Crea un itinerario turistico", description: "Genera automaticamente un itinerario turistico giorno per giorno per qualsiasi città della Romania, dalle nostre 500 attrazioni verificate.", breadcrumbCurrent: "Crea itinerario", h1: "🗺️ Crea il tuo itinerario", intro: "Dicci la città o la contea e quanti giorni hai a disposizione — costruiremo un percorso logico, dalle attrazioni turistiche già verificate.", placeholder: "Città o contea (es: Brașov, Sibiu, Maramureș)", daysLabel: "Numero di giorni:", submitBtn: "Genera itinerario", loadingMessages: ["Calcolo del percorso...", "Verifica delle attrazioni vicine...", "Organizzazione dei giorni...", "Quasi fatto..."], errorUnexpected: "Risposta inaspettata. Riprova.", errorNetwork: "Si è verificato un errore di rete. Riprova.", errorGeneric: "Non siamo riusciti a generare l'itinerario. Riprova.", resetBtn: "🗑️ Cancella e crea un nuovo itinerario", footer: "itinerari generati automaticamente, dalle attrazioni turistiche già verificate. Controlla sempre l'orario in tempo reale di ogni luogo prima di visitarlo.", dayPrefix: "Giorno", morning: "🌅 Mattina", lunch: "🍽️ Pranzo", evening: "🌙 Sera", googleMapsLabel: "🗺️ Apri il percorso in Google Maps", icalLabel: "📅 Aggiungi al calendario (.ics)", warningClosedThatDay: "⚠️ Potrebbe essere già chiuso in questo orario", warningMayCloseBefore: "⚠️ Di solito chiude alle {time} — potresti non fare in tempo", rainPlanNote: "🌧️ È prevista pioggia domani — abbiamo preferito luoghi al chiuso per il Giorno 1.", aiLangName: "italiano" },
  pl: { title: "Stwórz plan podróży", description: "Automatycznie generuj plan podróży dzień po dniu dla dowolnego miasta w Rumunii, z naszych 500 zweryfikowanych atrakcji.", breadcrumbCurrent: "Stwórz plan podróży", h1: "🗺️ Stwórz swój plan podróży", intro: "Powiedz nam miasto lub powiat i ile masz dni — zbudujemy logiczną trasę, z już zweryfikowanych atrakcji turystycznych.", placeholder: "Miasto lub powiat (np. Brașov, Sibiu, Maramureș)", daysLabel: "Liczba dni:", submitBtn: "Generuj plan podróży", loadingMessages: ["Obliczanie trasy...", "Sprawdzanie pobliskich atrakcji...", "Organizowanie dni...", "Prawie gotowe..."], errorUnexpected: "Nieoczekiwana odpowiedź. Spróbuj ponownie.", errorNetwork: "Wystąpił błąd sieci. Spróbuj ponownie.", errorGeneric: "Nie udało się wygenerować planu podróży. Spróbuj ponownie.", resetBtn: "🗑️ Wyczyść i stwórz nowy plan podróży", footer: "automatycznie generowane plany podróży, z już zweryfikowanych atrakcji turystycznych. Zawsze sprawdzaj aktualne godziny otwarcia każdego miejsca przed odwiedzinami.", dayPrefix: "Dzień", morning: "🌅 Rano", lunch: "🍽️ Południe", evening: "🌙 Wieczór", googleMapsLabel: "🗺️ Otwórz trasę w Google Maps", icalLabel: "📅 Dodaj do kalendarza (.ics)", warningClosedThatDay: "⚠️ Może być już zamknięte w tym przedziale", warningMayCloseBefore: "⚠️ Zwykle zamyka się o {time} — możesz się nie zdążyć", rainPlanNote: "🌧️ Jutro prognozowany jest deszcz — na Dzień 1 wybraliśmy atrakcje pod dachem.", aiLangName: "polski" },
  nl: { title: "Maak een reisroute", description: "Genereer automatisch een dagelijkse reisroute voor elke stad in Roemenië, uit onze 500 geverifieerde bezienswaardigheden.", breadcrumbCurrent: "Reisroute maken", h1: "🗺️ Maak je reisroute", intro: "Vertel ons de stad of het district en hoeveel dagen je hebt — we bouwen een logische route, uit de al geverifieerde bezienswaardigheden.", placeholder: "Stad of district (bijv. Brașov, Sibiu, Maramureș)", daysLabel: "Aantal dagen:", submitBtn: "Reisroute genereren", loadingMessages: ["Route wordt berekend...", "Bezienswaardigheden in de buurt controleren...", "Dagen organiseren...", "Bijna klaar..."], errorUnexpected: "Onverwacht antwoord. Probeer het opnieuw.", errorNetwork: "Er is een netwerkfout opgetreden. Probeer het opnieuw.", errorGeneric: "We konden de reisroute niet genereren. Probeer het opnieuw.", resetBtn: "🗑️ Wissen en nieuwe reisroute maken", footer: "automatisch gegenereerde reisroutes, uit al geverifieerde bezienswaardigheden. Controleer altijd de actuele openingstijden van elke plek voor je bezoek.", dayPrefix: "Dag", morning: "🌅 Ochtend", lunch: "🍽️ Middag", evening: "🌙 Avond", googleMapsLabel: "🗺️ Route openen in Google Maps", icalLabel: "📅 Toevoegen aan agenda (.ics)", warningClosedThatDay: "⚠️ Kan op dit tijdstip al gesloten zijn", warningMayCloseBefore: "⚠️ Sluit meestal om {time} — je haalt het misschien niet", rainPlanNote: "🌧️ Morgen wordt regen verwacht — voor Dag 1 kozen we voor binnenlocaties.", aiLangName: "Nederlands" },
  da: { title: "Opret en rejseplan", description: "Generer automatisk en daglig rejseplan for enhver by i Rumænien, fra vores 500 verificerede seværdigheder.", breadcrumbCurrent: "Opret rejseplan", h1: "🗺️ Opret din rejseplan", intro: "Fortæl os byen eller amtet og hvor mange dage du har — vi bygger en logisk rute, fra de allerede verificerede seværdigheder.", placeholder: "By eller amt (f.eks. Brașov, Sibiu, Maramureș)", daysLabel: "Antal dage:", submitBtn: "Generer rejseplan", loadingMessages: ["Beregner ruten...", "Tjekker seværdigheder i nærheden...", "Organiserer dagene...", "Næsten færdig..."], errorUnexpected: "Uventet svar. Prøv igen.", errorNetwork: "Der opstod en netværksfejl. Prøv igen.", errorGeneric: "Vi kunne ikke generere rejseplanen. Prøv igen.", resetBtn: "🗑️ Ryd og opret ny rejseplan", footer: "automatisk genererede rejseplaner, fra allerede verificerede seværdigheder. Tjek altid de aktuelle åbningstider for hvert sted før besøget.", dayPrefix: "Dag", morning: "🌅 Morgen", lunch: "🍽️ Middag", evening: "🌙 Aften", googleMapsLabel: "🗺️ Åbn ruten i Google Maps", icalLabel: "📅 Føj til kalender (.ics)", warningClosedThatDay: "⚠️ Kan allerede være lukket på dette tidspunkt", warningMayCloseBefore: "⚠️ Lukker normalt kl. {time} — du når det måske ikke", rainPlanNote: "🌧️ Der er regn i vente i morgen — vi valgte indendørs steder til Dag 1.", aiLangName: "dansk" },
  se: { title: "Skapa en reseplan", description: "Generera automatiskt en daglig reseplan för valfri stad i Rumänien, från våra 500 verifierade sevärdheter.", breadcrumbCurrent: "Skapa reseplan", h1: "🗺️ Skapa din reseplan", intro: "Berätta för oss staden eller länet och hur många dagar du har — vi bygger en logisk rutt, från de redan verifierade sevärdheterna.", placeholder: "Stad eller län (t.ex. Brașov, Sibiu, Maramureș)", daysLabel: "Antal dagar:", submitBtn: "Generera reseplan", loadingMessages: ["Beräknar rutten...", "Kontrollerar sevärdheter i närheten...", "Organiserar dagarna...", "Nästan klart..."], errorUnexpected: "Oväntat svar. Försök igen.", errorNetwork: "Ett nätverksfel uppstod. Försök igen.", errorGeneric: "Vi kunde inte generera reseplanen. Försök igen.", resetBtn: "🗑️ Rensa och skapa ny reseplan", footer: "automatiskt genererade reseplaner, från redan verifierade sevärdheter. Kontrollera alltid de aktuella öppettiderna för varje plats före besöket.", dayPrefix: "Dag", morning: "🌅 Morgon", lunch: "🍽️ Lunch", evening: "🌙 Kväll", googleMapsLabel: "🗺️ Öppna rutten i Google Maps", icalLabel: "📅 Lägg till i kalendern (.ics)", warningClosedThatDay: "⚠️ Kan redan vara stängt vid den här tiden", warningMayCloseBefore: "⚠️ Stänger vanligtvis kl. {time} — du kanske inte hinner", rainPlanNote: "🌧️ Regn väntas i morgon — vi valde inomhusattraktioner för Dag 1.", aiLangName: "svenska" },
  pt: { title: "Crie um itinerário turístico", description: "Gere automaticamente um itinerário turístico diário para qualquer cidade da Roménia, a partir das nossas 500 atrações verificadas.", breadcrumbCurrent: "Criar itinerário", h1: "🗺️ Crie o seu itinerário", intro: "Diga-nos a cidade ou o condado e quantos dias tem — vamos construir uma rota lógica, a partir das atrações turísticas já verificadas.", placeholder: "Cidade ou condado (ex: Brașov, Sibiu, Maramureș)", daysLabel: "Número de dias:", submitBtn: "Gerar itinerário", loadingMessages: ["A calcular a rota...", "A verificar atrações próximas...", "A organizar os dias...", "Quase pronto..."], errorUnexpected: "Resposta inesperada. Tente novamente.", errorNetwork: "Ocorreu um erro de rede. Tente novamente.", errorGeneric: "Não conseguimos gerar o itinerário. Tente novamente.", resetBtn: "🗑️ Limpar e criar novo itinerário", footer: "itinerários gerados automaticamente, a partir de atrações turísticas já verificadas. Verifique sempre o horário em tempo real de cada local antes de visitar.", dayPrefix: "Dia", morning: "🌅 Manhã", lunch: "🍽️ Almoço", evening: "🌙 Noite", googleMapsLabel: "🗺️ Abrir rota no Google Maps", icalLabel: "📅 Adicionar ao calendário (.ics)", warningClosedThatDay: "⚠️ Pode já estar fechado neste horário", warningMayCloseBefore: "⚠️ Costuma fechar às {time} — pode não chegar a tempo", rainPlanNote: "🌧️ Prevê-se chuva amanhã — demos preferência a locais interiores no Dia 1.", aiLangName: "português" },
  cz: { title: "Vytvořte cestovní itinerář", description: "Automaticky vygenerujte denní cestovní itinerář pro jakékoli město v Rumunsku, z našich 500 ověřených atrakcí.", breadcrumbCurrent: "Vytvořit itinerář", h1: "🗺️ Vytvořte si itinerář", intro: "Řekněte nám město nebo okres a kolik dní máte — sestavíme logickou trasu, z již ověřených turistických atrakcí.", placeholder: "Město nebo okres (např. Brašov, Sibiu, Maramureš)", daysLabel: "Počet dní:", submitBtn: "Vygenerovat itinerář", loadingMessages: ["Počítání trasy...", "Kontrola blízkých atrakcí...", "Organizování dní...", "Skoro hotovo..."], errorUnexpected: "Neočekávaná odpověď. Zkuste to znovu.", errorNetwork: "Došlo k síťové chybě. Zkuste to znovu.", errorGeneric: "Nepodařilo se nám vygenerovat itinerář. Zkuste to znovu.", resetBtn: "🗑️ Vymazat a vytvořit nový itinerář", footer: "automaticky generované itineráře, z již ověřených turistických atrakcí. Před návštěvou vždy zkontrolujte aktuální otevírací dobu daného místa.", dayPrefix: "Den", morning: "🌅 Ráno", lunch: "🍽️ Poledne", evening: "🌙 Večer", googleMapsLabel: "🗺️ Otevřít trasu v Google Maps", icalLabel: "📅 Přidat do kalendáře (.ics)", warningClosedThatDay: "⚠️ V tomto čase může být již zavřeno", warningMayCloseBefore: "⚠️ Obvykle zavírá v {time} — nemusíte to stihnout", rainPlanNote: "🌧️ Zítra se předpovídá déšť — pro Den 1 jsme upřednostnili vnitřní prostory.", aiLangName: "čeština" },
  fi: { title: "Luo matkareitti", description: "Luo automaattisesti päiväkohtainen matkareitti mihin tahansa Romanian kaupunkiin, 500 tarkistetusta nähtävyydestämme.", breadcrumbCurrent: "Luo matkareitti", h1: "🗺️ Luo matkareittisi", intro: "Kerro meille kaupunki tai maakunta ja kuinka monta päivää sinulla on — rakennamme loogisen reitin jo tarkistetuista nähtävyyksistä.", placeholder: "Kaupunki tai maakunta (esim. Brašov, Sibiu, Maramureș)", daysLabel: "Päivien määrä:", submitBtn: "Luo matkareitti", loadingMessages: ["Lasketaan reittiä...", "Tarkistetaan lähellä olevia nähtävyyksiä...", "Järjestetään päiviä...", "Melkein valmis..."], errorUnexpected: "Odottamaton vastaus. Yritä uudelleen.", errorNetwork: "Tapahtui verkkovirhe. Yritä uudelleen.", errorGeneric: "Emme voineet luoda matkareittiä. Yritä uudelleen.", resetBtn: "🗑️ Tyhjennä ja luo uusi matkareitti", footer: "automaattisesti luotuja matkareittejä, jo tarkistetuista nähtävyyksistä. Tarkista aina kunkin paikan reaaliaikaiset aukioloajat ennen vierailua.", dayPrefix: "Päivä", morning: "🌅 Aamu", lunch: "🍽️ Lounas", evening: "🌙 Ilta", googleMapsLabel: "🗺️ Avaa reitti Google Mapsissa", icalLabel: "📅 Lisää kalenteriin (.ics)", warningClosedThatDay: "⚠️ Saattaa olla jo kiinni tähän aikaan", warningMayCloseBefore: "⚠️ Sulkeutuu yleensä klo {time} — et ehkä ehdi", rainPlanNote: "🌧️ Huomenna on luvassa sadetta — suosimme sisätiloja Päivälle 1.", aiLangName: "suomi" },
  gr: { title: "Δημιουργήστε ένα ταξιδιωτικό δρομολόγιο", description: "Δημιουργήστε αυτόματα ένα ημερήσιο ταξιδιωτικό δρομολόγιο για οποιαδήποτε πόλη στη Ρουμανία, από τα 500 επαληθευμένα αξιοθέατά μας.", breadcrumbCurrent: "Δημιουργία δρομολογίου", h1: "🗺️ Δημιουργήστε το δρομολόγιό σας", intro: "Πείτε μας την πόλη ή την περιφέρεια και πόσες μέρες έχετε — θα φτιάξουμε μια λογική διαδρομή, από τα ήδη επαληθευμένα αξιοθέατα.", placeholder: "Πόλη ή περιφέρεια (π.χ. Μπρασόβ, Σίμπιου, Μαραμούρες)", daysLabel: "Αριθμός ημερών:", submitBtn: "Δημιουργία δρομολογίου", loadingMessages: ["Υπολογισμός διαδρομής...", "Έλεγχος κοντινών αξιοθέατων...", "Οργάνωση ημερών...", "Σχεδόν έτοιμο..."], errorUnexpected: "Μη αναμενόμενη απόκριση. Δοκιμάστε ξανά.", errorNetwork: "Παρουσιάστηκε σφάλμα δικτύου. Δοκιμάστε ξανά.", errorGeneric: "Δεν μπορέσαμε να δημιουργήσουμε το δρομολόγιο. Δοκιμάστε ξανά.", resetBtn: "🗑️ Καθαρισμός και δημιουργία νέου δρομολογίου", footer: "αυτόματα δημιουργημένα δρομολόγια, από ήδη επαληθευμένα αξιοθέατα. Ελέγχετε πάντα το ζωντανό ωράριο κάθε τοποθεσίας πριν την επίσκεψη.", dayPrefix: "Ημέρα", morning: "🌅 Πρωί", lunch: "🍽️ Μεσημέρι", evening: "🌙 Βράδυ", googleMapsLabel: "🗺️ Άνοιγμα διαδρομής στο Google Maps", icalLabel: "📅 Προσθήκη στο ημερολόγιο (.ics)", warningClosedThatDay: "⚠️ Ενδέχεται να έχει ήδη κλείσει σε αυτό το διάστημα", warningMayCloseBefore: "⚠️ Κλείνει συνήθως στις {time} — μπορεί να μην προλάβετε", rainPlanNote: "🌧️ Προβλέπεται βροχή αύριο — προτιμήσαμε εσωτερικούς χώρους για την Ημέρα 1.", aiLangName: "ελληνικά" },
  hu: { title: "Készítsen útitervet", description: "Automatikusan készítsen napi útitervet Románia bármely városához, az 500 ellenőrzött látványosságunkból.", breadcrumbCurrent: "Útiterv készítése", h1: "🗺️ Készítsd el az útitervedet", intro: "Mondd el nekünk a várost vagy megyét és hány napod van — logikus útvonalat építünk, a már ellenőrzött látványosságokból.", placeholder: "Város vagy megye (pl. Brassó, Nagyszeben, Máramaros)", daysLabel: "Napok száma:", submitBtn: "Útiterv készítése", loadingMessages: ["Útvonal kiszámítása...", "Közeli látványosságok ellenőrzése...", "Napok rendszerezése...", "Mindjárt kész..."], errorUnexpected: "Váratlan válasz. Próbáld újra.", errorNetwork: "Hálózati hiba történt. Próbáld újra.", errorGeneric: "Nem sikerült elkészíteni az útitervet. Próbáld újra.", resetBtn: "🗑️ Törlés és új útiterv készítése", footer: "automatikusan generált útitervek, már ellenőrzött látványosságokból. Mindig ellenőrizd az adott hely aktuális nyitvatartását látogatás előtt.", dayPrefix: "Nap", morning: "🌅 Reggel", lunch: "🍽️ Dél", evening: "🌙 Este", googleMapsLabel: "🗺️ Útvonal megnyitása Google Mapsben", icalLabel: "📅 Hozzáadás a naptárhoz (.ics)", warningClosedThatDay: "⚠️ Ekkorra már zárva lehet", warningMayCloseBefore: "⚠️ Általában {time}-kor zár — lehet, hogy nem érsz oda időben", rainPlanNote: "🌧️ Holnapra esőt jósolnak — az 1. napra beltéri helyszíneket részesítettünk előnyben.", aiLangName: "magyar" },
  hr: { title: "Izradite turistički itinerar", description: "Automatski generirajte dnevni turistički itinerar za bilo koji grad u Rumunjskoj, iz naših 500 provjerenih atrakcija.", breadcrumbCurrent: "Izradi itinerar", h1: "🗺️ Izradite svoj itinerar", intro: "Recite nam grad ili županiju i koliko dana imate — izgradit ćemo logičnu rutu, iz već provjerenih turističkih atrakcija.", placeholder: "Grad ili županija (npr. Brašov, Sibiu, Maramureš)", daysLabel: "Broj dana:", submitBtn: "Generiraj itinerar", loadingMessages: ["Izračunavanje rute...", "Provjera obližnjih atrakcija...", "Organiziranje dana...", "Skoro gotovo..."], errorUnexpected: "Neočekivan odgovor. Pokušajte ponovno.", errorNetwork: "Došlo je do mrežne pogreške. Pokušajte ponovno.", errorGeneric: "Nismo uspjeli generirati itinerar. Pokušajte ponovno.", resetBtn: "🗑️ Obriši i izradi novi itinerar", footer: "automatski generirani itinerari, iz već provjerenih turističkih atrakcija. Uvijek provjerite trenutno radno vrijeme svakog mjesta prije posjeta.", dayPrefix: "Dan", morning: "🌅 Jutro", lunch: "🍽️ Podne", evening: "🌙 Večer", googleMapsLabel: "🗺️ Otvori rutu u Google Mapsu", icalLabel: "📅 Dodaj u kalendar (.ics)", warningClosedThatDay: "⚠️ Moglo bi već biti zatvoreno u ovom terminu", warningMayCloseBefore: "⚠️ Obično zatvara u {time} — možda nećete stići", rainPlanNote: "🌧️ Za sutra se prognozira kiša — za 1. dan smo dali prednost unutarnjim atrakcijama.", aiLangName: "hrvatski" },
  sk: { title: "Vytvorte cestovný itinerár", description: "Automaticky vygenerujte denný cestovný itinerár pre akékoľvek mesto v Rumunsku, z našich 500 overených atrakcií.", breadcrumbCurrent: "Vytvoriť itinerár", h1: "🗺️ Vytvorte si itinerár", intro: "Povedzte nám mesto alebo okres a koľko dní máte — zostavíme logickú trasu, z už overených turistických atrakcií.", placeholder: "Mesto alebo okres (napr. Brašov, Sibiu, Maramureš)", daysLabel: "Počet dní:", submitBtn: "Vygenerovať itinerár", loadingMessages: ["Počítanie trasy...", "Kontrola blízkych atrakcií...", "Organizovanie dní...", "Takmer hotovo..."], errorUnexpected: "Neočakávaná odpoveď. Skúste to znova.", errorNetwork: "Došlo k sieťovej chybe. Skúste to znova.", errorGeneric: "Nepodarilo sa nám vygenerovať itinerár. Skúste to znova.", resetBtn: "🗑️ Vymazať a vytvoriť nový itinerár", footer: "automaticky generované itineráre, z už overených turistických atrakcií. Pred návštevou vždy skontrolujte aktuálne otváracie hodiny daného miesta.", dayPrefix: "Deň", morning: "🌅 Ráno", lunch: "🍽️ Obed", evening: "🌙 Večer", googleMapsLabel: "🗺️ Otvoriť trasu v Google Maps", icalLabel: "📅 Pridať do kalendára (.ics)", warningClosedThatDay: "⚠️ V tomto čase môže byť už zatvorené", warningMayCloseBefore: "⚠️ Zvyčajne zatvára o {time} — nemusíte to stihnúť", rainPlanNote: "🌧️ Na zajtra sa predpovedá dážď — pre 1. deň sme uprednostnili vnútorné priestory.", aiLangName: "slovenčina" },
  si: { title: "Ustvarite turistični itinerar", description: "Samodejno ustvarite dnevni turistični itinerar za katero koli mesto v Romuniji, iz naših 500 preverjenih znamenitosti.", breadcrumbCurrent: "Ustvari itinerar", h1: "🗺️ Ustvarite svoj itinerar", intro: "Povejte nam mesto ali županijo in koliko dni imate — zgradili bomo logično pot, iz že preverjenih turističnih znamenitosti.", placeholder: "Mesto ali županija (npr. Brašov, Sibiu, Maramureš)", daysLabel: "Število dni:", submitBtn: "Ustvari itinerar", loadingMessages: ["Izračunavanje poti...", "Preverjanje bližnjih znamenitosti...", "Organiziranje dni...", "Skoraj končano..."], errorUnexpected: "Nepričakovan odgovor. Poskusite znova.", errorNetwork: "Prišlo je do napake omrežja. Poskusite znova.", errorGeneric: "Itinerarja nismo mogli ustvariti. Poskusite znova.", resetBtn: "🗑️ Počisti in ustvari nov itinerar", footer: "samodejno ustvarjeni itinerarji, iz že preverjenih turističnih znamenitosti. Pred obiskom vedno preverite trenutni delovni čas posameznega mesta.", dayPrefix: "Dan", morning: "🌅 Jutro", lunch: "🍽️ Opoldne", evening: "🌙 Večer", googleMapsLabel: "🗺️ Odpri pot v Google Maps", icalLabel: "📅 Dodaj v koledar (.ics)", warningClosedThatDay: "⚠️ V tem času je morda že zaprto", warningMayCloseBefore: "⚠️ Običajno zapre ob {time} — morda ne boste uspeli", rainPlanNote: "🌧️ Za jutri je napovedan dež — za 1. dan smo dali prednost notranjim znamenitostim.", aiLangName: "slovenščina" },
  lt: { title: "Sukurkite kelionės maršrutą", description: "Automatiškai sukurkite dienos kelionės maršrutą bet kuriam Rumunijos miestui, iš mūsų 500 patikrintų lankytinų vietų.", breadcrumbCurrent: "Sukurti maršrutą", h1: "🗺️ Sukurkite savo maršrutą", intro: "Pasakykite mums miestą ar apskritį ir kiek dienų turite — sukursime logišką maršrutą, iš jau patikrintų lankytinų vietų.", placeholder: "Miestas ar apskritis (pvz., Brašovas, Sibiu, Maramuriešas)", daysLabel: "Dienų skaičius:", submitBtn: "Sukurti maršrutą", loadingMessages: ["Skaičiuojamas maršrutas...", "Tikrinamos netoliese esančios lankytinos vietos...", "Organizuojamos dienos...", "Beveik baigta..."], errorUnexpected: "Netikėtas atsakymas. Bandykite dar kartą.", errorNetwork: "Įvyko tinklo klaida. Bandykite dar kartą.", errorGeneric: "Nepavyko sukurti maršruto. Bandykite dar kartą.", resetBtn: "🗑️ Išvalyti ir sukurti naują maršrutą", footer: "automatiškai sukurti maršrutai, iš jau patikrintų lankytinų vietų. Prieš apsilankymą visada patikrinkite kiekvienos vietos gyvą darbo laiką.", dayPrefix: "Diena", morning: "🌅 Rytas", lunch: "🍽️ Pietūs", evening: "🌙 Vakaras", googleMapsLabel: "🗺️ Atidaryti maršrutą Google Maps", icalLabel: "📅 Pridėti į kalendorių (.ics)", warningClosedThatDay: "⚠️ Šiuo metu gali būti jau uždaryta", warningMayCloseBefore: "⚠️ Paprastai uždaroma {time} — galbūt nespėsite", rainPlanNote: "🌧️ Rytoj prognozuojamas lietus — 1-ajai dienai teikėme pirmenybę vidaus lankytinoms vietoms.", aiLangName: "lietuvių" },
  lv: { title: "Izveidojiet ceļojuma maršrutu", description: "Automātiski izveidojiet ikdienas ceļojuma maršrutu jebkurai Rumānijas pilsētai, no mūsu 500 pārbaudītajām apskates vietām.", breadcrumbCurrent: "Izveidot maršrutu", h1: "🗺️ Izveidojiet savu maršrutu", intro: "Pasakiet mums pilsētu vai novadu un cik dienu jums ir — mēs izveidosim loģisku maršrutu no jau pārbaudītajām apskates vietām.", placeholder: "Pilsēta vai novads (piem., Brašova, Sibiu, Maramuresa)", daysLabel: "Dienu skaits:", submitBtn: "Izveidot maršrutu", loadingMessages: ["Aprēķina maršrutu...", "Pārbauda tuvējās apskates vietas...", "Organizē dienas...", "Gandrīz gatavs..."], errorUnexpected: "Negaidīta atbilde. Mēģiniet vēlreiz.", errorNetwork: "Radās tīkla kļūda. Mēģiniet vēlreiz.", errorGeneric: "Mēs nevarējām izveidot maršrutu. Mēģiniet vēlreiz.", resetBtn: "🗑️ Notīrīt un izveidot jaunu maršrutu", footer: "automātiski izveidoti maršruti, no jau pārbaudītajām apskates vietām. Pirms apmeklējuma vienmēr pārbaudiet katras vietas aktuālo darba laiku.", dayPrefix: "Diena", morning: "🌅 Rīts", lunch: "🍽️ Pusdienas", evening: "🌙 Vakars", googleMapsLabel: "🗺️ Atvērt maršrutu Google Maps", icalLabel: "📅 Pievienot kalendāram (.ics)", warningClosedThatDay: "⚠️ Šajā laikā var būt jau slēgts", warningMayCloseBefore: "⚠️ Parasti aizveras {time} — jums var neizdoties paspēt", rainPlanNote: "🌧️ Rīt tiek prognozēts lietus — 1. dienai devām priekšroku iekštelpu apskates vietām.", aiLangName: "latviešu" },
  ee: { title: "Loo reisimarsruut", description: "Loo automaatselt päevapõhine reisimarsruut mis tahes Rumeenia linna jaoks, meie 500 kontrollitud vaatamisväärsuse hulgast.", breadcrumbCurrent: "Loo marsruut", h1: "🗺️ Loo oma marsruut", intro: "Ütle meile linn või maakond ja mitu päeva sul on — koostame loogilise marsruudi juba kontrollitud vaatamisväärsustest.", placeholder: "Linn või maakond (nt Brasov, Sibiu, Maramures)", daysLabel: "Päevade arv:", submitBtn: "Loo marsruut", loadingMessages: ["Arvutame marsruuti...", "Kontrollime lähedal asuvaid vaatamisväärsusi...", "Korraldame päevi...", "Peaaegu valmis..."], errorUnexpected: "Ootamatu vastus. Proovi uuesti.", errorNetwork: "Ilmnes võrgu viga. Proovi uuesti.", errorGeneric: "Marsruuti ei õnnestunud luua. Proovi uuesti.", resetBtn: "🗑️ Tühjenda ja loo uus marsruut", footer: "automaatselt loodud marsruudid, juba kontrollitud vaatamisväärsustest. Kontrolli alati koha reaalajas lahtiolekuaegu enne külastamist.", dayPrefix: "Päev", morning: "🌅 Hommik", lunch: "🍽️ Lõuna", evening: "🌙 Õhtu", googleMapsLabel: "🗺️ Ava marsruut Google Mapsis", icalLabel: "📅 Lisa kalendrisse (.ics)", warningClosedThatDay: "⚠️ Sel ajal võib juba suletud olla", warningMayCloseBefore: "⚠️ Tavaliselt sulgub kell {time} — võib-olla ei jõua", rainPlanNote: "🌧️ Homme on ennustatud vihma — 1. päevaks eelistasime siseruumides asuvaid vaatamisväärsusi.", aiLangName: "eesti" },
}

exports.BEACH_MONETIZATION_LABELS = {
  ro: "☀️ Echipament de plajă & activități — recomandările noastre", uk: "☀️ Beach gear & activities — our picks",
  de: "☀️ Strandausrüstung & Aktivitäten — unsere Empfehlungen", fr: "☀️ Équipement de plage & activités — nos sélections",
  es: "☀️ Equipo de playa y actividades — nuestras selecciones", it: "☀️ Attrezzatura da spiaggia e attività — le nostre scelte",
  pl: "☀️ Sprzęt plażowy i atrakcje — nasze polecenia", nl: "☀️ Strandbenodigdheden & activiteiten — onze aanraders",
  da: "☀️ Strandudstyr & aktiviteter — vores anbefalinger", cz: "☀️ Plážové vybavení a aktivity — naše tipy",
  fi: "☀️ Rantavarusteet ja aktiviteetit — suosituksemme", gr: "☀️ Εξοπλισμός & δραστηριότητες παραλίας — οι επιλογές μας",
  hu: "☀️ Strandfelszerelés és programok — ajánlásaink", hr: "☀️ Plažna oprema i aktivnosti — naši izbori",
  sk: "☀️ Plážové vybavenie a aktivity — naše tipy", si: "☀️ Plažna oprema in aktivnosti — naši izbori",
  lt: "☀️ Paplūdimio įranga ir veiklos — mūsų pasiūlymai", lv: "☀️ Pludmales inventārs un aktivitātes — mūsu ieteikumi",
  pt: "☀️ Equipamento de praia e atividades — as nossas escolhas", se: "☀️ Strandutrustning & aktiviteter — våra val",
  ee: "☀️ Rannavarustus ja tegevused — meie soovitused",
}

exports.EXTRA_LABELS = {
  "ro": {
    "bpTitle": "🅿️ Planifică vizita",
    "bpTicket": "🎟️ Vrei să eviți coada? Cumpără bilet online",
    "bpStays": "🏨 Vezi cazări în apropiere pe Booking.com",
    "bpRestaurant": "🍽️ Găsește și rezervă la restaurante în apropiere",
    "bpParkingNearby": "🚗 Caută parcare în apropiere",
    "riBtn": "🚩 Programul e corect sau locul nu mai există? Spune-ne, ajuți alți vizitatori!",
    "riYes": "Da",
    "riNo": "Nu",
    "riQ2": "Magazinul e închis definitiv, nu mai există la această locație?",
    "riThanksOpen": "✅ Mulțumim pentru confirmare! Ne ajuți să ținem informația corectă, pentru toată lumea.",
    "riThanksReport": "✅ Mulțumim că ești alături de noi pentru cea mai bună experiență a utilizatorilor!",
    "riError": "Nu am putut trimite raportarea. Încearcă din nou.",
    "riAlreadyReported": "Mulțumim, am primit deja mesajul tău — nu poți trimite o altă raportare pentru această locație.",
    "cpTitle": "🚫 Magazin închis definitiv sau mutat",
    "cpText": "Evaluare realizată pe baza confirmărilor de la utilizatori.",
    "reportedWrong": "⚠️ Mai mulți utilizatori au raportat că programul afișat ar putea fi greșit. Verifică, dacă poți, la fața locului.",
    "hgtBtn": "🚗 Cum ajung acolo?",
    "hgtWaze": "🧭 Mergi acolo (Waze)",
    "hgtOptionA": "🚕 Rezervă un Taxi/Transfer local",
    "hgtOptionB": "🚆 Caută Tren/Autobuz în Europa",
    "cwTicketOpen": "🎟️ Vrei să eviți coada? Cumpără bilet online",
    "cwClosedAlert": "⚠️ Locația este închisă în acest moment. Iată alternativele tale:",
    "cwBooking": "🏨 Cazări active pe Booking, în apropiere",
    "cwRestaurants": "🍽️ Restaurante deschise acum, în apropiere",
    "cwGlovo": "🛵 Comandă cu Glovo",
    "cwBringo": "🛒 Comandă cu Bringo",
    "shoppingZone": "Zonă shopping",
    "hypermarketZone": "Hipermarket din mall",
    "mallScheduleTitle": "Orar magazine mall",
    "mallHypermarketTitle": "Program hipermarket din mall",
    "cinemaNote": "Programul de filme se schimbă zilnic, în funcție de premierele săptămânii — nu afișăm aici un status fix „deschis” sau „închis”, ca să nu-ți dăm o informație aproximativă.",
    "cinemaBtn": "🎬 Vezi orarul filmelor de azi",
    "temuMallOffer": "Folosește Cod (aly786477) — reduceri Temu + livrare gratuită",
    "tgTitle": "📖 Informații utile pentru vizită",
    "tgTransport": "🚆 Cum ajung aici? Ghid de tren și autocar",
    "tgParking": "🅿️ Unde parchez mașina? Ghid parcări securizate",
    "tgRestaurant": "🍽️ Unde mănânc în apropiere? Rezervări restaurante",
    "pushSub": "🔔 Abonează-te la notificări (sărbători, program special)",
    "pushUnsub": "🔕 Dezabonează-te de la notificări",
    "instBanner": "e o aplicație web! Instalează-o pe ecranul telefonului pentru acces instant.",
    "instGuide": "Apasă pentru Ghid",
    "instTitle": "Instalează",
    "instNeedSafari": "Pe iPhone, instalarea funcționează doar din Safari. Acum ești într-un alt browser — apasă butonul de mai jos ca să continui direct în Safari.",
    "instOpenSafari": "🧭 Deschide în Safari",
    "instFallback": "Dacă nu s-a întâmplat nimic, deschide manual Safari și scrie adresa",
    "instForIphone": "🍎 Pentru iPhone (Safari)",
    "instSteps": "Apasă pe butonul de Partajare (iconița cu pătrățel și săgeată în sus) din bara de jos, derulează lista în jos și selectează „Adaugă pe ecranul principal”.",
    "instGotIt": "Am înțeles, închide",
    "instNow": "⬇️ Instalează aplicația",
    "instGeneric": "Adaugă acest site la ecranul principal, din meniul browserului."
  },
  "uk": {
    "bpTitle": "🅿️ Plan your visit",
    "bpTicket": "🎟️ Want to skip the line? Buy tickets online",
    "bpStays": "🏨 See nearby stays on Booking.com",
    "bpRestaurant": "🍽️ Find and book nearby restaurants",
    "bpParkingNearby": "🚗 Search for parking nearby",
    "riBtn": "🚩 Is the schedule right, or is this place gone? Let us know — help other visitors!",
    "riYes": "Yes",
    "riNo": "No",
    "riQ2": "Is this store permanently closed or gone from this location?",
    "riThanksOpen": "✅ Thanks for confirming! You're helping us keep this accurate for everyone.",
    "riThanksReport": "✅ Thank you for being with us in building the best experience for our users!",
    "riError": "Couldn't send the report. Try again.",
    "riAlreadyReported": "Thanks, we already received your report — you can't submit another one for this place.",
    "cpTitle": "🚫 Permanently closed or relocated",
    "cpText": "Based on confirmations from other users.",
    "reportedWrong": "⚠️ Several users have reported the displayed hours might be wrong. Please double-check if you can.",
    "hgtBtn": "🚗 How do I get there?",
    "hgtWaze": "🧭 Go there (Waze)",
    "hgtOptionA": "🚕 Book a local Taxi/Transfer",
    "hgtOptionB": "🚆 Search Train/Bus in Europe",
    "cwTicketOpen": "🎟️ Want to skip the line? Buy tickets online",
    "cwClosedAlert": "⚠️ This place is closed right now. Here are your alternatives:",
    "cwBooking": "🏨 Available stays on Booking, nearby",
    "cwRestaurants": "🍽️ Restaurants open now, nearby",
    "cwGlovo": "🛵 Order with Glovo",
    "cwBringo": "🛒 Order with Bringo",
    "shoppingZone": "Shopping zone",
    "hypermarketZone": "Hypermarket in the mall",
    "mallScheduleTitle": "Mall store hours",
    "mallHypermarketTitle": "Mall hypermarket hours",
    "cinemaNote": "Movie schedules change daily depending on the week's releases — we don't show a fixed \"open\" or \"closed\" status here, to avoid giving you approximate information.",
    "cinemaBtn": "🎬 See today's movie schedule",
    "temuMallOffer": "Use Code (aly786477) — Temu discounts + free shipping",
    "tgTitle": "📖 Useful info for your visit",
    "tgTransport": "🚆 How do I get here? Train & coach guide",
    "tgParking": "🅿️ Where do I park? Secure parking guide",
    "tgRestaurant": "🍽️ Where do I eat nearby? Restaurant bookings",
    "pushSub": "🔔 Subscribe to alerts (holidays, special hours)",
    "pushUnsub": "🔕 Unsubscribe from alerts",
    "instBanner": "is a web app! Install it on your phone's home screen for instant access.",
    "instGuide": "Tap for the guide",
    "instTitle": "Install",
    "instNeedSafari": "On iPhone, installation only works from Safari. You're currently in another browser — tap the button below to continue directly in Safari.",
    "instOpenSafari": "🧭 Open in Safari",
    "instFallback": "If nothing happened, open Safari manually and type in the address",
    "instForIphone": "🍎 For iPhone (Safari)",
    "instSteps": "Tap the Share button (the square with an arrow pointing up) in the bottom bar, scroll down, and select \"Add to Home Screen\".",
    "instGotIt": "Got it, close",
    "instNow": "⬇️ Install the app",
    "instGeneric": "Add this site to your home screen from your browser's menu."
  },
  "de": {
    "bpTitle": "🅿️ Planen Sie Ihren Besuch",
    "bpTicket": "🎟️ Warteschlange vermeiden? Ticket online kaufen",
    "bpStays": "🏨 Unterkünfte in der Nähe auf Booking.com ansehen",
    "bpRestaurant": "🍽️ Restaurants in der Nähe finden und buchen",
    "bpParkingNearby": "🚗 Parkplatz in der Nähe suchen",
    "riBtn": "🚩 Sind die Öffnungszeiten richtig, oder gibt es den Ort nicht mehr? Sag uns Bescheid — hilf anderen Besuchern!",
    "riYes": "Ja",
    "riNo": "Nein",
    "riQ2": "Ist dieses Geschäft dauerhaft geschlossen oder von diesem Standort verschwunden?",
    "riThanksOpen": "✅ Danke für die Bestätigung! Du hilfst uns, das für alle korrekt zu halten.",
    "riThanksReport": "✅ Danke, dass du uns hilfst, die beste Erfahrung für unsere Nutzer zu schaffen!",
    "riError": "Die Meldung konnte nicht gesendet werden. Versuche es erneut.",
    "riAlreadyReported": "Danke, wir haben deine Meldung bereits erhalten — du kannst für diesen Ort keine weitere einreichen.",
    "cpTitle": "🚫 Dauerhaft geschlossen oder umgezogen",
    "cpText": "Basierend auf Bestätigungen anderer Nutzer.",
    "reportedWrong": "⚠️ Mehrere Nutzer haben gemeldet, dass die angezeigten Zeiten falsch sein könnten. Bitte überprüfe es, wenn möglich.",
    "hgtBtn": "🚗 Wie komme ich dorthin?",
    "hgtWaze": "🧭 Dorthin fahren (Waze)",
    "hgtOptionA": "🚕 Lokalen Taxi/Transfer buchen",
    "hgtOptionB": "🚆 Zug/Bus in Europa suchen",
    "cwTicketOpen": "🎟️ Warteschlange vermeiden? Ticket online kaufen",
    "cwClosedAlert": "⚠️ Dieser Ort ist gerade geschlossen. Hier sind deine Alternativen:",
    "cwBooking": "🏨 Verfügbare Unterkünfte auf Booking, in der Nähe",
    "cwRestaurants": "🍽️ Jetzt geöffnete Restaurants in der Nähe",
    "cwGlovo": "🛵 Mit Glovo bestellen",
    "cwBringo": "🛒 Mit Bringo bestellen",
    "shoppingZone": "Einkaufszone",
    "hypermarketZone": "Hypermarkt im Einkaufszentrum",
    "mallScheduleTitle": "Öffnungszeiten der Geschäfte im Einkaufszentrum",
    "mallHypermarketTitle": "Öffnungszeiten des Hypermarkts im Einkaufszentrum",
    "cinemaNote": "Die Kinoprogramme ändern sich täglich je nach den Premieren der Woche — wir zeigen hier keinen festen „geöffnet“- oder „geschlossen“-Status an, um keine ungenauen Informationen zu geben.",
    "cinemaBtn": "🎬 Heutiges Kinoprogramm ansehen",
    "temuMallOffer": "Code (aly786477) verwenden — Temu-Rabatte + kostenloser Versand",
    "tgTitle": "📖 Nützliche Infos für deinen Besuch",
    "tgTransport": "🚆 Wie komme ich her? Zug- & Busreiseführer",
    "tgParking": "🅿️ Wo parke ich? Sicherer Parkplatz-Guide",
    "tgRestaurant": "🍽️ Wo esse ich in der Nähe? Restaurantreservierungen",
    "pushSub": "🔔 Benachrichtigungen abonnieren (Feiertage, Sonderöffnungszeiten)",
    "pushUnsub": "🔕 Benachrichtigungen abbestellen",
    "instBanner": "ist eine Web-App! Installiere sie auf deinem Homescreen für sofortigen Zugriff.",
    "instGuide": "Tippen für Anleitung",
    "instTitle": "Installieren",
    "instNeedSafari": "Auf dem iPhone funktioniert die Installation nur über Safari. Du bist gerade in einem anderen Browser — tippe unten, um direkt in Safari fortzufahren.",
    "instOpenSafari": "🧭 In Safari öffnen",
    "instFallback": "Falls nichts passiert ist, öffne Safari manuell und gib die Adresse ein",
    "instForIphone": "🍎 Für iPhone (Safari)",
    "instSteps": "Tippe auf das Teilen-Symbol (Quadrat mit Pfeil nach oben) in der unteren Leiste, scrolle nach unten und wähle „Zum Home-Bildschirm“.",
    "instGotIt": "Verstanden, schließen",
    "instNow": "⬇️ App installieren",
    "instGeneric": "Füge diese Seite über das Browsermenü zu deinem Homescreen hinzu."
  },
  "es": {
    "bpTitle": "🅿️ Planifica tu visita",
    "bpTicket": "🎟️ ¿Quieres evitar la cola? Compra la entrada online",
    "bpStays": "🏨 Ver alojamientos cercanos en Booking.com",
    "bpRestaurant": "🍽️ Encuentra y reserva restaurantes cercanos",
    "bpParkingNearby": "🚗 Buscar aparcamiento cercano",
    "riBtn": "🚩 ¿El horario es correcto, o este lugar ya no existe? Avísanos — ayudas a otros visitantes!",
    "riYes": "Sí",
    "riNo": "No",
    "riQ2": "¿Esta tienda está cerrada permanentemente o ya no está en esta ubicación?",
    "riThanksOpen": "✅ ¡Gracias por confirmar! Nos ayudas a mantener esto preciso para todos.",
    "riThanksReport": "✅ ¡Gracias por ayudarnos a construir la mejor experiencia para nuestros usuarios!",
    "riError": "No se pudo enviar el reporte. Inténtalo de nuevo.",
    "riAlreadyReported": "Gracias, ya recibimos tu reporte — no puedes enviar otro para este lugar.",
    "cpTitle": "🚫 Cerrado permanentemente o reubicado",
    "cpText": "Basado en confirmaciones de otros usuarios.",
    "reportedWrong": "⚠️ Varios usuarios han reportado que el horario mostrado podría ser incorrecto. Verifica en persona si puedes.",
    "hgtBtn": "🚗 ¿Cómo llego?",
    "hgtWaze": "🧭 Ir allí (Waze)",
    "hgtOptionA": "🚕 Reservar un Taxi/Transfer local",
    "hgtOptionB": "🚆 Buscar Tren/Autobús en Europa",
    "cwTicketOpen": "🎟️ ¿Quieres evitar la cola? Compra la entrada online",
    "cwClosedAlert": "⚠️ Este lugar está cerrado ahora mismo. Aquí tienes tus alternativas:",
    "cwBooking": "🏨 Alojamientos disponibles en Booking, cerca",
    "cwRestaurants": "🍽️ Restaurantes abiertos ahora, cerca",
    "cwGlovo": "🛵 Pedir con Glovo",
    "cwBringo": "🛒 Pedir con Bringo",
    "shoppingZone": "Zona comercial",
    "hypermarketZone": "Hipermercado en el centro comercial",
    "mallScheduleTitle": "Horario de tiendas del centro comercial",
    "mallHypermarketTitle": "Horario del hipermercado del centro comercial",
    "cinemaNote": "Los horarios de las películas cambian diariamente según los estrenos de la semana — no mostramos un estado fijo de \"abierto\" o \"cerrado\" aquí, para no darte información aproximada.",
    "cinemaBtn": "🎬 Ver la cartelera de hoy",
    "temuMallOffer": "Usa el Código (aly786477) — descuentos Temu + envío gratis",
    "tgTitle": "📖 Información útil para tu visita",
    "tgTransport": "🚆 ¿Cómo llego aquí? Guía de tren y autobús",
    "tgParking": "🅿️ ¿Dónde aparco? Guía de aparcamientos seguros",
    "tgRestaurant": "🍽️ ¿Dónde como cerca? Reservas de restaurantes",
    "pushSub": "🔔 Suscríbete a alertas (festivos, horarios especiales)",
    "pushUnsub": "🔕 Cancelar suscripción a alertas",
    "instBanner": "¡es una aplicación web! Instálala en tu pantalla de inicio para acceso instantáneo.",
    "instGuide": "Toca para ver la guía",
    "instTitle": "Instalar",
    "instNeedSafari": "En iPhone, la instalación solo funciona desde Safari. Ahora estás en otro navegador — toca el botón de abajo para continuar directamente en Safari.",
    "instOpenSafari": "🧭 Abrir en Safari",
    "instFallback": "Si no ha pasado nada, abre Safari manualmente y escribe la dirección",
    "instForIphone": "🍎 Para iPhone (Safari)",
    "instSteps": "Toca el botón Compartir (el cuadrado con una flecha hacia arriba) en la barra inferior, desplázate hacia abajo y selecciona \"Añadir a pantalla de inicio\".",
    "instGotIt": "Entendido, cerrar",
    "instNow": "⬇️ Instalar la aplicación",
    "instGeneric": "Añade este sitio a tu pantalla de inicio desde el menú de tu navegador."
  },
  "fr": {
    "bpTitle": "🅿️ Planifiez votre visite",
    "bpTicket": "🎟️ Envie d'éviter la file d'attente ? Achetez votre billet en ligne",
    "bpStays": "🏨 Voir les hébergements à proximité sur Booking.com",
    "bpRestaurant": "🍽️ Trouvez et réservez des restaurants à proximité",
    "bpParkingNearby": "🚗 Chercher un parking à proximité",
    "riBtn": "🚩 Les horaires sont-ils corrects, ou cet endroit n'existe plus ? Dites-le nous — aidez les autres visiteurs !",
    "riYes": "Oui",
    "riNo": "Non",
    "riQ2": "Ce magasin est-il définitivement fermé ou n'existe-t-il plus à cet emplacement ?",
    "riThanksOpen": "✅ Merci pour la confirmation ! Vous nous aidez à garder cette information exacte pour tous.",
    "riThanksReport": "✅ Merci de nous aider à construire la meilleure expérience pour nos utilisateurs !",
    "riError": "Impossible d'envoyer le signalement. Réessayez.",
    "riAlreadyReported": "Merci, nous avons déjà reçu votre signalement — vous ne pouvez pas en envoyer un autre pour cet endroit.",
    "cpTitle": "🚫 Fermé définitivement ou déplacé",
    "cpText": "Basé sur les confirmations d'autres utilisateurs.",
    "reportedWrong": "⚠️ Plusieurs utilisateurs ont signalé que les horaires affichés pourraient être incorrects. Vérifiez sur place si vous le pouvez.",
    "hgtBtn": "🚗 Comment y aller ?",
    "hgtWaze": "🧭 Y aller (Waze)",
    "hgtOptionA": "🚕 Réserver un Taxi/Transfert local",
    "hgtOptionB": "🚆 Chercher un Train/Bus en Europe",
    "cwTicketOpen": "🎟️ Envie d'éviter la file d'attente ? Achetez votre billet en ligne",
    "cwClosedAlert": "⚠️ Cet endroit est fermé en ce moment. Voici vos alternatives :",
    "cwBooking": "🏨 Hébergements disponibles sur Booking, à proximité",
    "cwRestaurants": "🍽️ Restaurants ouverts maintenant, à proximité",
    "cwGlovo": "🛵 Commander avec Glovo",
    "cwBringo": "🛒 Commander avec Bringo",
    "shoppingZone": "Zone commerciale",
    "hypermarketZone": "Hypermarché dans le centre commercial",
    "mallScheduleTitle": "Horaires des magasins du centre commercial",
    "mallHypermarketTitle": "Horaires de l'hypermarché du centre commercial",
    "cinemaNote": "Les horaires des films changent chaque jour selon les sorties de la semaine — nous n'affichons pas ici un statut fixe \"ouvert\" ou \"fermé\", pour ne pas vous donner une information approximative.",
    "cinemaBtn": "🎬 Voir les horaires des films d'aujourd'hui",
    "temuMallOffer": "Utilisez le Code (aly786477) — réductions Temu + livraison gratuite",
    "tgTitle": "📖 Infos utiles pour votre visite",
    "tgTransport": "🚆 Comment venir ici ? Guide train et bus",
    "tgParking": "🅿️ Où me garer ? Guide des parkings sécurisés",
    "tgRestaurant": "🍽️ Où manger à proximité ? Réservations de restaurants",
    "pushSub": "🔔 S'abonner aux alertes (jours fériés, horaires spéciaux)",
    "pushUnsub": "🔕 Se désabonner des alertes",
    "instBanner": "est une application web ! Installez-la sur l'écran d'accueil pour un accès instantané.",
    "instGuide": "Appuyez pour le guide",
    "instTitle": "Installer",
    "instNeedSafari": "Sur iPhone, l'installation ne fonctionne que depuis Safari. Vous êtes actuellement dans un autre navigateur — appuyez sur le bouton ci-dessous pour continuer directement dans Safari.",
    "instOpenSafari": "🧭 Ouvrir dans Safari",
    "instFallback": "Si rien ne s'est passé, ouvrez Safari manuellement et saisissez l'adresse",
    "instForIphone": "🍎 Pour iPhone (Safari)",
    "instSteps": "Appuyez sur le bouton Partager (le carré avec une flèche vers le haut) dans la barre du bas, faites défiler vers le bas et sélectionnez \"Sur l'écran d'accueil\".",
    "instGotIt": "Compris, fermer",
    "instNow": "⬇️ Installer l'application",
    "instGeneric": "Ajoutez ce site à votre écran d'accueil depuis le menu de votre navigateur."
  },
  "it": {
    "bpTitle": "🅿️ Pianifica la tua visita",
    "bpTicket": "🎟️ Vuoi evitare la fila? Compra il biglietto online",
    "bpStays": "🏨 Vedi alloggi vicini su Booking.com",
    "bpRestaurant": "🍽️ Trova e prenota ristoranti vicini",
    "bpParkingNearby": "🚗 Cerca parcheggio nelle vicinanze",
    "riBtn": "🚩 L'orario è corretto, o questo posto non esiste più? Faccelo sapere — aiuti altri visitatori!",
    "riYes": "Sì",
    "riNo": "No",
    "riQ2": "Questo negozio è chiuso definitivamente o non è più in questa posizione?",
    "riThanksOpen": "✅ Grazie per la conferma! Ci aiuti a mantenere questo accurato per tutti.",
    "riThanksReport": "✅ Grazie per essere con noi nel costruire la migliore esperienza per i nostri utenti!",
    "riError": "Impossibile inviare la segnalazione. Riprova.",
    "riAlreadyReported": "Grazie, abbiamo già ricevuto la tua segnalazione — non puoi inviarne un'altra per questo posto.",
    "cpTitle": "🚫 Chiuso definitivamente o trasferito",
    "cpText": "Basato sulle conferme di altri utenti.",
    "reportedWrong": "⚠️ Diversi utenti hanno segnalato che l'orario mostrato potrebbe essere sbagliato. Verifica di persona se puoi.",
    "hgtBtn": "🚗 Come ci arrivo?",
    "hgtWaze": "🧭 Vai lì (Waze)",
    "hgtOptionA": "🚕 Prenota un Taxi/Transfer locale",
    "hgtOptionB": "🚆 Cerca Treno/Autobus in Europa",
    "cwTicketOpen": "🎟️ Vuoi evitare la fila? Compra il biglietto online",
    "cwClosedAlert": "⚠️ Questo posto è chiuso in questo momento. Ecco le tue alternative:",
    "cwBooking": "🏨 Alloggi disponibili su Booking, nelle vicinanze",
    "cwRestaurants": "🍽️ Ristoranti aperti ora, nelle vicinanze",
    "cwGlovo": "🛵 Ordina con Glovo",
    "cwBringo": "🛒 Ordina con Bringo",
    "shoppingZone": "Zona shopping",
    "hypermarketZone": "Ipermercato nel centro commerciale",
    "mallScheduleTitle": "Orari dei negozi del centro commerciale",
    "mallHypermarketTitle": "Orari dell'ipermercato del centro commerciale",
    "cinemaNote": "Gli orari dei film cambiano ogni giorno in base alle uscite della settimana — non mostriamo qui uno stato fisso \"aperto\" o \"chiuso\", per non darti informazioni approssimative.",
    "cinemaBtn": "🎬 Vedi la programmazione di oggi",
    "temuMallOffer": "Usa il Codice (aly786477) — sconti Temu + spedizione gratuita",
    "tgTitle": "📖 Informazioni utili per la tua visita",
    "tgTransport": "🚆 Come arrivo qui? Guida treno e autobus",
    "tgParking": "🅿️ Dove parcheggio? Guida ai parcheggi sicuri",
    "tgRestaurant": "🍽️ Dove mangio nelle vicinanze? Prenotazioni ristoranti",
    "pushSub": "🔔 Iscriviti agli avvisi (festività, orari speciali)",
    "pushUnsub": "🔕 Annulla iscrizione agli avvisi",
    "instBanner": "è un'app web! Installala sulla schermata Home per un accesso immediato.",
    "instGuide": "Tocca per la guida",
    "instTitle": "Installa",
    "instNeedSafari": "Su iPhone, l'installazione funziona solo da Safari. Al momento sei in un altro browser — tocca il pulsante qui sotto per continuare direttamente in Safari.",
    "instOpenSafari": "🧭 Apri in Safari",
    "instFallback": "Se non è successo nulla, apri Safari manualmente e digita l'indirizzo",
    "instForIphone": "🍎 Per iPhone (Safari)",
    "instSteps": "Tocca il pulsante Condividi (il quadrato con la freccia verso l'alto) nella barra inferiore, scorri verso il basso e seleziona \"Aggiungi alla schermata Home\".",
    "instGotIt": "Capito, chiudi",
    "instNow": "⬇️ Installa l'app",
    "instGeneric": "Aggiungi questo sito alla schermata Home dal menu del browser."
  },
  "pl": {
    "bpTitle": "🅿️ Zaplanuj wizytę",
    "bpTicket": "🎟️ Chcesz uniknąć kolejki? Kup bilet online",
    "bpStays": "🏨 Zobacz noclegi w pobliżu na Booking.com",
    "bpRestaurant": "🍽️ Znajdź i zarezerwuj restauracje w pobliżu",
    "bpParkingNearby": "🚗 Szukaj parkingu w pobliżu",
    "riBtn": "🚩 Czy godziny są poprawne, czy tego miejsca już nie ma? Daj nam znać — pomóż innym odwiedzającym!",
    "riYes": "Tak",
    "riNo": "Nie",
    "riQ2": "Czy ten sklep jest trwale zamknięty lub zniknął z tej lokalizacji?",
    "riThanksOpen": "✅ Dziękujemy za potwierdzenie! Pomagasz nam utrzymać dokładność dla wszystkich.",
    "riThanksReport": "✅ Dziękujemy za pomoc w budowaniu najlepszego doświadczenia dla naszych użytkowników!",
    "riError": "Nie udało się wysłać zgłoszenia. Spróbuj ponownie.",
    "riAlreadyReported": "Dziękujemy, otrzymaliśmy już Twoje zgłoszenie — nie możesz wysłać kolejnego dla tego miejsca.",
    "cpTitle": "🚫 Trwale zamknięte lub przeniesione",
    "cpText": "Na podstawie potwierdzeń od innych użytkowników.",
    "reportedWrong": "⚠️ Kilku użytkowników zgłosiło, że wyświetlane godziny mogą być błędne. Sprawdź na miejscu, jeśli możesz.",
    "hgtBtn": "🚗 Jak tam dotrzeć?",
    "hgtWaze": "🧭 Jedź tam (Waze)",
    "hgtOptionA": "🚕 Zarezerwuj lokalną taksówkę/transfer",
    "hgtOptionB": "🚆 Szukaj pociągu/autobusu w Europie",
    "cwTicketOpen": "🎟️ Chcesz uniknąć kolejki? Kup bilet online",
    "cwClosedAlert": "⚠️ To miejsce jest teraz zamknięte. Oto Twoje alternatywy:",
    "cwBooking": "🏨 Dostępne noclegi na Booking, w pobliżu",
    "cwRestaurants": "🍽️ Restauracje otwarte teraz, w pobliżu",
    "cwGlovo": "🛵 Zamów z Glovo",
    "cwBringo": "🛒 Zamów z Bringo",
    "shoppingZone": "Strefa handlowa",
    "hypermarketZone": "Hipermarket w centrum handlowym",
    "mallScheduleTitle": "Godziny otwarcia sklepów w centrum handlowym",
    "mallHypermarketTitle": "Godziny otwarcia hipermarketu w centrum handlowym",
    "cinemaNote": "Repertuar filmowy zmienia się codziennie w zależności od premier tygodnia — nie pokazujemy tutaj stałego statusu \"otwarte\" lub \"zamknięte\", aby nie podawać przybliżonych informacji.",
    "cinemaBtn": "🎬 Zobacz dzisiejszy repertuar",
    "temuMallOffer": "Użyj Kodu (aly786477) — rabaty Temu + darmowa dostawa",
    "tgTitle": "📖 Przydatne informacje na wizytę",
    "tgTransport": "🚆 Jak tu dotrzeć? Przewodnik pociąg i autobus",
    "tgParking": "🅿️ Gdzie zaparkować? Przewodnik po bezpiecznych parkingach",
    "tgRestaurant": "🍽️ Gdzie zjeść w pobliżu? Rezerwacje restauracji",
    "pushSub": "🔔 Subskrybuj powiadomienia (święta, specjalne godziny)",
    "pushUnsub": "🔕 Anuluj subskrypcję powiadomień",
    "instBanner": "to aplikacja webowa! Zainstaluj ją na ekranie głównym telefonu dla natychmiastowego dostępu.",
    "instGuide": "Dotknij, aby zobaczyć przewodnik",
    "instTitle": "Zainstaluj",
    "instNeedSafari": "Na iPhonie instalacja działa tylko z Safari. Jesteś teraz w innej przeglądarce — dotknij przycisku poniżej, aby przejść bezpośrednio do Safari.",
    "instOpenSafari": "🧭 Otwórz w Safari",
    "instFallback": "Jeśli nic się nie stało, otwórz Safari ręcznie i wpisz adres",
    "instForIphone": "🍎 Dla iPhone'a (Safari)",
    "instSteps": "Dotknij przycisku Udostępnij (kwadrat ze strzałką w górę) na dolnym pasku, przewiń w dół i wybierz \"Dodaj do ekranu głównego\".",
    "instGotIt": "Rozumiem, zamknij",
    "instNow": "⬇️ Zainstaluj aplikację",
    "instGeneric": "Dodaj tę stronę do ekranu głównego z menu przeglądarki."
  },
  "nl": {
    "bpTitle": "🅿️ Plan je bezoek",
    "bpTicket": "🎟️ Wachtrij vermijden? Koop een ticket online",
    "bpStays": "🏨 Bekijk verblijven in de buurt op Booking.com",
    "bpRestaurant": "🍽️ Vind en boek restaurants in de buurt",
    "bpParkingNearby": "🚗 Zoek parkeerplaats in de buurt",
    "riBtn": "🚩 Klopt het rooster, of bestaat deze plek niet meer? Laat het ons weten — help andere bezoekers!",
    "riYes": "Ja",
    "riNo": "Nee",
    "riQ2": "Is deze winkel permanent gesloten of niet meer op deze locatie?",
    "riThanksOpen": "✅ Bedankt voor de bevestiging! Je helpt ons dit accuraat te houden voor iedereen.",
    "riThanksReport": "✅ Bedankt dat je ons helpt de beste ervaring voor onze gebruikers te bouwen!",
    "riError": "Kon de melding niet verzenden. Probeer het opnieuw.",
    "riAlreadyReported": "Bedankt, we hebben je melding al ontvangen — je kunt geen nieuwe indienen voor deze plek.",
    "cpTitle": "🚫 Permanent gesloten of verhuisd",
    "cpText": "Gebaseerd op bevestigingen van andere gebruikers.",
    "reportedWrong": "⚠️ Meerdere gebruikers hebben gemeld dat de weergegeven tijden mogelijk onjuist zijn. Controleer ter plaatse als je kunt.",
    "hgtBtn": "🚗 Hoe kom ik daar?",
    "hgtWaze": "🧭 Ga daarheen (Waze)",
    "hgtOptionA": "🚕 Boek een lokale taxi/transfer",
    "hgtOptionB": "🚆 Zoek trein/bus in Europa",
    "cwTicketOpen": "🎟️ Wachtrij vermijden? Koop een ticket online",
    "cwClosedAlert": "⚠️ Deze plek is nu gesloten. Hier zijn je alternatieven:",
    "cwBooking": "🏨 Beschikbare verblijven op Booking, in de buurt",
    "cwRestaurants": "🍽️ Nu geopende restaurants, in de buurt",
    "cwGlovo": "🛵 Bestel met Glovo",
    "cwBringo": "🛒 Bestel met Bringo",
    "shoppingZone": "Winkelzone",
    "hypermarketZone": "Hypermarkt in het winkelcentrum",
    "mallScheduleTitle": "Openingstijden winkels winkelcentrum",
    "mallHypermarketTitle": "Openingstijden hypermarkt winkelcentrum",
    "cinemaNote": "Filmroosters veranderen dagelijks afhankelijk van de premières van de week — we tonen hier geen vaste \"open\" of \"gesloten\" status, om geen bij benadering informatie te geven.",
    "cinemaBtn": "🎬 Bekijk het filmrooster van vandaag",
    "temuMallOffer": "Gebruik Code (aly786477) — Temu-kortingen + gratis verzending",
    "tgTitle": "📖 Nuttige info voor je bezoek",
    "tgTransport": "🚆 Hoe kom ik hier? Trein- en busgids",
    "tgParking": "🅿️ Waar parkeer ik? Gids voor veilig parkeren",
    "tgRestaurant": "🍽️ Waar eet ik in de buurt? Restaurantreserveringen",
    "pushSub": "🔔 Abonneer op meldingen (feestdagen, speciale tijden)",
    "pushUnsub": "🔕 Uitschrijven van meldingen",
    "instBanner": "is een webapp! Installeer het op je startscherm voor directe toegang.",
    "instGuide": "Tik voor de gids",
    "instTitle": "Installeer",
    "instNeedSafari": "Op iPhone werkt installeren alleen vanuit Safari. Je bent nu in een andere browser — tik op de knop hieronder om direct in Safari verder te gaan.",
    "instOpenSafari": "🧭 Open in Safari",
    "instFallback": "Als er niets is gebeurd, open Safari dan handmatig en typ het adres",
    "instForIphone": "🍎 Voor iPhone (Safari)",
    "instSteps": "Tik op de deelknop (het vierkant met pijl omhoog) in de onderste balk, scroll naar beneden en kies \"Zet op beginscherm\".",
    "instGotIt": "Begrepen, sluiten",
    "instNow": "⬇️ Installeer de app",
    "instGeneric": "Voeg deze site toe aan je startscherm via het menu van je browser."
  },
  "da": {
    "bpTitle": "🅿️ Planlæg dit besøg",
    "bpTicket": "🎟️ Vil du undgå køen? Køb billet online",
    "bpStays": "🏨 Se overnatninger i nærheden på Booking.com",
    "bpRestaurant": "🍽️ Find og book restauranter i nærheden",
    "bpParkingNearby": "🚗 Søg efter parkering i nærheden",
    "riBtn": "🚩 Er åbningstiderne korrekte, eller findes dette sted ikke længere? Fortæl os det — hjælp andre besøgende!",
    "riYes": "Ja",
    "riNo": "Nej",
    "riQ2": "Er denne butik permanent lukket eller væk fra denne placering?",
    "riThanksOpen": "✅ Tak for bekræftelsen! Du hjælper os med at holde dette nøjagtigt for alle.",
    "riThanksReport": "✅ Tak fordi du hjælper os med at skabe den bedste oplevelse for vores brugere!",
    "riError": "Kunne ikke sende rapporten. Prøv igen.",
    "riAlreadyReported": "Tak, vi har allerede modtaget din rapport — du kan ikke indsende en ny for dette sted.",
    "cpTitle": "🚫 Permanent lukket eller flyttet",
    "cpText": "Baseret på bekræftelser fra andre brugere.",
    "reportedWrong": "⚠️ Flere brugere har rapporteret, at de viste tider kan være forkerte. Tjek på stedet, hvis du kan.",
    "hgtBtn": "🚗 Hvordan kommer jeg derhen?",
    "hgtWaze": "🧭 Tag derhen (Waze)",
    "hgtOptionA": "🚕 Book en lokal Taxi/Transfer",
    "hgtOptionB": "🚆 Søg efter Tog/Bus i Europa",
    "cwTicketOpen": "🎟️ Vil du undgå køen? Køb billet online",
    "cwClosedAlert": "⚠️ Dette sted er lukket lige nu. Her er dine alternativer:",
    "cwBooking": "🏨 Tilgængelige overnatninger på Booking, i nærheden",
    "cwRestaurants": "🍽️ Restauranter der har åbent nu, i nærheden",
    "cwGlovo": "🛵 Bestil med Glovo",
    "cwBringo": "🛒 Bestil med Bringo",
    "shoppingZone": "Indkøbszone",
    "hypermarketZone": "Hypermarked i indkøbscentret",
    "mallScheduleTitle": "Åbningstider for butikker i indkøbscentret",
    "mallHypermarketTitle": "Åbningstider for hypermarked i indkøbscentret",
    "cinemaNote": "Filmplanerne ændrer sig dagligt afhængigt af ugens premierer — vi viser ikke en fast \"åben\" eller \"lukket\" status her, for ikke at give dig omtrentlig information.",
    "cinemaBtn": "🎬 Se dagens filmplan",
    "temuMallOffer": "Brug Kode (aly786477) — Temu-rabatter + gratis fragt",
    "tgTitle": "📖 Nyttig info til dit besøg",
    "tgTransport": "🚆 Hvordan kommer jeg hertil? Tog- og busguide",
    "tgParking": "🅿️ Hvor parkerer jeg? Guide til sikker parkering",
    "tgRestaurant": "🍽️ Hvor spiser jeg i nærheden? Restaurantreservationer",
    "pushSub": "🔔 Abonnér på alarmer (helligdage, særlige tider)",
    "pushUnsub": "🔕 Afmeld alarmer",
    "instBanner": "er en webapp! Installer den på din hjemmeskærm for øjeblikkelig adgang.",
    "instGuide": "Tryk for guiden",
    "instTitle": "Installer",
    "instNeedSafari": "På iPhone virker installation kun fra Safari. Du er lige nu i en anden browser — tryk på knappen nedenfor for at fortsætte direkte i Safari.",
    "instOpenSafari": "🧭 Åbn i Safari",
    "instFallback": "Hvis der ikke skete noget, så åbn Safari manuelt og indtast adressen",
    "instForIphone": "🍎 Til iPhone (Safari)",
    "instSteps": "Tryk på Del-knappen (firkanten med pilen opad) i bunden, rul ned, og vælg \"Føj til hjemmeskærm\".",
    "instGotIt": "Forstået, luk",
    "instNow": "⬇️ Installer appen",
    "instGeneric": "Tilføj denne side til din hjemmeskærm via din browsers menu."
  },
  "se": {
    "bpTitle": "🅿️ Planera ditt besök",
    "bpTicket": "🎟️ Vill du undvika kön? Köp biljett online",
    "bpStays": "🏨 Se boenden i närheten på Booking.com",
    "bpRestaurant": "🍽️ Hitta och boka restauranger i närheten",
    "bpParkingNearby": "🚗 Sök parkering i närheten",
    "riBtn": "🚩 Är öppettiderna korrekta, eller finns den här platsen inte längre? Berätta för oss — hjälp andra besökare!",
    "riYes": "Ja",
    "riNo": "Nej",
    "riQ2": "Är den här butiken permanent stängd eller borta från denna plats?",
    "riThanksOpen": "✅ Tack för bekräftelsen! Du hjälper oss hålla detta korrekt för alla.",
    "riThanksReport": "✅ Tack för att du hjälper oss bygga den bästa upplevelsen för våra användare!",
    "riError": "Kunde inte skicka rapporten. Försök igen.",
    "riAlreadyReported": "Tack, vi har redan tagit emot din rapport — du kan inte skicka in en till för denna plats.",
    "cpTitle": "🚫 Permanent stängd eller flyttad",
    "cpText": "Baserat på bekräftelser från andra användare.",
    "reportedWrong": "⚠️ Flera användare har rapporterat att de visade tiderna kan vara fel. Kontrollera på plats om du kan.",
    "hgtBtn": "🚗 Hur tar jag mig dit?",
    "hgtWaze": "🧭 Åk dit (Waze)",
    "hgtOptionA": "🚕 Boka en lokal Taxi/Transfer",
    "hgtOptionB": "🚆 Sök Tåg/Buss i Europa",
    "cwTicketOpen": "🎟️ Vill du undvika kön? Köp biljett online",
    "cwClosedAlert": "⚠️ Den här platsen är stängd just nu. Här är dina alternativ:",
    "cwBooking": "🏨 Tillgängliga boenden på Booking, i närheten",
    "cwRestaurants": "🍽️ Restauranger öppna nu, i närheten",
    "cwGlovo": "🛵 Beställ med Glovo",
    "cwBringo": "🛒 Beställ med Bringo",
    "shoppingZone": "Shoppingzon",
    "hypermarketZone": "Hypermarknad i köpcentret",
    "mallScheduleTitle": "Öppettider för butiker i köpcentret",
    "mallHypermarketTitle": "Öppettider för hypermarknad i köpcentret",
    "cinemaNote": "Filmschemat ändras dagligen beroende på veckans premiärer — vi visar inte en fast \"öppen\" eller \"stängd\" status här, för att inte ge dig ungefärlig information.",
    "cinemaBtn": "🎬 Se dagens filmschema",
    "temuMallOffer": "Använd Kod (aly786477) — Temu-rabatter + fri frakt",
    "tgTitle": "📖 Praktisk info för ditt besök",
    "tgTransport": "🚆 Hur tar jag mig hit? Tåg- och bussguide",
    "tgParking": "🅿️ Var parkerar jag? Guide för säker parkering",
    "tgRestaurant": "🍽️ Var äter jag i närheten? Restaurangbokningar",
    "pushSub": "🔔 Prenumerera på aviseringar (helgdagar, särskilda tider)",
    "pushUnsub": "🔕 Avsluta prenumeration på aviseringar",
    "instBanner": "är en webbapp! Installera den på hemskärmen för snabb åtkomst.",
    "instGuide": "Tryck för guiden",
    "instTitle": "Installera",
    "instNeedSafari": "På iPhone fungerar installationen bara från Safari. Du är just nu i en annan webbläsare — tryck på knappen nedan för att fortsätta direkt i Safari.",
    "instOpenSafari": "🧭 Öppna i Safari",
    "instFallback": "Om inget hände, öppna Safari manuellt och skriv in adressen",
    "instForIphone": "🍎 För iPhone (Safari)",
    "instSteps": "Tryck på Dela-knappen (fyrkanten med pil uppåt) i nedre fältet, bläddra ner och välj \"Lägg till på hemskärmen\".",
    "instGotIt": "Uppfattat, stäng",
    "instNow": "⬇️ Installera appen",
    "instGeneric": "Lägg till den här sidan på hemskärmen via webbläsarens meny."
  },
  "pt": {
    "bpTitle": "🅿️ Planeie a sua visita",
    "bpTicket": "🎟️ Quer evitar a fila? Compre o bilhete online",
    "bpStays": "🏨 Veja alojamentos próximos no Booking.com",
    "bpRestaurant": "🍽️ Encontre e reserve restaurantes próximos",
    "bpParkingNearby": "🚗 Procurar estacionamento próximo",
    "riBtn": "🚩 O horário está correto, ou este lugar já não existe? Diga-nos — ajude outros visitantes!",
    "riYes": "Sim",
    "riNo": "Não",
    "riQ2": "Esta loja está permanentemente fechada ou desapareceu desta localização?",
    "riThanksOpen": "✅ Obrigado pela confirmação! Está a ajudar-nos a manter isto preciso para todos.",
    "riThanksReport": "✅ Obrigado por nos ajudar a construir a melhor experiência para os nossos utilizadores!",
    "riError": "Não foi possível enviar o relatório. Tente novamente.",
    "riAlreadyReported": "Obrigado, já recebemos o seu relatório — não pode enviar outro para este lugar.",
    "cpTitle": "🚫 Permanentemente fechado ou mudou de local",
    "cpText": "Com base em confirmações de outros utilizadores.",
    "reportedWrong": "⚠️ Vários utilizadores relataram que o horário mostrado pode estar errado. Verifique no local, se puder.",
    "hgtBtn": "🚗 Como chego lá?",
    "hgtWaze": "🧭 Ir até lá (Waze)",
    "hgtOptionA": "🚕 Reservar um Táxi/Transfer local",
    "hgtOptionB": "🚆 Procurar Comboio/Autocarro na Europa",
    "cwTicketOpen": "🎟️ Quer evitar a fila? Compre o bilhete online",
    "cwClosedAlert": "⚠️ Este lugar está fechado neste momento. Aqui estão as suas alternativas:",
    "cwBooking": "🏨 Alojamentos disponíveis no Booking, próximos",
    "cwRestaurants": "🍽️ Restaurantes abertos agora, próximos",
    "cwGlovo": "🛵 Encomendar com Glovo",
    "cwBringo": "🛒 Encomendar com Bringo",
    "shoppingZone": "Zona comercial",
    "hypermarketZone": "Hipermercado no centro comercial",
    "mallScheduleTitle": "Horário das lojas do centro comercial",
    "mallHypermarketTitle": "Horário do hipermercado do centro comercial",
    "cinemaNote": "Os horários dos filmes mudam diariamente consoante as estreias da semana — não mostramos aqui um estado fixo de \"aberto\" ou \"fechado\", para não lhe dar informação aproximada.",
    "cinemaBtn": "🎬 Ver a programação de hoje",
    "temuMallOffer": "Usa o Código (aly786477) — descontos Temu + envio grátis",
    "tgTitle": "📖 Informações úteis para a sua visita",
    "tgTransport": "🚆 Como chego aqui? Guia de comboio e autocarro",
    "tgParking": "🅿️ Onde estaciono? Guia de estacionamentos seguros",
    "tgRestaurant": "🍽️ Onde como perto? Reservas de restaurantes",
    "pushSub": "🔔 Subscrever alertas (feriados, horários especiais)",
    "pushUnsub": "🔕 Cancelar subscrição de alertas",
    "instBanner": "é uma aplicação web! Instale-a no ecrã principal para acesso instantâneo.",
    "instGuide": "Toque para o guia",
    "instTitle": "Instalar",
    "instNeedSafari": "No iPhone, a instalação só funciona a partir do Safari. Está agora noutro navegador — toque no botão abaixo para continuar diretamente no Safari.",
    "instOpenSafari": "🧭 Abrir no Safari",
    "instFallback": "Se nada aconteceu, abra o Safari manualmente e escreva o endereço",
    "instForIphone": "🍎 Para iPhone (Safari)",
    "instSteps": "Toque no botão Partilhar (o quadrado com a seta para cima) na barra inferior, deslize para baixo e selecione \"Adicionar ao ecrã principal\".",
    "instGotIt": "Entendi, fechar",
    "instNow": "⬇️ Instalar a aplicação",
    "instGeneric": "Adicione este site ao ecrã principal a partir do menu do seu navegador."
  },
  "cz": {
    "bpTitle": "🅿️ Naplánujte si návštěvu",
    "bpTicket": "🎟️ Chcete se vyhnout frontě? Koupit vstupenku online",
    "bpStays": "🏨 Podívejte se na ubytování v okolí na Booking.com",
    "bpRestaurant": "🍽️ Najděte a rezervujte restaurace v okolí",
    "bpParkingNearby": "🚗 Hledat parkování v okolí",
    "riBtn": "🚩 Je otevírací doba správná, nebo toto místo už neexistuje? Dejte nám vědět — pomozte dalším návštěvníkům!",
    "riYes": "Ano",
    "riNo": "Ne",
    "riQ2": "Je tento obchod trvale zavřený nebo už na tomto místě neexistuje?",
    "riThanksOpen": "✅ Děkujeme za potvrzení! Pomáháte nám udržet tuto informaci přesnou pro všechny.",
    "riThanksReport": "✅ Děkujeme, že nám pomáháte vytvářet nejlepší zážitek pro naše uživatele!",
    "riError": "Hlášení se nepodařilo odeslat. Zkuste to znovu.",
    "riAlreadyReported": "Děkujeme, vaše hlášení jsme již obdrželi — pro toto místo nemůžete odeslat další.",
    "cpTitle": "🚫 Trvale zavřeno nebo přemístěno",
    "cpText": "Na základě potvrzení od ostatních uživatelů.",
    "reportedWrong": "⚠️ Několik uživatelů nahlásilo, že zobrazená otevírací doba může být nesprávná. Pokud můžete, ověřte to na místě.",
    "hgtBtn": "🚗 Jak se tam dostanu?",
    "hgtWaze": "🧭 Jet tam (Waze)",
    "hgtOptionA": "🚕 Rezervovat místní taxi/transfer",
    "hgtOptionB": "🚆 Hledat vlak/autobus v Evropě",
    "cwTicketOpen": "🎟️ Chcete se vyhnout frontě? Koupit vstupenku online",
    "cwClosedAlert": "⚠️ Toto místo je právě zavřené. Zde jsou vaše alternativy:",
    "cwBooking": "🏨 Dostupné ubytování na Booking, v okolí",
    "cwRestaurants": "🍽️ Restaurace otevřené právě teď, v okolí",
    "cwGlovo": "🛵 Objednat s Glovo",
    "cwBringo": "🛒 Objednat s Bringo",
    "shoppingZone": "Nákupní zóna",
    "hypermarketZone": "Hypermarket v obchodním centru",
    "mallScheduleTitle": "Otevírací doba obchodů v obchodním centru",
    "mallHypermarketTitle": "Otevírací doba hypermarketu v obchodním centru",
    "cinemaNote": "Filmový program se mění denně podle premiér daného týdne — nezobrazujeme zde pevný stav \"otevřeno\" nebo \"zavřeno\", abychom vám nedávali přibližné informace.",
    "cinemaBtn": "🎬 Zobrazit dnešní filmový program",
    "temuMallOffer": "Použij Kód (aly786477) — slevy Temu + doprava zdarma",
    "tgTitle": "📖 Užitečné informace pro vaši návštěvu",
    "tgTransport": "🚆 Jak se sem dostanu? Průvodce vlakem a autobusem",
    "tgParking": "🅿️ Kde zaparkuji? Průvodce bezpečným parkováním",
    "tgRestaurant": "🍽️ Kde se najím v okolí? Rezervace restaurací",
    "pushSub": "🔔 Přihlásit se k odběru upozornění (svátky, zvláštní doby)",
    "pushUnsub": "🔕 Odhlásit se z odběru upozornění",
    "instBanner": "je webová aplikace! Nainstalujte si ji na plochu telefonu pro okamžitý přístup.",
    "instGuide": "Klepněte pro návod",
    "instTitle": "Nainstalovat",
    "instNeedSafari": "Na iPhonu funguje instalace pouze ze Safari. Nyní jste v jiném prohlížeči — klepněte na tlačítko níže pro pokračování přímo v Safari.",
    "instOpenSafari": "🧭 Otevřít v Safari",
    "instFallback": "Pokud se nic nestalo, otevřete Safari ručně a zadejte adresu",
    "instForIphone": "🍎 Pro iPhone (Safari)",
    "instSteps": "Klepněte na tlačítko Sdílet (čtverec se šipkou nahoru) ve spodní liště, přejděte dolů a vyberte \"Přidat na plochu\".",
    "instGotIt": "Rozumím, zavřít",
    "instNow": "⬇️ Nainstalovat aplikaci",
    "instGeneric": "Přidejte tento web na plochu z nabídky prohlížeče."
  },
  "fi": {
    "bpTitle": "🅿️ Suunnittele vierailusi",
    "bpTicket": "🎟️ Haluatko välttää jonon? Osta lippu verkossa",
    "bpStays": "🏨 Katso lähellä olevat majoitukset Booking.comissa",
    "bpRestaurant": "🍽️ Löydä ja varaa lähellä olevia ravintoloita",
    "bpParkingNearby": "🚗 Etsi pysäköintiä lähistöltä",
    "riBtn": "🚩 Ovatko aukioloajat oikein, vai eikö tätä paikkaa enää ole? Kerro meille — auta muita kävijöitä!",
    "riYes": "Kyllä",
    "riNo": "Ei",
    "riQ2": "Onko tämä kauppa lopullisesti suljettu tai poissa tästä sijainnista?",
    "riThanksOpen": "✅ Kiitos vahvistuksesta! Autat meitä pitämään tämän tarkkana kaikille.",
    "riThanksReport": "✅ Kiitos, että autat meitä rakentamaan parhaan kokemuksen käyttäjillemme!",
    "riError": "Ilmoitusta ei voitu lähettää. Yritä uudelleen.",
    "riAlreadyReported": "Kiitos, olemme jo vastaanottaneet ilmoituksesi — et voi lähettää toista tälle paikalle.",
    "cpTitle": "🚫 Pysyvästi suljettu tai muuttanut",
    "cpText": "Perustuu muiden käyttäjien vahvistuksiin.",
    "reportedWrong": "⚠️ Useat käyttäjät ovat ilmoittaneet, että näytetyt ajat saattavat olla väärät. Tarkista paikan päällä, jos voit.",
    "hgtBtn": "🚗 Miten pääsen sinne?",
    "hgtWaze": "🧭 Mene sinne (Waze)",
    "hgtOptionA": "🚕 Varaa paikallinen taksi/kuljetus",
    "hgtOptionB": "🚆 Hae junaa/bussia Euroopassa",
    "cwTicketOpen": "🎟️ Haluatko välttää jonon? Osta lippu verkossa",
    "cwClosedAlert": "⚠️ Tämä paikka on nyt suljettu. Tässä vaihtoehtosi:",
    "cwBooking": "🏨 Saatavilla olevat majoitukset Bookingissa, lähellä",
    "cwRestaurants": "🍽️ Nyt avoinna olevat ravintolat, lähellä",
    "cwGlovo": "🛵 Tilaa Glovolla",
    "cwBringo": "🛒 Tilaa Bringolla",
    "shoppingZone": "Ostosalue",
    "hypermarketZone": "Hypermarket ostoskeskuksessa",
    "mallScheduleTitle": "Ostoskeskuksen kauppojen aukioloajat",
    "mallHypermarketTitle": "Ostoskeskuksen hypermarketin aukioloajat",
    "cinemaNote": "Elokuvien aikataulut muuttuvat päivittäin viikon ensi-iltojen mukaan — emme näytä tässä kiinteää \"auki\" tai \"kiinni\" -tilaa, jotta emme antaisi likimääräistä tietoa.",
    "cinemaBtn": "🎬 Katso tämän päivän elokuva-aikataulu",
    "temuMallOffer": "Käytä Koodia (aly786477) — Temu-alennuksia + ilmainen toimitus",
    "tgTitle": "📖 Hyödyllistä tietoa vierailuasi varten",
    "tgTransport": "🚆 Miten pääsen tänne? Juna- ja bussiopas",
    "tgParking": "🅿️ Missä pysäköin? Turvallisen pysäköinnin opas",
    "tgRestaurant": "🍽️ Missä syön lähistöllä? Ravintolavaraukset",
    "pushSub": "🔔 Tilaa ilmoitukset (pyhät, erikoisajat)",
    "pushUnsub": "🔕 Peruuta ilmoitustilaus",
    "instBanner": "on verkkosovellus! Asenna se aloitusnäytölle nopeaa pääsyä varten.",
    "instGuide": "Napauta nähdäksesi ohjeet",
    "instTitle": "Asenna",
    "instNeedSafari": "iPhonessa asennus toimii vain Safarista. Olet nyt toisessa selaimessa — napauta alla olevaa painiketta jatkaaksesi suoraan Safarissa.",
    "instOpenSafari": "🧭 Avaa Safarissa",
    "instFallback": "Jos mitään ei tapahtunut, avaa Safari manuaalisesti ja kirjoita osoite",
    "instForIphone": "🍎 iPhonelle (Safari)",
    "instSteps": "Napauta Jaa-painiketta (neliö, jossa nuoli ylöspäin) alapalkissa, vieritä alas ja valitse \"Lisää Koti-valikkoon\".",
    "instGotIt": "Selvä, sulje",
    "instNow": "⬇️ Asenna sovellus",
    "instGeneric": "Lisää tämä sivusto aloitusnäytölle selaimesi valikosta."
  },
  "gr": {
    "bpTitle": "🅿️ Προγραμματίστε την επίσκεψή σας",
    "bpTicket": "🎟️ Θέλετε να αποφύγετε την ουρά; Αγοράστε εισιτήριο online",
    "bpStays": "🏨 Δείτε διαμονές κοντά στο Booking.com",
    "bpRestaurant": "🍽️ Βρείτε και κλείστε εστιατόρια κοντά",
    "bpParkingNearby": "🚗 Αναζήτηση πάρκινγκ κοντά",
    "riBtn": "🚩 Είναι σωστό το ωράριο, ή αυτό το μέρος δεν υπάρχει πια; Πείτε μας — βοηθήστε άλλους επισκέπτες!",
    "riYes": "Ναι",
    "riNo": "Όχι",
    "riQ2": "Είναι αυτό το κατάστημα μόνιμα κλειστό ή δεν υπάρχει πια σε αυτή την τοποθεσία;",
    "riThanksOpen": "✅ Ευχαριστούμε για την επιβεβαίωση! Μας βοηθάτε να το κρατάμε ακριβές για όλους.",
    "riThanksReport": "✅ Ευχαριστούμε που μας βοηθάτε να χτίσουμε την καλύτερη εμπειρία για τους χρήστες μας!",
    "riError": "Δεν ήταν δυνατή η αποστολή της αναφοράς. Δοκιμάστε ξανά.",
    "riAlreadyReported": "Ευχαριστούμε, λάβαμε ήδη την αναφορά σας — δεν μπορείτε να υποβάλετε άλλη για αυτό το μέρος.",
    "cpTitle": "🚫 Μόνιμα κλειστό ή μετακόμισε",
    "cpText": "Με βάση επιβεβαιώσεις από άλλους χρήστες.",
    "reportedWrong": "⚠️ Αρκετοί χρήστες ανέφεραν ότι το εμφανιζόμενο ωράριο μπορεί να είναι λάθος. Ελέγξτε επιτόπου αν μπορείτε.",
    "hgtBtn": "🚗 Πώς πάω εκεί;",
    "hgtWaze": "🧭 Πήγαινε εκεί (Waze)",
    "hgtOptionA": "🚕 Κλείστε τοπικό ταξί/μεταφορά",
    "hgtOptionB": "🚆 Αναζήτηση τρένου/λεωφορείου στην Ευρώπη",
    "cwTicketOpen": "🎟️ Θέλετε να αποφύγετε την ουρά; Αγοράστε εισιτήριο online",
    "cwClosedAlert": "⚠️ Αυτό το μέρος είναι κλειστό αυτή τη στιγμή. Ορίστε οι εναλλακτικές σας:",
    "cwBooking": "🏨 Διαθέσιμες διαμονές στο Booking, κοντά",
    "cwRestaurants": "🍽️ Εστιατόρια ανοιχτά τώρα, κοντά",
    "cwGlovo": "🛵 Παραγγείλτε με Glovo",
    "cwBringo": "🛒 Παραγγείλτε με Bringo",
    "shoppingZone": "Ζώνη αγορών",
    "hypermarketZone": "Υπεραγορά στο εμπορικό κέντρο",
    "mallScheduleTitle": "Ωράριο καταστημάτων εμπορικού κέντρου",
    "mallHypermarketTitle": "Ωράριο υπεραγοράς εμπορικού κέντρου",
    "cinemaNote": "Το πρόγραμμα ταινιών αλλάζει καθημερινά ανάλογα με τις πρεμιέρες της εβδομάδας — δεν εμφανίζουμε εδώ σταθερή κατάσταση \"ανοιχτό\" ή \"κλειστό\", για να μη σας δώσουμε κατά προσέγγιση πληροφορία.",
    "cinemaBtn": "🎬 Δείτε το σημερινό πρόγραμμα ταινιών",
    "temuMallOffer": "Χρησιμοποίησε τον Κωδικό (aly786477) — εκπτώσεις Temu + δωρεάν αποστολή",
    "tgTitle": "📖 Χρήσιμες πληροφορίες για την επίσκεψή σας",
    "tgTransport": "🚆 Πώς έρχομαι εδώ; Οδηγός τρένου και λεωφορείου",
    "tgParking": "🅿️ Πού παρκάρω; Οδηγός ασφαλούς πάρκινγκ",
    "tgRestaurant": "🍽️ Πού τρώω κοντά; Κρατήσεις εστιατορίων",
    "pushSub": "🔔 Εγγραφείτε για ειδοποιήσεις (αργίες, ειδικά ωράρια)",
    "pushUnsub": "🔕 Απεγγραφή από ειδοποιήσεις",
    "instBanner": "είναι μια εφαρμογή web! Εγκαταστήστε την στην αρχική οθόνη για άμεση πρόσβαση.",
    "instGuide": "Πατήστε για τον οδηγό",
    "instTitle": "Εγκατάσταση",
    "instNeedSafari": "Στο iPhone, η εγκατάσταση λειτουργεί μόνο από το Safari. Αυτή τη στιγμή είστε σε άλλο πρόγραμμα περιήγησης — πατήστε το κουμπί παρακάτω για να συνεχίσετε απευθείας στο Safari.",
    "instOpenSafari": "🧭 Άνοιγμα στο Safari",
    "instFallback": "Αν δεν συνέβη τίποτα, ανοίξτε το Safari χειροκίνητα και πληκτρολογήστε τη διεύθυνση",
    "instForIphone": "🍎 Για iPhone (Safari)",
    "instSteps": "Πατήστε το κουμπί Κοινοποίηση (το τετράγωνο με το βέλος προς τα πάνω) στην κάτω μπάρα, μετακινηθείτε προς τα κάτω και επιλέξτε \"Προσθήκη στην Αρχική οθόνη\".",
    "instGotIt": "Το κατάλαβα, κλείσιμο",
    "instNow": "⬇️ Εγκατάσταση εφαρμογής",
    "instGeneric": "Προσθέστε αυτόν τον ιστότοπο στην αρχική οθόνη από το μενού του προγράμματος περιήγησης."
  },
  "hu": {
    "bpTitle": "🅿️ Tervezze meg látogatását",
    "bpTicket": "🎟️ El akarja kerülni a sort? Vegyen jegyet online",
    "bpStays": "🏨 Nézze meg a közeli szállásokat a Booking.com-on",
    "bpRestaurant": "🍽️ Találjon és foglaljon közeli éttermeket",
    "bpParkingNearby": "🚗 Parkolóhely keresése a közelben",
    "riBtn": "🚩 Helyes a nyitvatartás, vagy ez a hely már nem létezik? Szóljon nekünk — segítsen más látogatóknak!",
    "riYes": "Igen",
    "riNo": "Nem",
    "riQ2": "Ez az üzlet véglegesen bezárt, vagy már nincs ezen a helyen?",
    "riThanksOpen": "✅ Köszönjük a megerősítést! Segít nekünk, hogy ez pontos maradjon mindenki számára.",
    "riThanksReport": "✅ Köszönjük, hogy segít nekünk a legjobb élményt nyújtani felhasználóinknak!",
    "riError": "Nem sikerült elküldeni a jelentést. Próbálja újra.",
    "riAlreadyReported": "Köszönjük, már megkaptuk a jelentését — nem küldhet be másikat ehhez a helyhez.",
    "cpTitle": "🚫 Véglegesen bezárt vagy elköltözött",
    "cpText": "Más felhasználók megerősítései alapján.",
    "reportedWrong": "⚠️ Több felhasználó jelentette, hogy a megjelenített időpontok hibásak lehetnek. Ellenőrizze a helyszínen, ha tudja.",
    "hgtBtn": "🚗 Hogyan jutok oda?",
    "hgtWaze": "🧭 Menjen oda (Waze)",
    "hgtOptionA": "🚕 Foglaljon helyi taxit/transzfert",
    "hgtOptionB": "🚆 Keressen vonatot/buszt Európában",
    "cwTicketOpen": "🎟️ El akarja kerülni a sort? Vegyen jegyet online",
    "cwClosedAlert": "⚠️ Ez a hely most zárva van. Íme az alternatívák:",
    "cwBooking": "🏨 Elérhető szállások a Booking-on, a közelben",
    "cwRestaurants": "🍽️ Most nyitva lévő éttermek, a közelben",
    "cwGlovo": "🛵 Rendeljen a Glovóval",
    "cwBringo": "🛒 Rendeljen a Bringóval",
    "shoppingZone": "Bevásárló zóna",
    "hypermarketZone": "Hipermarket a bevásárlóközpontban",
    "mallScheduleTitle": "Bevásárlóközpont üzleteinek nyitvatartása",
    "mallHypermarketTitle": "Bevásárlóközpont hipermarketjének nyitvatartása",
    "cinemaNote": "A filmműsor naponta változik a heti bemutatóktól függően — itt nem mutatunk fix \"nyitva\" vagy \"zárva\" állapotot, hogy ne adjunk hozzávetőleges információt.",
    "cinemaBtn": "🎬 Mai filmműsor megtekintése",
    "temuMallOffer": "Használd a Kódot (aly786477) — Temu kedvezmények + ingyenes szállítás",
    "tgTitle": "📖 Hasznos információk a látogatáshoz",
    "tgTransport": "🚆 Hogyan jutok ide? Vonat- és buszútmutató",
    "tgParking": "🅿️ Hol parkoljak? Biztonságos parkolás útmutató",
    "tgRestaurant": "🍽️ Hol egyek a közelben? Étteremfoglalások",
    "pushSub": "🔔 Iratkozzon fel értesítésekre (ünnepek, különleges nyitvatartás)",
    "pushUnsub": "🔕 Leiratkozás az értesítésekről",
    "instBanner": "webalkalmazás! Telepítsd a kezdőképernyőre az azonnali hozzáféréshez.",
    "instGuide": "Koppints az útmutatóért",
    "instTitle": "Telepítés",
    "instNeedSafari": "iPhone-on a telepítés csak Safariból működik. Jelenleg egy másik böngészőben vagy — koppints az alábbi gombra, hogy közvetlenül a Safariban folytasd.",
    "instOpenSafari": "🧭 Megnyitás Safariban",
    "instFallback": "Ha semmi nem történt, nyisd meg a Safarit manuálisan és írd be a címet",
    "instForIphone": "🍎 iPhone-hoz (Safari)",
    "instSteps": "Koppints a Megosztás gombra (a felfelé mutató nyilas négyzet) az alsó sávban, görgess le, és válaszd a \"Hozzáadás a kezdőképernyőhöz\" opciót.",
    "instGotIt": "Értem, bezárás",
    "instNow": "⬇️ Alkalmazás telepítése",
    "instGeneric": "Add hozzá ezt az oldalt a kezdőképernyőhöz a böngésző menüjéből."
  },
  "hr": {
    "bpTitle": "🅿️ Planirajte svoj posjet",
    "bpTicket": "🎟️ Želite izbjeći red? Kupite ulaznicu online",
    "bpStays": "🏨 Pogledajte smještaj u blizini na Booking.com",
    "bpRestaurant": "🍽️ Pronađite i rezervirajte restorane u blizini",
    "bpParkingNearby": "🚗 Potražite parking u blizini",
    "riBtn": "🚩 Je li radno vrijeme točno, ili ovo mjesto više ne postoji? Javite nam — pomozite drugim posjetiteljima!",
    "riYes": "Da",
    "riNo": "Ne",
    "riQ2": "Je li ova trgovina trajno zatvorena ili više nije na ovoj lokaciji?",
    "riThanksOpen": "✅ Hvala na potvrdi! Pomažete nam održati ovo točnim za sve.",
    "riThanksReport": "✅ Hvala što nam pomažete izgraditi najbolje iskustvo za naše korisnike!",
    "riError": "Prijava se nije mogla poslati. Pokušajte ponovno.",
    "riAlreadyReported": "Hvala, već smo primili vašu prijavu — ne možete poslati još jednu za ovo mjesto.",
    "cpTitle": "🚫 Trajno zatvoreno ili preseljeno",
    "cpText": "Na temelju potvrda drugih korisnika.",
    "reportedWrong": "⚠️ Nekoliko korisnika prijavilo je da prikazano radno vrijeme možda nije točno. Provjerite na licu mjesta ako možete.",
    "hgtBtn": "🚗 Kako doći tamo?",
    "hgtWaze": "🧭 Idi tamo (Waze)",
    "hgtOptionA": "🚕 Rezervirajte lokalni taksi/transfer",
    "hgtOptionB": "🚆 Potražite vlak/autobus u Europi",
    "cwTicketOpen": "🎟️ Želite izbjeći red? Kupite ulaznicu online",
    "cwClosedAlert": "⚠️ Ovo mjesto je trenutno zatvoreno. Evo vaših alternativa:",
    "cwBooking": "🏨 Dostupan smještaj na Booking, u blizini",
    "cwRestaurants": "🍽️ Restorani otvoreni sada, u blizini",
    "cwGlovo": "🛵 Naručite s Glovo",
    "cwBringo": "🛒 Naručite s Bringo",
    "shoppingZone": "Trgovačka zona",
    "hypermarketZone": "Hipermarket u trgovačkom centru",
    "mallScheduleTitle": "Radno vrijeme trgovina u trgovačkom centru",
    "mallHypermarketTitle": "Radno vrijeme hipermarketa u trgovačkom centru",
    "cinemaNote": "Raspored filmova mijenja se svakodnevno ovisno o premijerama tjedna — ovdje ne prikazujemo fiksni status \"otvoreno\" ili \"zatvoreno\", kako vam ne bismo dali približnu informaciju.",
    "cinemaBtn": "🎬 Pogledajte današnji raspored filmova",
    "temuMallOffer": "Iskoristi Kod (aly786477) — Temu popusti + besplatna dostava",
    "tgTitle": "📖 Korisne informacije za vaš posjet",
    "tgTransport": "🚆 Kako doći ovamo? Vodič za vlak i autobus",
    "tgParking": "🅿️ Gdje parkirati? Vodič za sigurno parkiranje",
    "tgRestaurant": "🍽️ Gdje jesti u blizini? Rezervacije restorana",
    "pushSub": "🔔 Pretplatite se na obavijesti (praznici, posebno radno vrijeme)",
    "pushUnsub": "🔕 Odjavite se s obavijesti",
    "instBanner": "je web aplikacija! Instalirajte je na početni zaslon telefona za trenutni pristup.",
    "instGuide": "Dodirnite za vodič",
    "instTitle": "Instaliraj",
    "instNeedSafari": "Na iPhoneu instalacija radi samo iz Safarija. Trenutno ste u drugom pregledniku — dodirnite gumb ispod za nastavak izravno u Safariju.",
    "instOpenSafari": "🧭 Otvori u Safariju",
    "instFallback": "Ako se ništa nije dogodilo, otvorite Safari ručno i upišite adresu",
    "instForIphone": "🍎 Za iPhone (Safari)",
    "instSteps": "Dodirnite gumb Podijeli (kvadrat sa strelicom prema gore) u donjoj traci, pomaknite se prema dolje i odaberite \"Dodaj na početni zaslon\".",
    "instGotIt": "Razumijem, zatvori",
    "instNow": "⬇️ Instaliraj aplikaciju",
    "instGeneric": "Dodajte ovu stranicu na početni zaslon iz izbornika preglednika."
  },
  "sk": {
    "bpTitle": "🅿️ Naplánujte si návštevu",
    "bpTicket": "🎟️ Chcete sa vyhnúť radu? Kúpte si lístok online",
    "bpStays": "🏨 Pozrite si ubytovanie v okolí na Booking.com",
    "bpRestaurant": "🍽️ Nájdite a rezervujte reštaurácie v okolí",
    "bpParkingNearby": "🚗 Hľadať parkovanie v okolí",
    "riBtn": "🚩 Je otvárací čas správny, alebo toto miesto už neexistuje? Dajte nám vedieť — pomôžte ostatným návštevníkom!",
    "riYes": "Áno",
    "riNo": "Nie",
    "riQ2": "Je tento obchod trvalo zatvorený alebo už na tomto mieste neexistuje?",
    "riThanksOpen": "✅ Ďakujeme za potvrdenie! Pomáhate nám udržať túto informáciu presnú pre všetkých.",
    "riThanksReport": "✅ Ďakujeme, že nám pomáhate vytvárať najlepší zážitok pre našich používateľov!",
    "riError": "Hlásenie sa nepodarilo odoslať. Skúste to znova.",
    "riAlreadyReported": "Ďakujeme, vaše hlásenie sme už dostali — pre toto miesto nemôžete odoslať ďalšie.",
    "cpTitle": "🚫 Trvalo zatvorené alebo presunuté",
    "cpText": "Na základe potvrdení od ostatných používateľov.",
    "reportedWrong": "⚠️ Niekoľko používateľov nahlásilo, že zobrazený čas môže byť nesprávny. Ak môžete, overte to na mieste.",
    "hgtBtn": "🚗 Ako sa tam dostanem?",
    "hgtWaze": "🧭 Ísť tam (Waze)",
    "hgtOptionA": "🚕 Rezervovať miestne taxi/transfer",
    "hgtOptionB": "🚆 Hľadať vlak/autobus v Európe",
    "cwTicketOpen": "🎟️ Chcete sa vyhnúť radu? Kúpte si lístok online",
    "cwClosedAlert": "⚠️ Toto miesto je teraz zatvorené. Tu sú vaše alternatívy:",
    "cwBooking": "🏨 Dostupné ubytovanie na Booking, v okolí",
    "cwRestaurants": "🍽️ Reštaurácie otvorené teraz, v okolí",
    "cwGlovo": "🛵 Objednať s Glovo",
    "cwBringo": "🛒 Objednať s Bringo",
    "shoppingZone": "Nákupná zóna",
    "hypermarketZone": "Hypermarket v nákupnom centre",
    "mallScheduleTitle": "Otváracie hodiny obchodov v nákupnom centre",
    "mallHypermarketTitle": "Otváracie hodiny hypermarketu v nákupnom centre",
    "cinemaNote": "Filmový program sa mení denne podľa premiér daného týždňa — nezobrazujeme tu pevný stav \"otvorené\" alebo \"zatvorené\", aby sme vám nedávali približné informácie.",
    "cinemaBtn": "🎬 Zobraziť dnešný filmový program",
    "temuMallOffer": "Použi Kód (aly786477) — zľavy Temu + doprava zdarma",
    "tgTitle": "📖 Užitočné informácie pre vašu návštevu",
    "tgTransport": "🚆 Ako sa sem dostanem? Sprievodca vlakom a autobusom",
    "tgParking": "🅿️ Kde zaparkujem? Sprievodca bezpečným parkovaním",
    "tgRestaurant": "🍽️ Kde sa najem v okolí? Rezervácie reštaurácií",
    "pushSub": "🔔 Prihlásiť sa na odber upozornení (sviatky, špeciálny čas)",
    "pushUnsub": "🔕 Odhlásiť sa z odberu upozornení",
    "instBanner": "je webová aplikácia! Nainštalujte si ju na plochu telefónu pre okamžitý prístup.",
    "instGuide": "Klepnite pre návod",
    "instTitle": "Nainštalovať",
    "instNeedSafari": "Na iPhone funguje inštalácia iba zo Safari. Teraz ste v inom prehliadači — klepnite na tlačidlo nižšie pre pokračovanie priamo v Safari.",
    "instOpenSafari": "🧭 Otvoriť v Safari",
    "instFallback": "Ak sa nič nestalo, otvorte Safari ručne a zadajte adresu",
    "instForIphone": "🍎 Pre iPhone (Safari)",
    "instSteps": "Klepnite na tlačidlo Zdieľať (štvorec so šípkou nahor) v spodnej lište, prejdite nadol a vyberte \"Pridať na plochu\".",
    "instGotIt": "Rozumiem, zavrieť",
    "instNow": "⬇️ Nainštalovať aplikáciu",
    "instGeneric": "Pridajte tento web na plochu z ponuky prehliadača."
  },
  "si": {
    "bpTitle": "🅿️ Načrtujte svoj obisk",
    "bpTicket": "🎟️ Se želite izogniti vrsti? Kupite vstopnico online",
    "bpStays": "🏨 Oglejte si nastanitve v bližini na Booking.com",
    "bpRestaurant": "🍽️ Poiščite in rezervirajte restavracije v bližini",
    "bpParkingNearby": "🚗 Iščite parkirišče v bližini",
    "riBtn": "🚩 Je delovni čas pravilen, ali to mesto ne obstaja več? Sporočite nam — pomagajte drugim obiskovalcem!",
    "riYes": "Da",
    "riNo": "Ne",
    "riQ2": "Je ta trgovina trajno zaprta ali je ni več na tej lokaciji?",
    "riThanksOpen": "✅ Hvala za potrditev! Pomagate nam ohranjati to točno za vse.",
    "riThanksReport": "✅ Hvala, ker nam pomagate zgraditi najboljšo izkušnjo za naše uporabnike!",
    "riError": "Poročila ni bilo mogoče poslati. Poskusite znova.",
    "riAlreadyReported": "Hvala, vaše poročilo smo že prejeli — za to mesto ne morete oddati drugega.",
    "cpTitle": "🚫 Trajno zaprto ali preseljeno",
    "cpText": "Na podlagi potrditev drugih uporabnikov.",
    "reportedWrong": "⚠️ Več uporabnikov je prijavilo, da prikazani čas morda ni pravilen. Če lahko, preverite na kraju samem.",
    "hgtBtn": "🚗 Kako pridem tja?",
    "hgtWaze": "🧭 Pojdi tja (Waze)",
    "hgtOptionA": "🚕 Rezervirajte lokalni taksi/prevoz",
    "hgtOptionB": "🚆 Iščite vlak/avtobus v Evropi",
    "cwTicketOpen": "🎟️ Se želite izogniti vrsti? Kupite vstopnico online",
    "cwClosedAlert": "⚠️ To mesto je trenutno zaprto. Tukaj so vaše alternative:",
    "cwBooking": "🏨 Razpoložljive nastanitve na Booking, v bližini",
    "cwRestaurants": "🍽️ Restavracije, odprte zdaj, v bližini",
    "cwGlovo": "🛵 Naročite z Glovo",
    "cwBringo": "🛒 Naročite z Bringo",
    "shoppingZone": "Nakupovalno območje",
    "hypermarketZone": "Hipermarket v nakupovalnem središču",
    "mallScheduleTitle": "Delovni čas trgovin v nakupovalnem središču",
    "mallHypermarketTitle": "Delovni čas hipermarketa v nakupovalnem središču",
    "cinemaNote": "Filmski spored se dnevno spreminja glede na premiere tedna — tukaj ne prikazujemo fiksnega stanja \"odprto\" ali \"zaprto\", da vam ne bi dali približne informacije.",
    "cinemaBtn": "🎬 Oglejte si današnji filmski spored",
    "temuMallOffer": "Uporabi Kodo (aly786477) — Temu popusti + brezplačna dostava",
    "tgTitle": "📖 Koristne informacije za vaš obisk",
    "tgTransport": "🚆 Kako pridem sem? Vodnik za vlak in avtobus",
    "tgParking": "🅿️ Kje parkiram? Vodnik za varno parkiranje",
    "tgRestaurant": "🍽️ Kje jem v bližini? Rezervacije restavracij",
    "pushSub": "🔔 Naročite se na obvestila (prazniki, posebni delovni čas)",
    "pushUnsub": "🔕 Odjavite se od obvestil",
    "instBanner": "je spletna aplikacija! Namestite jo na začetni zaslon za takojšen dostop.",
    "instGuide": "Tapnite za vodnik",
    "instTitle": "Namesti",
    "instNeedSafari": "Na iPhonu namestitev deluje samo iz Safarija. Trenutno ste v drugem brskalniku — tapnite spodnji gumb za nadaljevanje neposredno v Safariju.",
    "instOpenSafari": "🧭 Odpri v Safariju",
    "instFallback": "Če se ni nič zgodilo, ročno odprite Safari in vnesite naslov",
    "instForIphone": "🍎 Za iPhone (Safari)",
    "instSteps": "Tapnite gumb Deli (kvadrat s puščico navzgor) v spodnji vrstici, pomaknite se navzdol in izberite \"Dodaj na začetni zaslon\".",
    "instGotIt": "Razumem, zapri",
    "instNow": "⬇️ Namesti aplikacijo",
    "instGeneric": "Dodajte to stran na začetni zaslon iz menija brskalnika."
  },
  "lt": {
    "bpTitle": "🅿️ Suplanuokite savo apsilankymą",
    "bpTicket": "🎟️ Norite išvengti eilės? Pirkite bilietą internetu",
    "bpStays": "🏨 Peržiūrėkite apgyvendinimą netoliese Booking.com",
    "bpRestaurant": "🍽️ Raskite ir rezervuokite restoranus netoliese",
    "bpParkingNearby": "🚗 Ieškoti parkavimo netoliese",
    "riBtn": "🚩 Ar darbo laikas teisingas, ar šios vietos jau nebėra? Praneškite mums — padėkite kitiems lankytojams!",
    "riYes": "Taip",
    "riNo": "Ne",
    "riQ2": "Ar ši parduotuvė visam laikui uždaryta arba jos nebėra šioje vietoje?",
    "riThanksOpen": "✅ Ačiū už patvirtinimą! Padedate mums išlaikyti tai tikslų visiems.",
    "riThanksReport": "✅ Ačiū, kad padedate mums sukurti geriausią patirtį mūsų vartotojams!",
    "riError": "Nepavyko išsiųsti pranešimo. Bandykite dar kartą.",
    "riAlreadyReported": "Ačiū, mes jau gavome jūsų pranešimą — negalite pateikti kito šiai vietai.",
    "cpTitle": "🚫 Visam laikui uždaryta arba perkelta",
    "cpText": "Remiantis kitų vartotojų patvirtinimais.",
    "reportedWrong": "⚠️ Keli vartotojai pranešė, kad rodomas laikas gali būti neteisingas. Jei galite, patikrinkite vietoje.",
    "hgtBtn": "🚗 Kaip ten patekti?",
    "hgtWaze": "🧭 Vykti ten (Waze)",
    "hgtOptionA": "🚕 Rezervuoti vietinį taksi/pervežimą",
    "hgtOptionB": "🚆 Ieškoti traukinio/autobuso Europoje",
    "cwTicketOpen": "🎟️ Norite išvengti eilės? Pirkite bilietą internetu",
    "cwClosedAlert": "⚠️ Ši vieta dabar uždaryta. Štai jūsų alternatyvos:",
    "cwBooking": "🏨 Prieinamas apgyvendinimas Booking, netoliese",
    "cwRestaurants": "🍽️ Dabar atviri restoranai, netoliese",
    "cwGlovo": "🛵 Užsisakykite su Glovo",
    "cwBringo": "🛒 Užsisakykite su Bringo",
    "shoppingZone": "Apsipirkimo zona",
    "hypermarketZone": "Hipermarketas prekybos centre",
    "mallScheduleTitle": "Prekybos centro parduotuvių darbo laikas",
    "mallHypermarketTitle": "Prekybos centro hipermarketo darbo laikas",
    "cinemaNote": "Filmų tvarkaraštis keičiasi kasdien priklausomai nuo savaitės premjerų — čia nerodome fiksuotos \"atidaryta\" ar \"uždaryta\" būsenos, kad nepateiktume apytikslios informacijos.",
    "cinemaBtn": "🎬 Peržiūrėti šiandienos filmų tvarkaraštį",
    "temuMallOffer": "Naudok Kodą (aly786477) — Temu nuolaidos + nemokamas pristatymas",
    "tgTitle": "📖 Naudinga informacija jūsų apsilankymui",
    "tgTransport": "🚆 Kaip čia patekti? Traukinio ir autobuso gidas",
    "tgParking": "🅿️ Kur pastatyti automobilį? Saugaus parkavimo gidas",
    "tgRestaurant": "🍽️ Kur pavalgyti netoliese? Restoranų rezervacijos",
    "pushSub": "🔔 Prenumeruokite įspėjimus (švenčių, specialaus darbo laiko)",
    "pushUnsub": "🔕 Atsisakyti įspėjimų prenumeratos",
    "instBanner": "yra žiniatinklio programa! Įdiekite ją pradžios ekrane greitai prieigai.",
    "instGuide": "Bakstelėkite dėl gidas",
    "instTitle": "Įdiegti",
    "instNeedSafari": "„iPhone“ diegimas veikia tik iš Safari. Šiuo metu esate kitoje naršyklėje — bakstelėkite žemiau esantį mygtuką, kad tęstumėte tiesiai Safari.",
    "instOpenSafari": "🧭 Atidaryti Safari",
    "instFallback": "Jei nieko neįvyko, atidarykite Safari rankiniu būdu ir įveskite adresą",
    "instForIphone": "🍎 „iPhone“ (Safari)",
    "instSteps": "Apatinėje juostoje bakstelėkite mygtuką Bendrinti (kvadratas su rodykle aukštyn), slinkite žemyn ir pasirinkite \"Į pradžios ekraną\".",
    "instGotIt": "Supratau, uždaryti",
    "instNow": "⬇️ Įdiegti programėlę",
    "instGeneric": "Pridėkite šią svetainę prie pradžios ekrano naršyklės meniu."
  },
  "lv": {
    "bpTitle": "🅿️ Plānojiet savu apmeklējumu",
    "bpTicket": "🎟️ Vēlaties izvairīties no rindas? Pērciet biļeti tiešsaistē",
    "bpStays": "🏨 Skatiet apmešanās vietas tuvumā Booking.com",
    "bpRestaurant": "🍽️ Atrodiet un rezervējiet restorānus tuvumā",
    "bpParkingNearby": "🚗 Meklēt stāvvietu tuvumā",
    "riBtn": "🚩 Vai darba laiks ir pareizs, vai šīs vietas vairs nav? Paziņojiet mums — palīdziet citiem apmeklētājiem!",
    "riYes": "Jā",
    "riNo": "Nē",
    "riQ2": "Vai šis veikals ir pilnībā slēgts vai vairs nav šajā vietā?",
    "riThanksOpen": "✅ Paldies par apstiprinājumu! Jūs palīdzat mums to saglabāt precīzu visiem.",
    "riThanksReport": "✅ Paldies, ka palīdzat mums veidot labāko pieredzi mūsu lietotājiem!",
    "riError": "Neizdevās nosūtīt ziņojumu. Mēģiniet vēlreiz.",
    "riAlreadyReported": "Paldies, mēs jau saņēmām jūsu ziņojumu — jūs nevarat iesniegt citu šai vietai.",
    "cpTitle": "🚫 Pilnībā slēgts vai pārvietots",
    "cpText": "Pamatojoties uz citu lietotāju apstiprinājumiem.",
    "reportedWrong": "⚠️ Vairāki lietotāji ir ziņojuši, ka rādītais laiks var būt nepareizs. Ja varat, pārbaudiet uz vietas.",
    "hgtBtn": "🚗 Kā es tur nokļūstu?",
    "hgtWaze": "🧭 Doties turp (Waze)",
    "hgtOptionA": "🚕 Rezervēt vietējo taksometru/transfēru",
    "hgtOptionB": "🚆 Meklēt vilcienu/autobusu Eiropā",
    "cwTicketOpen": "🎟️ Vēlaties izvairīties no rindas? Pērciet biļeti tiešsaistē",
    "cwClosedAlert": "⚠️ Šī vieta tagad ir slēgta. Šeit ir jūsu alternatīvas:",
    "cwBooking": "🏨 Pieejamā apmešanās Booking, tuvumā",
    "cwRestaurants": "🍽️ Tagad atvērti restorāni, tuvumā",
    "cwGlovo": "🛵 Pasūtiet ar Glovo",
    "cwBringo": "🛒 Pasūtiet ar Bringo",
    "shoppingZone": "Iepirkšanās zona",
    "hypermarketZone": "Lielveikals tirdzniecības centrā",
    "mallScheduleTitle": "Tirdzniecības centra veikalu darba laiks",
    "mallHypermarketTitle": "Tirdzniecības centra lielveikala darba laiks",
    "cinemaNote": "Filmu grafiks mainās katru dienu atkarībā no nedēļas pirmizrādēm — mēs šeit nerādām fiksētu \"atvērts\" vai \"slēgts\" statusu, lai nesniegtu jums aptuvenu informāciju.",
    "cinemaBtn": "🎬 Skatīt šodienas filmu grafiku",
    "temuMallOffer": "Izmanto Kodu (aly786477) — Temu atlaides + bezmaksas piegāde",
    "tgTitle": "📖 Noderīga informācija jūsu apmeklējumam",
    "tgTransport": "🚆 Kā es šeit nokļūstu? Vilciena un autobusa ceļvedis",
    "tgParking": "🅿️ Kur novietot automašīnu? Drošas stāvvietas ceļvedis",
    "tgRestaurant": "🍽️ Kur paēst tuvumā? Restorānu rezervācijas",
    "pushSub": "🔔 Abonēt brīdinājumus (svētki, īpašs darba laiks)",
    "pushUnsub": "🔕 Atteikties no brīdinājumu abonēšanas",
    "instBanner": "ir tīmekļa lietotne! Instalējiet to sākuma ekrānā ātrai piekļuvei.",
    "instGuide": "Pieskarieties ceļvedim",
    "instTitle": "Instalēt",
    "instNeedSafari": "iPhone tālrunī instalēšana darbojas tikai no Safari. Pašlaik atrodaties citā pārlūkā — pieskarieties zemāk esošajai pogai, lai turpinātu tieši Safari.",
    "instOpenSafari": "🧭 Atvērt Safari",
    "instFallback": "Ja nekas nenotika, atveriet Safari manuāli un ierakstiet adresi",
    "instForIphone": "🍎 iPhone tālrunim (Safari)",
    "instSteps": "Apakšējā joslā pieskarieties pogai Kopīgot (kvadrāts ar bultu uz augšu), ritiniet uz leju un izvēlieties \"Pievienot sākuma ekrānam\".",
    "instGotIt": "Sapratu, aizvērt",
    "instNow": "⬇️ Instalēt lietotni",
    "instGeneric": "Pievienojiet šo vietni sākuma ekrānam no pārlūka izvēlnes."
  },
  "ee": {
    "bpTitle": "🅿️ Planeeri oma külastust",
    "bpTicket": "🎟️ Soovid vältida järjekorda? Osta pilet veebis",
    "bpStays": "🏨 Vaata lähedal asuvaid majutusi Booking.com-is",
    "bpRestaurant": "🍽️ Leia ja broneeri lähedal asuvaid restorane",
    "bpParkingNearby": "🚗 Otsi parkimist lähedal",
    "riBtn": "🚩 Kas lahtiolekuaeg on õige, või seda kohta enam ei ole? Anna meile teada — aita teisi külastajaid!",
    "riYes": "Jah",
    "riNo": "Ei",
    "riQ2": "Kas see pood on jäädavalt suletud või seda enam sellel asukohal ei ole?",
    "riThanksOpen": "✅ Aitäh kinnituse eest! Aitad meil hoida seda täpsena kõigi jaoks.",
    "riThanksReport": "✅ Aitäh, et aitad meil luua parimat kogemust meie kasutajatele!",
    "riError": "Teadet ei õnnestunud saata. Proovi uuesti.",
    "riAlreadyReported": "Aitäh, oleme sinu teate juba saanud — sa ei saa selle koha kohta uut esitada.",
    "cpTitle": "🚫 Jäädavalt suletud või kolinud",
    "cpText": "Põhineb teiste kasutajate kinnitustel.",
    "reportedWrong": "⚠️ Mitmed kasutajad on teatanud, et näidatud aeg võib olla vale. Kontrolli kohapeal, kui saad.",
    "hgtBtn": "🚗 Kuidas ma sinna jõuan?",
    "hgtWaze": "🧭 Mine sinna (Waze)",
    "hgtOptionA": "🚕 Broneeri kohalik takso/transfeer",
    "hgtOptionB": "🚆 Otsi rongi/bussi Euroopas",
    "cwTicketOpen": "🎟️ Soovid vältida järjekorda? Osta pilet veebis",
    "cwClosedAlert": "⚠️ See koht on praegu suletud. Siin on sinu alternatiivid:",
    "cwBooking": "🏨 Saadaval majutused Bookingus, lähedal",
    "cwRestaurants": "🍽️ Praegu avatud restoranid, lähedal",
    "cwGlovo": "🛵 Telli Glovoga",
    "cwBringo": "🛒 Telli Bringoga",
    "shoppingZone": "Ostutsoon",
    "hypermarketZone": "Hüpermarket kaubanduskeskuses",
    "mallScheduleTitle": "Kaubanduskeskuse poodide lahtiolekuajad",
    "mallHypermarketTitle": "Kaubanduskeskuse hüpermarketi lahtiolekuajad",
    "cinemaNote": "Filmide ajakava muutub iga päev vastavalt nädala esilinastustele — me ei näita siin fikseeritud \"avatud\" või \"suletud\" olekut, et mitte anda ligikaudset teavet.",
    "cinemaBtn": "🎬 Vaata tänast filmide ajakava",
    "temuMallOffer": "Kasuta Koodi (aly786477) — Temu allahindlused + tasuta kohaletoimetamine",
    "tgTitle": "📖 Kasulik teave sinu külastuseks",
    "tgTransport": "🚆 Kuidas ma siia jõuan? Rongi- ja bussijuhend",
    "tgParking": "🅿️ Kus ma pargin? Turvalise parkimise juhend",
    "tgRestaurant": "🍽️ Kus ma lähedal söön? Restoranide broneeringud",
    "pushSub": "🔔 Telli teavitused (pühad, erilised lahtiolekuajad)",
    "pushUnsub": "🔕 Loobu teavitustest",
    "instBanner": "on veebirakendus! Paigalda see avakuvale kiireks juurdepääsuks.",
    "instGuide": "Puuduta juhendi jaoks",
    "instTitle": "Paigalda",
    "instNeedSafari": "iPhone'is töötab paigaldamine ainult Safarist. Sa oled praegu teises brauseris — puuduta allolevat nuppu, et jätkata otse Safaris.",
    "instOpenSafari": "🧭 Ava Safaris",
    "instFallback": "Kui midagi ei juhtunud, ava Safari käsitsi ja sisesta aadress",
    "instForIphone": "🍎 iPhone'ile (Safari)",
    "instSteps": "Puuduta alumises ribas jagamisnuppu (ruut koos üles suunatud noolega), keri alla ja vali \"Lisa avakuvale\".",
    "instGotIt": "Selge, sulge",
    "instNow": "⬇️ Paigalda rakendus",
    "instGeneric": "Lisa see sait avakuvale brauseri menüüst."
  }
}

exports.NO_LIVE_DATA_TEXT = {
  ro: (url) => `ℹ️ Programul live nu e încă disponibil pentru acest loc. Verifică <a href="${url}" target="_blank" rel="noopener">site-ul oficial</a> pentru informații actualizate.`,
  uk: (url) => `ℹ️ Live hours aren't available yet for this place. Check the <a href="${url}" target="_blank" rel="noopener">official site</a> for up-to-date info.`,
  de: (url) => `ℹ️ Für diesen Ort sind noch keine Live-Öffnungszeiten verfügbar. Prüfe die <a href="${url}" target="_blank" rel="noopener">offizielle Website</a> für aktuelle Infos.`,
  es: (url) => `ℹ️ El horario en vivo aún no está disponible para este lugar. Consulta el <a href="${url}" target="_blank" rel="noopener">sitio oficial</a> para información actualizada.`,
  fr: (url) => `ℹ️ Les horaires en direct ne sont pas encore disponibles pour cet endroit. Consultez le <a href="${url}" target="_blank" rel="noopener">site officiel</a> pour des informations à jour.`,
  it: (url) => `ℹ️ Gli orari in tempo reale non sono ancora disponibili per questo luogo. Controlla il <a href="${url}" target="_blank" rel="noopener">sito ufficiale</a> per informazioni aggiornate.`,
  pl: (url) => `ℹ️ Godziny na żywo nie są jeszcze dostępne dla tego miejsca. Sprawdź <a href="${url}" target="_blank" rel="noopener">oficjalną stronę</a>, aby uzyskać aktualne informacje.`,
  nl: (url) => `ℹ️ Live openingstijden zijn nog niet beschikbaar voor deze plek. Bekijk de <a href="${url}" target="_blank" rel="noopener">officiële site</a> voor actuele informatie.`,
  da: (url) => `ℹ️ Live åbningstider er endnu ikke tilgængelige for dette sted. Tjek den <a href="${url}" target="_blank" rel="noopener">officielle side</a> for opdateret info.`,
  se: (url) => `ℹ️ Direktöppettider är inte tillgängliga för denna plats än. Kolla den <a href="${url}" target="_blank" rel="noopener">officiella webbplatsen</a> för aktuell info.`,
  pt: (url) => `ℹ️ O horário em tempo real ainda não está disponível para este local. Consulte o <a href="${url}" target="_blank" rel="noopener">site oficial</a> para informações atualizadas.`,
  cz: (url) => `ℹ️ Živá otevírací doba pro toto místo zatím není k dispozici. Zkontrolujte <a href="${url}" target="_blank" rel="noopener">oficiální stránky</a> pro aktuální informace.`,
  fi: (url) => `ℹ️ Reaaliaikaiset aukioloajat eivät ole vielä saatavilla tälle paikalle. Tarkista <a href="${url}" target="_blank" rel="noopener">virallinen sivusto</a> ajantasaisia tietoja varten.`,
  gr: (url) => `ℹ️ Το ζωντανό ωράριο δεν είναι ακόμα διαθέσιμο για αυτό το μέρος. Ελέγξτε την <a href="${url}" target="_blank" rel="noopener">επίσημη ιστοσελίδα</a> για ενημερωμένες πληροφορίες.`,
  hu: (url) => `ℹ️ Az élő nyitvatartás még nem érhető el ehhez a helyhez. Nézd meg a <a href="${url}" target="_blank" rel="noopener">hivatalos oldalt</a> a friss információkért.`,
  hr: (url) => `ℹ️ Radno vrijeme uživo još nije dostupno za ovo mjesto. Provjerite <a href="${url}" target="_blank" rel="noopener">službenu stranicu</a> za ažurirane informacije.`,
  sk: (url) => `ℹ️ Živý otvárací čas pre toto miesto zatiaľ nie je k dispozícii. Skontrolujte <a href="${url}" target="_blank" rel="noopener">oficiálnu stránku</a> pre aktuálne informácie.`,
  si: (url) => `ℹ️ Delovni čas v živo za to mesto še ni na voljo. Preverite <a href="${url}" target="_blank" rel="noopener">uradno stran</a> za posodobljene informacije.`,
  lt: (url) => `ℹ️ Šiai vietai kol kas nėra prieinamas gyvas darbo laikas. Patikrinkite <a href="${url}" target="_blank" rel="noopener">oficialią svetainę</a> dėl naujausios informacijos.`,
  lv: (url) => `ℹ️ Šai vietai vēl nav pieejams tiešraides darba laiks. Pārbaudiet <a href="${url}" target="_blank" rel="noopener">oficiālo vietni</a>, lai iegūtu jaunāko informāciju.`,
  ee: (url) => `ℹ️ Selle koha kohta pole veel reaalajas lahtiolekuaegu saadaval. Vaata <a href="${url}" target="_blank" rel="noopener">ametlikku veebisaiti</a> värske info saamiseks.`,
}

exports.LIVE_GOOGLE_LABEL = {
  ro: "Live · Google", uk: "Live · Google", de: "Live · Google", es: "En vivo · Google", fr: "En direct · Google",
  it: "Live · Google", pl: "Na żywo · Google", nl: "Live · Google", da: "Live · Google", se: "Live · Google",
  pt: "Em direto · Google", cz: "Živě · Google", fi: "Live · Google", gr: "Ζωντανά · Google", hu: "Élő · Google",
  hr: "Uživo · Google", sk: "Naživo · Google", si: "V živo · Google", lt: "Tiesiogiai · Google", lv: "Tiešraidē · Google", ee: "Otse · Google",
}

exports.BOOKING_PLANNING_LABELS_RO = {
  title: "🅿️ Planifică vizita",
  hint: (name) => `Vezi cazări, parcare și bilete online pentru ${name} — toate într-un singur loc.`,
  ticket: "🎟️ Vrei să eviți coada? Cumpără bilet online",
  stays: "🏨 Vezi cazări în apropiere pe Booking.com",
  restaurant: "🍽️ Găsește și rezervă la restaurante în apropiere",
  parkingNearby: "🚗 Caută parcare în apropiere",
}

exports.BOOKING_PLANNING_LABELS_EN = {
  title: "🅿️ Plan your visit",
  hint: (name) => `Find nearby stays, parking, and online tickets for ${name} — all in one place.`,
  ticket: "🎟️ Want to skip the line? Buy tickets online",
  stays: "🏨 See nearby stays on Booking.com",
  restaurant: "🍽️ Find and book nearby restaurants",
  parkingNearby: "🚗 Search for parking nearby",
}

exports.CITY_FAQ_TEXTS = {
  ro: {
    title: "Întrebări frecvente",
    q1: (c) => `Cum pot afla dacă un magazin este deschis acum în ${c}?`,
    a1: "Alege magazinul din lista de mai sus — vezi instant statusul live, \"deschis\" sau \"închis\" chiar acum, actualizat automat pe baza orarului standard sau a datelor live de la Google.",
    q2: "Care este programul magazinelor de sărbători legale?",
    a2: "Fiecare pagină de magazin arată programul special pentru sărbătorile legale (Paște, Crăciun, 1 Mai și altele), actualizat pentru anul curent — inclusiv zilele cu program redus sau cu magazinul închis complet.",
  },
  uk: {
    title: "Frequently asked questions",
    q1: (c) => `How can I find out if a store is open right now in ${c}?`,
    a1: "Pick a store from the list above — you'll see its live status, \"open\" or \"closed\" right now, updated automatically based on standard hours or live Google data.",
    q2: "What are store hours during public holidays?",
    a2: "Each store's page shows its special hours for public holidays, updated for the current year — including reduced hours or full closures.",
  },
  de: {
    title: "Häufig gestellte Fragen",
    q1: (c) => `Wie kann ich herausfinden, ob ein Geschäft in ${c} gerade geöffnet ist?`,
    a1: "Wähle ein Geschäft aus der Liste oben — du siehst sofort den Live-Status, \"geöffnet\" oder \"geschlossen\", automatisch aktualisiert basierend auf den Standardöffnungszeiten oder Live-Daten von Google.",
    q2: "Wie sind die Öffnungszeiten an gesetzlichen Feiertagen?",
    a2: "Jede Geschäftsseite zeigt die speziellen Öffnungszeiten an Feiertagen, aktualisiert für das laufende Jahr — einschließlich reduzierter Öffnungszeiten oder vollständiger Schließungen.",
  },
  es: {
    title: "Preguntas frecuentes",
    q1: (c) => `¿Cómo puedo saber si una tienda está abierta ahora en ${c}?`,
    a1: "Elige una tienda de la lista de arriba — verás su estado en vivo, \"abierto\" o \"cerrado\" ahora mismo, actualizado automáticamente según el horario estándar o datos en vivo de Google.",
    q2: "¿Cuál es el horario de las tiendas en días festivos?",
    a2: "Cada página de tienda muestra su horario especial para los festivos, actualizado para el año en curso — incluyendo horarios reducidos o cierres completos.",
  },
  fr: {
    title: "Questions fréquentes",
    q1: (c) => `Comment puis-je savoir si un magasin est ouvert maintenant à ${c} ?`,
    a1: "Choisissez un magasin dans la liste ci-dessus — vous verrez son statut en direct, \"ouvert\" ou \"fermé\" à l'instant, mis à jour automatiquement selon les horaires standards ou les données en direct de Google.",
    q2: "Quels sont les horaires des magasins pendant les jours fériés ?",
    a2: "Chaque page de magasin affiche ses horaires spéciaux pour les jours fériés, mis à jour pour l'année en cours — y compris les horaires réduits ou les fermetures complètes.",
  },
  it: {
    title: "Domande frequenti",
    q1: (c) => `Come posso sapere se un negozio è aperto adesso a ${c}?`,
    a1: "Scegli un negozio dall'elenco sopra — vedrai il suo stato in tempo reale, \"aperto\" o \"chiuso\" in questo momento, aggiornato automaticamente in base agli orari standard o ai dati live di Google.",
    q2: "Quali sono gli orari dei negozi nei giorni festivi?",
    a2: "Ogni pagina del negozio mostra i suoi orari speciali per i giorni festivi, aggiornati per l'anno in corso — inclusi orari ridotti o chiusure complete.",
  },
  pl: {
    title: "Najczęściej zadawane pytania",
    q1: (c) => `Jak mogę sprawdzić, czy sklep jest teraz otwarty w ${c}?`,
    a1: "Wybierz sklep z listy powyżej — zobaczysz jego aktualny status na żywo, \"otwarte\" lub \"zamknięte\" w tej chwili, aktualizowany automatycznie na podstawie standardowych godzin lub danych na żywo z Google.",
    q2: "Jakie są godziny otwarcia sklepów w święta?",
    a2: "Każda strona sklepu pokazuje specjalne godziny otwarcia w święta, aktualizowane na bieżący rok — w tym skrócone godziny lub całkowite zamknięcia.",
  },
  nl: {
    title: "Veelgestelde vragen",
    q1: (c) => `Hoe kan ik zien of een winkel nu open is in ${c}?`,
    a1: "Kies een winkel uit de lijst hierboven — je ziet direct de live status, \"open\" of \"gesloten\" op dit moment, automatisch bijgewerkt op basis van standaardtijden of live gegevens van Google.",
    q2: "Wat zijn de openingstijden tijdens feestdagen?",
    a2: "Elke winkelpagina toont de speciale openingstijden voor feestdagen, bijgewerkt voor het huidige jaar — inclusief verkorte openingstijden of volledige sluitingen.",
  },
  da: {
    title: "Ofte stillede spørgsmål",
    q1: (c) => `Hvordan kan jeg finde ud af, om en butik har åbent lige nu i ${c}?`,
    a1: "Vælg en butik fra listen ovenfor — du ser dens live-status, \"åben\" eller \"lukket\" lige nu, opdateret automatisk baseret på standardåbningstider eller live-data fra Google.",
    q2: "Hvad er butikkernes åbningstider i helligdage?",
    a2: "Hver butiksside viser dens særlige åbningstider for helligdage, opdateret for det aktuelle år — inklusive reducerede timer eller fuld lukning.",
  },
  se: {
    title: "Vanliga frågor",
    q1: (c) => `Hur kan jag ta reda på om en butik är öppen just nu i ${c}?`,
    a1: "Välj en butik från listan ovan — du ser dess live-status, \"öppet\" eller \"stängt\" just nu, automatiskt uppdaterad baserat på standardtider eller live-data från Google.",
    q2: "Vilka är butikernas öppettider under helgdagar?",
    a2: "Varje butikssida visar dess särskilda öppettider för helgdagar, uppdaterad för innevarande år — inklusive begränsade tider eller full stängning.",
  },
  pt: {
    title: "Perguntas frequentes",
    q1: (c) => `Como posso saber se uma loja está aberta agora em ${c}?`,
    a1: "Escolha uma loja da lista acima — verá o seu estado em tempo real, \"aberto\" ou \"fechado\" agora mesmo, atualizado automaticamente com base no horário padrão ou em dados em tempo real do Google.",
    q2: "Qual é o horário das lojas nos feriados?",
    a2: "Cada página de loja mostra o seu horário especial para feriados, atualizado para o ano atual — incluindo horários reduzidos ou encerramentos completos.",
  },
  cz: {
    title: "Často kladené otázky",
    q1: (c) => `Jak zjistím, zda je obchod v ${c} nyní otevřený?`,
    a1: "Vyberte obchod ze seznamu výše — uvidíte jeho aktuální stav v reálném čase, \"otevřeno\" nebo \"zavřeno\" právě teď, automaticky aktualizovaný na základě standardní otevírací doby nebo živých dat z Google.",
    q2: "Jaká je otevírací doba obchodů o státních svátcích?",
    a2: "Každá stránka obchodu zobrazuje svou zvláštní otevírací dobu pro státní svátky, aktualizovanou pro aktuální rok — včetně zkrácené doby nebo úplného uzavření.",
  },
  fi: {
    title: "Usein kysytyt kysymykset",
    q1: (c) => `Miten voin selvittää, onko kauppa auki juuri nyt kaupungissa ${c}?`,
    a1: "Valitse kauppa yllä olevasta listasta — näet sen reaaliaikaisen tilan, \"auki\" tai \"kiinni\" juuri nyt, automaattisesti päivitettynä vakioaukioloaikojen tai Googlen reaaliaikaisten tietojen perusteella.",
    q2: "Mitkä ovat kauppojen aukioloajat pyhäpäivinä?",
    a2: "Jokainen kaupan sivu näyttää sen erityisen aukioloajan pyhäpäivinä, päivitettynä kuluvalle vuodelle — mukaan lukien lyhennetyt ajat tai täydelliset sulkemiset.",
  },
  gr: {
    title: "Συχνές ερωτήσεις",
    q1: (c) => `Πώς μπορώ να μάθω αν ένα κατάστημα είναι ανοιχτό αυτή τη στιγμή στην ${c};`,
    a1: "Επιλέξτε ένα κατάστημα από τη λίστα παραπάνω — θα δείτε αμέσως την ζωντανή κατάστασή του, \"ανοιχτό\" ή \"κλειστό\" αυτή τη στιγμή, ενημερωμένη αυτόματα βάσει του τυπικού ωραρίου ή ζωντανών δεδομένων από την Google.",
    q2: "Ποιο είναι το ωράριο των καταστημάτων τις επίσημες αργίες;",
    a2: "Κάθε σελίδα καταστήματος εμφανίζει το ειδικό της ωράριο για τις επίσημες αργίες, ενημερωμένο για το τρέχον έτος — συμπεριλαμβανομένων μειωμένων ωρών ή πλήρους κλεισίματος.",
  },
  hu: {
    title: "Gyakran ismételt kérdések",
    q1: (c) => `Honnan tudhatom meg, hogy egy üzlet most éppen nyitva van-e ${c} városban?`,
    a1: "Válassz egy üzletet a fenti listából — azonnal láthatod az élő állapotát, \"nyitva\" vagy \"zárva\" éppen most, automatikusan frissítve a szokásos nyitvatartás vagy a Google élő adatai alapján.",
    q2: "Milyen a boltok nyitvatartása munkaszüneti napokon?",
    a2: "Minden üzlet oldala megjeleníti a munkaszüneti napokra vonatkozó speciális nyitvatartását, frissítve a jelenlegi évre — beleértve a csökkentett nyitvatartást vagy a teljes zárva tartást.",
  },
  hr: {
    title: "Često postavljana pitanja",
    q1: (c) => `Kako mogu saznati je li trgovina sada otvorena u ${c}?`,
    a1: "Odaberite trgovinu s popisa iznad — vidjet ćete njezin trenutni status uživo, \"otvoreno\" ili \"zatvoreno\" upravo sada, automatski ažuriran na temelju standardnog radnog vremena ili podataka uživo s Googlea.",
    q2: "Koje je radno vrijeme trgovina za državne praznike?",
    a2: "Svaka stranica trgovine prikazuje svoje posebno radno vrijeme za državne praznike, ažurirano za tekuću godinu — uključujući skraćeno radno vrijeme ili potpuno zatvaranje.",
  },
  sk: {
    title: "Často kladené otázky",
    q1: (c) => `Ako zistím, či je obchod v meste ${c} teraz otvorený?`,
    a1: "Vyberte obchod zo zoznamu vyššie — okamžite uvidíte jeho aktuálny stav naživo, \"otvorené\" alebo \"zatvorené\" práve teraz, automaticky aktualizovaný na základe štandardného otváracieho času alebo živých údajov z Google.",
    q2: "Aký je otvárací čas obchodov počas štátnych sviatkov?",
    a2: "Každá stránka obchodu zobrazuje jeho špeciálny otvárací čas počas štátnych sviatkov, aktualizovaný pre aktuálny rok — vrátane skráteného času alebo úplného zatvorenia.",
  },
  si: {
    title: "Pogosta vprašanja",
    q1: (c) => `Kako lahko izvem, ali je trgovina zdaj odprta v mestu ${c}?`,
    a1: "Izberite trgovino s seznama zgoraj — takoj boste videli njen trenutni status v živo, \"odprto\" ali \"zaprto\" ravno zdaj, samodejno posodobljen na podlagi standardnega delovnega časa ali podatkov v živo iz Googla.",
    q2: "Kakšen je delovni čas trgovin ob državnih praznikih?",
    a2: "Vsaka stran trgovine prikazuje svoj poseben delovni čas ob državnih praznikih, posodobljen za trenutno leto — vključno s skrajšanim delovnim časom ali popolnim zaprtjem.",
  },
  lt: {
    title: "Dažnai užduodami klausimai",
    q1: (c) => `Kaip galiu sužinoti, ar parduotuvė dabar atidaryta mieste ${c}?`,
    a1: "Pasirinkite parduotuvę iš aukščiau esančio sąrašo — iš karto pamatysite jos gyvą būseną, \"atidaryta\" arba \"uždaryta\" dabar, automatiškai atnaujinamą pagal standartinį darbo laiką arba gyvus „Google“ duomenis.",
    q2: "Koks yra parduotuvių darbo laikas švenčių dienomis?",
    a2: "Kiekvienas parduotuvės puslapis rodo specialų darbo laiką švenčių dienomis, atnaujintą einamiesiems metams — įskaitant sutrumpintą darbo laiką arba visišką uždarymą.",
  },
  lv: {
    title: "Biežāk uzdotie jautājumi",
    q1: (c) => `Kā es varu uzzināt, vai veikals tagad ir atvērts pilsētā ${c}?`,
    a1: "Izvēlieties veikalu no saraksta augstāk — jūs uzreiz redzēsiet tā tiešraides statusu, \"atvērts\" vai \"slēgts\" pašlaik, automātiski atjaunināts, pamatojoties uz standarta darba laiku vai Google tiešraides datiem.",
    q2: "Kāds ir veikalu darba laiks svētku dienās?",
    a2: "Katra veikala lapa parāda savu īpašo darba laiku svētku dienās, atjauninātu pašreizējam gadam — ieskaitot samazinātu darba laiku vai pilnīgu slēgšanu.",
  },
  ee: {
    title: "Korduma kippuvad küsimused",
    q1: (c) => `Kuidas ma saan teada, kas pood on linnas ${c} praegu avatud?`,
    a1: "Vali pood ülaltoodud loendist — näed kohe selle reaalajas olekut, \"avatud\" või \"suletud\" praegu, automaatselt uuendatud standardse lahtiolekuaja või Google'i reaalajas andmete alusel.",
    q2: "Millised on poodide lahtiolekuajad riigipühadel?",
    a2: "Iga poe lehekülg näitab selle erilist lahtiolekuaega riigipühadel, uuendatud käesolevaks aastaks — sealhulgas lühendatud aegu või täielikku sulgemist.",
  },
}

exports.REPORT_ISSUE_LABELS_RO = {
  btn: "🚩 Programul e corect sau locul nu mai există? Spune-ne, ajuți alți vizitatori!",
  q1: (name) => `Este ${name} deschis chiar acum?`,
  yes: "Da",
  no: "Nu",
  q2: "Magazinul e închis definitiv, nu mai există la această locație?",
  thanksOpen: "✅ Mulțumim pentru confirmare! Ne ajuți să ținem informația corectă, pentru toată lumea.",
  thanksReport: "✅ Mulțumim că ești alături de noi pentru cea mai bună experiență a utilizatorilor!",
  error: "Nu am putut trimite raportarea. Încearcă din nou.",
  alreadyReported: "Mulțumim, am primit deja mesajul tău — nu poți trimite o altă raportare pentru această locație.",
}

exports.REPORT_ISSUE_LABELS_EN = {
  btn: "🚩 Is the schedule right, or is this place gone? Let us know — help other visitors!",
  q1: (name) => `Is ${name} open right now?`,
  yes: "Yes",
  no: "No",
  q2: "Is this store permanently closed or gone from this location?",
  thanksOpen: "✅ Thanks for confirming! You're helping us keep this accurate for everyone.",
  thanksReport: "✅ Thank you for being with us in building the best experience for our users!",
  error: "Couldn't send the report. Try again.",
  alreadyReported: "Thanks, we already received your report — you can't submit another one for this place.",
}

exports.CLOSED_PERMANENTLY_LABELS_RO = {
  title: "🚫 Magazin închis definitiv sau mutat",
  text: "Evaluare realizată pe baza confirmărilor de la utilizatori.",
}

exports.CLOSED_PERMANENTLY_LABELS_EN = {
  title: "🚫 Permanently closed or relocated",
  text: "Based on confirmations from other users.",
}

exports.REPORTED_WRONG_LABELS_RO = "⚠️ Mai mulți utilizatori au raportat că programul afișat ar putea fi greșit. Verifică, dacă poți, la fața locului.";

exports.REPORTED_WRONG_LABELS_EN = "⚠️ Several users have reported the displayed hours might be wrong. Please double-check if you can.";

exports.HOW_TO_GET_THERE_LABELS_RO = {
  btn: "🚗 Cum ajung acolo?",
  waze: "🧭 Mergi acolo (Waze)",
  optionA: "🚕 Rezervă un Taxi/Transfer local",
  optionB: "🚆 Caută Tren/Autobuz în Europa",
}

exports.HOW_TO_GET_THERE_LABELS_EN = {
  btn: "🚗 How do I get there?",
  waze: "🧭 Go there (Waze)",
  optionA: "🚕 Book a local Taxi/Transfer",
  optionB: "🚆 Search Train/Bus in Europe",
}

exports.NO_RESULTS_ITINERARY_LABELS = {
  ro: { text: "😴 Nimic deschis acum pe aici.", cta: "Planifică vizita pentru mai târziu, cu ajutorul AI-ului →" },
  uk: { text: "😴 Nothing open right now.", cta: "Plan your visit for later, with AI's help →" },
  de: { text: "😴 Gerade ist nichts geöffnet.", cta: "Plane deinen Besuch für später, mit Hilfe der KI →" },
  fr: { text: "😴 Rien n'est ouvert en ce moment.", cta: "Planifiez votre visite pour plus tard, avec l'aide de l'IA →" },
  es: { text: "😴 Nada abierto ahora mismo.", cta: "Planifica tu visita para más tarde, con ayuda de la IA →" },
  it: { text: "😴 Niente di aperto in questo momento.", cta: "Pianifica la tua visita per dopo, con l'aiuto dell'IA →" },
  pl: { text: "😴 Nic teraz nie jest otwarte.", cta: "Zaplanuj wizytę na później, z pomocą AI →" },
  nl: { text: "😴 Nu is er niets geopend.", cta: "Plan je bezoek voor later, met hulp van AI →" },
  da: { text: "😴 Der er intet åbent lige nu.", cta: "Planlæg dit besøg til senere, med hjælp fra AI →" },
  cz: { text: "😴 Právě teď nic není otevřené.", cta: "Naplánujte si návštěvu na později, s pomocí AI →" },
  fi: { text: "😴 Mikään ei ole nyt auki.", cta: "Suunnittele vierailusi myöhemmäksi, tekoälyn avulla →" },
  gr: { text: "😴 Τίποτα δεν είναι ανοιχτό αυτή τη στιγμή.", cta: "Προγραμματίστε την επίσκεψή σας για αργότερα, με τη βοήθεια του AI →" },
  hu: { text: "😴 Most semmi sincs nyitva.", cta: "Tervezd meg a látogatásod későbbre, mesterséges intelligencia segítségével →" },
  hr: { text: "😴 Trenutno ništa nije otvoreno.", cta: "Planirajte posjet za kasnije, uz pomoć AI-ja →" },
  sk: { text: "😴 Práve teraz nič nie je otvorené.", cta: "Naplánujte si návštevu na neskôr, s pomocou AI →" },
  si: { text: "😴 Trenutno nič ni odprto.", cta: "Načrtujte obisk za kasneje, s pomočjo AI →" },
  lt: { text: "😴 Dabar niekas neveikia.", cta: "Suplanuokite apsilankymą vėliau, pasitelkę DI →" },
  lv: { text: "😴 Šobrīd nekas nav atvērts.", cta: "Ieplānojiet apmeklējumu vēlākam laikam, ar MI palīdzību →" },
  pt: { text: "😴 Não há nada aberto agora.", cta: "Planeia a tua visita para mais tarde, com ajuda da IA →" },
  se: { text: "😴 Inget är öppet just nu.", cta: "Planera ditt besök till senare, med hjälp av AI →" },
  ee: { text: "😴 Praegu pole midagi avatud.", cta: "Planeeri oma külastus hiljemaks, tehisintellekti abiga →" },
}

exports.CONTEXTUAL_WIDGET_LABELS_RO = {
  ticketOpen: "🎟️ Vrei să eviți coada? Cumpără bilet online",
  closedAlert: "⚠️ Locația este închisă în acest moment. Iată alternativele tale:",
  booking: "🏨 Cazări active pe Booking, în apropiere",
  restaurants: "🍽️ Restaurante deschise acum, în apropiere",
  glovo: "🛵 Comandă cu Glovo",
  bringo: "🛒 Comandă cu Bringo",
}

exports.MALL_CINEMA_LABELS = {
  uk: {
    shoppingZone: "Shopping zone",
    hypermarketZone: "Hypermarket in the mall",
    mallScheduleTitle: "Mall store hours",
    mallHypermarketTitle: "Mall hypermarket hours",
    cinemaNote: "Movie schedules change daily depending on the week's releases — we don't show a fixed \"open\" or \"closed\" status here, to avoid giving you approximate information.",
    cinemaBtn: "🎬 See today's movie schedule",
  },
  ro: {
    shoppingZone: "Zonă shopping",
    hypermarketZone: "Hipermarket din mall",
    mallScheduleTitle: "Orar magazine mall",
    mallHypermarketTitle: "Program hipermarket din mall",
    cinemaNote: "Programul de filme se schimbă zilnic, în funcție de premierele săptămânii — nu afișăm aici un status fix „deschis” sau „închis”, ca să nu-ți dăm o informație aproximativă.",
    cinemaBtn: "🎬 Vezi orarul filmelor de azi",
  },
}

exports.CONTEXTUAL_WIDGET_LABELS_EN = {
  ticketOpen: "🎟️ Want to skip the line? Buy tickets online",
  closedAlert: "⚠️ This place is closed right now. Here are your alternatives:",
  booking: "🏨 Available stays on Booking, nearby",
  restaurants: "🍽️ Restaurants open now, nearby",
  glovo: "🛵 Order with Glovo",
  bringo: "🛒 Order with Bringo",
}

exports.ACCORDION_TEXTS = {
  "ro": {
    "status": "🕐 Vezi dacă e deschis acum, live",
    "ticket": "🎟️ Rezervă bilet online"
  },
  "uk": {
    "status": "🕐 See if it's open right now, live",
    "ticket": "🎟️ Book tickets online"
  },
  "de": {
    "status": "🕐 Sieh, ob es gerade geöffnet ist, live",
    "ticket": "🎟️ Ticket online buchen"
  },
  "es": {
    "status": "🕐 Ve si está abierto ahora mismo, en vivo",
    "ticket": "🎟️ Reserva entrada online"
  },
  "fr": {
    "status": "🕐 Voyez si c'est ouvert en ce moment, en direct",
    "ticket": "🎟️ Réservez un billet en ligne"
  },
  "it": {
    "status": "🕐 Scopri se è aperto proprio ora, live",
    "ticket": "🎟️ Prenota il biglietto online"
  },
  "pl": {
    "status": "🕐 Sprawdź, czy jest teraz otwarte, na żywo",
    "ticket": "🎟️ Zarezerwuj bilet online"
  },
  "nl": {
    "status": "🕐 Bekijk of het nu open is, live",
    "ticket": "🎟️ Boek een ticket online"
  },
  "da": {
    "status": "🕐 Se om der har åbent lige nu, live",
    "ticket": "🎟️ Book billet online"
  },
  "se": {
    "status": "🕐 Se om det är öppet just nu, live",
    "ticket": "🎟️ Boka biljett online"
  },
  "pt": {
    "status": "🕐 Veja se está aberto agora mesmo, ao vivo",
    "ticket": "🎟️ Reserve bilhete online"
  },
  "cz": {
    "status": "🕐 Zjistěte, zda je právě teď otevřeno, živě",
    "ticket": "🎟️ Rezervovat vstupenku online"
  },
  "fi": {
    "status": "🕐 Katso, onko auki juuri nyt, reaaliajassa",
    "ticket": "🎟️ Varaa lippu verkossa"
  },
  "gr": {
    "status": "🕐 Δείτε αν είναι ανοιχτό αυτή τη στιγμή, ζωντανά",
    "ticket": "🎟️ Κλείστε εισιτήριο online"
  },
  "hu": {
    "status": "🕐 Nézd meg, hogy most nyitva van-e, élőben",
    "ticket": "🎟️ Foglalj jegyet online"
  },
  "hr": {
    "status": "🕐 Pogledajte je li sada otvoreno, uživo",
    "ticket": "🎟️ Rezervirajte ulaznicu online"
  },
  "sk": {
    "status": "🕐 Pozrite, či je práve teraz otvorené, naživo",
    "ticket": "🎟️ Rezervovať lístok online"
  },
  "si": {
    "status": "🕐 Poglejte, ali je zdaj odprto, v živo",
    "ticket": "🎟️ Rezervirajte vstopnico online"
  },
  "lt": {
    "status": "🕐 Sužinokite, ar dabar atidaryta, tiesiogiai",
    "ticket": "🎟️ Rezervuoti bilietą internetu"
  },
  "lv": {
    "status": "🕐 Uzziniet, vai tagad ir atvērts, tiešraidē",
    "ticket": "🎟️ Rezervēt biļeti tiešsaistē"
  },
  "ee": {
    "status": "🕐 Vaata, kas praegu on avatud, reaalajas",
    "ticket": "🎟️ Broneeri pilet veebis"
  }
}

exports.ATTRACTION_PREFIX_TRANSLATIONS = {
  "Plaja": { ro: "Plaja", uk: "Beach", de: "Strand", es: "Playa", fr: "Plage", it: "Spiaggia", pl: "Plaża", nl: "Strand", da: "Stranden", se: "Stranden", pt: "Praia", cz: "Pláž", fi: "Ranta", gr: "Παραλία", hu: "Strand", hr: "Plaža", sk: "Pláž", si: "Plaža", lt: "Paplūdimys", lv: "Pludmale", ee: "Rand" },
  "Golful": { ro: "Golful", uk: "Bay", de: "Bucht", es: "Bahía", fr: "Baie", it: "Baia", pl: "Zatoka", nl: "Baai", da: "Bugten", se: "Viken", pt: "Baía", cz: "Záliv", fi: "Lahti", gr: "Κόλπος", hu: "Öböl", hr: "Uvala", sk: "Zátoka", si: "Zaliv", lt: "Įlanka", lv: "Līcis", ee: "Laht" },
  "Bazinul": { ro: "Bazinul", uk: "Pool", de: "Becken", es: "Piscina", fr: "Piscine", it: "Piscina", pl: "Basen", nl: "Zwembad", da: "Bassinet", se: "Bassängen", pt: "Piscina", cz: "Bazén", fi: "Allas", gr: "Πισίνα", hu: "Medence", hr: "Bazen", sk: "Bazén", si: "Bazen", lt: "Baseinas", lv: "Baseins", ee: "Bassein" },
  "Laguna": { ro: "Laguna", uk: "Lagoon", de: "Lagune", es: "Laguna", fr: "Lagune", it: "Laguna", pl: "Laguna", nl: "Lagune", da: "Lagunen", se: "Lagunen", pt: "Lagoa", cz: "Laguna", fi: "Laguuni", gr: "Λιμνοθάλασσα", hu: "Lagúna", hr: "Laguna", sk: "Laguna", si: "Laguna", lt: "Lagūna", lv: "Lagūna", ee: "Laguun" },
  "Muzeul": { ro: "Muzeul", uk: "Museum", de: "Museum", es: "Museo", fr: "Musée", it: "Museo", pl: "Muzeum", nl: "Museum", da: "Museet", se: "Museet", pt: "Museu", cz: "Muzeum", fi: "Museo", gr: "Μουσείο", hu: "Múzeum", hr: "Muzej", sk: "Múzeum", si: "Muzej", lt: "Muziejus", lv: "Muzejs", ee: "Muuseum" },
  "Castelul": { ro: "Castelul", uk: "Castle", de: "Schloss", es: "Castillo", fr: "Château", it: "Castello", pl: "Zamek", nl: "Kasteel", da: "Slottet", se: "Slottet", pt: "Castelo", cz: "Hrad", fi: "Linna", gr: "Κάστρο", hu: "Vár", hr: "Dvorac", sk: "Hrad", si: "Grad", lt: "Pilis", lv: "Pils", ee: "Loss" },
  "Biserica": { ro: "Biserica", uk: "Church", de: "Kirche", es: "Iglesia", fr: "Église", it: "Chiesa", pl: "Kościół", nl: "Kerk", da: "Kirken", se: "Kyrkan", pt: "Igreja", cz: "Kostel", fi: "Kirkko", gr: "Εκκλησία", hu: "Templom", hr: "Crkva", sk: "Kostol", si: "Cerkev", lt: "Bažnyčia", lv: "Baznīca", ee: "Kirik" },
  "Parcul": { ro: "Parcul", uk: "Park", de: "Park", es: "Parque", fr: "Parc", it: "Parco", pl: "Park", nl: "Park", da: "Parken", se: "Parken", pt: "Parque", cz: "Park", fi: "Puisto", gr: "Πάρκο", hu: "Park", hr: "Park", sk: "Park", si: "Park", lt: "Parkas", lv: "Parks", ee: "Park" },
  "Catedrala": { ro: "Catedrala", uk: "Cathedral", de: "Kathedrale", es: "Catedral", fr: "Cathédrale", it: "Cattedrale", pl: "Katedra", nl: "Kathedraal", da: "Katedralen", se: "Katedralen", pt: "Catedral", cz: "Katedrála", fi: "Katedraali", gr: "Καθεδρικός Ναός", hu: "Katedrális", hr: "Katedrala", sk: "Katedrála", si: "Katedrala", lt: "Katedra", lv: "Katedrāle", ee: "Katedraal" },
  "Palatul": { ro: "Palatul", uk: "Palace", de: "Palast", es: "Palacio", fr: "Palais", it: "Palazzo", pl: "Pałac", nl: "Paleis", da: "Paladset", se: "Palatset", pt: "Palácio", cz: "Palác", fi: "Palatsi", gr: "Παλάτι", hu: "Palota", hr: "Palača", sk: "Palác", si: "Palača", lt: "Rūmai", lv: "Pils", ee: "Palee" },
  "Cetatea": { ro: "Cetatea", uk: "Citadel", de: "Zitadelle", es: "Ciudadela", fr: "Citadelle", it: "Cittadella", pl: "Cytadela", nl: "Citadel", da: "Citadellet", se: "Citadellet", pt: "Cidadela", cz: "Citadela", fi: "Linnoitus", gr: "Ακρόπολη", hu: "Fellegvár", hr: "Citadela", sk: "Citadela", si: "Citadela", lt: "Citadelė", lv: "Citadele", ee: "Kindlus" },
  "Mănăstirea": { ro: "Mănăstirea", uk: "Monastery", de: "Kloster", es: "Monasterio", fr: "Monastère", it: "Monastero", pl: "Klasztor", nl: "Klooster", da: "Klosteret", se: "Klostret", pt: "Mosteiro", cz: "Klášter", fi: "Luostari", gr: "Μονή", hu: "Kolostor", hr: "Samostan", sk: "Kláštor", si: "Samostan", lt: "Vienuolynas", lv: "Klosteris", ee: "Klooster" },
  "Manastirea": { ro: "Mănăstirea", uk: "Monastery", de: "Kloster", es: "Monasterio", fr: "Monastère", it: "Monastero", pl: "Klasztor", nl: "Klooster", da: "Klosteret", se: "Klostret", pt: "Mosteiro", cz: "Klášter", fi: "Luostari", gr: "Μονή", hu: "Kolostor", hr: "Samostan", sk: "Kláštor", si: "Samostan", lt: "Vienuolynas", lv: "Klosteris", ee: "Klooster" },
  "Turnul": { ro: "Turnul", uk: "Tower", de: "Turm", es: "Torre", fr: "Tour", it: "Torre", pl: "Wieża", nl: "Toren", da: "Tårnet", se: "Tornet", pt: "Torre", cz: "Věž", fi: "Torni", gr: "Πύργος", hu: "Torony", hr: "Toranj", sk: "Veža", si: "Stolp", lt: "Bokštas", lv: "Tornis", ee: "Torn" },
  "Podul": { ro: "Podul", uk: "Bridge", de: "Brücke", es: "Puente", fr: "Pont", it: "Ponte", pl: "Most", nl: "Brug", da: "Broen", se: "Bron", pt: "Ponte", cz: "Most", fi: "Silta", gr: "Γέφυρα", hu: "Híd", hr: "Most", sk: "Most", si: "Most", lt: "Tiltas", lv: "Tilts", ee: "Sild" },
  "Teatrul": { ro: "Teatrul", uk: "Theatre", de: "Theater", es: "Teatro", fr: "Théâtre", it: "Teatro", pl: "Teatr", nl: "Theater", da: "Teatret", se: "Teatern", pt: "Teatro", cz: "Divadlo", fi: "Teatteri", gr: "Θέατρο", hu: "Színház", hr: "Kazalište", sk: "Divadlo", si: "Gledališče", lt: "Teatras", lv: "Teātris", ee: "Teater" },
  "Lacul": { ro: "Lacul", uk: "Lake", de: "See", es: "Lago", fr: "Lac", it: "Lago", pl: "Jezioro", nl: "Meer", da: "Søen", se: "Sjön", pt: "Lago", cz: "Jezero", fi: "Järvi", gr: "Λίμνη", hu: "Tó", hr: "Jezero", sk: "Jazero", si: "Jezero", lt: "Ežeras", lv: "Ezers", ee: "Järv" },
  "Zidurile": { ro: "Zidurile", uk: "Walls", de: "Mauern", es: "Murallas", fr: "Murailles", it: "Mura", pl: "Mury", nl: "Muren", da: "Murene", se: "Murarna", pt: "Muralhas", cz: "Hradby", fi: "Muurit", gr: "Τείχη", hu: "Falak", hr: "Zidine", sk: "Hradby", si: "Obzidje", lt: "Sienos", lv: "Mūri", ee: "Müürid" },
  "Peșterile": { ro: "Peșterile", uk: "Caves", de: "Höhlen", es: "Cuevas", fr: "Grottes", it: "Grotte", pl: "Jaskinie", nl: "Grotten", da: "Grotterne", se: "Grottorna", pt: "Grutas", cz: "Jeskyně", fi: "Luolat", gr: "Σπήλαια", hu: "Barlangok", hr: "Špilje", sk: "Jaskyne", si: "Jame", lt: "Urvai", lv: "Alas", ee: "Koopad" },
  "Peștera": { ro: "Peștera", uk: "Cave", de: "Höhle", es: "Cueva", fr: "Grotte", it: "Grotta", pl: "Jaskinia", nl: "Grot", da: "Grotten", se: "Grottan", pt: "Gruta", cz: "Jeskyně", fi: "Luola", gr: "Σπήλαιο", hu: "Barlang", hr: "Špilja", sk: "Jaskyňa", si: "Jama", lt: "Urvas", lv: "Ala", ee: "Koobas" },
  "Pestera": { ro: "Peștera", uk: "Cave", de: "Höhle", es: "Cueva", fr: "Grotte", it: "Grotta", pl: "Jaskinia", nl: "Grot", da: "Grotten", se: "Grottan", pt: "Gruta", cz: "Jeskyně", fi: "Luola", gr: "Σπήλαιο", hu: "Barlang", hr: "Špilja", sk: "Jaskyňa", si: "Jama", lt: "Urvas", lv: "Ala", ee: "Koobas" },
  "Bazilica": { ro: "Bazilica", uk: "Basilica", de: "Basilika", es: "Basílica", fr: "Basilique", it: "Basilica", pl: "Bazylika", nl: "Basiliek", da: "Basilikaen", se: "Basilikan", pt: "Basílica", cz: "Bazilika", fi: "Basilika", gr: "Βασιλική", hu: "Bazilika", hr: "Bazilika", sk: "Bazilika", si: "Bazilika", lt: "Bazilika", lv: "Bazilika", ee: "Basiilika" },
  "Piața": { ro: "Piața", uk: "Square", de: "Platz", es: "Plaza", fr: "Place", it: "Piazza", pl: "Plac", nl: "Plein", da: "Pladsen", se: "Torget", pt: "Praça", cz: "Náměstí", fi: "Aukio", gr: "Πλατεία", hu: "Tér", hr: "Trg", sk: "Námestie", si: "Trg", lt: "Aikštė", lv: "Laukums", ee: "Väljak" },
  "Piata": { ro: "Piața", uk: "Square", de: "Platz", es: "Plaza", fr: "Place", it: "Piazza", pl: "Plac", nl: "Plein", da: "Pladsen", se: "Torget", pt: "Praça", cz: "Náměstí", fi: "Aukio", gr: "Πλατεία", hu: "Tér", hr: "Trg", sk: "Námestie", si: "Trg", lt: "Aikštė", lv: "Laukums", ee: "Väljak" },
  "Situl": { ro: "Situl", uk: "Site", de: "Stätte", es: "Sitio", fr: "Site", it: "Sito", pl: "Stanowisko", nl: "Site", da: "Stedet", se: "Platsen", pt: "Sítio", cz: "Naleziště", fi: "Kohde", gr: "Χώρος", hu: "Lelőhely", hr: "Nalazište", sk: "Náleziská", si: "Najdišče", lt: "Vieta", lv: "Vieta", ee: "Ala" },
  "Cheile": { ro: "Cheile", uk: "Gorge", de: "Schlucht", es: "Desfiladero", fr: "Gorges", it: "Gola", pl: "Wąwóz", nl: "Kloof", da: "Kløften", se: "Klyftan", pt: "Desfiladeiro", cz: "Soutěska", fi: "Rotko", gr: "Φαράγγι", hu: "Szurdok", hr: "Klanac", sk: "Tiesňava", si: "Soteska", lt: "Tarpeklis", lv: "Aiza", ee: "Kanjon" },
  "Casa": { ro: "Casa", uk: "House", de: "Haus", es: "Casa", fr: "Maison", it: "Casa", pl: "Dom", nl: "Huis", da: "Huset", se: "Huset", pt: "Casa", cz: "Dům", fi: "Talo", gr: "Σπίτι", hu: "Ház", hr: "Kuća", sk: "Dom", si: "Hiša", lt: "Namas", lv: "Māja", ee: "Maja" },
  "Cascada": { ro: "Cascada", uk: "Waterfall", de: "Wasserfall", es: "Cascada", fr: "Cascade", it: "Cascata", pl: "Wodospad", nl: "Waterval", da: "Vandfaldet", se: "Vattenfallet", pt: "Cascata", cz: "Vodopád", fi: "Vesiputous", gr: "Καταρράκτης", hu: "Vízesés", hr: "Vodopad", sk: "Vodopád", si: "Slap", lt: "Krioklys", lv: "Ūdenskritums", ee: "Juga" },
  "Gara": { ro: "Gara", uk: "Station", de: "Bahnhof", es: "Estación", fr: "Gare", it: "Stazione", pl: "Dworzec", nl: "Station", da: "Banegården", se: "Stationen", pt: "Estação", cz: "Nádraží", fi: "Asema", gr: "Σταθμός", hu: "Pályaudvar", hr: "Kolodvor", sk: "Stanica", si: "Postaja", lt: "Stotis", lv: "Stacija", ee: "Jaam" },
  "Fortăreața": { ro: "Fortăreața", uk: "Fortress", de: "Festung", es: "Fortaleza", fr: "Forteresse", it: "Fortezza", pl: "Twierdza", nl: "Vesting", da: "Fæstningen", se: "Fästningen", pt: "Fortaleza", cz: "Pevnost", fi: "Linnoitus", gr: "Φρούριο", hu: "Erőd", hr: "Tvrđava", sk: "Pevnosť", si: "Trdnjava", lt: "Tvirtovė", lv: "Cietoksnis", ee: "Kindlus" },
  "Rezervația": { ro: "Rezervația", uk: "Reserve", de: "Reservat", es: "Reserva", fr: "Réserve", it: "Riserva", pl: "Rezerwat", nl: "Reservaat", da: "Reservatet", se: "Reservatet", pt: "Reserva", cz: "Rezervace", fi: "Luonnonsuojelualue", gr: "Καταφύγιο", hu: "Rezervátum", hr: "Rezervat", sk: "Rezervácia", si: "Rezervat", lt: "Rezervatas", lv: "Rezervāts", ee: "Kaitseala" },
  "Grădinile": { ro: "Grădinile", uk: "Gardens", de: "Gärten", es: "Jardines", fr: "Jardins", it: "Giardini", pl: "Ogrody", nl: "Tuinen", da: "Haverne", se: "Trädgårdarna", pt: "Jardins", cz: "Zahrady", fi: "Puutarhat", gr: "Κήποι", hu: "Kertek", hr: "Vrtovi", sk: "Záhrady", si: "Vrtovi", lt: "Sodai", lv: "Dārzi", ee: "Aiad" },
  "Gradina": { ro: "Grădina", uk: "Garden", de: "Garten", es: "Jardín", fr: "Jardin", it: "Giardino", pl: "Ogród", nl: "Tuin", da: "Haven", se: "Trädgården", pt: "Jardim", cz: "Zahrada", fi: "Puutarha", gr: "Κήπος", hu: "Kert", hr: "Vrt", sk: "Záhrada", si: "Vrt", lt: "Sodas", lv: "Dārzs", ee: "Aed" },
  "Galeria": { ro: "Galeria", uk: "Gallery", de: "Galerie", es: "Galería", fr: "Galerie", it: "Galleria", pl: "Galeria", nl: "Galerie", da: "Galleriet", se: "Galleriet", pt: "Galeria", cz: "Galerie", fi: "Galleria", gr: "Πινακοθήκη", hu: "Galéria", hr: "Galerija", sk: "Galéria", si: "Galerija", lt: "Galerija", lv: "Galerija", ee: "Galerii" },
  "Arcul": { ro: "Arcul", uk: "Arch", de: "Bogen", es: "Arco", fr: "Arc", it: "Arco", pl: "Łuk", nl: "Boog", da: "Buen", se: "Bågen", pt: "Arco", cz: "Oblouk", fi: "Kaari", gr: "Αψίδα", hu: "Diadalív", hr: "Slavoluk", sk: "Oblúk", si: "Slavolok", lt: "Arka", lv: "Arka", ee: "Kaar" },
  "Insula": { ro: "Insula", uk: "Island", de: "Insel", es: "Isla", fr: "Île", it: "Isola", pl: "Wyspa", nl: "Eiland", da: "Øen", se: "Ön", pt: "Ilha", cz: "Ostrov", fi: "Saari", gr: "Νησί", hu: "Sziget", hr: "Otok", sk: "Ostrov", si: "Otok", lt: "Sala", lv: "Sala", ee: "Saar" },
  "Insulele": { ro: "Insulele", uk: "Islands", de: "Inseln", es: "Islas", fr: "Îles", it: "Isole", pl: "Wyspy", nl: "Eilanden", da: "Øerne", se: "Öarna", pt: "Ilhas", cz: "Ostrovy", fi: "Saaret", gr: "Νησιά", hu: "Szigetek", hr: "Otoci", sk: "Ostrovy", si: "Otoki", lt: "Salos", lv: "Salas", ee: "Saared" },
  "Muntele": { ro: "Muntele", uk: "Mount", de: "Berg", es: "Monte", fr: "Mont", it: "Monte", pl: "Góra", nl: "Berg", da: "Bjerget", se: "Berget", pt: "Monte", cz: "Hora", fi: "Vuori", gr: "Όρος", hu: "Hegy", hr: "Planina", sk: "Vrch", si: "Gora", lt: "Kalnas", lv: "Kalns", ee: "Mägi" },
  "Templul": { ro: "Templul", uk: "Temple", de: "Tempel", es: "Templo", fr: "Temple", it: "Tempio", pl: "Świątynia", nl: "Tempel", da: "Templet", se: "Templet", pt: "Templo", cz: "Chrám", fi: "Temppeli", gr: "Ναός", hu: "Templom", hr: "Hram", sk: "Chrám", si: "Tempelj", lt: "Šventykla", lv: "Templis", ee: "Tempel" },
  "Sinagoga": { ro: "Sinagoga", uk: "Synagogue", de: "Synagoge", es: "Sinagoga", fr: "Synagogue", it: "Sinagoga", pl: "Synagoga", nl: "Synagoge", da: "Synagogen", se: "Synagogan", pt: "Sinagoga", cz: "Synagoga", fi: "Synagoga", gr: "Συναγωγή", hu: "Zsinagóga", hr: "Sinagoga", sk: "Synagóga", si: "Sinagoga", lt: "Sinagoga", lv: "Sinagoga", ee: "Sünagoog" },
  "Salina": { ro: "Salina", uk: "Salt Mine", de: "Salzbergwerk", es: "Mina de Sal", fr: "Mine de Sel", it: "Miniera di Sale", pl: "Kopalnia Soli", nl: "Zoutmijn", da: "Saltminen", se: "Saltgruvan", pt: "Mina de Sal", cz: "Solný Důl", fi: "Suolakaivos", gr: "Ορυχείο Αλατιού", hu: "Sóbánya", hr: "Rudnik Soli", sk: "Soľná Baňa", si: "Solni Rudnik", lt: "Druskos Kasykla", lv: "Sāls Raktuves", ee: "Soolakaevandus" },
  "Portul": { ro: "Portul", uk: "Port", de: "Hafen", es: "Puerto", fr: "Port", it: "Porto", pl: "Port", nl: "Haven", da: "Havnen", se: "Hamnen", pt: "Porto", cz: "Přístav", fi: "Satama", gr: "Λιμάνι", hu: "Kikötő", hr: "Luka", sk: "Prístav", si: "Pristanišče", lt: "Uostas", lv: "Osta", ee: "Sadam" },
  "Barajul": { ro: "Barajul", uk: "Dam", de: "Staudamm", es: "Presa", fr: "Barrage", it: "Diga", pl: "Zapora", nl: "Dam", da: "Dæmningen", se: "Dammen", pt: "Barragem", cz: "Přehrada", fi: "Pato", gr: "Φράγμα", hu: "Gát", hr: "Brana", sk: "Priehrada", si: "Jez", lt: "Užtvanka", lv: "Dambis", ee: "Tamm" },
  "Mausoleul": { ro: "Mausoleul", uk: "Mausoleum", de: "Mausoleum", es: "Mausoleo", fr: "Mausolée", it: "Mausoleo", pl: "Mauzoleum", nl: "Mausoleum", da: "Mausolæet", se: "Mausoleet", pt: "Mausoléu", cz: "Mauzoleum", fi: "Mausoleumi", gr: "Μαυσωλείο", hu: "Mauzóleum", hr: "Mauzolej", sk: "Mauzóleum", si: "Mavzolej", lt: "Mauzoliejus", lv: "Mauzolejs", ee: "Mausoleum" },
  "Complexul": { ro: "Complexul", uk: "Complex", de: "Komplex", es: "Complejo", fr: "Complexe", it: "Complesso", pl: "Kompleks", nl: "Complex", da: "Komplekset", se: "Komplexet", pt: "Complexo", cz: "Komplex", fi: "Kompleksi", gr: "Συγκρότημα", hu: "Együttes", hr: "Kompleks", sk: "Komplex", si: "Kompleks", lt: "Kompleksas", lv: "Komplekss", ee: "Kompleks" },
  "Abația": { ro: "Abația", uk: "Abbey", de: "Abtei", es: "Abadía", fr: "Abbaye", it: "Abbazia", pl: "Opactwo", nl: "Abdij", da: "Abbediet", se: "Klostret", pt: "Abadia", cz: "Opatství", fi: "Luostari", gr: "Αβαείο", hu: "Apátság", hr: "Opatija", sk: "Opátstvo", si: "Opatija", lt: "Abatija", lv: "Abatija", ee: "Klooster" },
  "Clădirea": { ro: "Clădirea", uk: "Building", de: "Gebäude", es: "Edificio", fr: "Bâtiment", it: "Edificio", pl: "Budynek", nl: "Gebouw", da: "Bygningen", se: "Byggnaden", pt: "Edifício", cz: "Budova", fi: "Rakennus", gr: "Κτίριο", hu: "Épület", hr: "Zgrada", sk: "Budova", si: "Stavba", lt: "Pastatas", lv: "Ēka", ee: "Hoone" },
}

exports.RECOMMENDED_LABELS = {
  ro: "Recomandat — obiectiv important", uk: "Recommended — must-see", de: "Empfohlen — nicht verpassen",
  fr: "Recommandé — incontournable", es: "Recomendado — imprescindible", it: "Consigliato — da non perdere",
  pl: "Polecane — warto zobaczyć", nl: "Aanbevolen — niet te missen", da: "Anbefalet — must-see",
  cz: "Doporučeno — musíte vidět", fi: "Suositeltu — ehdottomasti nähtävä", gr: "Προτεινόμενο — απαραίτητο",
  hu: "Ajánlott — kihagyhatatlan", hr: "Preporučeno — obavezno vidjeti", sk: "Odporúčané — musíte vidieť",
  si: "Priporočeno — obvezno videti", lt: "Rekomenduojama — būtina pamatyti", lv: "Ieteicams — obligāti apskatāms",
  pt: "Recomendado — imperdível", se: "Rekommenderad — måste ses", ee: "Soovitatud — kindlasti vaadatav",
}

exports.RECOMMENDED_FIRST_LABELS = {
  ro: "👑 Arată mai întâi Recomandate", uk: "👑 Show Recommended first", de: "👑 Empfohlene zuerst anzeigen",
  fr: "👑 Afficher les recommandés en premier", es: "👑 Mostrar recomendados primero", it: "👑 Mostra i consigliati per primi",
  pl: "👑 Pokaż polecane najpierw", nl: "👑 Aanbevolen eerst tonen", da: "👑 Vis anbefalede først",
  cz: "👑 Zobrazit doporučené jako první", fi: "👑 Näytä suositellut ensin", gr: "👑 Εμφάνιση προτεινόμενων πρώτα",
  hu: "👑 Ajánlottak megjelenítése elsőként", hr: "👑 Prikaži preporučene prve", sk: "👑 Zobraziť odporúčané ako prvé",
  si: "👑 Najprej prikaži priporočene", lt: "👑 Rodyti rekomenduojamus pirmiausia", lv: "👑 Vispirms rādīt ieteicamos",
  pt: "👑 Mostrar recomendados primeiro", se: "👑 Visa rekommenderade först", ee: "👑 Näita soovitatuid esimesena",
}

exports.BEACHES_MEGA_CATEGORY_LABELS = {
  ro: "🏖️🌊 Plaje — Continent și Insule", uk: "🏖️🌊 Beaches — Mainland & Islands", de: "🏖️🌊 Strände — Festland & Inseln",
  fr: "🏖️🌊 Plages — Continent et Îles", es: "🏖️🌊 Playas — Continente e Islas", it: "🏖️🌊 Spiagge — Continente e Isole",
  pl: "🏖️🌊 Plaże — Kontynent i Wyspy", nl: "🏖️🌊 Stranden — Vasteland & Eilanden", da: "🏖️🌊 Strande — Fastland & Øer",
  cz: "🏖️🌊 Pláže — Pevnina a Ostrovy", fi: "🏖️🌊 Rannat — Manner & Saaret", gr: "🏖️🌊 Παραλίες — Ήπειρος & Νησιά",
  hu: "🏖️🌊 Strandok — Szárazföld és Szigetek", hr: "🏖️🌊 Plaže — Kopno i Otoci", sk: "🏖️🌊 Pláže — Pevnina a Ostrovy",
  si: "🏖️🌊 Plaže — Celina in Otoki", lt: "🏖️🌊 Paplūdimiai — Žemynas ir Salos", lv: "🏖️🌊 Pludmales — Kontinents un Salas",
  pt: "🏖️🌊 Praias — Continente e Ilhas", se: "🏖️🌊 Stränder — Fastland & Öar", ee: "🏖️🌊 Rannad — Mandriosa ja Saared",
}

exports.DISCOVER_BEACH_LABELS = {
  ro: "🏝️ Descoperă această plajă", uk: "🏝️ Discover this beach", de: "🏝️ Entdecke diesen Strand",
  fr: "🏝️ Découvrez cette plage", es: "🏝️ Descubre esta playa", it: "🏝️ Scopri questa spiaggia",
  pl: "🏝️ Odkryj tę plażę", nl: "🏝️ Ontdek dit strand", da: "🏝️ Oplev denne strand",
  cz: "🏝️ Objevte tuto pláž", fi: "🏝️ Tutustu tähän rantaan", gr: "🏝️ Ανακαλύψτε αυτή την παραλία",
  hu: "🏝️ Fedezd fel ezt a strandot", hr: "🏝️ Otkrijte ovu plažu", sk: "🏝️ Objavte túto pláž",
  si: "🏝️ Odkrijte to plažo", lt: "🏝️ Atraskite šį paplūdimį", lv: "🏝️ Atklājiet šo pludmali",
  pt: "🏝️ Descobre esta praia", se: "🏝️ Upptäck denna strand", ee: "🏝️ Avasta seda randa",
}

exports.BEACH_REVIEW_LABELS = {
  ro: { title: "🗳️ Ce spun turiștii despre această plajă", cta: "📝 Lasă recenzia ta — ajută alți turiști să știe la ce să se aștepte!", yes: "Da", no: "Nu", submit: "Trimite recenzia", thanks: "✓ Mulțumim pentru recenzie!" },
  uk: { title: "🗳️ What travelers say about this beach", cta: "📝 Leave your review — help other travelers know what to expect!", yes: "Yes", no: "No", submit: "Submit review", thanks: "✓ Thanks for your review!" },
  de: { title: "🗳️ Was Reisende über diesen Strand sagen", cta: "📝 Hinterlasse deine Bewertung — hilf anderen Reisenden zu wissen, was sie erwartet!", yes: "Ja", no: "Nein", submit: "Bewertung senden", thanks: "✓ Danke für deine Bewertung!" },
  fr: { title: "🗳️ Ce que disent les voyageurs sur cette plage", cta: "📝 Laissez votre avis — aidez d'autres voyageurs à savoir à quoi s'attendre !", yes: "Oui", no: "Non", submit: "Envoyer l'avis", thanks: "✓ Merci pour votre avis !" },
  es: { title: "🗳️ Lo que dicen los viajeros sobre esta playa", cta: "📝 Deja tu opinión — ¡ayuda a otros viajeros a saber qué esperar!", yes: "Sí", no: "No", submit: "Enviar opinión", thanks: "✓ ¡Gracias por tu opinión!" },
  it: { title: "🗳️ Cosa dicono i viaggiatori su questa spiaggia", cta: "📝 Lascia la tua recensione — aiuta altri viaggiatori a sapere cosa aspettarsi!", yes: "Sì", no: "No", submit: "Invia recensione", thanks: "✓ Grazie per la recensione!" },
  pl: { title: "🗳️ Co mówią podróżni o tej plaży", cta: "📝 Zostaw swoją opinię — pomóż innym podróżnym wiedzieć, czego się spodziewać!", yes: "Tak", no: "Nie", submit: "Wyślij opinię", thanks: "✓ Dziękujemy za opinię!" },
  nl: { title: "🗳️ Wat reizigers zeggen over dit strand", cta: "📝 Laat je recensie achter — help andere reizigers weten wat ze kunnen verwachten!", yes: "Ja", no: "Nee", submit: "Recensie versturen", thanks: "✓ Bedankt voor je recensie!" },
  da: { title: "🗳️ Hvad rejsende siger om denne strand", cta: "📝 Efterlad din anmeldelse — hjælp andre rejsende med at vide, hvad de kan forvente!", yes: "Ja", no: "Nej", submit: "Send anmeldelse", thanks: "✓ Tak for din anmeldelse!" },
  cz: { title: "🗳️ Co říkají turisté o této pláži", cta: "📝 Zanechte recenzi — pomozte dalším turistům vědět, co očekávat!", yes: "Ano", no: "Ne", submit: "Odeslat recenzi", thanks: "✓ Díky za recenzi!" },
  fi: { title: "🗳️ Mitä matkailijat sanovat tästä rannasta", cta: "📝 Jätä arvostelusi — auta muita matkailijoita tietämään, mitä odottaa!", yes: "Kyllä", no: "Ei", submit: "Lähetä arvostelu", thanks: "✓ Kiitos arvostelusta!" },
  gr: { title: "🗳️ Τι λένε οι ταξιδιώτες για αυτή την παραλία", cta: "📝 Αφήστε την κριτική σας — βοηθήστε άλλους ταξιδιώτες να ξέρουν τι να περιμένουν!", yes: "Ναι", no: "Όχι", submit: "Υποβολή κριτικής", thanks: "✓ Ευχαριστούμε για την κριτική!" },
  hu: { title: "🗳️ Mit mondanak az utazók erről a strandról", cta: "📝 Hagyd meg a véleményed — segíts más utazóknak tudni, mire számíthatnak!", yes: "Igen", no: "Nem", submit: "Vélemény küldése", thanks: "✓ Köszönjük a véleményt!" },
  hr: { title: "🗳️ Što putnici kažu o ovoj plaži", cta: "📝 Ostavite svoju recenziju — pomozite drugim putnicima da znaju što ih čeka!", yes: "Da", no: "Ne", submit: "Pošalji recenziju", thanks: "✓ Hvala na recenziji!" },
  sk: { title: "🗳️ Čo hovoria cestovatelia o tejto pláži", cta: "📝 Zanechajte recenziu — pomôžte ostatným cestovateľom vedieť, čo očakávať!", yes: "Áno", no: "Nie", submit: "Odoslať recenziu", thanks: "✓ Ďakujeme za recenziu!" },
  si: { title: "🗳️ Kaj popotniki pravijo o tej plaži", cta: "📝 Pustite svojo oceno — pomagajte drugim popotnikom vedeti, kaj lahko pričakujejo!", yes: "Da", no: "Ne", submit: "Pošlji oceno", thanks: "✓ Hvala za oceno!" },
  lt: { title: "🗳️ Ką keliautojai sako apie šį paplūdimį", cta: "📝 Palikite savo atsiliepimą — padėkite kitiems keliautojams žinoti, ko tikėtis!", yes: "Taip", no: "Ne", submit: "Siųsti atsiliepimą", thanks: "✓ Ačiū už atsiliepimą!" },
  lv: { title: "🗳️ Ko ceļotāji saka par šo pludmali", cta: "📝 Atstājiet savu atsauksmi — palīdziet citiem ceļotājiem zināt, ko sagaidīt!", yes: "Jā", no: "Nē", submit: "Sūtīt atsauksmi", thanks: "✓ Paldies par atsauksmi!" },
  pt: { title: "🗳️ O que dizem os viajantes sobre esta praia", cta: "📝 Deixa a tua opinião — ajuda outros viajantes a saber o que esperar!", yes: "Sim", no: "Não", submit: "Enviar opinião", thanks: "✓ Obrigado pela opinião!" },
  se: { title: "🗳️ Vad resenärer säger om denna strand", cta: "📝 Lämna din recension — hjälp andra resenärer veta vad de kan förvänta sig!", yes: "Ja", no: "Nej", submit: "Skicka recension", thanks: "✓ Tack för din recension!" },
  ee: { title: "🗳️ Mida reisijad selle ranna kohta ütlevad", cta: "📝 Jäta oma arvustus — aita teistel reisijatel teada, mida oodata!", yes: "Jah", no: "Ei", submit: "Saada arvustus", thanks: "✓ Täname arvustuse eest!" },
}

exports.ITINERARY_PROMO_LABELS = {
  ro: { title: "📍 Pleci la drum?", text: "Scapă de stresul planificării! Spune-ne ce-ți place să vezi, iar noi îți creăm pe loc traseul pentru o vacanță de neuitat.", cta: "Hai să facem itinerarul →" },
  uk: { title: "📍 Heading out?", text: "Skip the planning stress! Tell us what you like to see, and we'll create your route on the spot for an unforgettable trip.", cta: "Let's build the itinerary →" },
  de: { title: "📍 Auf Reisen?", text: "Spar dir den Planungsstress! Sag uns, was du gerne siehst, und wir erstellen sofort deine Route für einen unvergesslichen Urlaub.", cta: "Lass uns die Reiseroute erstellen →" },
  fr: { title: "📍 Vous partez ?", text: "Fini le stress de la planification ! Dites-nous ce que vous aimez voir, et nous créons votre parcours sur-le-champ pour des vacances inoubliables.", cta: "Créons l'itinéraire →" },
  es: { title: "📍 ¿Te vas de viaje?", text: "¡Olvídate del estrés de planificar! Dinos qué te gusta ver y creamos al instante tu ruta para unas vacaciones inolvidables.", cta: "Creemos el itinerario →" },
  it: { title: "📍 Stai per partire?", text: "Basta stress da pianificazione! Dicci cosa ti piace vedere e creiamo subito il tuo percorso per una vacanza indimenticabile.", cta: "Creiamo l'itinerario →" },
  pl: { title: "📍 Wybierasz się w podróż?", text: "Koniec ze stresem planowania! Powiedz nam, co lubisz zwiedzać, a stworzymy Twoją trasę od razu, na niezapomniane wakacje.", cta: "Stwórzmy plan podróży →" },
  nl: { title: "📍 Ga je op reis?", text: "Geen planningsstress meer! Vertel ons wat je graag ziet en we maken direct jouw route voor een onvergetelijke vakantie.", cta: "Laten we de reisroute maken →" },
  da: { title: "📍 Skal du ud at rejse?", text: "Slip for planlægningsstress! Fortæl os, hvad du kan lide at se, så laver vi din rute med det samme til en uforglemmelig ferie.", cta: "Lad os lave rejseplanen →" },
  cz: { title: "📍 Chystáte se na cestu?", text: "Zbavte se stresu z plánování! Řekněte nám, co rádi vidíte, a my hned vytvoříme vaši trasu pro nezapomenutelnou dovolenou.", cta: "Pojďme vytvořit trasu →" },
  fi: { title: "📍 Lähdössä matkalle?", text: "Unohda suunnittelun stressi! Kerro meille, mistä pidät, ja luomme heti reittisi ikimuistoista lomaa varten.", cta: "Luodaan matkasuunnitelma →" },
  gr: { title: "📍 Ετοιμάζεσαι για ταξίδι;", text: "Ξέχνα το άγχος του προγραμματισμού! Πες μας τι σου αρέσει να βλέπεις, και θα δημιουργήσουμε αμέσως τη διαδρομή σου για ένα αξέχαστο ταξίδι.", cta: "Ας φτιάξουμε το δρομολόγιο →" },
  hu: { title: "📍 Utazásra készülsz?", text: "Felejtsd el a tervezés stresszét! Mondd el, mit szeretnél látni, és azonnal elkészítjük az útvonaladat egy felejthetetlen nyaraláshoz.", cta: "Készítsük el az útitervet →" },
  hr: { title: "📍 Krećete na put?", text: "Riješite se stresa planiranja! Recite nam što volite vidjeti, a mi ćemo odmah stvoriti vašu rutu za nezaboravan odmor.", cta: "Napravimo itinerar →" },
  sk: { title: "📍 Chystáte sa na cestu?", text: "Zbavte sa stresu z plánovania! Povedzte nám, čo radi vidíte, a my hneď vytvoríme vašu trasu pre nezabudnuteľnú dovolenku.", cta: "Vytvorme itinerár →" },
  si: { title: "📍 Se odpravljate na pot?", text: "Znebite se stresa načrtovanja! Povejte nam, kaj radi vidite, in takoj ustvarimo vašo pot za nepozabne počitnice.", cta: "Ustvarimo itinerar →" },
  lt: { title: "📍 Ruošiatės kelionei?", text: "Atsisveikinkite su planavimo stresu! Pasakykite, ką mėgstate matyti, ir mes iškart sukursime jūsų maršrutą nepamirštamoms atostogoms.", cta: "Sukurkime kelionės planą →" },
  lv: { title: "📍 Dodaties ceļojumā?", text: "Aizmirstiet plānošanas stresu! Pastāstiet, ko vēlaties redzēt, un mēs uzreiz izveidosim jūsu maršrutu neaizmirstamām brīvdienām.", cta: "Izveidosim maršrutu →" },
  pt: { title: "📍 Vais viajar?", text: "Esquece o stress do planeamento! Diz-nos o que gostas de ver e criamos já a tua rota para umas férias inesquecíveis.", cta: "Vamos criar o itinerário →" },
  se: { title: "📍 Ska du ut och resa?", text: "Slipp planeringsstressen! Berätta vad du gillar att se, så skapar vi direkt din rutt för en oförglömlig semester.", cta: "Låt oss skapa reseplanen →" },
  ee: { title: "📍 Kas lähed reisile?", text: "Unusta planeerimise stress! Ütle meile, mida soovid näha, ja loome kohe sinu marsruudi unustamatuks puhkuseks.", cta: "Loome marsruudi →" },
}

exports.GREECE_BEACH_PROMO_LABELS = {
  ro: { title: "🏖️ Planifici o zi de plajă în Grecia?", text: "Plajele faimoase se umplu rapid după ora 10:00, iar drumul până la ele poate fi o întreagă aventură. În plus, la barurile de pe coastă șezlongurile se ocupă rapid. Fă-ți planul cu noi și prinde cel mai bun loc la soare, fără bătăi de cap!", cta: "Organizează-mi traseul „Beach Hopper” →" },
  uk: { title: "🏖️ Planning a beach day in Greece?", text: "Famous beaches fill up fast after 10am, and getting there can be quite an adventure. Plus, sunbeds at coastal bars go quickly too. Plan it with us and grab the best spot in the sun, hassle-free!", cta: "Plan my \\\"Beach Hopper\\\" route →" },
  de: { title: "🏖️ Planst du einen Strandtag in Griechenland?", text: "Berühmte Strände füllen sich nach 10 Uhr schnell, und der Weg dorthin kann ein echtes Abenteuer sein. Außerdem sind die Liegen an den Küstenbars schnell vergeben. Plane mit uns und sichere dir den besten Sonnenplatz, ganz ohne Stress!", cta: "Meine „Beach Hopper”-Route planen →" },
  fr: { title: "🏖️ Vous planifiez une journée plage en Grèce ?", text: "Les plages célèbres se remplissent vite après 10h, et le trajet jusqu'à elles peut être une vraie aventure. De plus, les transats des bars côtiers partent rapidement. Planifiez avec nous et attrapez la meilleure place au soleil, sans tracas !", cta: "Organiser mon parcours « Beach Hopper » →" },
  es: { title: "🏖️ ¿Planeas un día de playa en Grecia?", text: "Las playas famosas se llenan rápido después de las 10h, y llegar hasta ellas puede ser toda una aventura. Además, las tumbonas de los bares costeros se ocupan rápido. ¡Planifica con nosotros y consigue el mejor lugar al sol, sin complicaciones!", cta: "Organizar mi ruta «Beach Hopper» →" },
  it: { title: "🏖️ Stai pianificando una giornata in spiaggia in Grecia?", text: "Le spiagge famose si riempiono rapidamente dopo le 10, e arrivarci può essere una vera avventura. Inoltre, i lettini nei bar costieri si occupano in fretta. Pianifica con noi e conquista il posto migliore al sole, senza pensieri!", cta: "Organizza il mio percorso «Beach Hopper» →" },
  pl: { title: "🏖️ Planujesz dzień na plaży w Grecji?", text: "Słynne plaże szybko się zapełniają po godzinie 10:00, a dotarcie do nich może być prawdziwą przygodą. Do tego leżaki w nadmorskich barach znikają błyskawicznie. Zaplanuj z nami i zdobądź najlepsze miejsce w słońcu, bez zbędnego stresu!", cta: "Zorganizuj moją trasę „Beach Hopper” →" },
  nl: { title: "🏖️ Plan je een strand dag in Griekenland?", text: "Beroemde stranden raken snel vol na 10 uur, en de weg ernaartoe kan een heel avontuur zijn. Bovendien zijn de ligstoelen bij strandbars snel bezet. Plan het met ons en bemachtig de beste plek in de zon, zonder gedoe!", cta: "Organiseer mijn „Beach Hopper”-route →" },
  da: { title: "🏖️ Planlægger du en strand dag i Grækenland?", text: "Berømte strande fyldes hurtigt op efter kl. 10, og turen derhen kan være et helt eventyr. Desuden bliver liggestolene ved kystbarerne hurtigt optaget. Planlæg med os og sikr dig den bedste plads i solen, uden besvær!", cta: "Organiser min „Beach Hopper”-rute →" },
  cz: { title: "🏖️ Plánujete den na pláži v Řecku?", text: "Slavné pláže se po 10. hodině rychle zaplní a cesta k nim může být pořádné dobrodružství. Navíc lehátka u pobřežních barů rychle mizí. Naplánujte si to s námi a získejte nejlepší místo na sluníčku, bez starostí!", cta: "Zorganizujte mi trasu „Beach Hopper” →" },
  fi: { title: "🏖️ Suunnitteletko rantapäivää Kreikassa?", text: "Kuuluisat rannat täyttyvät nopeasti kello 10 jälkeen, ja sinne pääseminen voi olla melkoinen seikkailu. Lisäksi rantabaarien aurinkotuolit varataan nopeasti. Suunnittele kanssamme ja nappaa paras paikka auringossa, ilman vaivaa!", cta: "Järjestä „Beach Hopper” -reittini →" },
  gr: { title: "🏖️ Σχεδιάζεις μια μέρα στην παραλία στην Ελλάδα;", text: "Οι διάσημες παραλίες γεμίζουν γρήγορα μετά τις 10 π.μ., και η διαδρομή μέχρι εκεί μπορεί να είναι μια ολόκληρη περιπέτεια. Επιπλέον, οι ξαπλώστρες στα παραθαλάσσια μπαρ πιάνονται γρήγορα. Σχεδίασε το μαζί μας και κέρδισε την καλύτερη θέση στον ήλιο, χωρίς άγχος!", cta: "Οργάνωσε τη διαδρομή «Beach Hopper» →" },
  hu: { title: "🏖️ Strandolós napot tervezel Görögországban?", text: "A híres strandok 10 óra után gyorsan megtelnek, és az odajutás egész kalandnak számíthat. Emellett a tengerparti bárok napágyai is gyorsan elfogynak. Tervezd meg velünk, és szerezd meg a legjobb helyet a napon, gond nélkül!", cta: "Szervezd meg a „Beach Hopper” útvonalamat →" },
  hr: { title: "🏖️ Planirate dan na plaži u Grčkoj?", text: "Poznate plaže se brzo pune nakon 10 sati, a put do njih može biti prava avantura. Uz to, ležaljke u obalnim barovima brzo se popune. Isplanirajte s nama i osigurajte najbolje mjesto na suncu, bez muke!", cta: "Organiziraj moju „Beach Hopper” rutu →" },
  sk: { title: "🏖️ Plánujete deň na pláži v Grécku?", text: "Slávne pláže sa po 10. hodine rýchlo zaplnia a cesta k nim môže byť poriadne dobrodružstvo. Navyše ležadlá pri pobrežných baroch rýchlo miznú. Naplánujte si to s nami a získajte najlepšie miesto na slnku, bez starostí!", cta: "Zorganizujte mi trasu „Beach Hopper” →" },
  si: { title: "🏖️ Načrtujete dan na plaži v Grčiji?", text: "Znane plaže se po 10. uri hitro napolnijo, pot do njih pa je lahko prava avantura. Poleg tega se ležalniki v obalnih barih hitro zasedejo. Načrtujte z nami in si zagotovite najboljše mesto na soncu, brez težav!", cta: "Organiziraj mojo pot „Beach Hopper” →" },
  lt: { title: "🏖️ Planuojate paplūdimio dieną Graikijoje?", text: "Garsūs paplūdimiai greitai užsipildo po 10 val., o kelias iki jų gali būti tikras nuotykis. Be to, gultai pakrantės baruose greitai užimami. Suplanuokite su mumis ir užimkite geriausią vietą saulėje, be jokių rūpesčių!", cta: "Suorganizuok mano „Beach Hopper” maršrutą →" },
  lv: { title: "🏖️ Plānojat pludmales dienu Grieķijā?", text: "Slavenas pludmales ātri piepildās pēc plkst. 10, un ceļš uz turieni var būt īsts piedzīvojums. Turklāt sauļošanās krēsli piekrastes bāros ātri tiek aizņemti. Plānojiet kopā ar mums un iegūstiet labāko vietu saulē, bez raizēm!", cta: "Sakārto manu „Beach Hopper” maršrutu →" },
  pt: { title: "🏖️ Estás a planear um dia de praia na Grécia?", text: "As praias famosas enchem rapidamente depois das 10h, e o caminho até lá pode ser uma verdadeira aventura. Além disso, as espreguiçadeiras nos bares da costa esgotam-se depressa. Planeia connosco e garante o melhor lugar ao sol, sem complicações!", cta: "Organiza a minha rota «Beach Hopper» →" },
  se: { title: "🏖️ Planerar du en strand dag i Grekland?", text: "Berömda stränder fylls snabbt efter kl. 10, och vägen dit kan vara ett helt äventyr. Dessutom tar solstolarna vid kustbarerna snabbt slut. Planera med oss och säkra den bästa platsen i solen, utan krångel!", cta: "Organisera min „Beach Hopper”-rutt →" },
  ee: { title: "🏖️ Kas planeerid rannapäeva Kreekas?", text: "Kuulsad rannad täituvad kiiresti pärast kella 10 ja sinnajõudmine võib olla terve seiklus. Lisaks lähevad rannabaaride lamamistoolid kiiresti. Planeeri koos meiega ja haara parim koht päikese käes, ilma muredeta!", cta: "Korralda minu „Beach Hopper” marsruut →" },
}

exports.VOTE_LABELS = {
  ro: { vote: "👍 Îmi place acest obiectiv", voted: "✓ Ai votat, mulțumim!", popular: "🔥 Popular în comunitate" },
  uk: { vote: "👍 I like this attraction", voted: "✓ Thanks for voting!", popular: "🔥 Popular with the community" },
  de: { vote: "👍 Mir gefällt das", voted: "✓ Danke für deine Stimme!", popular: "🔥 Beliebt in der Community" },
  fr: { vote: "👍 J'aime ce site", voted: "✓ Merci pour votre vote !", popular: "🔥 Populaire dans la communauté" },
  es: { vote: "👍 Me gusta este lugar", voted: "✓ ¡Gracias por votar!", popular: "🔥 Popular en la comunidad" },
  it: { vote: "👍 Mi piace questo posto", voted: "✓ Grazie per il voto!", popular: "🔥 Popolare nella community" },
  pl: { vote: "👍 Podoba mi się", voted: "✓ Dziękujemy za głos!", popular: "🔥 Popularne w społeczności" },
  nl: { vote: "👍 Ik vind dit leuk", voted: "✓ Bedankt voor je stem!", popular: "🔥 Populair bij de community" },
  da: { vote: "👍 Jeg kan lide dette", voted: "✓ Tak for din stemme!", popular: "🔥 Populær i fællesskabet" },
  cz: { vote: "👍 Líbí se mi to", voted: "✓ Díky za hlas!", popular: "🔥 Oblíbené v komunitě" },
  fi: { vote: "👍 Pidän tästä", voted: "✓ Kiitos äänestä!", popular: "🔥 Suosittu yhteisössä" },
  gr: { vote: "👍 Μου αρέσει", voted: "✓ Ευχαριστούμε για την ψήφο!", popular: "🔥 Δημοφιλές στην κοινότητα" },
  hu: { vote: "👍 Tetszik", voted: "✓ Köszönjük a szavazatot!", popular: "🔥 Népszerű a közösségben" },
  hr: { vote: "👍 Sviđa mi se", voted: "✓ Hvala na glasu!", popular: "🔥 Popularno u zajednici" },
  sk: { vote: "👍 Páči sa mi to", voted: "✓ Ďakujeme za hlas!", popular: "🔥 Obľúbené v komunite" },
  si: { vote: "👍 Všeč mi je", voted: "✓ Hvala za glas!", popular: "🔥 Priljubljeno v skupnosti" },
  lt: { vote: "👍 Man patinka", voted: "✓ Ačiū už balsą!", popular: "🔥 Populiaru bendruomenėje" },
  lv: { vote: "👍 Man patīk", voted: "✓ Paldies par balsojumu!", popular: "🔥 Populārs kopienā" },
  pt: { vote: "👍 Gosto deste local", voted: "✓ Obrigado pelo voto!", popular: "🔥 Popular na comunidade" },
  se: { vote: "👍 Jag gillar detta", voted: "✓ Tack för din röst!", popular: "🔥 Populärt i communityn" },
  ee: { vote: "👍 Mulle meeldib see", voted: "✓ Täname hääle eest!", popular: "🔥 Populaarne kogukonnas" },
}

exports.BEACH_TAG_LABELS = {
  ro: { access_car: "🚗 Acces Auto", access_boat: "⛵ Doar cu Barca", sunbeds_free: "🆓 Șezlonguri Gratuite", sunbeds_paid: "💰 Șezlonguri Contra Cost", sunbeds_with_drink: "🍹 Șezlonguri cu Consumație", terrain_family: "👶 Ideală pentru Familii", terrain_pebbles: "🪨 Pietriș / Stânci", free_parking: "🅿️ Parcare Gratuită", food_on_beach: "🍽️ Se Poate Servi Masa", taverns_nearby: "🍴 Taverne în Zonă" },
  uk: { access_car: "🚗 Car Access", access_boat: "⛵ Boat Only", sunbeds_free: "🆓 Free Sunbeds", sunbeds_paid: "💰 Paid Sunbeds", sunbeds_with_drink: "🍹 Sunbeds with Drink", terrain_family: "👶 Family Friendly", terrain_pebbles: "🪨 Pebbles / Rocky", free_parking: "🅿️ Free Parking", food_on_beach: "🍽️ Food Available on Beach", taverns_nearby: "🍴 Taverns Nearby" },
  de: { access_car: "🚗 Mit dem Auto erreichbar", access_boat: "⛵ Nur mit dem Boot", sunbeds_free: "🆓 Kostenlose Liegen", sunbeds_paid: "💰 Liegen gegen Gebühr", sunbeds_with_drink: "🍹 Liegen mit Getränk inklusive", terrain_family: "👶 Familienfreundlich", terrain_pebbles: "🪨 Kiesel / Felsig", free_parking: "🅿️ Kostenloser Parkplatz", food_on_beach: "🍽️ Essen am Strand möglich", taverns_nearby: "🍴 Tavernen in der Nähe" },
  fr: { access_car: "🚗 Accès en Voiture", access_boat: "⛵ Accès en Bateau Uniquement", sunbeds_free: "🆓 Transats Gratuits", sunbeds_paid: "💰 Transats Payants", sunbeds_with_drink: "🍹 Transats avec Consommation", terrain_family: "👶 Idéale pour Familles", terrain_pebbles: "🪨 Galets / Rochers", free_parking: "🅿️ Parking Gratuit", food_on_beach: "🍽️ Restauration sur la Plage", taverns_nearby: "🍴 Tavernes à Proximité" },
  es: { access_car: "🚗 Acceso en Coche", access_boat: "⛵ Solo en Barco", sunbeds_free: "🆓 Tumbonas Gratis", sunbeds_paid: "💰 Tumbonas de Pago", sunbeds_with_drink: "🍹 Tumbonas con Consumición", terrain_family: "👶 Ideal para Familias", terrain_pebbles: "🪨 Guijarros / Rocas", free_parking: "🅿️ Aparcamiento Gratis", food_on_beach: "🍽️ Se Puede Comer en la Playa", taverns_nearby: "🍴 Tabernas Cerca" },
  it: { access_car: "🚗 Accesso in Auto", access_boat: "⛵ Solo in Barca", sunbeds_free: "🆓 Lettini Gratuiti", sunbeds_paid: "💰 Lettini a Pagamento", sunbeds_with_drink: "🍹 Lettini con Consumazione", terrain_family: "👶 Ideale per Famiglie", terrain_pebbles: "🪨 Ciottoli / Rocce", free_parking: "🅿️ Parcheggio Gratuito", food_on_beach: "🍽️ Si Può Mangiare in Spiaggia", taverns_nearby: "🍴 Taverne nei Dintorni" },
  pl: { access_car: "🚗 Dojazd Samochodem", access_boat: "⛵ Tylko Łodzią", sunbeds_free: "🆓 Darmowe Leżaki", sunbeds_paid: "💰 Płatne Leżaki", sunbeds_with_drink: "🍹 Leżaki z Konsumpcją", terrain_family: "👶 Przyjazna Rodzinom", terrain_pebbles: "🪨 Kamyki / Skały", free_parking: "🅿️ Darmowy Parking", food_on_beach: "🍽️ Posiłki na Plaży", taverns_nearby: "🍴 Tawerny w Pobliżu" },
  nl: { access_car: "🚗 Bereikbaar met Auto", access_boat: "⛵ Alleen per Boot", sunbeds_free: "🆓 Gratis Ligstoelen", sunbeds_paid: "💰 Betaalde Ligstoelen", sunbeds_with_drink: "🍹 Ligstoelen met Drankje", terrain_family: "👶 Gezinsvriendelijk", terrain_pebbles: "🪨 Kiezels / Rotsen", free_parking: "🅿️ Gratis Parkeren", food_on_beach: "🍽️ Eten op het Strand Mogelijk", taverns_nearby: "🍴 Tavernes in de Buurt" },
  da: { access_car: "🚗 Adgang med Bil", access_boat: "⛵ Kun med Båd", sunbeds_free: "🆓 Gratis Solsenge", sunbeds_paid: "💰 Betalte Solsenge", sunbeds_with_drink: "🍹 Solsenge med Drink", terrain_family: "👶 Familievenlig", terrain_pebbles: "🪨 Sten / Klipper", free_parking: "🅿️ Gratis Parkering", food_on_beach: "🍽️ Mad Muligt på Stranden", taverns_nearby: "🍴 Tavernaer i Nærheden" },
  cz: { access_car: "🚗 Přístup Autem", access_boat: "⛵ Pouze Lodí", sunbeds_free: "🆓 Lehátka Zdarma", sunbeds_paid: "💰 Placená Lehátka", sunbeds_with_drink: "🍹 Lehátka s Konzumací", terrain_family: "👶 Vhodná pro Rodiny", terrain_pebbles: "🪨 Oblázky / Skály", free_parking: "🅿️ Parkování Zdarma", food_on_beach: "🍽️ Jídlo na Pláži", taverns_nearby: "🍴 Taverny v Okolí" },
  fi: { access_car: "🚗 Pääsy Autolla", access_boat: "⛵ Vain Veneellä", sunbeds_free: "🆓 Ilmaiset Aurinkotuolit", sunbeds_paid: "💰 Maksulliset Aurinkotuolit", sunbeds_with_drink: "🍹 Aurinkotuolit Juoman Kanssa", terrain_family: "👶 Perheystävällinen", terrain_pebbles: "🪨 Kivikko / Kalliot", free_parking: "🅿️ Ilmainen Pysäköinti", food_on_beach: "🍽️ Ruokailu Rannalla Mahdollista", taverns_nearby: "🍴 Tavernoita Lähellä" },
  gr: { access_car: "🚗 Πρόσβαση με Αυτοκίνητο", access_boat: "⛵ Μόνο με Σκάφος", sunbeds_free: "🆓 Δωρεάν Ξαπλώστρες", sunbeds_paid: "💰 Ξαπλώστρες με Χρέωση", sunbeds_with_drink: "🍹 Ξαπλώστρες με Κατανάλωση", terrain_family: "👶 Ιδανική για Οικογένειες", terrain_pebbles: "🪨 Βότσαλα / Βράχια", free_parking: "🅿️ Δωρεάν Πάρκινγκ", food_on_beach: "🍽️ Φαγητό στην Παραλία", taverns_nearby: "🍴 Ταβέρνες Κοντά" },
  hu: { access_car: "🚗 Autóval Megközelíthető", access_boat: "⛵ Csak Hajóval", sunbeds_free: "🆓 Ingyenes Napágyak", sunbeds_paid: "💰 Fizetős Napágyak", sunbeds_with_drink: "🍹 Napágyak Itallal", terrain_family: "👶 Családbarát", terrain_pebbles: "🪨 Kavics / Sziklás", free_parking: "🅿️ Ingyenes Parkolás", food_on_beach: "🍽️ Étkezés a Strandon", taverns_nearby: "🍴 Tavernák a Közelben" },
  hr: { access_car: "🚗 Pristup Automobilom", access_boat: "⛵ Samo Brodom", sunbeds_free: "🆓 Besplatni Ležaljke", sunbeds_paid: "💰 Plaćene Ležaljke", sunbeds_with_drink: "🍹 Ležaljke s Pićem", terrain_family: "👶 Pogodna za Obitelji", terrain_pebbles: "🪨 Šljunak / Stijene", free_parking: "🅿️ Besplatan Parking", food_on_beach: "🍽️ Hrana na Plaži", taverns_nearby: "🍴 Taverne u Blizini" },
  sk: { access_car: "🚗 Prístup Autom", access_boat: "⛵ Iba Loďou", sunbeds_free: "🆓 Ležadlá Zdarma", sunbeds_paid: "💰 Platené Ležadlá", sunbeds_with_drink: "🍹 Ležadlá s Konzumáciou", terrain_family: "👶 Vhodná pre Rodiny", terrain_pebbles: "🪨 Oblázky / Skaly", free_parking: "🅿️ Parkovanie Zdarma", food_on_beach: "🍽️ Jedlo na Pláži", taverns_nearby: "🍴 Taverny v Okolí" },
  si: { access_car: "🚗 Dostop z Avtomobilom", access_boat: "⛵ Samo s Čolnom", sunbeds_free: "🆓 Brezplačni Ležalniki", sunbeds_paid: "💰 Plačljivi Ležalniki", sunbeds_with_drink: "🍹 Ležalniki z Pijačo", terrain_family: "👶 Primerna za Družine", terrain_pebbles: "🪨 Prod / Skale", free_parking: "🅿️ Brezplačno Parkiranje", food_on_beach: "🍽️ Hrana na Plaži", taverns_nearby: "🍴 Taverne v Bližini" },
  lt: { access_car: "🚗 Privažiavimas Automobiliu", access_boat: "⛵ Tik Valtimi", sunbeds_free: "🆓 Nemokami Gultai", sunbeds_paid: "💰 Mokami Gultai", sunbeds_with_drink: "🍹 Gultai su Gėrimu", terrain_family: "👶 Tinka Šeimoms", terrain_pebbles: "🪨 Akmenukai / Uolos", free_parking: "🅿️ Nemokamas Parkavimas", food_on_beach: "🍽️ Maistas Paplūdimyje", taverns_nearby: "🍴 Tavernos Netoliese" },
  lv: { access_car: "🚗 Piekļuve ar Auto", access_boat: "⛵ Tikai ar Laivu", sunbeds_free: "🆓 Bezmaksas Sauļošanās Krēsli", sunbeds_paid: "💰 Maksas Sauļošanās Krēsli", sunbeds_with_drink: "🍹 Krēsli ar Dzērienu", terrain_family: "👶 Piemērota Ģimenēm", terrain_pebbles: "🪨 Oļi / Klintis", free_parking: "🅿️ Bezmaksas Stāvvieta", food_on_beach: "🍽️ Ēdiens Pludmalē", taverns_nearby: "🍴 Tavernas Tuvumā" },
  pt: { access_car: "🚗 Acesso de Carro", access_boat: "⛵ Apenas de Barco", sunbeds_free: "🆓 Espreguiçadeiras Grátis", sunbeds_paid: "💰 Espreguiçadeiras Pagas", sunbeds_with_drink: "🍹 Espreguiçadeiras com Consumo", terrain_family: "👶 Ideal para Famílias", terrain_pebbles: "🪨 Seixos / Rochas", free_parking: "🅿️ Estacionamento Grátis", food_on_beach: "🍽️ Refeições na Praia", taverns_nearby: "🍴 Tabernas Perto" },
  se: { access_car: "🚗 Åtkomst med Bil", access_boat: "⛵ Endast med Båt", sunbeds_free: "🆓 Gratis Solstolar", sunbeds_paid: "💰 Betalda Solstolar", sunbeds_with_drink: "🍹 Solstolar med Dryck", terrain_family: "👶 Familjevänlig", terrain_pebbles: "🪨 Stenar / Klippor", free_parking: "🅿️ Gratis Parkering", food_on_beach: "🍽️ Mat på Stranden", taverns_nearby: "🍴 Tavernor i Närheten" },
  ee: { access_car: "🚗 Ligipääs Autoga", access_boat: "⛵ Ainult Paadiga", sunbeds_free: "🆓 Tasuta Lamamistoolid", sunbeds_paid: "💰 Tasulised Lamamistoolid", sunbeds_with_drink: "🍹 Lamamistoolid Joogiga", terrain_family: "👶 Peresõbralik", terrain_pebbles: "🪨 Kivid / Kaljud", free_parking: "🅿️ Tasuta Parkimine", food_on_beach: "🍽️ Toit Rannas", taverns_nearby: "🍴 Tavernad Lähedal" },
}

exports.BOAT_TOUR_LABELS = {
  ro: "⛵ Vezi tururi cu barca", uk: "⛵ See boat tours", de: "⛵ Bootstouren ansehen",
  fr: "⛵ Voir les excursions en bateau", es: "⛵ Ver tours en barco", it: "⛵ Vedi i tour in barca",
  pl: "⛵ Zobacz wycieczki łodzią", nl: "⛵ Bekijk boottochten", da: "⛵ Se bådture",
  cz: "⛵ Zobrazit lodní výlety", fi: "⛵ Katso venematkat", gr: "⛵ Δείτε βαρκάδες",
  hu: "⛵ Nézd meg a hajótúrákat", hr: "⛵ Pogledaj izlete brodom", sk: "⛵ Zobraziť lodné výlety",
  si: "⛵ Poglej izlete s čolnom", lt: "⛵ Žiūrėti kelionių valtimi", lv: "⛵ Skatīt laivu ekskursijas",
  pt: "⛵ Ver passeios de barco", se: "⛵ Se båtturer", ee: "⛵ Vaata paadireise",
}

exports.CAR_ACCESS_HINT_LABELS = {
  ro: (city) => `🚗 Pentru a ajunge la această plajă, ai nevoie de mașină. Vezi prețuri închirieri auto în ${city}`,
  uk: (city) => `🚗 You'll need a car to reach this beach. See car rental prices in ${city}`,
  de: (city) => `🚗 Für diesen Strand brauchst du ein Auto. Mietwagenpreise in ${city} ansehen`,
  fr: (city) => `🚗 Une voiture est nécessaire pour atteindre cette plage. Voir les prix de location à ${city}`,
  es: (city) => `🚗 Necesitas un coche para llegar a esta playa. Ver precios de alquiler en ${city}`,
  it: (city) => `🚗 Per raggiungere questa spiaggia serve un'auto. Vedi i prezzi di noleggio a ${city}`,
  pl: (city) => `🚗 Aby dotrzeć na tę plażę, potrzebujesz samochodu. Zobacz ceny wynajmu w ${city}`,
  nl: (city) => `🚗 Je hebt een auto nodig om dit strand te bereiken. Bekijk huurprijzen in ${city}`,
  da: (city) => `🚗 Du skal bruge en bil for at nå denne strand. Se lejepriser i ${city}`,
  cz: (city) => `🚗 Na tuto pláž se dostanete jen autem. Zobrazit ceny půjčoven v ${city}`,
  fi: (city) => `🚗 Tarvitset auton päästäksesi tälle rannalle. Katso vuokrahinnat kaupungissa ${city}`,
  gr: (city) => `🚗 Χρειάζεσαι αυτοκίνητο για να φτάσεις σε αυτή την παραλία. Δες τιμές ενοικίασης στην ${city}`,
  hu: (city) => `🚗 Ehhez a strandhoz autóra van szükséged. Nézd meg a bérlési árakat itt: ${city}`,
  hr: (city) => `🚗 Do ove plaže treba vam automobil. Pogledajte cijene najma u ${city}`,
  sk: (city) => `🚗 Na túto pláž sa dostanete len autom. Zobraziť ceny prenájmu v ${city}`,
  si: (city) => `🚗 Do te plaže potrebujete avto. Oglejte si cene najema v ${city}`,
  lt: (city) => `🚗 Norint pasiekti šį paplūdimį, reikia automobilio. Žiūrėti nuomos kainas ${city}`,
  lv: (city) => `🚗 Lai nokļūtu šajā pludmalē, nepieciešama automašīna. Skatīt nomas cenas ${city}`,
  pt: (city) => `🚗 Precisas de carro para chegar a esta praia. Vê preços de aluguer em ${city}`,
  se: (city) => `🚗 Du behöver en bil för att nå denna strand. Se hyrpriser i ${city}`,
  ee: (city) => `🚗 Sellele rannale jõudmiseks on vaja autot. Vaata rendihindu linnas ${city}`,
}

exports.FREE_ACCESS_LABELS = {
  ro: "🌤️ Acces liber, non-stop — nu are program de vizitare.",
  uk: "🌤️ Free access, open 24/7 — no visiting hours.",
  de: "🌤️ Freier Zugang, rund um die Uhr — keine Öffnungszeiten.",
  fr: "🌤️ Accès libre, 24h/24 — pas d'horaires de visite.",
  es: "🌤️ Acceso libre, 24 horas — sin horario de visita.",
  it: "🌤️ Accesso libero, 24 ore su 24 — senza orari di visita.",
  pl: "🌤️ Wolny dostęp, całodobowo — bez godzin zwiedzania.",
  nl: "🌤️ Vrije toegang, 24/7 — geen bezoekuren.",
  da: "🌤️ Fri adgang, døgnet rundt — ingen åbningstider.",
  cz: "🌤️ Volný přístup, nepřetržitě — bez otevírací doby.",
  fi: "🌤️ Vapaa pääsy, ympäri vuorokauden — ei aukioloaikoja.",
  gr: "🌤️ Ελεύθερη πρόσβαση, 24 ώρες — χωρίς ωράριο επίσκεψης.",
  hu: "🌤️ Szabad bejárás, éjjel-nappal — nincs látogatási idő.",
  hr: "🌤️ Slobodan pristup, 24 sata — bez radnog vremena.",
  sk: "🌤️ Voľný prístup, nepretržite — bez otváracích hodín.",
  si: "🌤️ Prost dostop, 24 ur — brez obratovalnega časa.",
  lt: "🌤️ Laisvas įėjimas, visą parą — be lankymo valandų.",
  lv: "🌤️ Brīva piekļuve, visu diennakti — bez apmeklējuma laika.",
  pt: "🌤️ Acesso livre, 24 horas — sem horário de visita.",
  se: "🌤️ Fritt tillträde, dygnet runt — inga öppettider.",
  ee: "🌤️ Vaba juurdepääs, ööpäevaringselt — külastusaega pole.",
}

exports.SEASONAL_WARNING_LABELS = {
  ro: "❄️ Verifică starea drumului și condițiile meteo înainte de a pleca, mai ales iarna.",
  uk: "❄️ Check road conditions and weather before you go, especially in winter.",
  de: "❄️ Prüfe vor der Abfahrt die Straßen- und Wetterbedingungen, besonders im Winter.",
  fr: "❄️ Vérifiez l'état des routes et la météo avant de partir, surtout en hiver.",
  es: "❄️ Comprueba el estado de la carretera y el tiempo antes de salir, sobre todo en invierno.",
  it: "❄️ Controlla le condizioni stradali e meteo prima di partire, soprattutto in inverno.",
  pl: "❄️ Sprawdź stan dróg i pogodę przed wyjazdem, szczególnie zimą.",
  nl: "❄️ Controleer de weg- en weersomstandigheden voordat je vertrekt, vooral 's winters.",
  da: "❄️ Tjek vej- og vejrforhold, før du tager af sted, især om vinteren.",
  cz: "❄️ Před cestou zkontrolujte stav silnic a počasí, zejména v zimě.",
  fi: "❄️ Tarkista tie- ja sääolot ennen lähtöä, erityisesti talvella.",
  gr: "❄️ Ελέγξτε τις συνθήκες του δρόμου και τον καιρό πριν φύγετε, ειδικά τον χειμώνα.",
  hu: "❄️ Indulás előtt ellenőrizd az útviszonyokat és az időjárást, különösen télen.",
  hr: "❄️ Provjerite stanje ceste i vremenske uvjete prije polaska, posebno zimi.",
  sk: "❄️ Pred odchodom skontrolujte stav ciest a počasie, najmä v zime.",
  si: "❄️ Pred odhodom preverite stanje cest in vreme, zlasti pozimi.",
  lt: "❄️ Prieš išvykdami patikrinkite kelių būklę ir orus, ypač žiemą.",
  lv: "❄️ Pirms došanās pārbaudiet ceļu stāvokli un laikapstākļus, īpaši ziemā.",
  pt: "❄️ Verifica o estado da estrada e o tempo antes de partires, especialmente no inverno.",
  se: "❄️ Kontrollera väg- och väderförhållanden innan du åker, särskilt på vintern.",
  ee: "❄️ Enne teele asumist kontrolli tee- ja ilmastikuolusid, eriti talvel.",
}

exports.OPEN_ONLY_STORE_LABELS = {
  ro: "Doar magazinele deschise acum", uk: "Only stores open now", de: "Nur aktuell geöffnete Geschäfte",
  fr: "Uniquement les magasins ouverts", es: "Solo tiendas abiertas ahora", it: "Solo negozi aperti ora",
  pl: "Tylko otwarte teraz sklepy", nl: "Alleen nu geopende winkels", da: "Kun åbne butikker nu",
  cz: "Jen aktuálně otevřené obchody", fi: "Vain nyt avoinna olevat kaupat", gr: "Μόνο ανοιχτά καταστήματα τώρα",
  hu: "Csak most nyitva tartó üzletek", hr: "Samo trgovine otvorene sada", sk: "Len teraz otvorené obchody",
  si: "Samo zdaj odprte trgovine", lt: "Tik dabar veikiančios parduotuvės", lv: "Tikai tagad atvērti veikali",
  pt: "Apenas lojas abertas agora", se: "Endast öppna butiker nu", ee: "Ainult praegu avatud poed",
}

exports.OPEN_ONLY_ATTRACTION_LABELS = {
  ro: "Doar obiectivele deschise acum", uk: "Only attractions open now", de: "Nur aktuell geöffnete Sehenswürdigkeiten",
  fr: "Uniquement les sites ouverts", es: "Solo atracciones abiertas ahora", it: "Solo attrazioni aperte ora",
  pl: "Tylko otwarte teraz atrakcje", nl: "Alleen nu geopende attracties", da: "Kun åbne seværdigheder nu",
  cz: "Jen aktuálně otevřené zajímavosti", fi: "Vain nyt avoinna olevat kohteet", gr: "Μόνο ανοιχτά αξιοθέατα τώρα",
  hu: "Csak most nyitva tartó látnivalók", hr: "Samo znamenitosti otvorene sada", sk: "Len teraz otvorené atrakcie",
  si: "Samo zdaj odprte znamenitosti", lt: "Tik dabar veikiančios lankytinos vietos", lv: "Tikai tagad atvērtas apskates vietas",
  pt: "Apenas atrações abertas agora", se: "Endast öppna sevärdheter nu", ee: "Ainult praegu avatud vaatamisväärsused",
}

exports.OPEN_ONLY_SHORT_LABELS = {
  ro: "Arată doar cele deschise acum", uk: "Show only open now", de: "Nur aktuell geöffnete zeigen",
  fr: "Afficher seulement les ouverts", es: "Mostrar solo los abiertos ahora", it: "Mostra solo quelli aperti ora",
  pl: "Pokaż tylko otwarte teraz", nl: "Alleen nu geopende tonen", da: "Vis kun åbne nu",
  cz: "Zobrazit jen aktuálně otevřené", fi: "Näytä vain nyt avoinna olevat", gr: "Εμφάνιση μόνο ανοιχτών τώρα",
  hu: "Csak most nyitva tartók", hr: "Prikaži samo otvorene sada", sk: "Zobraziť len teraz otvorené",
  si: "Prikaži samo zdaj odprte", lt: "Rodyti tik dabar veikiančius", lv: "Rādīt tikai tagad atvērtos",
  pt: "Mostrar apenas os abertos agora", se: "Visa endast öppna nu", ee: "Näita ainult praegu avatuid",
}

exports.LIVE_COMING_SOON_LABELS = {
  ro: "🔜 Programul live urmează în curând pentru acest obiectiv.",
  uk: "🔜 Live schedule coming soon for this attraction.",
  de: "🔜 Live-Öffnungszeiten für diese Sehenswürdigkeit folgen in Kürze.",
  fr: "🔜 Les horaires en direct arrivent bientôt pour ce site.",
  es: "🔜 Próximamente horario en vivo para esta atracción.",
  it: "🔜 Presto disponibili gli orari in tempo reale per questa attrazione.",
  pl: "🔜 Wkrótce dostępne godziny na żywo dla tej atrakcji.",
  nl: "🔜 Binnenkort live openingstijden voor deze attractie.",
  da: "🔜 Live åbningstider kommer snart for denne seværdighed.",
  cz: "🔜 Živé otevírací doby pro tuto zajímavost budou brzy k dispozici.",
  fi: "🔜 Reaaliaikaiset aukioloajat tälle kohteelle tulossa pian.",
  gr: "🔜 Σύντομα διαθέσιμο το ζωντανό ωράριο για αυτό το αξιοθέατο.",
  hu: "🔜 Hamarosan élő nyitvatartás érkezik ehhez a látnivalóhoz.",
  hr: "🔜 Radno vrijeme uživo za ovu znamenitost uskoro stiže.",
  sk: "🔜 Živý otvárací čas pre túto atrakciu čoskoro pribudne.",
  si: "🔜 Delovni čas v živo za to znamenitost bo kmalu na voljo.",
  lt: "🔜 Netrukus atsiras šios lankytinos vietos gyvas darbo laikas.",
  lv: "🔜 Drīzumā būs pieejams šīs apskates vietas tiešraides darba laiks.",
  pt: "🔜 Em breve, horário em direto para esta atração.",
  se: "🔜 Livöppettider för denna sevärdhet kommer snart.",
  ee: "🔜 Selle vaatamisväärsuse reaalajas lahtiolekuajad lisatakse peagi.",
}

exports.ESTIMATED_SCHEDULE_LABELS = {
  ro: "Program orientativ, tipic categoriei — neconfirmat live încă",
  uk: "Typical schedule for this type of attraction — not live-confirmed yet",
  de: "Typische Öffnungszeiten für diese Art von Sehenswürdigkeit — noch nicht live bestätigt",
  fr: "Horaires typiques pour ce type de site — pas encore confirmés en direct",
  es: "Horario típico para este tipo de atracción — aún no confirmado en vivo",
  it: "Orario tipico per questo tipo di attrazione — non ancora confermato in tempo reale",
  pl: "Typowe godziny dla tego typu atrakcji — jeszcze niepotwierdzone na żywo",
  nl: "Typische openingstijden voor dit type attractie — nog niet live bevestigd",
  da: "Typiske åbningstider for denne type seværdighed — endnu ikke live-bekræftet",
  cz: "Typická otevírací doba pro tento typ zajímavosti — zatím nepotvrzeno živě",
  fi: "Tyypilliset aukioloajat tämäntyyppiselle kohteelle — ei vielä reaaliaikaisesti vahvistettu",
  gr: "Τυπικό ωράριο για αυτόν τον τύπο αξιοθέατου — δεν έχει επιβεβαιωθεί ζωντανά ακόμα",
  hu: "Ilyen típusú látnivalóra jellemző nyitvatartás — élőben még nem megerősítve",
  hr: "Tipično radno vrijeme za ovu vrstu znamenitosti — još nije potvrđeno uživo",
  sk: "Typický otvárací čas pre tento typ atrakcie — zatiaľ nepotvrdené naživo",
  si: "Značilen delovni čas za to vrsto znamenitosti — še ni potrjeno v živo",
  lt: "Šio tipo lankytinai vietai būdingas darbo laikas — dar nepatvirtinta gyvai",
  lv: "Šāda veida apskates vietai raksturīgs darba laiks — vēl nav apstiprināts tiešraidē",
  pt: "Horário típico para este tipo de atração — ainda não confirmado em direto",
  se: "Typiska öppettider för denna typ av sevärdhet — ännu inte livebekräftat",
  ee: "Seda tüüpi vaatamisväärsusele tüüpiline lahtiolekuaeg — reaalajas veel kinnitamata",
}

exports.CATEGORY_LABELS = {
  ro: {
    castele_palate: "🏰 Castele, Palate și Conace",
    cetati_turnuri: "🏯 Cetăți, Fortărețe și Turnuri Istorice",
    manastiri: "⛪ Mănăstiri și Lăcașuri de Cult Monumentale",
    biserici_cimitire: "🛖 Biserici Fortificate și Cimitire Unice",
    natura: "🏔️ Monumente ale Naturii, Peșteri și Rezervații",
    infrastructura: "🚗 Șosele Alpine și Infrastructură Turistică",
    muzee: "🖼️ Muzee de Artă, Istorie și Etnografie",
    cladiri_teatre: "🏛️ Clădiri Monumentale, Teatre și Piețe Urbane",
    parcuri_agrement: "🎢 Parcuri de Agrement și Recreere",
    plaje_organizate: "🏖️ Plaje Organizate",
    plaje_salbatice: "🌊 Plaje Sălbatice",
  },
  uk: {
    castele_palate: "🏰 Castles, Palaces and Manors",
    cetati_turnuri: "🏯 Citadels, Fortresses and Historic Towers",
    manastiri: "⛪ Monasteries and Monumental Places of Worship",
    biserici_cimitire: "🛖 Fortified Churches and Unique Cemeteries",
    natura: "🏔️ Natural Monuments, Caves and Reserves",
    infrastructura: "🚗 Mountain Roads and Tourist Infrastructure",
    muzee: "🖼️ Art, History and Ethnography Museums",
    cladiri_teatre: "🏛️ Monumental Buildings, Theatres and Squares",
    parcuri_agrement: "🎢 Amusement and Leisure Parks",
    plaje_organizate: "🏖️ Organized Beaches",
    plaje_salbatice: "🌊 Wild Beaches",
  },
  de: {
    castele_palate: "🏰 Burgen, Paläste und Herrenhäuser",
    cetati_turnuri: "🏯 Zitadellen, Festungen und historische Türme",
    manastiri: "⛪ Klöster und monumentale Gotteshäuser",
    biserici_cimitire: "🛖 Wehrkirchen und einzigartige Friedhöfe",
    natura: "🏔️ Naturdenkmäler, Höhlen und Reservate",
    infrastructura: "🚗 Bergstraßen und touristische Infrastruktur",
    muzee: "🖼️ Kunst-, Geschichts- und Volkskundemuseen",
    cladiri_teatre: "🏛️ Monumentale Gebäude, Theater und Plätze",
    parcuri_agrement: "🎢 Freizeitparks und Erholung",
    plaje_organizate: "🏖️ Organisierte Strände",
    plaje_salbatice: "🌊 Wilde Strände",
  },
  es: {
    castele_palate: "🏰 Castillos, Palacios y Casas Solariegas",
    cetati_turnuri: "🏯 Ciudadelas, Fortalezas y Torres Históricas",
    manastiri: "⛪ Monasterios y Lugares de Culto Monumentales",
    biserici_cimitire: "🛖 Iglesias Fortificadas y Cementerios Únicos",
    natura: "🏔️ Monumentos Naturales, Cuevas y Reservas",
    infrastructura: "🚗 Carreteras de Montaña e Infraestructura Turística",
    muzee: "🖼️ Museos de Arte, Historia y Etnografía",
    cladiri_teatre: "🏛️ Edificios Monumentales, Teatros y Plazas",
    parcuri_agrement: "🎢 Parques de Atracciones y Ocio",
    plaje_organizate: "🏖️ Playas Organizadas",
    plaje_salbatice: "🌊 Playas Salvajes",
  },
  fr: {
    castele_palate: "🏰 Châteaux, Palais et Manoirs",
    cetati_turnuri: "🏯 Citadelles, Forteresses et Tours Historiques",
    manastiri: "⛪ Monastères et Lieux de Culte Monumentaux",
    biserici_cimitire: "🛖 Églises Fortifiées et Cimetières Uniques",
    natura: "🏔️ Monuments Naturels, Grottes et Réserves",
    infrastructura: "🚗 Routes de Montagne et Infrastructures Touristiques",
    muzee: "🖼️ Musées d'Art, d'Histoire et d'Ethnographie",
    cladiri_teatre: "🏛️ Bâtiments Monumentaux, Théâtres et Places",
    parcuri_agrement: "🎢 Parcs d'Attractions et de Loisirs",
    plaje_organizate: "🏖️ Plages Organisées",
    plaje_salbatice: "🌊 Plages Sauvages",
  },
  it: {
    castele_palate: "🏰 Castelli, Palazzi e Manieri",
    cetati_turnuri: "🏯 Cittadelle, Fortezze e Torri Storiche",
    manastiri: "⛪ Monasteri e Luoghi di Culto Monumentali",
    biserici_cimitire: "🛖 Chiese Fortificate e Cimiteri Unici",
    natura: "🏔️ Monumenti Naturali, Grotte e Riserve",
    infrastructura: "🚗 Strade di Montagna e Infrastrutture Turistiche",
    muzee: "🖼️ Musei d'Arte, Storia ed Etnografia",
    cladiri_teatre: "🏛️ Edifici Monumentali, Teatri e Piazze",
    parcuri_agrement: "🎢 Parchi Divertimento e Tempo Libero",
    plaje_organizate: "🏖️ Spiagge Organizzate",
    plaje_salbatice: "🌊 Spiagge Selvagge",
  },
  pl: {
    castele_palate: "🏰 Zamki, Pałace i Dwory",
    cetati_turnuri: "🏯 Cytadele, Twierdze i Historyczne Wieże",
    manastiri: "⛪ Klasztory i Monumentalne Miejsca Kultu",
    biserici_cimitire: "🛖 Kościoły Warowne i Wyjątkowe Cmentarze",
    natura: "🏔️ Pomniki Przyrody, Jaskinie i Rezerwaty",
    infrastructura: "🚗 Drogi Górskie i Infrastruktura Turystyczna",
    muzee: "🖼️ Muzea Sztuki, Historii i Etnografii",
    cladiri_teatre: "🏛️ Budowle Monumentalne, Teatry i Place",
    parcuri_agrement: "🎢 Parki Rozrywki i Rekreacji",
    plaje_organizate: "🏖️ Zorganizowane Plaże",
    plaje_salbatice: "🌊 Dzikie Plaże",
  },
  nl: {
    castele_palate: "🏰 Kastelen, Paleizen en Landhuizen",
    cetati_turnuri: "🏯 Citadellen, Vestingen en Historische Torens",
    manastiri: "⛪ Kloosters en Monumentale Gebedshuizen",
    biserici_cimitire: "🛖 Versterkte Kerken en Unieke Begraafplaatsen",
    natura: "🏔️ Natuurmonumenten, Grotten en Reservaten",
    infrastructura: "🚗 Bergwegen en Toeristische Infrastructuur",
    muzee: "🖼️ Kunst-, Geschiedenis- en Etnografiemusea",
    cladiri_teatre: "🏛️ Monumentale Gebouwen, Theaters en Pleinen",
    parcuri_agrement: "🎢 Pretparken en Recreatie",
    plaje_organizate: "🏖️ Georganiseerde Stranden",
    plaje_salbatice: "🌊 Wilde Stranden",
  },
  da: {
    castele_palate: "🏰 Slotte, Paladser og Herregårde",
    cetati_turnuri: "🏯 Citadeller, Fæstninger og Historiske Tårne",
    manastiri: "⛪ Klostre og Monumentale Gudshuse",
    biserici_cimitire: "🛖 Befæstede Kirker og Unikke Kirkegårde",
    natura: "🏔️ Naturmonumenter, Grotter og Reservater",
    infrastructura: "🚗 Bjergveje og Turistinfrastruktur",
    muzee: "🖼️ Kunst-, Historie- og Etnografimuseer",
    cladiri_teatre: "🏛️ Monumentale Bygninger, Teatre og Pladser",
    parcuri_agrement: "🎢 Forlystelsesparker og Fritid",
    plaje_organizate: "🏖️ Organiserede Strande",
    plaje_salbatice: "🌊 Vilde Strande",
  },
  se: {
    castele_palate: "🏰 Slott, Palats och Herrgårdar",
    cetati_turnuri: "🏯 Citadeller, Fästningar och Historiska Torn",
    manastiri: "⛪ Kloster och Monumentala Gudshus",
    biserici_cimitire: "🛖 Befästa Kyrkor och Unika Kyrkogårdar",
    natura: "🏔️ Naturminnen, Grottor och Reservat",
    infrastructura: "🚗 Bergsvägar och Turistinfrastruktur",
    muzee: "🖼️ Konst-, Historia- och Etnografimuseer",
    cladiri_teatre: "🏛️ Monumentala Byggnader, Teatrar och Torg",
    parcuri_agrement: "🎢 Nöjesparker och Rekreation",
    plaje_organizate: "🏖️ Organiserade Stränder",
    plaje_salbatice: "🌊 Vilda Stränder",
  },
  pt: {
    castele_palate: "🏰 Castelos, Palácios e Solares",
    cetati_turnuri: "🏯 Cidadelas, Fortalezas e Torres Históricas",
    manastiri: "⛪ Mosteiros e Locais de Culto Monumentais",
    biserici_cimitire: "🛖 Igrejas Fortificadas e Cemitérios Únicos",
    natura: "🏔️ Monumentos Naturais, Grutas e Reservas",
    infrastructura: "🚗 Estradas de Montanha e Infraestrutura Turística",
    muzee: "🖼️ Museus de Arte, História e Etnografia",
    cladiri_teatre: "🏛️ Edifícios Monumentais, Teatros e Praças",
    parcuri_agrement: "🎢 Parques de Diversão e Lazer",
    plaje_organizate: "🏖️ Praias Organizadas",
    plaje_salbatice: "🌊 Praias Selvagens",
  },
  cz: {
    castele_palate: "🏰 Hrady, Paláce a Zámky",
    cetati_turnuri: "🏯 Citadely, Pevnosti a Historické Věže",
    manastiri: "⛪ Kláštery a Monumentální Bohoslužebná Místa",
    biserici_cimitire: "🛖 Opevněné Kostely a Jedinečné Hřbitovy",
    natura: "🏔️ Přírodní Památky, Jeskyně a Rezervace",
    infrastructura: "🚗 Horské Silnice a Turistická Infrastruktura",
    muzee: "🖼️ Muzea Umění, Historie a Etnografie",
    cladiri_teatre: "🏛️ Monumentální Budovy, Divadla a Náměstí",
    parcuri_agrement: "🎢 Zábavní Parky a Rekreace",
    plaje_organizate: "🏖️ Organizované Pláže",
    plaje_salbatice: "🌊 Divoké Pláže",
  },
  fi: {
    castele_palate: "🏰 Linnat, Palatsit ja Kartanot",
    cetati_turnuri: "🏯 Linnoitukset, Varustukset ja Historialliset Tornit",
    manastiri: "⛪ Luostarit ja Monumentaaliset Uskonnolliset Paikat",
    biserici_cimitire: "🛖 Linnoitetut Kirkot ja Ainutlaatuiset Hautausmaat",
    natura: "🏔️ Luonnonmuistomerkit, Luolat ja Suojelualueet",
    infrastructura: "🚗 Vuoristotiet ja Matkailuinfrastruktuuri",
    muzee: "🖼️ Taide-, Historia- ja Kansatieteen Museot",
    cladiri_teatre: "🏛️ Monumentaaliset Rakennukset, Teatterit ja Aukiot",
    parcuri_agrement: "🎢 Huvipuistot ja Vapaa-aika",
    plaje_organizate: "🏖️ Järjestetyt Rannat",
    plaje_salbatice: "🌊 Villit Rannat",
  },
  gr: {
    castele_palate: "🏰 Κάστρα, Παλάτια και Αρχοντικά",
    cetati_turnuri: "🏯 Ακροπόλεις, Φρούρια και Ιστορικοί Πύργοι",
    manastiri: "⛪ Μοναστήρια και Μνημειακοί Χώροι Λατρείας",
    biserici_cimitire: "🛖 Οχυρωμένες Εκκλησίες και Μοναδικά Νεκροταφεία",
    natura: "🏔️ Φυσικά Μνημεία, Σπήλαια και Καταφύγια",
    infrastructura: "🚗 Ορεινοί Δρόμοι και Τουριστικές Υποδομές",
    muzee: "🖼️ Μουσεία Τέχνης, Ιστορίας και Εθνογραφίας",
    cladiri_teatre: "🏛️ Μνημειακά Κτίρια, Θέατρα και Πλατείες",
    parcuri_agrement: "🎢 Πάρκα Αναψυχής και Ψυχαγωγίας",
    plaje_organizate: "🏖️ Οργανωμένες Παραλίες",
    plaje_salbatice: "🌊 Άγριες Παραλίες",
  },
  hu: {
    castele_palate: "🏰 Kastélyok, Paloták és Kúriák",
    cetati_turnuri: "🏯 Fellegvárak, Erődök és Történelmi Tornyok",
    manastiri: "⛪ Kolostorok és Monumentális Vallási Helyek",
    biserici_cimitire: "🛖 Erődtemplomok és Egyedülálló Temetők",
    natura: "🏔️ Természeti Emlékek, Barlangok és Rezervátumok",
    infrastructura: "🚗 Hegyi Utak és Turisztikai Infrastruktúra",
    muzee: "🖼️ Művészeti, Történeti és Néprajzi Múzeumok",
    cladiri_teatre: "🏛️ Monumentális Épületek, Színházak és Terek",
    parcuri_agrement: "🎢 Vidámparkok és Szabadidő",
    plaje_organizate: "🏖️ Szervezett Strandok",
    plaje_salbatice: "🌊 Vad Strandok",
  },
  hr: {
    castele_palate: "🏰 Dvorci, Palače i Vlastelinstva",
    cetati_turnuri: "🏯 Utvrde, Tvrđave i Povijesni Tornjevi",
    manastiri: "⛪ Samostani i Monumentalna Sveta Mjesta",
    biserici_cimitire: "🛖 Utvrđene Crkve i Jedinstvena Groblja",
    natura: "🏔️ Prirodni Spomenici, Špilje i Rezervati",
    infrastructura: "🚗 Planinske Ceste i Turistička Infrastruktura",
    muzee: "🖼️ Muzeji Umjetnosti, Povijesti i Etnografije",
    cladiri_teatre: "🏛️ Monumentalne Zgrade, Kazališta i Trgovi",
    parcuri_agrement: "🎢 Zabavni Parkovi i Rekreacija",
    plaje_organizate: "🏖️ Uređene Plaže",
    plaje_salbatice: "🌊 Divlje Plaže",
  },
  sk: {
    castele_palate: "🏰 Hrady, Paláce a Kaštiele",
    cetati_turnuri: "🏯 Citadely, Pevnosti a Historické Veže",
    manastiri: "⛪ Kláštory a Monumentálne Bohoslužobné Miesta",
    biserici_cimitire: "🛖 Opevnené Kostoly a Jedinečné Cintoríny",
    natura: "🏔️ Prírodné Pamiatky, Jaskyne a Rezervácie",
    infrastructura: "🚗 Horské Cesty a Turistická Infraštruktúra",
    muzee: "🖼️ Múzeá Umenia, Histórie a Etnografie",
    cladiri_teatre: "🏛️ Monumentálne Budovy, Divadlá a Námestia",
    parcuri_agrement: "🎢 Zábavné Parky a Rekreácia",
    plaje_organizate: "🏖️ Organizované Pláže",
    plaje_salbatice: "🌊 Divoké Pláže",
  },
  si: {
    castele_palate: "🏰 Gradovi, Palače in Dvorci",
    cetati_turnuri: "🏯 Citadele, Trdnjave in Zgodovinski Stolpi",
    manastiri: "⛪ Samostani in Monumentalni Verski Objekti",
    biserici_cimitire: "🛖 Utrjene Cerkve in Edinstvena Pokopališča",
    natura: "🏔️ Naravni Spomeniki, Jame in Rezervati",
    infrastructura: "🚗 Gorske Ceste in Turistična Infrastruktura",
    muzee: "🖼️ Muzeji Umetnosti, Zgodovine in Etnografije",
    cladiri_teatre: "🏛️ Monumentalne Stavbe, Gledališča in Trgi",
    parcuri_agrement: "🎢 Zabaviščni Parki in Rekreacija",
    plaje_organizate: "🏖️ Urejene Plaže",
    plaje_salbatice: "🌊 Divje Plaže",
  },
  lt: {
    castele_palate: "🏰 Pilys, Rūmai ir Dvarai",
    cetati_turnuri: "🏯 Citadelės, Tvirtovės ir Istoriniai Bokštai",
    manastiri: "⛪ Vienuolynai ir Monumentalios Kulto Vietos",
    biserici_cimitire: "🛖 Įtvirtintos Bažnyčios ir Unikalios Kapinės",
    natura: "🏔️ Gamtos Paminklai, Urvai ir Rezervatai",
    infrastructura: "🚗 Kalnų Keliai ir Turizmo Infrastruktūra",
    muzee: "🖼️ Meno, Istorijos ir Etnografijos Muziejai",
    cladiri_teatre: "🏛️ Monumentalūs Pastatai, Teatrai ir Aikštės",
    parcuri_agrement: "🎢 Pramogų Parkai ir Poilsis",
    plaje_organizate: "🏖️ Sutvarkyti Paplūdimiai",
    plaje_salbatice: "🌊 Laukiniai Paplūdimiai",
  },
  lv: {
    castele_palate: "🏰 Pilis un Muižas",
    cetati_turnuri: "🏯 Citadeles, Cietokšņi un Vēsturiski Torņi",
    manastiri: "⛪ Klosteri un Monumentālas Kulta Vietas",
    biserici_cimitire: "🛖 Nocietinātas Baznīcas un Unikāli Kapsētas",
    natura: "🏔️ Dabas Pieminekļi, Alas un Rezervāti",
    infrastructura: "🚗 Kalnu Ceļi un Tūrisma Infrastruktūra",
    muzee: "🖼️ Mākslas, Vēstures un Etnogrāfijas Muzeji",
    cladiri_teatre: "🏛️ Monumentālas Ēkas, Teātri un Laukumi",
    parcuri_agrement: "🎢 Atrakciju Parki un Atpūta",
    plaje_organizate: "🏖️ Iekārtoti Pludmales",
    plaje_salbatice: "🌊 Savvaļas Pludmales",
  },
  ee: {
    castele_palate: "🏰 Lossid, Paleed ja Mõisad",
    cetati_turnuri: "🏯 Kindlused, Linnused ja Ajaloolised Tornid",
    manastiri: "⛪ Kloostrid ja Monumentaalsed Kultuskohad",
    biserici_cimitire: "🛖 Kindlustatud Kirikud ja Unikaalsed Kalmistud",
    natura: "🏔️ Looduslikud Mälestised, Koopad ja Kaitsealad",
    infrastructura: "🚗 Mägiteed ja Turismiinfrastruktuur",
    muzee: "🖼️ Kunsti-, Ajaloo- ja Etnograafiamuuseumid",
    cladiri_teatre: "🏛️ Monumentaalsed Hooned, Teatrid ja Väljakud",
    parcuri_agrement: "🎢 Lõbustuspargid ja Vaba Aeg",
    plaje_organizate: "🏖️ Korrastatud Rannad",
    plaje_salbatice: "🌊 Metsikud Rannad",
  },
}

exports.LOADING_TEXTS = {
  ro: "Se încarcă…", uk: "Loading…", de: "Wird geladen…", es: "Cargando…",
  fr: "Chargement…", it: "Caricamento…", pl: "Ładowanie…", nl: "Laden…",
  da: "Indlæser…", se: "Laddar…", pt: "A carregar…", cz: "Načítání…",
  fi: "Ladataan…", gr: "Φόρτωση…", hu: "Betöltés…", hr: "Učitavanje…",
  sk: "Načítava sa…", si: "Nalaganje…", lt: "Kraunama…", lv: "Ielādē…", ee: "Laadimine…",
}

exports.TRANSLATIONS = {
  ro: {
    dayNames: ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"],
    homeH1: "Este magazinul deschis chiar acum?",
    homeIntro: "Caută direct sau apasă 📍 ca să găsim automat orașul tău. Mai jos poți alege și limba sau o țară, ca să filtrezi tot — magazine și obiective deopotrivă.",
    chooseCountry: "Alege o țară",
    showAllCountries: "🌍 Arată toate țările",
    storesIn: "Magazine în",
    attractionsIn: "Obiective în",
    attractionsIntro: (favHref, itinHref) => `Informații și bilete oficiale. Verifică programul actualizat înainte de vizită, adaugă obiective turistice la <a href="${favHref}" class="intro-inline-link">favorite (⭐)</a> pentru mai târziu sau creează un <a href="${itinHref}" class="intro-inline-link">itinerar (🧭)</a>.`,
    allPrefix: "Toate",
    geoLooksLike: "📍 Se pare că ești în",
    geoShowingFirst: "— ți-l arătăm primul. Apasă 🌍 ca să răsfoiești tot, sau alege alt steag mai jos oricând.",
    pushSubBtn: "🔔 Abonează-te la alerte (sărbători, program special)",
    favoritesLabel: "⭐ Favorite",
    searchPlaceholder: "Caută un magazin sau un obiectiv...",
    home: "Acasă",
    todayLabel: "Azi",
    calculating: "Se calculează programul...",
    weeklyTitle: "Program săptămânal",
    holidaysTitle: "Program de sărbători",
    noHolidays: "Fără program special momentan",
    closedWord: "Închis",
    installBtn: "📱 Instalează aplicația pentru acces rapid",
    iosHint: "Pe iPhone: apasă pe butonul de Partajare (Share) și selectează „Adaugă pe ecranul de pornire”.",
    geoSuggestionPrefix: "📍 Orașul tău pare să fie",
    geoSuggestionBtn: "Vrei să vezi magazinele de aici? →",
    geoSuggestionNote: "Nu e orașul tău? Alege mai jos.",
    amazonBtn: "🛍️ Vezi ofertele de azi pe Amazon",
    ticketBtn: "🎟️ Rezervă bilet online și evită coada",
    tabStores: "🛒 Magazine și Servicii",
    tabAttractions: "🏛️ Obiective Turistice",
    exploreCollections: "Explorează colecții",
    attractionsComingSoon: "Ghidul de obiective turistice este în lucru — revino curând.",
    titleTemplate: (brand, city) => `Program ${brand} ${city} Azi – Deschis sau Închis Acum`,
    descriptionTemplate: (brand, city) => `Vezi acum dacă ${brand} din ${city} este deschis. Program pe zile ale săptămânii și program de sărbători, actualizat live.`,
    disclaimer: (name) => `Programul afișat pentru ${name} este orientativ, pe baza orarului standard anunțat de rețea. Unele locații pot avea ore diferite — verifică programul afișat la intrarea magazinului.`,
    footer: (name) => `îți arată în timp real dacă ${name} este deschis chiar acum, plus programul complet pe zile și programul special de sărbători legale.`,
    labels: {
      openNow: "DESCHIS ACUM",
      closedNow: "ÎNCHIS ACUM",
      closedHoliday: "Închis astăzi — {label}",
      closedAllDay: "Închis toată ziua",
      opensToday: "Se deschide azi la {time}",
      closedComeBack: "S-a închis la {time} — revino mâine",
      closesToday: "Se închide azi la {time}",
    },
  },
  de: {
    dayNames: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
    homeH1: "Ist der Laden gerade geöffnet?",
    homeIntro: "Suche direkt, oder tippe auf 📍, um automatisch deine Stadt zu finden. Unten kannst du auch eine Sprache oder ein Land wählen, um alles zu filtern — Geschäfte und Sehenswürdigkeiten.",
    chooseCountry: "Länder auswählen",
    showAllCountries: "🌍 Alle Länder anzeigen",
    storesIn: "Geschäfte in",
    attractionsIn: "Sehenswürdigkeiten in",
    attractionsIntro: (favHref, itinHref) => `Offizielle Informationen und Tickets. Prüfe vor deinem Besuch die aktuellen Öffnungszeiten, füge Sehenswürdigkeiten zu deinen <a href="${favHref}" class="intro-inline-link">Favoriten (⭐)</a> hinzu oder erstelle eine <a href="${itinHref}" class="intro-inline-link">Reiseroute (🧭)</a>.`,
    allPrefix: "Alle",
    geoLooksLike: "📍 Sieht so aus, als wärst du in",
    geoShowingFirst: "— zeigen wir dir zuerst. Tippe auf 🌍, um alles zu durchsuchen, oder wähle unten jederzeit eine andere Flagge.",
    pushSubBtn: "🔔 Benachrichtigungen abonnieren (Feiertage, Sonderöffnungszeiten)",
    favoritesLabel: "⭐ Favoriten",
    searchPlaceholder: "Geschäft oder Sehenswürdigkeit suchen...",
    home: "Startseite",
    todayLabel: "Heute",
    calculating: "Öffnungszeiten werden berechnet...",
    weeklyTitle: "Wöchentliche Öffnungszeiten",
    holidaysTitle: "Feiertagsöffnungszeiten",
    noHolidays: "Derzeit keine besonderen Öffnungszeiten",
    closedWord: "Geschlossen",
    installBtn: "📱 App für schnellen Zugriff installieren",
    iosHint: "Auf dem iPhone: Tippen Sie auf „Teilen” und wählen Sie „Zum Home-Bildschirm”.",
    geoSuggestionPrefix: "📍 Ihre Stadt scheint zu sein",
    geoSuggestionBtn: "Geschäfte hier anzeigen? →",
    geoSuggestionNote: "Nicht Ihre Stadt? Unten auswählen.",
    amazonBtn: "🛍️ Heutige Angebote bei Amazon ansehen",
    ticketBtn: "🎟️ Tickets online buchen",
    tabStores: "🛒 Geschäfte und Dienstleistungen",
    tabAttractions: "🏛️ Sehenswürdigkeiten",
    attractionsComingSoon: "Der Sehenswürdigkeiten-Guide wird gerade erstellt — schauen Sie bald wieder vorbei.",
    titleTemplate: (brand, city) => `Öffnungszeiten ${brand} ${city} Heute – Geöffnet oder Geschlossen`,
    descriptionTemplate: (brand, city) => `Prüfen Sie jetzt, ob ${brand} in ${city} geöffnet ist. Wöchentliche Öffnungszeiten und Feiertagszeiten, live aktualisiert.`,
    disclaimer: (name) => `Die angezeigten Öffnungszeiten für ${name} sind Richtwerte, basierend auf den Standardzeiten der Kette. Einzelne Filialen können abweichen — bitte prüfen Sie die vor Ort angegebenen Öffnungszeiten.`,
    footer: (name) => `zeigt Ihnen in Echtzeit, ob ${name} gerade geöffnet ist, sowie die vollständigen wöchentlichen Öffnungszeiten und Feiertagszeiten.`,
    labels: {
      openNow: "JETZT GEÖFFNET",
      closedNow: "JETZT GESCHLOSSEN",
      closedHoliday: "Heute geschlossen — {label}",
      closedAllDay: "Ganztägig geschlossen",
      opensToday: "Öffnet heute um {time} Uhr",
      closedComeBack: "Hat um {time} Uhr geschlossen — morgen wieder da",
      closesToday: "Schließt heute um {time} Uhr",
    },
  },
  uk: {
    dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    homeH1: "Is the store open right now?",
    homeIntro: "Search directly, or tap 📍 to find your city automatically. Below you can also pick a language or country to filter everything — Stores and Attractions both.",
    chooseCountry: "Choose a country",
    showAllCountries: "🌍 Show all countries",
    storesIn: "Stores in",
    attractionsIn: "Attractions in",
    attractionsIntro: (favHref, itinHref) => `Official information and tickets. Check the updated hours before your visit, add attractions to your <a href="${favHref}" class="intro-inline-link">favorites (⭐)</a> for later, or create an <a href="${itinHref}" class="intro-inline-link">itinerary (🧭)</a>.`,
    allPrefix: "All",
    geoLooksLike: "📍 Looks like you're in",
    geoShowingFirst: "— showing that first. Tap 🌍 to browse everything, or pick another flag below anytime.",
    pushSubBtn: "🔔 Subscribe to alerts (holidays, special hours)",
    favoritesLabel: "⭐ Favorites",
    searchPlaceholder: "Search a store or attraction...",
    home: "Home",
    todayLabel: "Today",
    calculating: "Calculating opening hours...",
    weeklyTitle: "Weekly Opening Hours",
    holidaysTitle: "Holiday Opening Hours",
    noHolidays: "No special hours at the moment",
    closedWord: "Closed",
    installBtn: "📱 Install the app for quick access",
    iosHint: "On iPhone: tap the Share button and select \"Add to Home Screen\".",
    geoSuggestionPrefix: "📍 Your city appears to be",
    geoSuggestionBtn: "Want to see shops here? →",
    geoSuggestionNote: "Not your city? Choose below.",
    amazonBtn: "🛍️ Check today's deals on Amazon",
    ticketBtn: "🎟️ Book tickets online & skip the line",
    tabStores: "🛒 Stores and Services",
    tabAttractions: "🏛️ Attractions",
    exploreCollections: "Explore collections",
    attractionsComingSoon: "Our attractions guide is on its way — check back soon.",
    titleTemplate: (brand, city) => `${brand} ${city} Opening Hours Today – Open or Closed Now`,
    descriptionTemplate: (brand, city) => `Check now whether ${brand} in ${city} is open. Weekly opening hours and holiday hours, updated live.`,
    disclaimer: (name) => `Opening hours shown for ${name} are indicative, based on the chain's standard hours. Individual branches may vary — please check the hours posted at the store entrance.`,
    footer: (name) => `shows you in real time whether ${name} is currently open, plus full weekly opening hours and holiday hours.`,
    labels: {
      openNow: "OPEN NOW",
      closedNow: "CLOSED NOW",
      closedHoliday: "Closed today — {label}",
      closedAllDay: "Closed all day",
      opensToday: "Opens today at {time}",
      closedComeBack: "Closed at {time} — come back tomorrow",
      closesToday: "Closes today at {time}",
    },
  },
  es: {
    dayNames: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
    homeH1: "¿Está la tienda abierta ahora mismo?",
    homeIntro: "Busca directamente, o toca 📍 para encontrar tu ciudad automáticamente. Abajo también puedes elegir un idioma o país para filtrar todo — tiendas y atracciones.",
    chooseCountry: "Elige un país",
    showAllCountries: "🌍 Mostrar todos los países",
    storesIn: "Tiendas en",
    attractionsIn: "Atracciones en",
    attractionsIntro: (favHref, itinHref) => `Información y entradas oficiales. Comprueba el horario actualizado antes de tu visita, añade atracciones a tus <a href="${favHref}" class="intro-inline-link">favoritos (⭐)</a> para más tarde o crea un <a href="${itinHref}" class="intro-inline-link">itinerario (🧭)</a>.`,
    allPrefix: "Todo",
    geoLooksLike: "📍 Parece que estás en",
    geoShowingFirst: "— mostrando eso primero. Toca 🌍 para ver todo, o elige otra bandera abajo cuando quieras.",
    pushSubBtn: "🔔 Suscríbete a alertas (festivos, horarios especiales)",
    favoritesLabel: "⭐ Favoritos",
    searchPlaceholder: "Buscar una tienda o atracción...",
    home: "Inicio",
    todayLabel: "Hoy",
    calculating: "Calculando el horario...",
    weeklyTitle: "Horario semanal",
    holidaysTitle: "Horario de festivos",
    noHolidays: "Sin horario especial por el momento",
    closedWord: "Cerrado",
    installBtn: "📱 Instala la app para acceso rápido",
    iosHint: "En iPhone: toca el botón Compartir y selecciona «Añadir a pantalla de inicio».",
    geoSuggestionPrefix: "📍 Tu ciudad parece ser",
    geoSuggestionBtn: "¿Quieres ver las tiendas de aquí? →",
    geoSuggestionNote: "¿No es tu ciudad? Elige abajo.",
    amazonBtn: "🛍️ Ver las ofertas de hoy en Amazon",
    ticketBtn: "🎟️ Reserva entradas online y evita la cola",
    tabStores: "🛒 Tiendas y Servicios",
    tabAttractions: "🏛️ Atracciones",
    attractionsComingSoon: "Nuestra guía de atracciones está en camino — vuelve pronto.",
    titleTemplate: (brand, city) => `Horario ${brand} ${city} Hoy – Abierto o Cerrado Ahora`,
    descriptionTemplate: (brand, city) => `Comprueba ahora si ${brand} en ${city} está abierto. Horario semanal y horario de festivos, actualizado en vivo.`,
    disclaimer: (name) => `El horario mostrado para ${name} es orientativo, según el horario estándar de la cadena. Cada tienda puede variar — comprueba el horario indicado en la entrada.`,
    footer: (name) => `te muestra en tiempo real si ${name} está abierto ahora mismo, además del horario semanal completo y el horario de festivos.`,
    labels: {
      openNow: "ABIERTO AHORA",
      closedNow: "CERRADO AHORA",
      closedHoliday: "Cerrado hoy — {label}",
      closedAllDay: "Cerrado todo el día",
      opensToday: "Abre hoy a las {time}",
      closedComeBack: "Cerró a las {time} — vuelve mañana",
      closesToday: "Cierra hoy a las {time}",
    },
  },
  fr: {
    dayNames: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
    homeH1: "Le magasin est-il ouvert maintenant ?",
    homeIntro: "Recherchez directement, ou appuyez sur 📍 pour trouver votre ville automatiquement. Ci-dessous, vous pouvez aussi choisir une langue ou un pays pour tout filtrer — magasins et attractions.",
    chooseCountry: "Choisir un pays",
    showAllCountries: "🌍 Afficher tous les pays",
    storesIn: "Magasins en",
    attractionsIn: "Attractions en",
    attractionsIntro: (favHref, itinHref) => `Informations et billets officiels. Vérifiez les horaires actualisés avant votre visite, ajoutez des attractions à vos <a href="${favHref}" class="intro-inline-link">favoris (⭐)</a> pour plus tard, ou créez un <a href="${itinHref}" class="intro-inline-link">itinéraire (🧭)</a>.`,
    allPrefix: "Tout",
    geoLooksLike: "📍 Il semble que vous soyez à",
    geoShowingFirst: "— on vous le montre en premier. Appuyez sur 🌍 pour tout parcourir, ou choisissez un autre drapeau ci-dessous à tout moment.",
    pushSubBtn: "🔔 S'abonner aux alertes (jours fériés, horaires spéciaux)",
    favoritesLabel: "⭐ Favoris",
    searchPlaceholder: "Rechercher un magasin ou une attraction...",
    home: "Accueil",
    todayLabel: "Aujourd'hui",
    calculating: "Calcul des horaires...",
    weeklyTitle: "Horaires hebdomadaires",
    holidaysTitle: "Horaires des jours fériés",
    noHolidays: "Aucun horaire spécial pour le moment",
    closedWord: "Fermé",
    installBtn: "📱 Installer l'application pour un accès rapide",
    iosHint: "Sur iPhone : appuyez sur le bouton Partager et sélectionnez « Sur l'écran d'accueil ».",
    geoSuggestionPrefix: "📍 Votre ville semble être",
    geoSuggestionBtn: "Voir les magasins ici ? →",
    geoSuggestionNote: "Ce n'est pas votre ville ? Choisissez ci-dessous.",
    amazonBtn: "🛍️ Voir les offres du jour sur Amazon",
    ticketBtn: "🎟️ Réservez vos billets en ligne et évitez la file d'attente",
    tabStores: "🛒 Magasins et Services",
    tabAttractions: "🏛️ Attractions",
    attractionsComingSoon: "Notre guide des attractions arrive bientôt — revenez vite.",
    titleTemplate: (brand, city) => `Horaires ${brand} ${city} Aujourd'hui – Ouvert ou Fermé`,
    descriptionTemplate: (brand, city) => `Vérifiez maintenant si ${brand} à ${city} est ouvert. Horaires hebdomadaires et horaires des jours fériés, mis à jour en direct.`,
    disclaimer: (name) => `Les horaires affichés pour ${name} sont indicatifs, basés sur les horaires standards de l'enseigne. Chaque magasin peut varier — vérifiez les horaires affichés à l'entrée.`,
    footer: (name) => `vous montre en temps réel si ${name} est actuellement ouvert, ainsi que les horaires hebdomadaires complets et les horaires des jours fériés.`,
    labels: {
      openNow: "OUVERT MAINTENANT",
      closedNow: "FERMÉ MAINTENANT",
      closedHoliday: "Fermé aujourd'hui — {label}",
      closedAllDay: "Fermé toute la journée",
      opensToday: "Ouvre aujourd'hui à {time}",
      closedComeBack: "Fermé à {time} — revenez demain",
      closesToday: "Ferme aujourd'hui à {time}",
    },
  },
  it: {
    dayNames: ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"],
    homeH1: "Il negozio è aperto proprio ora?",
    homeIntro: "Cerca direttamente, oppure tocca 📍 per trovare automaticamente la tua città. Qui sotto puoi anche scegliere una lingua o un paese per filtrare tutto — negozi e attrazioni.",
    chooseCountry: "Scegli un paese",
    showAllCountries: "🌍 Mostra tutti i paesi",
    storesIn: "Negozi in",
    attractionsIn: "Attrazioni in",
    attractionsIntro: (favHref, itinHref) => `Informazioni e biglietti ufficiali. Controlla gli orari aggiornati prima della visita, aggiungi attrazioni ai tuoi <a href="${favHref}" class="intro-inline-link">preferiti (⭐)</a> per dopo, oppure crea un <a href="${itinHref}" class="intro-inline-link">itinerario (🧭)</a>.`,
    allPrefix: "Tutti",
    geoLooksLike: "📍 Sembra che tu sia a",
    geoShowingFirst: "— te lo mostriamo per primo. Tocca 🌍 per sfogliare tutto, o scegli un'altra bandiera qui sotto in qualsiasi momento.",
    pushSubBtn: "🔔 Iscriviti agli avvisi (festività, orari speciali)",
    favoritesLabel: "⭐ Preferiti",
    searchPlaceholder: "Cerca un negozio o un'attrazione...",
    home: "Home",
    todayLabel: "Oggi",
    calculating: "Calcolo degli orari in corso...",
    weeklyTitle: "Orari settimanali",
    holidaysTitle: "Orari festivi",
    noHolidays: "Nessun orario speciale al momento",
    closedWord: "Chiuso",
    installBtn: "📱 Installa l'app per un accesso rapido",
    iosHint: "Su iPhone: tocca il pulsante Condividi e seleziona «Aggiungi alla schermata Home».",
    geoSuggestionPrefix: "📍 La tua città sembra essere",
    geoSuggestionBtn: "Vuoi vedere i negozi qui? →",
    geoSuggestionNote: "Non è la tua città? Scegli qui sotto.",
    amazonBtn: "🛍️ Vedi le offerte di oggi su Amazon",
    ticketBtn: "🎟️ Prenota i biglietti online e salta la fila",
    tabStores: "🛒 Negozi e Servizi",
    tabAttractions: "🏛️ Attrazioni",
    attractionsComingSoon: "La nostra guida alle attrazioni sta arrivando — torna presto.",
    titleTemplate: (brand, city) => `Orari ${brand} ${city} Oggi – Aperto o Chiuso Ora`,
    descriptionTemplate: (brand, city) => `Scopri subito se ${brand} a ${city} è aperto. Orari settimanali e festivi, aggiornati in tempo reale.`,
    disclaimer: (name) => `Gli orari mostrati per ${name} sono indicativi, basati sugli orari standard della catena. Ogni punto vendita può variare — verifica gli orari esposti all'ingresso.`,
    footer: (name) => `ti mostra in tempo reale se ${name} è attualmente aperto, oltre agli orari settimanali completi e agli orari festivi.`,
    labels: {
      openNow: "APERTO ORA",
      closedNow: "CHIUSO ORA",
      closedHoliday: "Chiuso oggi — {label}",
      closedAllDay: "Chiuso tutto il giorno",
      opensToday: "Apre oggi alle {time}",
      closedComeBack: "Ha chiuso alle {time} — torna domani",
      closesToday: "Chiude oggi alle {time}",
    },
  },
  pl: {
    dayNames: ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"],
    homeH1: "Czy sklep jest teraz otwarty?",
    homeIntro: "Wyszukaj bezpośrednio lub dotknij 📍, aby automatycznie znaleźć swoje miasto. Poniżej możesz też wybrać język lub kraj, aby wszystko filtrować — sklepy i atrakcje.",
    chooseCountry: "Wybierz kraj",
    showAllCountries: "🌍 Pokaż wszystkie kraje",
    storesIn: "Sklepy w",
    attractionsIn: "Atrakcje w",
    attractionsIntro: (favHref, itinHref) => `Oficjalne informacje i bilety. Sprawdź aktualne godziny przed wizytą, dodaj atrakcje do <a href="${favHref}" class="intro-inline-link">ulubionych (⭐)</a> na później lub stwórz <a href="${itinHref}" class="intro-inline-link">plan podróży (🧭)</a>.`,
    allPrefix: "Wszystkie",
    geoLooksLike: "📍 Wygląda na to, że jesteś w",
    geoShowingFirst: "— pokazujemy to jako pierwsze. Dotknij 🌍, aby przeglądać wszystko, lub wybierz inną flagę poniżej w dowolnym momencie.",
    pushSubBtn: "🔔 Subskrybuj powiadomienia (święta, specjalne godziny)",
    favoritesLabel: "⭐ Ulubione",
    searchPlaceholder: "Szukaj sklepu lub atrakcji...",
    home: "Strona główna",
    todayLabel: "Dziś",
    calculating: "Obliczanie godzin otwarcia...",
    weeklyTitle: "Godziny otwarcia w tygodniu",
    holidaysTitle: "Godziny otwarcia w święta",
    noHolidays: "Brak specjalnych godzin w tej chwili",
    closedWord: "Zamknięte",
    installBtn: "📱 Zainstaluj aplikację, aby uzyskać szybki dostęp",
    iosHint: "Na iPhonie: dotknij przycisku Udostępnij i wybierz „Dodaj do ekranu początkowego”.",
    geoSuggestionPrefix: "📍 Wygląda na to, że jesteś w",
    geoSuggestionBtn: "Zobaczyć sklepy tutaj? →",
    geoSuggestionNote: "To nie twoje miasto? Wybierz poniżej.",
    amazonBtn: "🛍️ Zobacz dzisiejsze oferty na Amazon",
    ticketBtn: "🎟️ Zarezerwuj bilety online i unikaj kolejki",
    tabStores: "🛒 Sklepy i Usługi",
    tabAttractions: "🏛️ Atrakcje",
    attractionsComingSoon: "Nasz przewodnik po atrakcjach już wkrótce — zajrzyj ponownie.",
    titleTemplate: (brand, city) => `Godziny otwarcia ${brand} ${city} Dziś – Otwarte czy Zamknięte`,
    descriptionTemplate: (brand, city) => `Sprawdź teraz, czy ${brand} w ${city} jest otwarte. Godziny w tygodniu i święta, aktualizowane na żywo.`,
    disclaimer: (name) => `Podane godziny otwarcia dla ${name} mają charakter orientacyjny, na podstawie standardowych godzin sieci. Poszczególne sklepy mogą się różnić — sprawdź godziny podane przy wejściu.`,
    footer: (name) => `pokazuje w czasie rzeczywistym, czy ${name} jest obecnie otwarte, a także pełne godziny otwarcia w tygodniu i święta.`,
    labels: {
      openNow: "OTWARTE TERAZ",
      closedNow: "ZAMKNIĘTE TERAZ",
      closedHoliday: "Dziś zamknięte — {label}",
      closedAllDay: "Zamknięte cały dzień",
      opensToday: "Otwiera się dziś o {time}",
      closedComeBack: "Zamknięte od {time} — wróć jutro",
      closesToday: "Zamyka się dziś o {time}",
    },
  },
  nl: {
    dayNames: ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"],
    homeH1: "Is de winkel nu open?",
    homeIntro: "Zoek direct, of tik op 📍 om automatisch je stad te vinden. Hieronder kun je ook een taal of land kiezen om alles te filteren — winkels en attracties.",
    chooseCountry: "Kies een land",
    showAllCountries: "🌍 Toon alle landen",
    storesIn: "Winkels in",
    attractionsIn: "Attracties in",
    attractionsIntro: (favHref, itinHref) => `Officiële informatie en tickets. Controleer de actuele openingstijden vóór je bezoek, voeg attracties toe aan je <a href="${favHref}" class="intro-inline-link">favorieten (⭐)</a> voor later, of maak een <a href="${itinHref}" class="intro-inline-link">reisroute (🧭)</a>.`,
    allPrefix: "Alle",
    geoLooksLike: "📍 Het lijkt erop dat je in",
    geoShowingFirst: "bent — dat tonen we eerst. Tik op 🌍 om alles te doorzoeken, of kies hieronder altijd een andere vlag.",
    pushSubBtn: "🔔 Abonneer op meldingen (feestdagen, speciale tijden)",
    favoritesLabel: "⭐ Favorieten",
    searchPlaceholder: "Zoek een winkel of attractie...",
    home: "Home",
    todayLabel: "Vandaag",
    calculating: "Openingstijden worden berekend...",
    weeklyTitle: "Openingstijden per week",
    holidaysTitle: "Openingstijden feestdagen",
    noHolidays: "Op dit moment geen speciale openingstijden",
    closedWord: "Gesloten",
    installBtn: "📱 Installeer de app voor snelle toegang",
    iosHint: "Op iPhone: tik op Delen en kies «Zet op beginscherm».",
    geoSuggestionPrefix: "📍 Uw stad lijkt te zijn",
    geoSuggestionBtn: "Winkels hier bekijken? →",
    geoSuggestionNote: "Niet uw stad? Kies hieronder.",
    amazonBtn: "🛍️ Bekijk de aanbiedingen van vandaag op Amazon",
    ticketBtn: "🎟️ Boek tickets online en sla de wachtrij over",
    tabStores: "🛒 Winkels en Diensten",
    tabAttractions: "🏛️ Attracties",
    attractionsComingSoon: "Onze attractiegids komt eraan — kom snel terug.",
    titleTemplate: (brand, city) => `Openingstijden ${brand} ${city} Vandaag – Open of Gesloten`,
    descriptionTemplate: (brand, city) => `Bekijk nu of ${brand} in ${city} open is. Wekelijkse openingstijden en feestdagen, live bijgewerkt.`,
    disclaimer: (name) => `De getoonde openingstijden voor ${name} zijn indicatief, gebaseerd op de standaardtijden van de keten. Individuele winkels kunnen afwijken — controleer de tijden bij de ingang.`,
    footer: (name) => `laat u in real time zien of ${name} nu open is, plus de volledige wekelijkse openingstijden en feestdagen.`,
    labels: {
      openNow: "NU GEOPEND",
      closedNow: "NU GESLOTEN",
      closedHoliday: "Vandaag gesloten — {label}",
      closedAllDay: "De hele dag gesloten",
      opensToday: "Opent vandaag om {time}",
      closedComeBack: "Gesloten sinds {time} — kom morgen terug",
      closesToday: "Sluit vandaag om {time}",
    },
  },
  da: {
    dayNames: ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"],
    homeH1: "Har butikken åbent lige nu?",
    homeIntro: "Søg direkte, eller tryk på 📍 for automatisk at finde din by. Nedenfor kan du også vælge et sprog eller land for at filtrere alt — butikker og seværdigheder.",
    chooseCountry: "Vælg et land",
    showAllCountries: "🌍 Vis alle lande",
    storesIn: "Butikker i",
    attractionsIn: "Seværdigheder i",
    attractionsIntro: (favHref, itinHref) => `Officiel information og billetter. Tjek de opdaterede åbningstider før dit besøg, tilføj seværdigheder til dine <a href="${favHref}" class="intro-inline-link">favoritter (⭐)</a> til senere, eller lav en <a href="${itinHref}" class="intro-inline-link">rejseplan (🧭)</a>.`,
    allPrefix: "Alle",
    geoLooksLike: "📍 Det ser ud til, at du er i",
    geoShowingFirst: "— viser vi det først. Tryk på 🌍 for at gennemse alt, eller vælg et andet flag nedenfor når som helst.",
    pushSubBtn: "🔔 Abonnér på alarmer (helligdage, særlige tider)",
    favoritesLabel: "⭐ Favoritter",
    searchPlaceholder: "Søg efter en butik eller seværdighed...",
    home: "Hjem",
    todayLabel: "I dag",
    calculating: "Beregner åbningstider...",
    weeklyTitle: "Ugentlige åbningstider",
    holidaysTitle: "Åbningstider på helligdage",
    noHolidays: "Ingen særlige åbningstider lige nu",
    closedWord: "Lukket",
    installBtn: "📱 Installer appen for hurtig adgang",
    iosHint: "På iPhone: tryk på Del-knappen og vælg \"Føj til hjemmeskærm\".",
    geoSuggestionPrefix: "📍 Din by ser ud til at være",
    geoSuggestionBtn: "Vil du se butikker her? →",
    geoSuggestionNote: "Ikke din by? Vælg nedenfor.",
    amazonBtn: "🛍️ Se dagens tilbud på Amazon",
    ticketBtn: "🎟️ Bestil billetter online og undgå køen",
    tabStores: "🛒 Butikker og Tjenester",
    tabAttractions: "🏛️ Seværdigheder",
    attractionsComingSoon: "Vores guide til seværdigheder er på vej — kig forbi snart igen.",
    titleTemplate: (brand, city) => `${brand} ${city} Åbningstider I Dag – Åbent eller Lukket Nu`,
    descriptionTemplate: (brand, city) => `Tjek nu om ${brand} i ${city} har åbent. Ugentlige åbningstider og helligdagsåbningstider, opdateret live.`,
    disclaimer: (name) => `De viste åbningstider for ${name} er vejledende, baseret på kædens standardtider. De enkelte butikker kan variere — tjek åbningstiderne ved indgangen.`,
    footer: (name) => `viser dig i realtid, om ${name} har åbent lige nu, samt fulde ugentlige åbningstider og helligdagsåbningstider.`,
    labels: {
      openNow: "ÅBENT NU",
      closedNow: "LUKKET NU",
      closedHoliday: "Lukket i dag — {label}",
      closedAllDay: "Lukket hele dagen",
      opensToday: "Åbner i dag kl. {time}",
      closedComeBack: "Lukkede kl. {time} — kom igen i morgen",
      closesToday: "Lukker i dag kl. {time}",
    },
  },
  se: {
    dayNames: ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"],
    homeH1: "Är butiken öppen just nu?",
    homeIntro: "Sök direkt, eller tryck på 📍 för att automatiskt hitta din stad. Nedan kan du också välja språk eller land för att filtrera allt — butiker och sevärdheter.",
    chooseCountry: "Välj ett land",
    showAllCountries: "🌍 Visa alla länder",
    storesIn: "Butiker i",
    attractionsIn: "Sevärdheter i",
    attractionsIntro: (favHref, itinHref) => `Officiell information och biljetter. Kontrollera de uppdaterade öppettiderna före ditt besök, lägg till sevärdheter i dina <a href="${favHref}" class="intro-inline-link">favoriter (⭐)</a> för senare, eller skapa en <a href="${itinHref}" class="intro-inline-link">reseplan (🧭)</a>.`,
    allPrefix: "Alla",
    geoLooksLike: "📍 Det ser ut som att du är i",
    geoShowingFirst: "— visar vi det först. Tryck på 🌍 för att bläddra bland allt, eller välj en annan flagga nedan när som helst.",
    pushSubBtn: "🔔 Prenumerera på aviseringar (helgdagar, särskilda tider)",
    favoritesLabel: "⭐ Favoriter",
    searchPlaceholder: "Sök efter en butik eller sevärdhet...",
    home: "Hem",
    todayLabel: "Idag",
    calculating: "Beräknar öppettider...",
    weeklyTitle: "Veckans öppettider",
    holidaysTitle: "Öppettider på helgdagar",
    noHolidays: "Inga särskilda öppettider just nu",
    closedWord: "Stängt",
    installBtn: "📱 Installera appen för snabb åtkomst",
    iosHint: "På iPhone: tryck på Dela-knappen och välj \"Lägg till på hemskärmen\".",
    geoSuggestionPrefix: "📍 Din stad verkar vara",
    geoSuggestionBtn: "Vill du se butiker här? →",
    geoSuggestionNote: "Inte din stad? Välj nedan.",
    amazonBtn: "🛍️ Se dagens erbjudanden på Amazon",
    ticketBtn: "🎟️ Boka biljetter online och undvik kön",
    tabStores: "🛒 Butiker och Tjänster",
    tabAttractions: "🏛️ Sevärdheter",
    attractionsComingSoon: "Vår guide till sevärdheter är på väg — kom tillbaka snart.",
    titleTemplate: (brand, city) => `${brand} ${city} Öppettider Idag – Öppet eller Stängt Nu`,
    descriptionTemplate: (brand, city) => `Kolla nu om ${brand} i ${city} har öppet. Veckans öppettider och öppettider på helgdagar, uppdaterat i realtid.`,
    disclaimer: (name) => `De visade öppettiderna för ${name} är vägledande, baserade på kedjans standardtider. Enskilda butiker kan variera — kontrollera öppettiderna vid entrén.`,
    footer: (name) => `visar dig i realtid om ${name} har öppet just nu, samt fullständiga veckoöppettider och öppettider på helgdagar.`,
    labels: {
      openNow: "ÖPPET NU",
      closedNow: "STÄNGT NU",
      closedHoliday: "Stängt idag — {label}",
      closedAllDay: "Stängt hela dagen",
      opensToday: "Öppnar idag kl. {time}",
      closedComeBack: "Stängde kl. {time} — kom tillbaka imorgon",
      closesToday: "Stänger idag kl. {time}",
    },
  },
  pt: {
    dayNames: ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"],
    homeH1: "A loja está aberta agora mesmo?",
    homeIntro: "Pesquise diretamente, ou toque em 📍 para encontrar a sua cidade automaticamente. Abaixo também pode escolher um idioma ou país para filtrar tudo — lojas e pontos turísticos.",
    chooseCountry: "Escolha um país",
    showAllCountries: "🌍 Mostrar todos os países",
    storesIn: "Lojas em",
    attractionsIn: "Pontos turísticos em",
    attractionsIntro: (favHref, itinHref) => `Informações e bilhetes oficiais. Verifique o horário atualizado antes da tua visita, adiciona atrações aos teus <a href="${favHref}" class="intro-inline-link">favoritos (⭐)</a> para mais tarde, ou cria um <a href="${itinHref}" class="intro-inline-link">itinerário (🧭)</a>.`,
    allPrefix: "Todos",
    geoLooksLike: "📍 Parece que você está em",
    geoShowingFirst: "— mostramos isso primeiro. Toque em 🌍 para explorar tudo, ou escolha outra bandeira abaixo a qualquer momento.",
    pushSubBtn: "🔔 Inscreva-se para alertas (feriados, horários especiais)",
    favoritesLabel: "⭐ Favoritos",
    searchPlaceholder: "Pesquisar uma loja ou ponto turístico...",
    home: "Início",
    todayLabel: "Hoje",
    calculating: "A calcular horários...",
    weeklyTitle: "Horário semanal",
    holidaysTitle: "Horário em feriados",
    noHolidays: "Sem horários especiais neste momento",
    closedWord: "Fechado",
    installBtn: "📱 Instalar a app para acesso rápido",
    iosHint: "No iPhone: toque no botão Partilhar e escolha \"Adicionar ao ecrã principal\".",
    geoSuggestionPrefix: "📍 A sua cidade parece ser",
    geoSuggestionBtn: "Ver lojas aqui? →",
    geoSuggestionNote: "Não é a sua cidade? Escolha abaixo.",
    amazonBtn: "🛍️ Ver ofertas de hoje na Amazon",
    ticketBtn: "🎟️ Compre bilhetes online e evite a fila",
    tabStores: "🛒 Lojas e Serviços",
    tabAttractions: "🏛️ Pontos turísticos",
    attractionsComingSoon: "O nosso guia de pontos turísticos está a caminho — volte em breve.",
    titleTemplate: (brand, city) => `${brand} ${city} Horário Hoje – Aberto ou Fechado Agora`,
    descriptionTemplate: (brand, city) => `Veja agora se ${brand} em ${city} está aberto. Horário semanal e horário de feriados, atualizado em tempo real.`,
    disclaimer: (name) => `Os horários apresentados para ${name} são indicativos, com base no horário padrão da cadeia. Lojas individuais podem variar — confirme o horário à entrada.`,
    footer: (name) => `mostra-lhe em tempo real se ${name} está aberto agora, além do horário semanal completo e do horário de feriados.`,
    labels: {
      openNow: "ABERTO AGORA",
      closedNow: "FECHADO AGORA",
      closedHoliday: "Fechado hoje — {label}",
      closedAllDay: "Fechado o dia todo",
      opensToday: "Abre hoje às {time}",
      closedComeBack: "Fechou às {time} — volte amanhã",
      closesToday: "Fecha hoje às {time}",
    },
  },
  cz: {
    dayNames: ["Neděle", "Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota"],
    homeH1: "Je obchod právě teď otevřený?",
    homeIntro: "Hledejte přímo, nebo klepněte na 📍 a automaticky najdeme vaše město. Níže si můžete vybrat i jazyk nebo zemi a filtrovat vše — obchody i zajímavosti.",
    chooseCountry: "Vyberte zemi",
    showAllCountries: "🌍 Zobrazit všechny země",
    storesIn: "Obchody v",
    attractionsIn: "Zajímavosti v",
    attractionsIntro: (favHref, itinHref) => `Oficiální informace a vstupenky. Ověřte si aktuální otevírací dobu před návštěvou, přidejte zajímavosti do svých <a href="${favHref}" class="intro-inline-link">oblíbených (⭐)</a> na později, nebo si vytvořte <a href="${itinHref}" class="intro-inline-link">itinerář (🧭)</a>.`,
    allPrefix: "Vše",
    geoLooksLike: "📍 Vypadá to, že jste v",
    geoShowingFirst: "— zobrazujeme to jako první. Klepněte na 🌍 pro procházení všeho, nebo kdykoli vyberte jinou vlajku níže.",
    pushSubBtn: "🔔 Přihlásit se k odběru upozornění (svátky, zvláštní doby)",
    favoritesLabel: "⭐ Oblíbené",
    searchPlaceholder: "Hledat obchod nebo zajímavost...",
    home: "Domů",
    todayLabel: "Dnes",
    calculating: "Počítání otevírací doby...",
    weeklyTitle: "Otevírací doba v týdnu",
    holidaysTitle: "Otevírací doba o svátcích",
    noHolidays: "Momentálně žádná zvláštní otevírací doba",
    closedWord: "Zavřeno",
    installBtn: "📱 Nainstalovat aplikaci pro rychlý přístup",
    iosHint: "Na iPhonu: klepněte na tlačítko Sdílet a vyberte \"Přidat na plochu\".",
    geoSuggestionPrefix: "📍 Vaše město je pravděpodobně",
    geoSuggestionBtn: "Zobrazit obchody zde? →",
    geoSuggestionNote: "Není to vaše město? Vyberte níže.",
    amazonBtn: "🛍️ Zobrazit dnešní nabídky na Amazonu",
    ticketBtn: "🎟️ Koupit vstupenky online a vyhnout se frontě",
    tabStores: "🛒 Obchody a Služby",
    tabAttractions: "🏛️ Zajímavosti",
    attractionsComingSoon: "Náš průvodce zajímavostmi je na cestě — brzy se vraťte.",
    titleTemplate: (brand, city) => `${brand} ${city} Otevírací Doba Dnes – Otevřeno nebo Zavřeno`,
    descriptionTemplate: (brand, city) => `Zjistěte, zda je ${brand} v ${city} nyní otevřeno. Otevírací doba v týdnu a o svátcích, aktualizováno v reálném čase.`,
    disclaimer: (name) => `Zobrazená otevírací doba pro ${name} je orientační, na základě standardní doby řetězce. Jednotlivé prodejny se mohou lišit — ověřte otevírací dobu u vchodu.`,
    footer: (name) => `vám v reálném čase ukazuje, zda je ${name} nyní otevřeno, plus úplnou týdenní otevírací dobu a otevírací dobu o svátcích.`,
    labels: {
      openNow: "OTEVŘENO",
      closedNow: "ZAVŘENO",
      closedHoliday: "Dnes zavřeno — {label}",
      closedAllDay: "Zavřeno celý den",
      opensToday: "Dnes otevírá v {time}",
      closedComeBack: "Zavřeno od {time} — přijďte zítra",
      closesToday: "Dnes zavírá v {time}",
    },
  },
  fi: {
    dayNames: ["Sunnuntai", "Maanantai", "Tiistai", "Keskiviikko", "Torstai", "Perjantai", "Lauantai"],
    homeH1: "Onko kauppa auki juuri nyt?",
    homeIntro: "Hae suoraan, tai napauta 📍 löytääksesi kaupunkisi automaattisesti. Alta voit myös valita kielen tai maan suodattaaksesi kaiken — kaupat ja nähtävyydet.",
    chooseCountry: "Valitse maa",
    showAllCountries: "🌍 Näytä kaikki maat",
    storesIn: "Kaupat maassa",
    attractionsIn: "Nähtävyydet maassa",
    attractionsIntro: (favHref, itinHref) => `Viralliset tiedot ja liput. Tarkista päivitetyt aukioloajat ennen vierailua, lisää nähtävyyksiä <a href="${favHref}" class="intro-inline-link">suosikkeihin (⭐)</a> myöhempää varten tai luo <a href="${itinHref}" class="intro-inline-link">matkasuunnitelma (🧭)</a>.`,
    allPrefix: "Kaikki",
    geoLooksLike: "📍 Näyttää siltä, että olet",
    geoShowingFirst: "— näytämme sen ensin. Napauta 🌍 selataksesi kaikkea, tai valitse toinen lippu alta milloin tahansa.",
    pushSubBtn: "🔔 Tilaa ilmoitukset (pyhät, erikoisajat)",
    favoritesLabel: "⭐ Suosikit",
    searchPlaceholder: "Hae kauppaa tai nähtävyyttä...",
    home: "Koti",
    todayLabel: "Tänään",
    calculating: "Lasketaan aukioloaikoja...",
    weeklyTitle: "Viikoittaiset aukioloajat",
    holidaysTitle: "Aukioloajat pyhäpäivinä",
    noHolidays: "Ei erityisiä aukioloaikoja juuri nyt",
    closedWord: "Suljettu",
    installBtn: "📱 Asenna sovellus nopeaa käyttöä varten",
    iosHint: "iPhonessa: napauta Jaa-painiketta ja valitse \"Lisää Koti-valikkoon\".",
    geoSuggestionPrefix: "📍 Kaupunkisi näyttäisi olevan",
    geoSuggestionBtn: "Näytä kaupat täällä? →",
    geoSuggestionNote: "Eikö tämä ole kaupunkisi? Valitse alta.",
    amazonBtn: "🛍️ Katso päivän tarjoukset Amazonissa",
    ticketBtn: "🎟️ Osta liput verkossa ja vältä jono",
    tabStores: "🛒 Kaupat ja Palvelut",
    tabAttractions: "🏛️ Nähtävyydet",
    attractionsComingSoon: "Nähtävyysoppaamme on tulossa — käy pian uudelleen.",
    titleTemplate: (brand, city) => `${brand} ${city} Aukioloajat Tänään – Auki tai Kiinni Nyt`,
    descriptionTemplate: (brand, city) => `Tarkista nyt, onko ${brand} kaupungissa ${city} auki. Viikoittaiset aukioloajat ja pyhäpäivien aukioloajat, päivitetty reaaliajassa.`,
    disclaimer: (name) => `Näytetyt aukioloajat kohteelle ${name} ovat suuntaa-antavia, perustuen ketjun vakioaikoihin. Yksittäiset myymälät voivat vaihdella — tarkista aukioloajat sisäänkäynniltä.`,
    footer: (name) => `näyttää sinulle reaaliajassa, onko ${name} auki juuri nyt, sekä täydet viikoittaiset aukioloajat ja pyhäpäivien aukioloajat.`,
    labels: {
      openNow: "AUKI NYT",
      closedNow: "KIINNI NYT",
      closedHoliday: "Kiinni tänään — {label}",
      closedAllDay: "Kiinni koko päivän",
      opensToday: "Avautuu tänään klo {time}",
      closedComeBack: "Sulkeutui klo {time} — tule takaisin huomenna",
      closesToday: "Sulkeutuu tänään klo {time}",
    },
  },
  gr: {
    dayNames: ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"],
    homeH1: "Είναι ανοιχτό το κατάστημα αυτή τη στιγμή;",
    homeIntro: "Αναζητήστε απευθείας, ή πατήστε 📍 για να βρούμε αυτόματα την πόλη σας. Παρακάτω μπορείτε επίσης να επιλέξετε γλώσσα ή χώρα για να φιλτράρετε τα πάντα — καταστήματα και αξιοθέατα.",
    chooseCountry: "Επιλέξτε χώρα",
    showAllCountries: "🌍 Εμφάνιση όλων των χωρών",
    storesIn: "Καταστήματα στην",
    attractionsIn: "Αξιοθέατα στην",
    attractionsIntro: (favHref, itinHref) => `Επίσημες πληροφορίες και εισιτήρια. Ελέγξτε το ενημερωμένο ωράριο πριν την επίσκεψη, προσθέστε αξιοθέατα στα <a href="${favHref}" class="intro-inline-link">αγαπημένα (⭐)</a> για αργότερα, ή δημιουργήστε ένα <a href="${itinHref}" class="intro-inline-link">δρομολόγιο (🧭)</a>.`,
    allPrefix: "Όλα",
    geoLooksLike: "📍 Φαίνεται ότι είστε στη",
    geoShowingFirst: "— σας το δείχνουμε πρώτο. Πατήστε 🌍 για να περιηγηθείτε όλα, ή επιλέξτε άλλη σημαία παρακάτω οποτεδήποτε.",
    pushSubBtn: "🔔 Εγγραφείτε για ειδοποιήσεις (αργίες, ειδικά ωράρια)",
    favoritesLabel: "⭐ Αγαπημένα",
    searchPlaceholder: "Αναζητήστε κατάστημα ή αξιοθέατο...",
    home: "Αρχική",
    todayLabel: "Σήμερα",
    calculating: "Υπολογισμός ωραρίου...",
    weeklyTitle: "Εβδομαδιαίο ωράριο",
    holidaysTitle: "Ωράριο αργιών",
    noHolidays: "Κανένα ειδικό ωράριο αυτή τη στιγμή",
    closedWord: "Κλειστό",
    installBtn: "📱 Εγκατάσταση εφαρμογής για γρήγορη πρόσβαση",
    iosHint: "Στο iPhone: πατήστε το κουμπί Κοινοποίηση και επιλέξτε \"Προσθήκη στην Αρχική Οθόνη\".",
    geoSuggestionPrefix: "📍 Η πόλη σας φαίνεται να είναι",
    geoSuggestionBtn: "Δείτε καταστήματα εδώ; →",
    geoSuggestionNote: "Δεν είναι η πόλη σας; Επιλέξτε παρακάτω.",
    amazonBtn: "🛍️ Δείτε τις σημερινές προσφορές στο Amazon",
    ticketBtn: "🎟️ Αγοράστε εισιτήρια online και αποφύγετε την ουρά",
    tabStores: "🛒 Καταστήματα και Υπηρεσίες",
    tabAttractions: "🏛️ Αξιοθέατα",
    attractionsComingSoon: "Ο οδηγός αξιοθέατων μας έρχεται σύντομα — περάστε ξανά.",
    titleTemplate: (brand, city) => `${brand} ${city} Ωράριο Σήμερα – Ανοιχτό ή Κλειστό Τώρα`,
    descriptionTemplate: (brand, city) => `Δείτε τώρα αν το ${brand} στην ${city} είναι ανοιχτό. Εβδομαδιαίο ωράριο και ωράριο αργιών, ενημερωμένο σε πραγματικό χρόνο.`,
    disclaimer: (name) => `Το εμφανιζόμενο ωράριο για ${name} είναι ενδεικτικό, με βάση το τυπικό ωράριο της αλυσίδας. Μεμονωμένα καταστήματα ενδέχεται να διαφέρουν — επιβεβαιώστε το ωράριο στην είσοδο.`,
    footer: (name) => `σας δείχνει σε πραγματικό χρόνο αν το ${name} είναι ανοιχτό αυτή τη στιγμή, καθώς και το πλήρες εβδομαδιαίο ωράριο και το ωράριο αργιών.`,
    labels: {
      openNow: "ΑΝΟΙΧΤΟ ΤΩΡΑ",
      closedNow: "ΚΛΕΙΣΤΟ ΤΩΡΑ",
      closedHoliday: "Κλειστό σήμερα — {label}",
      closedAllDay: "Κλειστό όλη τη μέρα",
      opensToday: "Ανοίγει σήμερα στις {time}",
      closedComeBack: "Έκλεισε στις {time} — επιστρέψτε αύριο",
      closesToday: "Κλείνει σήμερα στις {time}",
    },
  },
  hu: {
    dayNames: ["Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat"],
    homeH1: "Most éppen nyitva van az üzlet?",
    homeIntro: "Keress közvetlenül, vagy koppints a 📍 gombra, hogy automatikusan megtaláljuk a városodat. Lent nyelvet vagy országot is választhatsz, hogy mindent szűrj — üzleteket és látnivalókat.",
    chooseCountry: "Válassz országot",
    showAllCountries: "🌍 Összes ország megjelenítése",
    storesIn: "Üzletek itt:",
    attractionsIn: "Látnivalók itt:",
    attractionsIntro: (favHref, itinHref) => `Hivatalos információk és jegyek. Ellenőrizd a frissített nyitvatartást látogatás előtt, add hozzá a látnivalókat a <a href="${favHref}" class="intro-inline-link">kedvencekhez (⭐)</a> későbbre, vagy készíts <a href="${itinHref}" class="intro-inline-link">útitervet (🧭)</a>.`,
    allPrefix: "Összes",
    geoLooksLike: "📍 Úgy tűnik, itt vagy:",
    geoShowingFirst: "— ezt mutatjuk először. Koppints a 🌍 gombra az összes böngészéséhez, vagy válassz más zászlót lent bármikor.",
    pushSubBtn: "🔔 Iratkozz fel értesítésekre (ünnepek, különleges nyitvatartás)",
    favoritesLabel: "⭐ Kedvencek",
    searchPlaceholder: "Üzlet vagy látnivaló keresése...",
    home: "Kezdőlap",
    todayLabel: "Ma",
    calculating: "Nyitvatartás számítása...",
    weeklyTitle: "Heti nyitvatartás",
    holidaysTitle: "Nyitvatartás ünnepnapokon",
    noHolidays: "Jelenleg nincs speciális nyitvatartás",
    closedWord: "Zárva",
    installBtn: "📱 Telepítse az alkalmazást a gyors eléréshez",
    iosHint: "iPhone-on: koppintson a Megosztás gombra, majd válassza a \"Hozzáadás a kezdőképernyőhöz\" lehetőséget.",
    geoSuggestionPrefix: "📍 Úgy tűnik, az Ön városa",
    geoSuggestionBtn: "Boltok megjelenítése itt? →",
    geoSuggestionNote: "Nem ez az Ön városa? Válasszon alább.",
    amazonBtn: "🛍️ Nézze meg a mai Amazon ajánlatokat",
    ticketBtn: "🎟️ Vásároljon jegyet online, és kerülje el a sort",
    tabStores: "🛒 Üzletek és Szolgáltatások",
    tabAttractions: "🏛️ Látnivalók",
    attractionsComingSoon: "A látnivaló-útmutatónk hamarosan érkezik — nézzen vissza később.",
    titleTemplate: (brand, city) => `${brand} ${city} Nyitvatartás Ma – Nyitva vagy Zárva Most`,
    descriptionTemplate: (brand, city) => `Nézze meg most, hogy a ${brand} ${city} városban nyitva van-e. Heti nyitvatartás és ünnepnapi nyitvatartás, valós időben frissítve.`,
    disclaimer: (name) => `A megjelenített nyitvatartás a(z) ${name} esetében tájékoztató jellegű, a lánc standard nyitvatartásán alapul. Az egyes üzletek eltérhetnek — kérjük, ellenőrizze a nyitvatartást a bejáratnál.`,
    footer: (name) => `valós időben mutatja, hogy a(z) ${name} nyitva van-e most, valamint a teljes heti és ünnepnapi nyitvatartást.`,
    labels: {
      openNow: "MOST NYITVA",
      closedNow: "MOST ZÁRVA",
      closedHoliday: "Ma zárva — {label}",
      closedAllDay: "Egész nap zárva",
      opensToday: "Ma {time}-kor nyit",
      closedComeBack: "{time}-kor zárt — jöjjön vissza holnap",
      closesToday: "Ma {time}-kor zár",
    },
  },
  hr: {
    dayNames: ["Nedjelja", "Ponedjeljak", "Utorak", "Srijeda", "Četvrtak", "Petak", "Subota"],
    homeH1: "Je li trgovina sada otvorena?",
    homeIntro: "Pretražite izravno ili dodirnite 📍 da automatski pronađemo vaš grad. Ispod možete odabrati i jezik ili državu za filtriranje svega — trgovine i znamenitosti.",
    chooseCountry: "Odaberite državu",
    showAllCountries: "🌍 Prikaži sve države",
    storesIn: "Trgovine u",
    attractionsIn: "Znamenitosti u",
    attractionsIntro: (favHref, itinHref) => `Službene informacije i ulaznice. Provjerite ažurirano radno vrijeme prije posjeta, dodajte znamenitosti u <a href="${favHref}" class="intro-inline-link">favorite (⭐)</a> za kasnije, ili izradite <a href="${itinHref}" class="intro-inline-link">itinerar (🧭)</a>.`,
    allPrefix: "Sve",
    geoLooksLike: "📍 Čini se da ste u",
    geoShowingFirst: "— to prikazujemo prvo. Dodirnite 🌍 za pregled svega, ili odaberite drugu zastavu ispod bilo kada.",
    pushSubBtn: "🔔 Pretplatite se na obavijesti (praznici, posebno radno vrijeme)",
    favoritesLabel: "⭐ Favoriti",
    searchPlaceholder: "Pretražite trgovinu ili znamenitost...",
    home: "Početna",
    todayLabel: "Danas",
    calculating: "Izračun radnog vremena...",
    weeklyTitle: "Tjedno radno vrijeme",
    holidaysTitle: "Radno vrijeme praznicima",
    noHolidays: "Trenutno nema posebnog radnog vremena",
    closedWord: "Zatvoreno",
    installBtn: "📱 Instalirajte aplikaciju za brzi pristup",
    iosHint: "Na iPhoneu: dodirnite gumb Podijeli i odaberite \"Dodaj na početni zaslon\".",
    geoSuggestionPrefix: "📍 Čini se da je vaš grad",
    geoSuggestionBtn: "Prikaži trgovine ovdje? →",
    geoSuggestionNote: "Nije vaš grad? Odaberite ispod.",
    amazonBtn: "🛍️ Pogledajte današnje ponude na Amazonu",
    ticketBtn: "🎟️ Kupite ulaznice online i izbjegnite red",
    tabStores: "🛒 Trgovine i Usluge",
    tabAttractions: "🏛️ Znamenitosti",
    attractionsComingSoon: "Naš vodič kroz znamenitosti stiže uskoro — svratite ponovno.",
    titleTemplate: (brand, city) => `${brand} ${city} Radno Vrijeme Danas – Otvoreno ili Zatvoreno`,
    descriptionTemplate: (brand, city) => `Provjerite je li ${brand} u gradu ${city} sada otvoren. Tjedno radno vrijeme i radno vrijeme praznicima, ažurirano u stvarnom vremenu.`,
    disclaimer: (name) => `Prikazano radno vrijeme za ${name} je okvirno, temeljeno na standardnom radnom vremenu lanca. Pojedine trgovine mogu se razlikovati — provjerite radno vrijeme na ulazu.`,
    footer: (name) => `prikazuje vam u stvarnom vremenu je li ${name} sada otvoren, kao i potpuno tjedno radno vrijeme i radno vrijeme praznicima.`,
    labels: {
      openNow: "SADA OTVORENO",
      closedNow: "SADA ZATVORENO",
      closedHoliday: "Danas zatvoreno — {label}",
      closedAllDay: "Zatvoreno cijeli dan",
      opensToday: "Danas se otvara u {time}",
      closedComeBack: "Zatvoreno u {time} — dođite sutra",
      closesToday: "Danas se zatvara u {time}",
    },
  },
  sk: {
    dayNames: ["Nedeľa", "Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok", "Sobota"],
    homeH1: "Je obchod práve teraz otvorený?",
    homeIntro: "Hľadajte priamo, alebo ťuknite na 📍 a automaticky nájdeme vaše mesto. Nižšie si môžete vybrať aj jazyk alebo krajinu na filtrovanie všetkého — obchody aj zaujímavosti.",
    chooseCountry: "Vyberte krajinu",
    showAllCountries: "🌍 Zobraziť všetky krajiny",
    storesIn: "Obchody v",
    attractionsIn: "Zaujímavosti v",
    attractionsIntro: (favHref, itinHref) => `Oficiálne informácie a vstupenky. Overte si aktuálny otvárací čas pred návštevou, pridajte zaujímavosti do svojich <a href="${favHref}" class="intro-inline-link">obľúbených (⭐)</a> na neskôr, alebo si vytvorte <a href="${itinHref}" class="intro-inline-link">itinerár (🧭)</a>.`,
    allPrefix: "Všetko",
    geoLooksLike: "📍 Vyzerá to, že ste v",
    geoShowingFirst: "— zobrazujeme to ako prvé. Klepnite na 🌍 na prezeranie všetkého, alebo kedykoľvek vyberte inú vlajku nižšie.",
    pushSubBtn: "🔔 Prihlásiť sa na odber upozornení (sviatky, špeciálny čas)",
    favoritesLabel: "⭐ Obľúbené",
    searchPlaceholder: "Hľadať obchod alebo zaujímavosť...",
    home: "Domov",
    todayLabel: "Dnes",
    calculating: "Počítanie otváracích hodín...",
    weeklyTitle: "Týždenné otváracie hodiny",
    holidaysTitle: "Otváracie hodiny cez sviatky",
    noHolidays: "Momentálne žiadne špeciálne otváracie hodiny",
    closedWord: "Zatvorené",
    installBtn: "📱 Nainštalujte aplikáciu pre rýchly prístup",
    iosHint: "Na iPhone: ťuknite na tlačidlo Zdieľať a vyberte \"Pridať na plochu\".",
    geoSuggestionPrefix: "📍 Vaše mesto je pravdepodobne",
    geoSuggestionBtn: "Zobraziť obchody tu? →",
    geoSuggestionNote: "Nie je to vaše mesto? Vyberte nižšie.",
    amazonBtn: "🛍️ Pozrite si dnešné ponuky na Amazone",
    ticketBtn: "🎟️ Kúpte si lístky online a vyhnite sa radu",
    tabStores: "🛒 Obchody a Služby",
    tabAttractions: "🏛️ Zaujímavosti",
    attractionsComingSoon: "Náš sprievodca zaujímavosťami sa pripravuje — pozrite sa znova čoskoro.",
    titleTemplate: (brand, city) => `${brand} ${city} Otváracie Hodiny Dnes – Otvorené alebo Zatvorené`,
    descriptionTemplate: (brand, city) => `Zistite, či je ${brand} v meste ${city} teraz otvorené. Týždenné otváracie hodiny a otváracie hodiny cez sviatky, aktualizované v reálnom čase.`,
    disclaimer: (name) => `Zobrazené otváracie hodiny pre ${name} sú orientačné, na základe štandardných hodín reťazca. Jednotlivé predajne sa môžu líšiť — overte si otváracie hodiny pri vchode.`,
    footer: (name) => `vám v reálnom čase ukazuje, či je ${name} teraz otvorené, ako aj kompletné týždenné otváracie hodiny a otváracie hodiny cez sviatky.`,
    labels: {
      openNow: "TERAZ OTVORENÉ",
      closedNow: "TERAZ ZATVORENÉ",
      closedHoliday: "Dnes zatvorené — {label}",
      closedAllDay: "Zatvorené celý deň",
      opensToday: "Dnes otvára o {time}",
      closedComeBack: "Zatvorené o {time} — príďte zajtra",
      closesToday: "Dnes zatvára o {time}",
    },
  },
  si: {
    dayNames: ["Nedelja", "Ponedeljek", "Torek", "Sreda", "Četrtek", "Petek", "Sobota"],
    homeH1: "Je trgovina zdaj odprta?",
    homeIntro: "Iščite neposredno ali se dotaknite 📍, da samodejno najdemo vaše mesto. Spodaj lahko izberete tudi jezik ali državo za filtriranje vsega — trgovine in znamenitosti.",
    chooseCountry: "Izberite državo",
    showAllCountries: "🌍 Pokaži vse države",
    storesIn: "Trgovine v",
    attractionsIn: "Znamenitosti v",
    attractionsIntro: (favHref, itinHref) => `Uradne informacije in vstopnice. Preverite posodobljen delovni čas pred obiskom, dodajte znamenitosti med <a href="${favHref}" class="intro-inline-link">priljubljene (⭐)</a> za kasneje, ali ustvarite <a href="${itinHref}" class="intro-inline-link">itinerar (🧭)</a>.`,
    allPrefix: "Vse",
    geoLooksLike: "📍 Videti je, da ste v",
    geoShowingFirst: "— to prikažemo najprej. Tapnite 🌍 za brskanje po vsem, ali kadar koli izberite drugo zastavo spodaj.",
    pushSubBtn: "🔔 Naročite se na obvestila (prazniki, posebni delovni čas)",
    favoritesLabel: "⭐ Priljubljene",
    searchPlaceholder: "Iščite trgovino ali znamenitost...",
    home: "Domov",
    todayLabel: "Danes",
    calculating: "Izračunavanje delovnega časa...",
    weeklyTitle: "Tedenski delovni čas",
    holidaysTitle: "Delovni čas ob praznikih",
    noHolidays: "Trenutno ni posebnega delovnega časa",
    closedWord: "Zaprto",
    installBtn: "📱 Namestite aplikacijo za hiter dostop",
    iosHint: "Na iPhonu: tapnite gumb Deli in izberite \"Dodaj na začetni zaslon\".",
    geoSuggestionPrefix: "📍 Vaše mesto je verjetno",
    geoSuggestionBtn: "Prikaži trgovine tukaj? →",
    geoSuggestionNote: "Ni vaše mesto? Izberite spodaj.",
    amazonBtn: "🛍️ Oglejte si današnje ponudbe na Amazonu",
    ticketBtn: "🎟️ Kupite vstopnice online in se izognite vrsti",
    tabStores: "🛒 Trgovine in Storitve",
    tabAttractions: "🏛️ Znamenitosti",
    attractionsComingSoon: "Naš vodnik po znamenitostih prihaja kmalu — oglejte si ponovno kmalu.",
    titleTemplate: (brand, city) => `${brand} ${city} Delovni Čas Danes – Odprto ali Zaprto`,
    descriptionTemplate: (brand, city) => `Preverite, ali je ${brand} v mestu ${city} zdaj odprto. Tedenski delovni čas in delovni čas ob praznikih, posodobljeno v realnem času.`,
    disclaimer: (name) => `Prikazan delovni čas za ${name} je okviren, na podlagi standardnega delovnega časa verige. Posamezne trgovine se lahko razlikujejo — preverite delovni čas pri vhodu.`,
    footer: (name) => `vam v realnem času prikazuje, ali je ${name} zdaj odprto, ter celoten tedenski delovni čas in delovni čas ob praznikih.`,
    labels: {
      openNow: "ZDAJ ODPRTO",
      closedNow: "ZDAJ ZAPRTO",
      closedHoliday: "Danes zaprto — {label}",
      closedAllDay: "Zaprto ves dan",
      opensToday: "Danes odpre ob {time}",
      closedComeBack: "Zaprto ob {time} — pridite jutri",
      closesToday: "Danes zapre ob {time}",
    },
  },
  lt: {
    dayNames: ["Sekmadienis", "Pirmadienis", "Antradienis", "Trečiadienis", "Ketvirtadienis", "Penktadienis", "Šeštadienis"],
    homeH1: "Ar parduotuvė dabar atidaryta?",
    homeIntro: "Ieškokite tiesiogiai arba paspauskite 📍, kad automatiškai rastume jūsų miestą. Žemiau taip pat galite pasirinkti kalbą ar šalį, kad filtruotumėte viską — parduotuves ir lankytinas vietas.",
    chooseCountry: "Pasirinkite šalį",
    showAllCountries: "🌍 Rodyti visas šalis",
    storesIn: "Parduotuvės",
    attractionsIn: "Lankytinos vietos",
    attractionsIntro: (favHref, itinHref) => `Oficiali informacija ir bilietai. Patikrinkite atnaujintą darbo laiką prieš apsilankymą, pridėkite lankytinas vietas prie <a href="${favHref}" class="intro-inline-link">mėgstamiausių (⭐)</a> vėlesniam laikui arba sukurkite <a href="${itinHref}" class="intro-inline-link">kelionės planą (🧭)</a>.`,
    allPrefix: "Visos",
    geoLooksLike: "📍 Panašu, kad esate",
    geoShowingFirst: "— rodome tai pirmiausia. Bakstelėkite 🌍, kad peržiūrėtumėte viską, arba bet kada pasirinkite kitą vėliavą žemiau.",
    pushSubBtn: "🔔 Prenumeruokite įspėjimus (švenčių, specialaus darbo laiko)",
    favoritesLabel: "⭐ Mėgstamiausi",
    searchPlaceholder: "Ieškoti parduotuvės ar lankytinos vietos...",
    home: "Pradžia",
    todayLabel: "Šiandien",
    calculating: "Skaičiuojamos darbo valandos...",
    weeklyTitle: "Savaitės darbo laikas",
    holidaysTitle: "Darbo laikas švenčių dienomis",
    noHolidays: "Šiuo metu specialaus darbo laiko nėra",
    closedWord: "Uždaryta",
    installBtn: "📱 Įdiekite programėlę greitam prieigai",
    iosHint: "„iPhone“: bakstelėkite mygtuką „Bendrinti“ ir pasirinkite „Įtraukti į pagrindinį ekraną“.",
    geoSuggestionPrefix: "📍 Panašu, kad jūsų miestas yra",
    geoSuggestionBtn: "Rodyti parduotuves čia? →",
    geoSuggestionNote: "Ne jūsų miestas? Pasirinkite žemiau.",
    amazonBtn: "🛍️ Peržiūrėkite šiandienos pasiūlymus „Amazon“",
    ticketBtn: "🎟️ Pirkite bilietus internetu ir išvenkite eilės",
    tabStores: "🛒 Parduotuvės ir Paslaugos",
    tabAttractions: "🏛️ Lankytinos vietos",
    attractionsComingSoon: "Mūsų lankytinų vietų gidas jau ruošiamas — netrukus sugrįžkite.",
    titleTemplate: (brand, city) => `${brand} ${city} Darbo Laikas Šiandien – Atidaryta ar Uždaryta`,
    descriptionTemplate: (brand, city) => `Sužinokite, ar ${brand} mieste ${city} dabar atidaryta. Savaitės darbo laikas ir darbo laikas švenčių dienomis, atnaujinama realiuoju laiku.`,
    disclaimer: (name) => `Rodomas ${name} darbo laikas yra orientacinis, pagrįstas standartiniu tinklo darbo laiku. Atskiros parduotuvės gali skirtis — patikrinkite darbo laiką prie įėjimo.`,
    footer: (name) => `realiuoju laiku rodo, ar ${name} dabar atidaryta, taip pat pilną savaitės darbo laiką ir darbo laiką švenčių dienomis.`,
    labels: {
      openNow: "DABAR ATIDARYTA",
      closedNow: "DABAR UŽDARYTA",
      closedHoliday: "Šiandien uždaryta — {label}",
      closedAllDay: "Uždaryta visą dieną",
      opensToday: "Šiandien atidaroma {time}",
      closedComeBack: "Uždaryta nuo {time} — ateikite rytoj",
      closesToday: "Šiandien uždaroma {time}",
    },
  },
  lv: {
    dayNames: ["Svētdiena", "Pirmdiena", "Otrdiena", "Trešdiena", "Ceturtdiena", "Piektdiena", "Sestdiena"],
    homeH1: "Vai veikals ir atvērts pašlaik?",
    homeIntro: "Meklējiet tieši vai pieskarieties 📍, lai automātiski atrastu jūsu pilsētu. Zemāk varat izvēlēties arī valodu vai valsti, lai filtrētu visu — veikalus un apskates vietas.",
    chooseCountry: "Izvēlieties valsti",
    showAllCountries: "🌍 Rādīt visas valstis",
    storesIn: "Veikali",
    attractionsIn: "Apskates vietas",
    attractionsIntro: (favHref, itinHref) => `Oficiāla informācija un biļetes. Pārbaudiet atjaunināto darba laiku pirms apmeklējuma, pievienojiet apskates vietas <a href="${favHref}" class="intro-inline-link">iecienītajiem (⭐)</a> vēlākai izmantošanai vai izveidojiet <a href="${itinHref}" class="intro-inline-link">maršrutu (🧭)</a>.`,
    allPrefix: "Visi",
    geoLooksLike: "📍 Izskatās, ka esat",
    geoShowingFirst: "— to rādām vispirms. Pieskarieties 🌍, lai pārlūkotu visu, vai jebkurā brīdī izvēlieties citu karogu zemāk.",
    pushSubBtn: "🔔 Abonēt brīdinājumus (svētki, īpašs darba laiks)",
    favoritesLabel: "⭐ Iecienītie",
    searchPlaceholder: "Meklēt veikalu vai apskates vietu...",
    home: "Sākums",
    todayLabel: "Šodien",
    calculating: "Aprēķina darba laiku...",
    weeklyTitle: "Nedēļas darba laiks",
    holidaysTitle: "Darba laiks svētkos",
    noHolidays: "Šobrīd nav īpaša darba laika",
    closedWord: "Slēgts",
    installBtn: "📱 Instalējiet lietotni ātrai piekļuvei",
    iosHint: "iPhone: pieskarieties pogai Dalīties un izvēlieties \"Pievienot sākuma ekrānam\".",
    geoSuggestionPrefix: "📍 Šķiet, ka jūsu pilsēta ir",
    geoSuggestionBtn: "Rādīt veikalus šeit? →",
    geoSuggestionNote: "Nav jūsu pilsēta? Izvēlieties zemāk.",
    amazonBtn: "🛍️ Skatiet šodienas piedāvājumus Amazon",
    ticketBtn: "🎟️ Pērciet biļetes tiešsaistē un izvairieties no rindas",
    tabStores: "🛒 Veikali un Pakalpojumi",
    tabAttractions: "🏛️ Apskates vietas",
    attractionsComingSoon: "Mūsu apskates vietu ceļvedis jau tiek gatavots — apmeklējiet drīzumā vēlreiz.",
    titleTemplate: (brand, city) => `${brand} ${city} Darba Laiks Šodien – Atvērts vai Slēgts`,
    descriptionTemplate: (brand, city) => `Uzziniet, vai ${brand} pilsētā ${city} tagad ir atvērts. Nedēļas darba laiks un darba laiks svētkos, atjaunināts reāllaikā.`,
    disclaimer: (name) => `Norādītais darba laiks ${name} ir orientējošs, balstīts uz tīkla standarta darba laiku. Atsevišķi veikali var atšķirties — pārbaudiet darba laiku pie ieejas.`,
    footer: (name) => `reāllaikā rāda, vai ${name} tagad ir atvērts, kā arī pilnu nedēļas darba laiku un darba laiku svētkos.`,
    labels: {
      openNow: "TAGAD ATVĒRTS",
      closedNow: "TAGAD SLĒGTS",
      closedHoliday: "Šodien slēgts — {label}",
      closedAllDay: "Slēgts visu dienu",
      opensToday: "Šodien atveras {time}",
      closedComeBack: "Slēgts kopš {time} — atgriezieties rīt",
      closesToday: "Šodien slēdzas {time}",
    },
  },
  ee: {
    dayNames: ["Pühapäev", "Esmaspäev", "Teisipäev", "Kolmapäev", "Neljapäev", "Reede", "Laupäev"],
    homeH1: "Kas pood on praegu avatud?",
    homeIntro: "Otsige otse või puudutage 📍, et automaatselt leida teie linn. Allpool saate valida ka keele või riigi, et filtreerida kõike — poode ja vaatamisväärsusi.",
    chooseCountry: "Vali riik",
    showAllCountries: "🌍 Näita kõiki riike",
    storesIn: "Poed riigis",
    attractionsIn: "Vaatamisväärsused riigis",
    attractionsIntro: (favHref, itinHref) => `Ametlik info ja piletid. Kontrolli uuendatud lahtiolekuaegu enne külastust, lisa vaatamisväärsused oma <a href="${favHref}" class="intro-inline-link">lemmikutesse (⭐)</a> hilisemaks või loo <a href="${itinHref}" class="intro-inline-link">marsruut (🧭)</a>.`,
    allPrefix: "Kõik",
    geoLooksLike: "📍 Tundub, et oled",
    geoShowingFirst: "— näitame seda esimesena. Puuduta 🌍, et sirvida kõike, või vali allpool alati mõni teine lipp.",
    pushSubBtn: "🔔 Telli teavitused (pühad, erilised lahtiolekuajad)",
    favoritesLabel: "⭐ Lemmikud",
    searchPlaceholder: "Otsi poodi või vaatamisväärsust...",
    home: "Avaleht",
    todayLabel: "Täna",
    calculating: "Lahtiolekuaegade arvutamine...",
    weeklyTitle: "Nädala lahtiolekuajad",
    holidaysTitle: "Lahtiolekuajad pühade ajal",
    noHolidays: "Praegu erilisi lahtiolekuaegu ei ole",
    closedWord: "Suletud",
    installBtn: "📱 Paigalda rakendus kiireks ligipääsuks",
    iosHint: "iPhone'is: puuduta jagamisnuppu ja vali \"Lisa avakuvale\".",
    geoSuggestionPrefix: "📍 Tundub, et sinu linn on",
    geoSuggestionBtn: "Näita poode siin? →",
    geoSuggestionNote: "Pole sinu linn? Vali allpool.",
    amazonBtn: "🛍️ Vaata tänaseid pakkumisi Amazonis",
    ticketBtn: "🎟️ Osta piletid veebis ja väldi järjekorda",
    tabStores: "🛒 Poed ja Teenused",
    tabAttractions: "🏛️ Vaatamisväärsused",
    attractionsComingSoon: "Meie vaatamisväärsuste juht on valmimas — vaata varsti uuesti.",
    titleTemplate: (brand, city) => `${brand} ${city} Lahtiolekuajad Täna – Avatud või Suletud`,
    descriptionTemplate: (brand, city) => `Vaata, kas ${brand} linnas ${city} on praegu avatud. Nädala lahtiolekuajad ja lahtiolekuajad pühade ajal, uuendatud reaalajas.`,
    disclaimer: (name) => `Kuvatud ${name} lahtiolekuajad on suunavad, põhinedes keti standardsel lahtiolekuajal. Üksikud poed võivad erineda — kontrolli lahtiolekuaega sissepääsu juures.`,
    footer: (name) => `näitab sulle reaalajas, kas ${name} on praegu avatud, samuti täielikke nädala lahtiolekuaegu ja lahtiolekuaegu pühade ajal.`,
    labels: {
      openNow: "PRAEGU AVATUD",
      closedNow: "PRAEGU SULETUD",
      closedHoliday: "Täna suletud — {label}",
      closedAllDay: "Terve päev suletud",
      opensToday: "Täna avaneb {time}",
      closedComeBack: "Suletud alates {time} — tule homme tagasi",
      closesToday: "Täna suletakse {time}",
    },
  },
}

exports.COUNTRY_LABELS = { ro: "🇷🇴 Romania", de: "🇩🇪 Germany", uk: "🇬🇧 United Kingdom", es: "🇪🇸 Spain", fr: "🇫🇷 France", it: "🇮🇹 Italy", pl: "🇵🇱 Poland", nl: "🇳🇱 Netherlands", at: "🇦🇹 Austria", be: "🇧🇪 Belgium", dk: "🇩🇰 Denmark", se: "🇸🇪 Sweden", pt: "🇵🇹 Portugal", cz: "🇨🇿 Czech Republic", fi: "🇫🇮 Finland", gr: "🇬🇷 Greece", hu: "🇭🇺 Hungary", hr: "🇭🇷 Croatia", ie: "🇮🇪 Ireland", sk: "🇸🇰 Slovakia", si: "🇸🇮 Slovenia", lt: "🇱🇹 Lithuania", lv: "🇱🇻 Latvia", ee: "🇪🇪 Estonia", cy: "🇨🇾 Cyprus", mt: "🇲🇹 Malta", lu: "🇱🇺 Luxembourg", tr: "🇹🇷 Turkey", ch: "🇨🇭 Switzerland" }

exports.LANGUAGE_LABELS = { uk: "English", de: "Deutsch", es: "Español", fr: "Français", it: "Italiano", pl: "Polski", nl: "Nederlands", da: "Dansk", ro: "Română", se: "Svenska", pt: "Português", cz: "Čeština", fi: "Suomi", gr: "Ελληνικά", hu: "Magyar", hr: "Hrvatski", sk: "Slovenčina", si: "Slovenščina", lt: "Lietuvių", lv: "Latviešu", ee: "Eesti" }

exports.STORE_CATEGORY_LABELS = {
  ro: {
    magazine: "🛒 Magazine și Supermarketuri",
    bricolaj_electro: "🔨 Bricolaj și Electrocasnice",
    farmacii: "💊 Farmacii și Sănătate",
    mall: "🏬 Mall-uri",
    cinema: "🎬 Cinematografe",
    banci: "🏦 Servicii Financiare / Bănci",
    posta_curieri: "📦 Poștă și Curierat",
    fastfood: "🍔 Restaurante Fast-Food",
  },
  uk: {
    magazine: "🛒 Stores and Supermarkets",
    bricolaj_electro: "🔨 DIY and Electronics",
    farmacii: "💊 Pharmacies and Health",
    mall: "🏬 Malls",
    cinema: "🎬 Cinemas",
    banci: "🏦 Financial Services / Banks",
    posta_curieri: "📦 Post and Courier",
    fastfood: "🍔 Fast-Food Restaurants",
  },
  de: {
    magazine: "🛒 Geschäfte und Supermärkte",
    bricolaj_electro: "🔨 Baumarkt und Elektronik",
    farmacii: "💊 Apotheken und Gesundheit",
    mall: "🏬 Einkaufszentren",
    cinema: "🎬 Kinos",
    banci: "🏦 Finanzdienstleistungen / Banken",
    posta_curieri: "📦 Post und Kurierdienste",
    fastfood: "🍔 Fast-Food-Restaurants",
  },
  es: {
    magazine: "🛒 Tiendas y Supermercados",
    bricolaj_electro: "🔨 Bricolaje y Electrónica",
    farmacii: "💊 Farmacias y Salud",
    mall: "🏬 Centros Comerciales",
    cinema: "🎬 Cines",
    banci: "🏦 Servicios Financieros / Bancos",
    posta_curieri: "📦 Correos y Mensajería",
    fastfood: "🍔 Restaurantes de Comida Rápida",
  },
  fr: {
    magazine: "🛒 Magasins et Supermarchés",
    bricolaj_electro: "🔨 Bricolage et Électronique",
    farmacii: "💊 Pharmacies et Santé",
    mall: "🏬 Centres Commerciaux",
    cinema: "🎬 Cinémas",
    banci: "🏦 Services Financiers / Banques",
    posta_curieri: "📦 Poste et Coursiers",
    fastfood: "🍔 Restaurants Rapides",
  },
  it: {
    magazine: "🛒 Negozi e Supermercati",
    bricolaj_electro: "🔨 Bricolage ed Elettronica",
    farmacii: "💊 Farmacie e Salute",
    mall: "🏬 Centri Commerciali",
    cinema: "🎬 Cinema",
    banci: "🏦 Servizi Finanziari / Banche",
    posta_curieri: "📦 Posta e Corrieri",
    fastfood: "🍔 Ristoranti Fast-Food",
  },
  pl: {
    magazine: "🛒 Sklepy i Supermarkety",
    bricolaj_electro: "🔨 Majsterkowanie i Elektronika",
    farmacii: "💊 Apteki i Zdrowie",
    mall: "🏬 Centra Handlowe",
    cinema: "🎬 Kina",
    banci: "🏦 Usługi Finansowe / Banki",
    posta_curieri: "📦 Poczta i Kurierzy",
    fastfood: "🍔 Restauracje Fast-Food",
  },
  nl: {
    magazine: "🛒 Winkels en Supermarkten",
    bricolaj_electro: "🔨 Doe-het-zelf en Elektronica",
    farmacii: "💊 Apotheken en Gezondheid",
    mall: "🏬 Winkelcentra",
    cinema: "🎬 Bioscopen",
    banci: "🏦 Financiële Diensten / Banken",
    posta_curieri: "📦 Post en Koeriers",
    fastfood: "🍔 Fastfoodrestaurants",
  },
  da: {
    magazine: "🛒 Butikker og Supermarkeder",
    bricolaj_electro: "🔨 Gør-det-selv og Elektronik",
    farmacii: "💊 Apoteker og Sundhed",
    mall: "🏬 Indkøbscentre",
    cinema: "🎬 Biografer",
    banci: "🏦 Finansielle Tjenester / Banker",
    posta_curieri: "📦 Post og Kurerer",
    fastfood: "🍔 Fastfood-restauranter",
  },
  se: {
    magazine: "🛒 Butiker och Stormarknader",
    bricolaj_electro: "🔨 Gör-det-själv och Elektronik",
    farmacii: "💊 Apotek och Hälsa",
    mall: "🏬 Köpcentrum",
    cinema: "🎬 Biografer",
    banci: "🏦 Finansiella Tjänster / Banker",
    posta_curieri: "📦 Post och Kurirer",
    fastfood: "🍔 Snabbmatsrestauranger",
  },
  pt: {
    magazine: "🛒 Lojas e Supermercados",
    bricolaj_electro: "🔨 Bricolage e Eletrónica",
    farmacii: "💊 Farmácias e Saúde",
    mall: "🏬 Centros Comerciais",
    cinema: "🎬 Cinemas",
    banci: "🏦 Serviços Financeiros / Bancos",
    posta_curieri: "📦 Correios e Estafetas",
    fastfood: "🍔 Restaurantes Fast-Food",
  },
  cz: {
    magazine: "🛒 Obchody a Supermarkety",
    bricolaj_electro: "🔨 Kutilství a Elektronika",
    farmacii: "💊 Lékárny a Zdraví",
    mall: "🏬 Nákupní Centra",
    cinema: "🎬 Kina",
    banci: "🏦 Finanční Služby / Banky",
    posta_curieri: "📦 Pošta a Kurýři",
    fastfood: "🍔 Restaurace Rychlého Občerstvení",
  },
  fi: {
    magazine: "🛒 Kaupat ja Supermarketit",
    bricolaj_electro: "🔨 Askartelu ja Elektroniikka",
    farmacii: "💊 Apteekit ja Terveys",
    mall: "🏬 Ostoskeskukset",
    cinema: "🎬 Elokuvateatterit",
    banci: "🏦 Rahoituspalvelut / Pankit",
    posta_curieri: "📦 Posti ja Kuriirit",
    fastfood: "🍔 Pikaruokaravintolat",
  },
  gr: {
    magazine: "🛒 Καταστήματα και Σούπερ Μάρκετ",
    bricolaj_electro: "🔨 Είδη Σπιτιού και Ηλεκτρονικά",
    farmacii: "💊 Φαρμακεία και Υγεία",
    mall: "🏬 Εμπορικά Κέντρα",
    cinema: "🎬 Κινηματογράφοι",
    banci: "🏦 Χρηματοοικονομικές Υπηρεσίες / Τράπεζες",
    posta_curieri: "📦 Ταχυδρομείο και Ταχυμεταφορές",
    fastfood: "🍔 Εστιατόρια Fast-Food",
  },
  hu: {
    magazine: "🛒 Üzletek és Szupermarketek",
    bricolaj_electro: "🔨 Barkácsolás és Elektronika",
    farmacii: "💊 Gyógyszertárak és Egészség",
    mall: "🏬 Bevásárlóközpontok",
    cinema: "🎬 Mozik",
    banci: "🏦 Pénzügyi Szolgáltatások / Bankok",
    posta_curieri: "📦 Posta és Futárok",
    fastfood: "🍔 Gyorséttermek",
  },
  hr: {
    magazine: "🛒 Trgovine i Supermarketi",
    bricolaj_electro: "🔨 Majstorski Alat i Elektronika",
    farmacii: "💊 Ljekarne i Zdravlje",
    mall: "🏬 Trgovački Centri",
    cinema: "🎬 Kina",
    banci: "🏦 Financijske Usluge / Banke",
    posta_curieri: "📦 Pošta i Dostava",
    fastfood: "🍔 Restorani Brze Hrane",
  },
  sk: {
    magazine: "🛒 Obchody a Supermarkety",
    bricolaj_electro: "🔨 Kutilstvo a Elektronika",
    farmacii: "💊 Lekárne a Zdravie",
    mall: "🏬 Nákupné Centrá",
    cinema: "🎬 Kiná",
    banci: "🏦 Finančné Služby / Banky",
    posta_curieri: "📦 Pošta a Kuriéri",
    fastfood: "🍔 Reštaurácie Rýchleho Občerstvenia",
  },
  si: {
    magazine: "🛒 Trgovine in Supermarketi",
    bricolaj_electro: "🔨 Hišni Mojster in Elektronika",
    farmacii: "💊 Lekarne in Zdravje",
    mall: "🏬 Nakupovalni Centri",
    cinema: "🎬 Kina",
    banci: "🏦 Finančne Storitve / Banke",
    posta_curieri: "📦 Pošta in Kurirji",
    fastfood: "🍔 Restavracije s Hitro Hrano",
  },
  lt: {
    magazine: "🛒 Parduotuvės ir Prekybos Centrai",
    bricolaj_electro: "🔨 Buitinė Technika ir Elektronika",
    farmacii: "💊 Vaistinės ir Sveikata",
    mall: "🏬 Prekybos Centrai",
    cinema: "🎬 Kino Teatrai",
    banci: "🏦 Finansinės Paslaugos / Bankai",
    posta_curieri: "📦 Paštas ir Kurjeriai",
    fastfood: "🍔 Greito Maisto Restoranai",
  },
  lv: {
    magazine: "🛒 Veikali un Lielveikali",
    bricolaj_electro: "🔨 Mājas Remonts un Elektronika",
    farmacii: "💊 Aptiekas un Veselība",
    mall: "🏬 Tirdzniecības Centri",
    cinema: "🎬 Kinoteātri",
    banci: "🏦 Finanšu Pakalpojumi / Bankas",
    posta_curieri: "📦 Pasts un Kurjeri",
    fastfood: "🍔 Ātrās Ēdināšanas Restorāni",
  },
  ee: {
    magazine: "🛒 Poed ja Supermarketid",
    bricolaj_electro: "🔨 Ehitus ja Elektroonika",
    farmacii: "💊 Apteegid ja Tervis",
    mall: "🏬 Kaubanduskeskused",
    cinema: "🎬 Kinod",
    banci: "🏦 Finantsteenused / Pangad",
    posta_curieri: "📦 Post ja Kullerid",
    fastfood: "🍔 Kiirtoidurestoranid",
  },
}

exports.SMART_INSTALL_TEXTS_RO = {
  bannerText: "e o aplicație web! Instalează-o pe ecranul telefonului pentru acces instant.",
  guideLabel: "Apasă pentru Ghid",
  installTitle: "Instalează",
  needSafari: "Pe iPhone, instalarea funcționează doar din Safari. Acum ești într-un alt browser — apasă butonul de mai jos ca să continui direct în Safari.",
  openInSafari: "🧭 Deschide în Safari",
  fallbackText: "Dacă nu s-a întâmplat nimic, deschide manual Safari și scrie adresa",
  forIphone: "🍎 Pentru iPhone (Safari)",
  safariSteps: "Apasă pe butonul de Partajare (iconița cu pătrățel și săgeată în sus) din bara de jos, derulează lista în jos și selectează „Adaugă pe ecranul principal”.",
  gotIt: "Am înțeles, închide",
  installNow: "⬇️ Instalează aplicația",
  genericHint: "Adaugă acest site la ecranul principal, din meniul browserului.",
}

exports.SMART_INSTALL_TEXTS_EN = {
  bannerText: "is a web app! Install it on your phone's home screen for instant access.",
  guideLabel: "Tap for the guide",
  installTitle: "Install",
  needSafari: "On iPhone, installation only works from Safari. You're currently in another browser — tap the button below to continue directly in Safari.",
  openInSafari: "🧭 Open in Safari",
  fallbackText: "If nothing happened, open Safari manually and type in the address",
  forIphone: "🍎 For iPhone (Safari)",
  safariSteps: "Tap the Share button (the square with an arrow pointing up) in the bottom bar, scroll down, and select \"Add to Home Screen\".",
  gotIt: "Got it, close",
  installNow: "⬇️ Install the app",
  genericHint: "Add this site to your home screen from your browser's menu.",
}

exports.FAV_EMPTY_TEXTS = {
  "ro": "Nimic salvat încă. Pleci undeva? Apasă ☆ lângă orice magazin sau obiectiv — de exemplu, salvează 3 locuri pe care vrei să le vezi în Berlin — și construiește-ți propria listă pentru călătorie, chiar aici.",
  "uk": "Nothing saved yet. Going somewhere? Tap ☆ next to any store or attraction — for example, save 3 places you want to see in Berlin — and build your own list for the trip, right here.",
  "de": "Noch nichts gespeichert. Reist du irgendwohin? Tippe auf ☆ neben einem Geschäft oder einer Sehenswürdigkeit — speichere zum Beispiel 3 Orte, die du in Berlin sehen möchtest — und erstelle hier deine eigene Liste für die Reise.",
  "es": "Aún no has guardado nada. ¿Vas a algún sitio? Toca ☆ junto a cualquier tienda o atracción — por ejemplo, guarda 3 lugares que quieras ver en Berlín — y crea aquí tu propia lista para el viaje.",
  "fr": "Rien d'enregistré pour l'instant. Vous partez quelque part ? Appuyez sur ☆ à côté d'un magasin ou d'une attraction — par exemple, enregistrez 3 lieux que vous voulez voir à Berlin — et créez ici votre propre liste pour le voyage.",
  "it": "Non hai ancora salvato nulla. Stai andando da qualche parte? Tocca ☆ accanto a un negozio o un'attrazione — ad esempio, salva 3 luoghi che vuoi vedere a Berlino — e crea qui la tua lista per il viaggio.",
  "pl": "Nic jeszcze nie zapisano. Wybierasz się gdzieś? Dotknij ☆ obok dowolnego sklepu lub atrakcji — na przykład zapisz 3 miejsca, które chcesz zobaczyć w Berlinie — i stwórz tutaj własną listę na podróż.",
  "nl": "Nog niets opgeslagen. Ga je ergens naartoe? Tik op ☆ naast een winkel of attractie — sla bijvoorbeeld 3 plekken op die je in Berlijn wilt zien — en bouw hier je eigen lijst voor de reis.",
  "da": "Intet gemt endnu. Skal du et sted hen? Tryk på ☆ ved siden af en butik eller seværdighed — gem for eksempel 3 steder, du vil se i Berlin — og byg din egen liste til turen lige her.",
  "se": "Inget sparat än. Ska du någonstans? Tryck på ☆ bredvid en butik eller sevärdhet — spara till exempel 3 platser du vill se i Berlin — och bygg din egen lista för resan här.",
  "pt": "Ainda não guardaste nada. Vais a algum lado? Toca em ☆ junto a qualquer loja ou ponto turístico — por exemplo, guarda 3 locais que queres ver em Berlim — e cria aqui a tua própria lista para a viagem.",
  "cz": "Zatím nic uloženo. Chystáte se někam? Klepněte na ☆ vedle libovolného obchodu nebo zajímavosti — například si uložte 3 místa, která chcete vidět v Berlíně — a vytvořte si zde svůj vlastní seznam na cestu.",
  "fi": "Ei vielä mitään tallennettu. Oletko menossa jonnekin? Napauta ☆ minkä tahansa kaupan tai nähtävyyden vieressä — tallenna esimerkiksi 3 paikkaa, jotka haluat nähdä Berliinissä — ja rakenna oma listasi matkalle tässä.",
  "gr": "Δεν έχεις αποθηκεύσει τίποτα ακόμα. Πηγαίνεις κάπου; Πάτησε ☆ δίπλα σε οποιοδήποτε κατάστημα ή αξιοθέατο — αποθήκευσε για παράδειγμα 3 μέρη που θέλεις να δεις στο Βερολίνο — και φτιάξε τη δική σου λίστα για το ταξίδι εδώ.",
  "hu": "Még nincs semmi mentve. Utazol valahova? Koppints a ☆ gombra bármelyik üzlet vagy látnivaló mellett — például mentsd el a 3 helyet, amit meg szeretnél nézni Berlinben — és itt hozd létre saját listádat az utazáshoz.",
  "hr": "Još ništa nije spremljeno. Idete negdje? Dodirnite ☆ pored bilo koje trgovine ili znamenitosti — na primjer, spremite 3 mjesta koja želite vidjeti u Berlinu — i ovdje izradite vlastiti popis za putovanje.",
  "sk": "Zatiaľ nič uložené. Chystáte sa niekam? Klepnite na ☆ vedľa ľubovoľného obchodu alebo zaujímavosti — napríklad si uložte 3 miesta, ktoré chcete vidieť v Berlíne — a vytvorte si tu svoj vlastný zoznam na cestu.",
  "si": "Še nič shranjenega. Greste kam? Tapnite ☆ ob kateri koli trgovini ali znamenitosti — na primer shranite 3 kraje, ki jih želite videti v Berlinu — in tukaj ustvarite svoj seznam za potovanje.",
  "lt": "Kol kas nieko neišsaugota. Kur nors vykstate? Bakstelėkite ☆ šalia bet kurios parduotuvės ar lankytinos vietos — pavyzdžiui, išsaugokite 3 vietas, kurias norite pamatyti Berlyne — ir sukurkite savo sąrašą kelionei čia.",
  "lv": "Vēl nekas nav saglabāts. Kaut kur dodaties? Pieskarieties ☆ blakus jebkuram veikalam vai apskates vietai — piemēram, saglabājiet 3 vietas, ko vēlaties redzēt Berlīnē — un izveidojiet savu sarakstu ceļojumam šeit.",
  "ee": "Veel pole midagi salvestatud. Lähed kuhugi? Puuduta ☆ mis tahes poe või vaatamisväärsuse kõrval — näiteks salvesta 3 kohta, mida soovid Berliinis näha — ja koosta siin oma nimekiri reisiks."
}

exports.FAV_INTRO_TEXTS = {
  "ro": "Planifici o călătorie? Apasă ☆ lângă orice magazin sau obiectiv — să zicem, 3 locuri pe care vrei să le vezi în Berlin — și le ai pe toate aici, gata, fără să mai cauți din nou. Adaugă câte vrei, și apasă ★ din nou oricând, ca să elimini unul. Salvat doar pe acest dispozitiv, nu într-un cont.",
  "uk": "Planning a trip? Tap ☆ next to any store or attraction — say, 3 places you want to see in Berlin — and they'll all be right here, ready to go, no need to search again. Add as many as you like, and tap ★ again anytime to remove one. Saved on this device only, not in an account.",
  "de": "Planst du eine Reise? Tippe auf ☆ neben einem Geschäft oder einer Sehenswürdigkeit — zum Beispiel 3 Orte, die du in Berlin sehen möchtest — und sie sind alle hier, bereit, ohne erneut zu suchen. Füge so viele hinzu, wie du willst, und tippe jederzeit erneut auf ★, um eines zu entfernen. Nur auf diesem Gerät gespeichert, nicht in einem Konto.",
  "es": "¿Planeando un viaje? Toca ☆ junto a cualquier tienda o atracción — digamos, 3 lugares que quieras ver en Berlín — y estarán todos aquí, listos, sin buscar de nuevo. Añade tantos como quieras, y toca ★ de nuevo en cualquier momento para eliminar uno. Guardado solo en este dispositivo, no en una cuenta.",
  "fr": "Vous planifiez un voyage ? Appuyez sur ☆ à côté d'un magasin ou d'une attraction — par exemple, 3 lieux que vous voulez voir à Berlin — et ils seront tous ici, prêts, sans avoir à rechercher à nouveau. Ajoutez-en autant que vous voulez, et appuyez à nouveau sur ★ à tout moment pour en supprimer un. Enregistré uniquement sur cet appareil, pas dans un compte.",
  "it": "Stai pianificando un viaggio? Tocca ☆ accanto a un negozio o un'attrazione — ad esempio, 3 luoghi che vuoi vedere a Berlino — e saranno tutti qui, pronti, senza dover cercare di nuovo. Aggiungine quanti vuoi, e tocca di nuovo ★ in qualsiasi momento per rimuoverne uno. Salvato solo su questo dispositivo, non in un account.",
  "pl": "Planujesz podróż? Dotknij ☆ obok dowolnego sklepu lub atrakcji — powiedzmy, 3 miejsca, które chcesz zobaczyć w Berlinie — i będą tu wszystkie, gotowe, bez ponownego wyszukiwania. Dodaj ich tyle, ile chcesz, i dotknij ★ ponownie w dowolnym momencie, aby usunąć jedno. Zapisane tylko na tym urządzeniu, nie na koncie.",
  "nl": "Ben je een reis aan het plannen? Tik op ☆ naast een winkel of attractie — bijvoorbeeld 3 plekken die je in Berlijn wilt zien — en ze staan hier allemaal klaar, zonder opnieuw te zoeken. Voeg er zoveel toe als je wilt, en tik op elk moment opnieuw op ★ om er een te verwijderen. Alleen op dit apparaat opgeslagen, niet in een account.",
  "da": "Planlægger du en rejse? Tryk på ☆ ved siden af en butik eller seværdighed — sig, 3 steder du vil se i Berlin — og de er alle her, klar, uden at søge igen. Tilføj lige så mange du vil, og tryk på ★ igen når som helst for at fjerne en. Kun gemt på denne enhed, ikke i en konto.",
  "se": "Planerar du en resa? Tryck på ☆ bredvid en butik eller sevärdhet — säg 3 platser du vill se i Berlin — och de är alla här, redo, utan att söka igen. Lägg till så många du vill, och tryck på ★ igen när som helst för att ta bort en. Sparat endast på den här enheten, inte i ett konto.",
  "pt": "A planear uma viagem? Toca em ☆ junto a qualquer loja ou ponto turístico — digamos, 3 locais que queres ver em Berlim — e estarão todos aqui, prontos, sem procurar de novo. Adiciona quantos quiseres, e toca em ★ novamente a qualquer momento para remover um. Guardado apenas neste dispositivo, não numa conta.",
  "cz": "Plánujete cestu? Klepněte na ☆ vedle libovolného obchodu nebo zajímavosti — řekněme 3 místa, která chcete vidět v Berlíně — a budou zde všechna připravena, bez dalšího hledání. Přidejte jich, kolik chcete, a kdykoli klepněte znovu na ★ pro odebrání jednoho. Uloženo pouze na tomto zařízení, ne v účtu.",
  "fi": "Suunnitteletko matkaa? Napauta ☆ minkä tahansa kaupan tai nähtävyyden vieressä — sano, 3 paikkaa, jotka haluat nähdä Berliinissä — ja ne kaikki ovat täällä valmiina, ilman uutta hakua. Lisää niin monta kuin haluat, ja napauta ★ uudelleen milloin tahansa poistaaksesi yhden. Tallennettu vain tähän laitteeseen, ei tilille.",
  "gr": "Σχεδιάζεις ταξίδι; Πάτησε ☆ δίπλα σε οποιοδήποτε κατάστημα ή αξιοθέατο — ας πούμε, 3 μέρη που θέλεις να δεις στο Βερολίνο — και θα είναι όλα εδώ, έτοιμα, χωρίς να χρειάζεται νέα αναζήτηση. Πρόσθεσε όσα θέλεις, και πάτησε ξανά ★ οποιαδήποτε στιγμή για να αφαιρέσεις ένα. Αποθηκευμένο μόνο σε αυτή τη συσκευή, όχι σε λογαριασμό.",
  "hu": "Utazást tervezel? Koppints a ☆ gombra bármelyik üzlet vagy látnivaló mellett — mondjuk 3 hely, amit meg szeretnél nézni Berlinben — és mind itt lesznek, készen állva, újbóli keresés nélkül. Adj hozzá annyit, amennyit szeretnél, és bármikor koppints újra a ★ gombra egy eltávolításához. Csak ezen az eszközön mentve, nem fiókban.",
  "hr": "Planirate putovanje? Dodirnite ☆ pored bilo koje trgovine ili znamenitosti — recimo, 3 mjesta koja želite vidjeti u Berlinu — i sva će biti ovdje, spremna, bez ponovnog pretraživanja. Dodajte ih koliko želite, i bilo kada ponovno dodirnite ★ za uklanjanje jednog. Spremljeno samo na ovom uređaju, ne u računu.",
  "sk": "Plánujete cestu? Klepnite na ☆ vedľa ľubovoľného obchodu alebo zaujímavosti — povedzme 3 miesta, ktoré chcete vidieť v Berlíne — a budú tu všetky pripravené, bez opätovného hľadania. Pridajte ich, koľko chcete, a kedykoľvek klepnite znova na ★ na odstránenie jedného. Uložené len na tomto zariadení, nie v účte.",
  "si": "Načrtujete potovanje? Tapnite ☆ ob kateri koli trgovini ali znamenitosti — recimo 3 kraje, ki jih želite videti v Berlinu — in vsi bodo tukaj, pripravljeni, brez ponovnega iskanja. Dodajte jih kolikor želite, in kadar koli znova tapnite ★, da odstranite enega. Shranjeno samo v tej napravi, ne v računu.",
  "lt": "Planuojate kelionę? Bakstelėkite ☆ šalia bet kurios parduotuvės ar lankytinos vietos — tarkime, 3 vietas, kurias norite pamatyti Berlyne — ir jos visos bus čia, paruoštos, be naujos paieškos. Pridėkite tiek, kiek norite, ir bet kada bakstelėkite ★ dar kartą, kad pašalintumėte vieną. Išsaugota tik šiame įrenginyje, ne paskyroje.",
  "lv": "Plānojat ceļojumu? Pieskarieties ☆ blakus jebkuram veikalam vai apskates vietai — teiksim, 3 vietas, ko vēlaties redzēt Berlīnē — un tās visas būs šeit, gatavas, bez atkārtotas meklēšanas. Pievienojiet, cik vien vēlaties, un jebkurā laikā pieskarieties ★ vēlreiz, lai noņemtu vienu. Saglabāts tikai šajā ierīcē, nevis kontā.",
  "ee": "Kas planeerid reisi? Puuduta ☆ mis tahes poe või vaatamisväärsuse kõrval — ütleme, 3 kohta, mida soovid Berliinis näha — ja need kõik on siin, valmis, ilma uue otsinguta. Lisa nii palju kui soovid ja puuduta ★ uuesti igal ajal, et ühe eemaldada. Salvestatud ainult sellesse seadmesse, mitte kontole."
}

exports.HOMEPAGE_FOOTER_TEXTS = {
  "ro": "îți arată în timp real dacă marile magazine și obiective turistice din Europa sunt deschise chiar acum, plus programul complet săptămânal și de sărbători — caută, răsfoiește pe țară, salvează-ți favoritele sau creează un itinerar pentru o călătorie de neuitat.",
  "uk": "shows you in real time whether major stores and tourist attractions across Europe are currently open, plus full weekly and holiday opening hours — search, browse by country, save your favorites, or create an itinerary for an unforgettable trip.",
  "de": "zeigt dir in Echtzeit, ob große Geschäfte und Sehenswürdigkeiten in ganz Europa gerade geöffnet sind, sowie vollständige wöchentliche und feiertägliche Öffnungszeiten — suche, durchsuche nach Land, speichere deine Favoriten, oder erstelle eine Reiseroute für eine unvergessliche Reise.",
  "es": "te muestra en tiempo real si las principales tiendas y atracciones turísticas de toda Europa están abiertas ahora mismo, además del horario semanal y festivo completo — busca, explora por país, guarda tus favoritos, o crea un itinerario para un viaje inolvidable.",
  "fr": "vous indique en temps réel si les grands magasins et attractions touristiques d'Europe sont actuellement ouverts, ainsi que les horaires hebdomadaires et fériés complets — recherchez, parcourez par pays, enregistrez vos favoris, ou créez un itinéraire pour un voyage inoubliable.",
  "it": "ti mostra in tempo reale se i principali negozi e attrazioni turistiche in tutta Europa sono attualmente aperti, oltre agli orari settimanali e festivi completi — cerca, sfoglia per paese, salva i tuoi preferiti, o crea un itinerario per un viaggio indimenticabile.",
  "pl": "pokazuje w czasie rzeczywistym, czy główne sklepy i atrakcje turystyczne w całej Europie są obecnie otwarte, oraz pełne godziny tygodniowe i świąteczne — szukaj, przeglądaj według kraju, zapisz swoje ulubione, lub stwórz plan podróży na niezapomnianą wyprawę.",
  "nl": "laat je in real time zien of grote winkels en toeristische attracties in heel Europa nu open zijn, plus volledige wekelijkse en feestdagopeningstijden — zoek, blader per land, sla je favorieten op, of maak een reisroute voor een onvergetelijke reis.",
  "da": "viser dig i realtid, om store butikker og turistattraktioner i hele Europa har åbent lige nu, plus fulde ugentlige og helligdagsåbningstider — søg, gennemse efter land, gem dine favoritter, eller lav en rejseplan til en uforglemmelig rejse.",
  "se": "visar dig i realtid om stora butiker och turistattraktioner i hela Europa är öppna just nu, plus fullständiga vecko- och helgdagsöppettider — sök, bläddra efter land, spara dina favoriter, eller skapa en reseplan för en oförglömlig resa.",
  "pt": "mostra-te em tempo real se as principais lojas e pontos turísticos em toda a Europa estão abertos agora mesmo, além do horário semanal e feriados completo — pesquisa, navega por país, guarda os teus favoritos, ou cria um itinerário para uma viagem inesquecível.",
  "cz": "ti v reálném čase ukazuje, zda jsou hlavní obchody a turistické zajímavosti po celé Evropě právě teď otevřené, plus kompletní týdenní a sváteční otevírací dobu — hledej, procházej podle země, ulož si oblíbené, nebo si vytvoř trasu pro nezapomenutelný výlet.",
  "fi": "näyttää sinulle reaaliajassa, ovatko Euroopan suuret kaupat ja nähtävyydet juuri nyt auki, sekä täydelliset viikoittaiset ja pyhäpäivien aukioloajat — hae, selaa maittain, tallenna suosikkisi, tai luo matkasuunnitelma unohtumatonta matkaa varten.",
  "gr": "σου δείχνει σε πραγματικό χρόνο αν τα μεγάλα καταστήματα και τα τουριστικά αξιοθέατα σε όλη την Ευρώπη είναι ανοιχτά αυτή τη στιγμή, καθώς και το πλήρες εβδομαδιαίο και εορταστικό ωράριο — αναζήτησε, περιήγηση ανά χώρα, αποθήκευσε τα αγαπημένα σου, ή δημιούργησε ένα δρομολόγιο για ένα αξέχαστο ταξίδι.",
  "hu": "valós időben megmutatja, hogy Európa nagy üzletei és turisztikai látványosságai éppen nyitva vannak-e, valamint a teljes heti és ünnepnapi nyitvatartást — keress, böngéssz ország szerint, mentsd el kedvenceidet, vagy készíts útitervet egy felejthetetlen utazáshoz.",
  "hr": "pokazuje ti u stvarnom vremenu jesu li velike trgovine i turističke znamenitosti diljem Europe trenutno otvorene, uz potpuno tjedno i blagdansko radno vrijeme — pretraži, pregledaj po državi, spremi svoje favorite, ili izradi itinerar za nezaboravno putovanje.",
  "sk": "ti v reálnom čase ukazuje, či sú veľké obchody a turistické zaujímavosti v celej Európe práve teraz otvorené, plus kompletný týždenný a sviatočný otvárací čas — hľadaj, prezeraj podľa krajiny, ulož si obľúbené, alebo si vytvor itinerár pre nezabudnuteľný výlet.",
  "si": "ti v realnem času prikazuje, ali so velike trgovine in turistične znamenitosti po vsej Evropi trenutno odprte, ter celoten tedenski in praznični delovni čas — išči, brskaj po državah, shrani svoje priljubljene, ali ustvari itinerar za nepozabno potovanje.",
  "lt": "realiuoju laiku rodo, ar didelės parduotuvės ir turistų lankomos vietos visoje Europoje šiuo metu yra atviros, taip pat visą savaitės ir švenčių darbo laiką — ieškokite, naršykite pagal šalį, išsaugokite mėgstamiausius, arba sukurkite kelionės planą nepamirštamai kelionei.",
  "lv": "reāllaikā parāda, vai lielie veikali un tūrisma apskates vietas visā Eiropā pašlaik ir atvērti, kā arī pilnu nedēļas un svētku darba laiku — meklējiet, pārlūkojiet pēc valsts, saglabājiet iecienītākos, vai izveidojiet maršrutu neaizmirstamam ceļojumam.",
  "ee": "näitab sulle reaalajas, kas suured poed ja vaatamisväärsused kogu Euroopas on praegu avatud, samuti täielikke nädala- ja pühadeaegseid lahtiolekuaegu — otsi, sirvi riigi järgi, salvesta oma lemmikud, või loo marsruut unustamatuks reisiks."
}

// Titlu/descriere SEO pentru pagina internațională — cerut explicit, tradus
// în toate 21 de limbi, ca să se potrivească noului brief SEO (RO), nu
// doar în engleză/română.
exports.HOMEPAGE_SEO_TITLES = {
  ro: "Este magazinul deschis chiar acum? Program Magazine Azi & Orar în timp real",
  uk: "Is the Store Open Right Now? Today's Store Hours & Live Status",
  de: "Ist der Laden gerade geöffnet? Öffnungszeiten heute & Live-Status",
  es: "¿Está la tienda abierta ahora mismo? Horario de hoy y estado en vivo",
  fr: "Le magasin est-il ouvert maintenant ? Horaires du jour et statut en direct",
  it: "Il negozio è aperto adesso? Orari di oggi e stato in tempo reale",
  pl: "Czy sklep jest teraz otwarty? Dzisiejsze godziny otwarcia na żywo",
  nl: "Is de winkel nu open? Openingstijden van vandaag & live status",
  da: "Har butikken åbent lige nu? Dagens åbningstider & status live",
  se: "Har butiken öppet just nu? Dagens öppettider & status live",
  pt: "A loja está aberta agora? Horário de hoje e estado em tempo real",
  cz: "Má obchod teď otevřeno? Dnešní otevírací doba a stav naživo",
  fi: "Onko kauppa auki juuri nyt? Tämän päivän aukioloajat & tila reaaliajassa",
  gr: "Είναι ανοιχτό το κατάστημα τώρα; Ωράριο σήμερα & κατάσταση ζωντανά",
  hu: "Nyitva van most az üzlet? Mai nyitvatartás és élő állapot",
  hr: "Je li trgovina sada otvorena? Današnje radno vrijeme i status uživo",
  sk: "Má obchod teraz otvorené? Dnešná otváracia doba a stav naživo",
  si: "Je trgovina zdaj odprta? Današnji delovni čas in stanje v živo",
  lt: "Ar parduotuvė dabar atidaryta? Šiandienos darbo laikas ir būsena tiesiogiai",
  lv: "Vai veikals tagad ir atvērts? Šodienas darba laiks un statuss tiešraidē",
  ee: "Kas pood on praegu avatud? Tänased lahtiolekuajad ja olek reaalajas",
};
exports.HOMEPAGE_SEO_DESCRIPTIONS = {
  ro: "Află instant dacă magazinul tău este deschis acum. Verifică programul magazinelor de astăzi în orașul tău prin localizare automată. Simplu și rapid!",
  uk: "Find out instantly if your store is open right now. Check today's opening hours in your city with automatic location detection. Simple and fast!",
  de: "Finde sofort heraus, ob dein Geschäft gerade geöffnet ist. Prüfe die heutigen Öffnungszeiten in deiner Stadt per automatischer Standorterkennung. Einfach und schnell!",
  es: "Descubre al instante si tu tienda está abierta ahora mismo. Consulta el horario de hoy en tu ciudad con localización automática. ¡Sencillo y rápido!",
  fr: "Découvrez instantanément si votre magasin est ouvert maintenant. Consultez les horaires du jour dans votre ville grâce à la localisation automatique. Simple et rapide !",
  it: "Scopri all'istante se il tuo negozio è aperto adesso. Controlla gli orari di oggi nella tua città con la localizzazione automatica. Semplice e veloce!",
  pl: "Sprawdź od razu, czy Twój sklep jest teraz otwarty. Zobacz dzisiejsze godziny otwarcia w Twoim mieście dzięki automatycznej lokalizacji. Prosto i szybko!",
  nl: "Ontdek direct of jouw winkel nu open is. Bekijk de openingstijden van vandaag in jouw stad met automatische locatiebepaling. Simpel en snel!",
  da: "Find straks ud af, om din butik har åbent lige nu. Tjek dagens åbningstider i din by med automatisk placering. Enkelt og hurtigt!",
  se: "Ta reda på direkt om din butik har öppet just nu. Se dagens öppettider i din stad med automatisk platsigenkänning. Enkelt och snabbt!",
  pt: "Descubra instantaneamente se a sua loja está aberta agora. Consulte o horário de hoje na sua cidade com localização automática. Simples e rápido!",
  cz: "Okamžitě zjistěte, zda má váš obchod teď otevřeno. Podívejte se na dnešní otevírací dobu ve vašem městě pomocí automatické lokalizace. Jednoduše a rychle!",
  fi: "Selvitä heti, onko kauppasi auki juuri nyt. Tarkista tämän päivän aukioloajat kaupungissasi automaattisen paikannuksen avulla. Yksinkertaista ja nopeaa!",
  gr: "Μάθετε αμέσως αν το κατάστημά σας είναι ανοιχτό τώρα. Δείτε το σημερινό ωράριο στην πόλη σας με αυτόματο εντοπισμό τοποθεσίας. Απλό και γρήγορο!",
  hu: "Tudd meg azonnal, hogy nyitva van-e most az üzleted. Nézd meg a mai nyitvatartást a városodban, automatikus helymeghatározással. Egyszerű és gyors!",
  hr: "Odmah saznajte je li vaša trgovina sada otvorena. Provjerite današnje radno vrijeme u vašem gradu uz automatsku lokaciju. Jednostavno i brzo!",
  sk: "Okamžite zistite, či má váš obchod teraz otvorené. Pozrite si dnešnú otváraciu dobu vo vašom meste pomocou automatickej polohy. Jednoducho a rýchlo!",
  si: "Takoj ugotovite, ali je vaša trgovina zdaj odprta. Preverite današnji delovni čas v vašem mestu s samodejno lokacijo. Preprosto in hitro!",
  lt: "Iškart sužinokite, ar jūsų parduotuvė dabar atidaryta. Peržiūrėkite šiandienos darbo laiką savo mieste naudodami automatinį vietos nustatymą. Paprasta ir greita!",
  lv: "Uzziniet uzreiz, vai jūsu veikals tagad ir atvērts. Skatiet šodienas darba laiku savā pilsētā ar automātisku atrašanās vietas noteikšanu. Vienkārši un ātri!",
  ee: "Saa kohe teada, kas sinu pood on praegu avatud. Vaata tänaseid lahtiolekuaegu oma linnas automaatse asukoha tuvastamisega. Lihtne ja kiire!",
};

exports.MAP_UNIFIED_TOGGLE_LABELS = {
  ro: "⚡ Deschise Acum / Acces 24/7", uk: "⚡ Open Now / Free Access", de: "⚡ Jetzt geöffnet / Freier Zugang",
  fr: "⚡ Ouvert maintenant / Accès libre", es: "⚡ Abierto ahora / Acceso libre", it: "⚡ Aperto ora / Accesso libero",
  pl: "⚡ Otwarte teraz / Wolny dostęp", nl: "⚡ Nu geopend / Vrije toegang", da: "⚡ Åben nu / Fri adgang",
  cz: "⚡ Nyní otevřeno / Volný přístup", fi: "⚡ Nyt auki / Vapaa pääsy", gr: "⚡ Ανοιχτό τώρα / Ελεύθερη πρόσβαση",
  hu: "⚡ Most nyitva / Szabad bejárás", hr: "⚡ Sada otvoreno / Slobodan pristup", sk: "⚡ Teraz otvorené / Voľný prístup",
  si: "⚡ Zdaj odprto / Prost dostop", lt: "⚡ Dabar atidaryta / Laisvas įėjimas", lv: "⚡ Tagad atvērts / Brīva piekļuve",
  pt: "⚡ Aberto agora / Acesso livre", se: "⚡ Öppet nu / Fritt tillträde", ee: "⚡ Praegu avatud / Vaba juurdepääs",
}

exports.MAP_LOADING_STORES_LABELS = {
  ro: "Se încarcă statusul live al magazinelor...", uk: "Loading live store status...", de: "Live-Status der Geschäfte wird geladen …",
  fr: "Chargement du statut en direct des magasins…", es: "Cargando el estado en vivo de las tiendas…", it: "Caricamento dello stato in tempo reale dei negozi…",
  pl: "Ładowanie statusu sklepów na żywo…", nl: "Live status van winkels wordt geladen…", da: "Indlæser butikkers live-status…",
  cz: "Načítání živého stavu obchodů…", fi: "Ladataan kauppojen reaaliaikaista tilaa…", gr: "Φόρτωση ζωντανής κατάστασης καταστημάτων…",
  hu: "Üzletek élő állapotának betöltése…", hr: "Učitavanje statusa trgovina uživo…", sk: "Načítava sa živý stav obchodov…",
  si: "Nalaganje statusa trgovin v živo…", lt: "Įkeliama parduotuvių gyva būsena…", lv: "Ielādē veikalu tiešraides statusu…",
  pt: "A carregar o estado em direto das lojas…", se: "Laddar butikers livestatus…", ee: "Poodide reaalajas oleku laadimine…",
}

exports.MAP_LOADING_ATTRACTIONS_LABELS = {
  ro: "Se încarcă obiectivele turistice...", uk: "Loading tourist attractions...", de: "Sehenswürdigkeiten werden geladen …",
  fr: "Chargement des sites touristiques…", es: "Cargando las atracciones turísticas…", it: "Caricamento delle attrazioni turistiche…",
  pl: "Ładowanie atrakcji turystycznych…", nl: "Toeristische attracties worden geladen…", da: "Indlæser seværdigheder…",
  cz: "Načítání turistických zajímavostí…", fi: "Ladataan nähtävyyksiä…", gr: "Φόρτωση τουριστικών αξιοθέατων…",
  hu: "Turisztikai látnivalók betöltése…", hr: "Učitavanje turističkih znamenitosti…", sk: "Načítavajú sa turistické atrakcie…",
  si: "Nalaganje turističnih znamenitosti…", lt: "Įkeliamos lankytinos vietos…", lv: "Ielādē tūrisma apskates vietas…",
  pt: "A carregar as atrações turísticas…", se: "Laddar sevärdheter…", ee: "Vaatamisväärsuste laadimine…",
}

exports.BOTTOM_NAV_LABELS = {
  ro: { home: "Acasă", search: "Căutare", favorites: "Favorite", map: "Hartă" },
  uk: { home: "Home", search: "Search", favorites: "Favorites", map: "Map" },
  de: { home: "Start", search: "Suche", favorites: "Favoriten", map: "Karte" },
  es: { home: "Inicio", search: "Buscar", favorites: "Favoritos", map: "Mapa" },
  fr: { home: "Accueil", search: "Recherche", favorites: "Favoris", map: "Carte" },
  it: { home: "Home", search: "Cerca", favorites: "Preferiti", map: "Mappa" },
  pl: { home: "Start", search: "Szukaj", favorites: "Ulubione", map: "Mapa" },
  nl: { home: "Home", search: "Zoeken", favorites: "Favorieten", map: "Kaart" },
  da: { home: "Hjem", search: "Søg", favorites: "Favoritter", map: "Kort" },
  se: { home: "Hem", search: "Sök", favorites: "Favoriter", map: "Karta" },
  pt: { home: "Início", search: "Pesquisar", favorites: "Favoritos", map: "Mapa" },
  cz: { home: "Domů", search: "Hledat", favorites: "Oblíbené", map: "Mapa" },
  fi: { home: "Koti", search: "Haku", favorites: "Suosikit", map: "Kartta" },
  gr: { home: "Αρχική", search: "Αναζήτηση", favorites: "Αγαπημένα", map: "Χάρτης" },
  hu: { home: "Kezdőlap", search: "Keresés", favorites: "Kedvencek", map: "Térkép" },
  hr: { home: "Početna", search: "Pretraga", favorites: "Favoriti", map: "Karta" },
  sk: { home: "Domov", search: "Hľadať", favorites: "Obľúbené", map: "Mapa" },
  si: { home: "Domov", search: "Iskanje", favorites: "Priljubljene", map: "Zemljevid" },
  lt: { home: "Pradžia", search: "Paieška", favorites: "Mėgstami", map: "Žemėlapis" },
  lv: { home: "Sākums", search: "Meklēt", favorites: "Iecienītie", map: "Karte" },
  ee: { home: "Avaleht", search: "Otsi", favorites: "Lemmikud", map: "Kaart" },
}

exports.TRAVEL_GUIDES_RO = [
  {
    slug: "transport",
    title: "Cum ajungi eficient la marile obiective turistice",
    intro: "Ghid de transport urban și regional",
    body: `
    <p>Un itinerar turistic reușit depinde în mare măsură de cum te miști între obiective. Când vrei să vizitezi muzee, castele sau monumente istorice, conexiunea dintre orașe și logistica locală fac diferența dintre o zi relaxată și una pierdută prin gări și stații.</p>
    <p>Pentru distanțe lungi sau între regiuni istorice, trenul rămâne varianta cea mai populară — rețeaua feroviară europeană leagă majoritatea capitalelor de orașele mai mici, cu rute adesea pitorești. Autocarele completează bine acoperirea, mai ales spre localități sau zone montane unde trenul nu ajunge direct, și costă de regulă mai puțin.</p>
    <p>Dacă aterizezi la aeroport cu bagaje multe sau călătorești în grup, un transfer privat precomandat elimină bătaia de cap a schimbării mijloacelor de transport — te duce direct de la terminal la poarta castelului sau la hotel. Planificarea din timp a acestor conexiuni e ceea ce transformă o vacanță aglomerată într-una fără stres.</p>
    <div class="plan-visit-block" style="display:block">
      ${TRAVEL_GUIDES_MONETIZATION_READY
        ? `
      <a href="${escapeHtml(getTransferLinkFor())}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking-alt">🚕 Rezervă un transfer privat</a>`
        : `<p class="plan-visit-hint">${comingSoonTextFor("ro")}</p>`}
    </div>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Planifică toată călătoria, dintr-un singur loc</h3>
      <p class="trip-toolkit-subtitle">Ai nevoie de zbor, cazare, o mașină sau un transfer? Le găsești chiar aici.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=ron&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=ro&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Caută bilete de avion</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Caută cazare</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Închiriază o mașină</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="getTransferWidgetBox" data-widget-src="https://tpembd.com/content?trs=565241&shmarker=767825&locale=en&powered_by=false&border_radius=12&plain=true&color_background=%23f6f6f6&color_button=%23F0813A&promo_id=4674&campaign_id=22"><span class="affiliate-cta-text">🚕 Rezervă un transfer</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="getTransferWidgetBox" class="flight-widget-card" style="display:none"></div>
      </div>
    </div>`,
  },
  {
    slug: "parcari",
    title: "Cum gestionezi parcarea în apropierea zonelor istorice",
    intro: "Ghid pentru șoferi — parcare în centrele vechi",
    body: `
    <p>Cu mașina proprie sau închiriată ai o libertate de mișcare pe care alte mijloace de transport n-o pot oferi — dar centrele istorice ale marilor orașe sunt cunoscute pentru restricțiile de trafic și lipsa cronică de locuri de parcare.</p>
    <p>Lăsată la întâmplare, mașina riscă amendă sau chiar ridicare. Cea mai sigură variantă rămâne o parcare securizată, subterană sau supraterană, administrată privat — multe dintre ele permit rezervarea unui loc din timp, ceea ce contează mai ales în weekend sau în plin sezon, când obiectivele sunt aglomerate.</p>
    <p>O parcare aleasă bine, la câțiva pași de muzeu sau de zona istorică, îți lasă libertatea să explorezi în ritmul tău, fără să te mai gândești la mașină. Verifică din timp disponibilitatea și rezervă online — merită, mai ales dacă mergi într-un weekend aglomerat.</p>
    <div class="plan-visit-block" style="display:block">
      ${TRAVEL_GUIDES_MONETIZATION_READY
        ? `<a href="https://www.awin1.com/cread.php?awinmid=18633&awinaffid=3051943&campaign=Your%20Parking%20Space&ued=https%3A%2F%2Fwww.yourparkingspace.co.uk%2F" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking">🅿️ Parcare UK — rezervă un loc, în avans</a>
      <p class="plan-visit-hint">🅿️ Parcare UE — în curând</p>`
        : `<p class="plan-visit-hint">${comingSoonTextFor("ro")}</p>`}
    </div>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Planifică toată călătoria, dintr-un singur loc</h3>
      <p class="trip-toolkit-subtitle">Ai nevoie de zbor, cazare, o mașină sau un transfer? Le găsești chiar aici.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=ron&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=ro&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Caută bilete de avion</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Caută cazare</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Închiriază o mașină</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="getTransferWidgetBox" data-widget-src="https://tpembd.com/content?trs=565241&shmarker=767825&locale=en&powered_by=false&border_radius=12&plain=true&color_background=%23f6f6f6&color_button=%23F0813A&promo_id=4674&campaign_id=22"><span class="affiliate-cta-text">🚕 Rezervă un transfer</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="getTransferWidgetBox" class="flight-widget-card" style="display:none"></div>
      </div>
    </div>`,
  },
  {
    slug: "restaurante",
    title: "Cum organizezi o zi perfectă de vacanță",
    intro: "Corelarea programului de vizitare cu mesele",
    body: `
    <p>O zi de vacanță reușită înseamnă un echilibru între cultură și relaxare. Dacă îți construiești ziua în jurul programului unui muzeu sau al unei galerii, merită să incluzi din timp și pauzele de masă — altfel riști să ajungi flămând exact când toate localurile din apropiere sunt pline.</p>
    <p>Marile obiective atrag mii de vizitatori zilnic, iar zonele din jurul lor devin rapid aglomerate, mai ales la prânz și seara. O rezervare făcută din timp, printr-o platformă online, îți garantează o masă fără să stai la coadă sau să cauți disperat un loc liber.</p>
    <p>Cel mai eficient tipar: vizitează expozițiile dimineața devreme, când e liniște, apoi încheie ziua cu o masă la un restaurant local, rezervat din timp — o simplă zi de vacanță devine, așa, o amintire pe care chiar vrei s-o ții minte.</p>
    <div class="plan-visit-block" style="display:block">
      ${TRAVEL_GUIDES_MONETIZATION_READY
        ? `<a href="${escapeHtml(linkTheForkAffiliate || "https://www.thefork.com/")}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-booking">🍽️ Caută pe TheFork (Franța, Italia, Spania)</a>
      <a href="${escapeHtml(linkOpenTableAffiliate || "https://www.opentable.com/")}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking-alt">🍽️ Caută pe OpenTable (UK, Germania)</a>`
        : `<p class="plan-visit-hint">${comingSoonTextFor("ro")}</p>`}
    </div>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Planifică toată călătoria, dintr-un singur loc</h3>
      <p class="trip-toolkit-subtitle">Ai nevoie de zbor, cazare, o mașină sau un transfer? Le găsești chiar aici.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=ron&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=ro&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Caută bilete de avion</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Caută cazare</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Închiriază o mașină</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="getTransferWidgetBox" data-widget-src="https://tpembd.com/content?trs=565241&shmarker=767825&locale=en&powered_by=false&border_radius=12&plain=true&color_background=%23f6f6f6&color_button=%23F0813A&promo_id=4674&campaign_id=22"><span class="affiliate-cta-text">🚕 Rezervă un transfer</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="getTransferWidgetBox" class="flight-widget-card" style="display:none"></div>
      </div>
    </div>`,
  },
  {
    slug: "zboruri",
    title: "Cum găsești cele mai bune bilete de avion",
    intro: "Ghid de căutare zboruri, cu comparator de prețuri în timp real",
    body: `
    <p>Biletul de avion e de obicei cea mai mare cheltuială dintr-o vacanță — și cea mai ușor de optimizat, dacă știi unde să cauți. Diferențele de preț între companii, între zile ale săptămânii sau între aeroporturi apropiate pot ajunge la sute de euro pentru aceeași destinație.</p>
    <p>Un comparator care caută simultan pe zeci de companii aeriene (inclusiv low-cost) îți arată dintr-o privire cea mai ieftină variantă, indiferent cine o operează — mult mai rapid decât să verifici manual site-ul fiecărei companii în parte.</p>
    <p>Caută mai jos direct, fără să părăsești pagina — introdu orașul de plecare și destinația, iar rezultatele apar în timp real, cu prețuri actualizate.</p>
    <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesWidgetBox" data-widget-src="https://tpembd.com/content?currency=ron&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=ro&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Caută bilete de avion</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button>
    <div class="flight-widget-card" id="aviasalesWidgetBox" style="display:none"></div>`,
  },
  {
    slug: "transfer-aeroport",
    title: "Cum rezervi un transfer sigur de la aeroport",
    intro: "Rezervă un transfer privat sau shuttle de la aeroport, cu preț fix",
    body: `
    <p>La aterizare, într-un oraș nou, ultimul lucru pe care-l vrei e să cauți un taxi la întâmplare sau să negociezi prețul cu un șofer necunoscut. Un transfer rezervat dinainte are preț fix, șofer confirmat și te așteaptă exact la ora aterizării — fără surprize, fără stres.</p>
    <p>Rezervarea din timp e de obicei mai ieftină decât un taxi luat pe loc, și elimină complet riscul de a rămâne blocat la aeroport dacă zborul întârzie.</p>
    <p>Apasă mai jos ca să cauți și să rezervi transferul tău, direct pe platforma partenerului.</p>
    <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="getTransferWidgetBox" data-widget-src="https://tpembd.com/content?trs=565241&shmarker=767825&locale=en&powered_by=false&border_radius=12&plain=true&color_background=%23f6f6f6&color_button=%23F0813A&promo_id=4674&campaign_id=22"><span class="affiliate-cta-text">🚕 Rezervă transferul de la aeroport</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button>
    <div class="flight-widget-card" id="getTransferWidgetBox" style="display:none"></div>`,
  },
  {
    slug: "excursii-tururi-europa",
    title: "Cele mai bune excursii și tururi cu ghid turistic din Europa",
    intro: "Excursii de o zi și tururi ghidate în marile orașe europene, rezervabile din timp",
    body: `
    <p>O excursie rezervată din timp înseamnă loc garantat, ghid confirmat și, de multe ori, acces la locuri unde altfel ai sta la coadă ore întregi. Am adunat mai jos câteva dintre cele mai apreciate tururi și excursii de o zi din marile orașe europene — de la plimbări cu barca pe Dunăre, până la trasee prin istoria antică a Romei sau Atenei.</p>

    <h2 class="section-title"><span class="bar"></span>Excursii recomandate</h2>

    <h3>București — Mănăstirea Snagov, Palatul Mogoșoaia și Salina Slănic</h3>
    <p>O excursie de o zi perfectă pentru cine vrea să vadă, într-un singur traseu, trei fețe complet diferite ale zonei din jurul Bucureștiului: liniștea insulei mănăstirii Snagov, eleganța Palatului Mogoșoaia și impresionanta Salină Slănic, sculptată adânc în munte. Ideală dacă ai doar o zi liberă în capitală și vrei să ieși din agitația orașului.</p>
    <a href="https://www.getyourguide.com/slanic-l91935/snagov-monastery-mogosoaia-salt-mine-day-trip-bucharest-t1221626/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă excursia — Snagov, Mogoșoaia și Salina Slănic</a>

    <h3>București — Excursie de o zi în Delta Dunării</h3>
    <p>Delta Dunării e una dintre cele mai spectaculoase rezervații naturale din Europa, cu o biodiversitate unică — pelicani, cormorani și sute de specii de păsări, printre canale înguste și sate de pescari. O excursie de o zi din București, cu tot cu deplasare, e cea mai simplă variantă să prinzi atmosfera Deltei fără să-ți organizezi singur transportul.</p>
    <a href="https://www.getyourguide.com/bucharest-l111/from-bucharest-day-trip-to-danube-delta-t662170/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă excursia — Delta Dunării</a>

    <h3>Viena — Croazieră pe Dunăre, cu prânz opțional</h3>
    <p>Viena văzută de pe apă are cu totul altă poveste — poduri istorice, clădiri imperiale și parcuri verzi, toate defilând pe malul Dunării. O croazieră relaxantă, cu opțiune de prânz la bord, e o pauză binevenită după o dimineață de mers pe jos prin centrul istoric.</p>
    <a href="https://www.getyourguide.com/vienna-l7/vienna-city-cruise-with-optional-lunch-t58823/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă croaziera — Viena</a>

    <h3>Budapesta — Croazieră de seară pe Dunăre</h3>
    <p>Budapesta luminată noaptea e, pentru mulți, cea mai frumoasă panoramă urbană din Europa Centrală — Parlamentul, Podul cu Lanțuri și Cetatea Buda, toate strălucind pe malurile Dunării. O croazieră de seară e modul clasic, aproape obligatoriu, de a vedea orașul din perspectiva potrivită.</p>
    <a href="https://www.getyourguide.com/budapest-l29/budapest-evening-sightseeing-cruise-on-the-danube-t1117141/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă croaziera — Budapesta</a>

    <h3>Amsterdam — Excursie de o zi la Bruges</h3>
    <p>Bruges e considerat unul dintre cele mai bine păstrate orașe medievale din Europa — canale, poduri de piatră și clădiri gotice, toate concentrate într-un centru istoric compact, ușor de explorat pe jos. O excursie de o zi din Amsterdam, cu ghid vorbitor de engleză sau spaniolă, e alegerea simplă pentru cine nu vrea să-și complice transportul.</p>
    <a href="https://www.getyourguide.com/amsterdam-l36/from-amsterdam-bruges-day-tour-in-spanish-or-english-t2633/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program&cmp=amsterdam" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă excursia — Bruges, din Amsterdam</a>

    <h3>Haga — Bilet de intrare la Muzeul Panorama Mesdag</h3>
    <p>Panorama Mesdag e o pictură circulară uriașă, din 1881, care înconjoară complet vizitatorul cu o priveliște a satului de pescari Scheveningen din secolul XIX — o experiență vizuală unică, greu de imaginat până n-o vezi cu ochii tăi. Un muzeu mic, dar spectaculos, la doar câțiva pași de centrul Hagăi.</p>
    <a href="https://www.getyourguide.com/the-hague-l1267/the-hague-entry-ticket-to-the-panorama-mesdag-museum-t391318/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă biletul — Muzeul Panorama Mesdag, Haga</a>

    <h3>Praga — Cetatea Vyšehrad, bijuteria ascunsă a orașului</h3>
    <p>În timp ce majoritatea turiștilor se înghesuie la Castelul Praga, Vyšehrad rămâne o alegere mult mai liniștită — o fortăreață istorică pe malul Vltavei, cu priveliști superbe și un cimitir unde sunt îngropate mari personalități cehe. Un loc perfect pentru cine vrea Praga fără aglomerație.</p>
    <a href="https://www.getyourguide.com/prague-l10/prague-s-best-hidden-gem-vysehrad-castle-historic-fort-t1011583/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă tur-ul — Cetatea Vyšehrad, Praga</a>

    <h3>Roma — Colosseum cu acces pe arenă și Forumul Roman</h3>
    <p>Puțini vizitatori ajung vreodată chiar pe podeaua arenei Colosseumului, exact acolo unde luptau gladiatorii — un acces special, disponibil doar cu bilete dedicate. Combinat cu o vizită ghidată la Forumul Roman, tura reconstituie, pas cu pas, viața de zi cu zi din Roma Antică.</p>
    <a href="https://www.getyourguide.com/rome-l33/rome-colosseum-gladiator-floor-access-roman-forum-tour-t633431/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă tur-ul — Colosseum și Forumul Roman</a>

    <h3>Paris — Tur în grup mic în interiorul Catedralei Notre-Dame</h3>
    <p>După ani de restaurare, o vizită în interiorul Notre-Dame capătă o greutate aparte — arhitectura gotică, vitraliile și istoria catedralei, explicate de un ghid local, în grupuri mici de maxim 5 persoane, pentru o experiență mult mai personală decât o vizită obișnuită.</p>
    <a href="https://www.getyourguide.com/paris-l16/paris-small-group-interior-tour-of-notre-dame-max-5-people-t607051/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă tur-ul — Interiorul Catedralei Notre-Dame</a>

    <h3>Madrid — Biletul combinat San Antonio de los Alemanes și Mănăstirea San Placido</h3>
    <p>Două dintre cele mai puțin cunoscute, dar spectaculoase, biserici baroce din centrul Madridului — bolți pictate, altare aurite și o liniște rar întâlnită în inima orașului. Un bilet combinat, ideal pentru cine vrea să vadă Madridul dincolo de muzeele mari, aglomerate de turiști.</p>
    <a href="https://www.getyourguide.com/madrid-l46/combo-entry-to-san-antonio-de-los-alemanes-and-the-monastery-of-san-placido-t1103055/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă biletul combinat — Madrid</a>

    <h3>Bratislava — Tur panoramic cu autobuzul</h3>
    <p>Bratislava se lasă descoperită repede și confortabil dintr-un autobuz panoramic — Castelul Bratislava, Poarta lui Mihai și clădirile istorice ale capitalei slovace, toate într-un traseu simplu, fără efort, ideal mai ales dacă ai puțin timp la dispoziție într-un city-break.</p>
    <a href="https://www.getyourguide.com/bratislava-l765/bratislava-sightseeing-bus-tour-t28703/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă tur-ul — Bratislava</a>

    <h3>Lisabona — Muzeul Tezaurului Regal</h3>
    <p>Coroane, bijuterii regale și obiecte de o valoare istorică imensă, expuse într-unul dintre cele mai puțin aglomerate muzee ale Lisabonei. O oprire scurtă, dar spectaculoasă, pentru cine vrea să vadă o altă față a monarhiei portugheze, departe de traseele turistice clasice.</p>
    <a href="https://www.getyourguide.com/lisbon-l42/lisbon-royal-treasure-museum-entry-ticket-t425344/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă biletul — Muzeul Tezaurului Regal, Lisabona</a>

    <h3>Atena — Excursie de o zi la Delphi</h3>
    <p>Delphi, considerat în Antichitate "buricul pământului", găzduia cel mai important oracol al lumii grecești — ruine impresionante, într-un peisaj muntos spectaculos, la câteva ore de Atena. Excursia include audio-ghid în mai multe limbi, ideală pentru cine vrea istorie antică fără bătaia de cap a organizării proprii.</p>
    <a href="https://www.getyourguide.com/athens-l91/from-athens-delphi-day-trip-with-multilingual-audioguide-t748369/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă excursia — Delphi, din Atena</a>

    <h3>Istanbul — Cină și spectacol pe Cornul de Aur și Bosfor</h3>
    <p>O seară pe apă, cu Istanbul luminat de-o parte și de alta a Bosforului — cină la bord, muzică live și dansuri tradiționale, într-o croazieră care combină priveliștea orașului cu o experiență culturală completă. Un final de zi memorabil pentru orice vizită în Istanbul.</p>
    <a href="https://www.getyourguide.com/istanbul-l56/istanbul-golden-horn-bosphorus-dinner-and-show-t459410/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă croaziera cu cină — Istanbul</a>

    <h3>Stockholm — Tur cu barca prin arhipelag</h3>
    <p>Arhipelagul Stockholmului înseamnă peste 30.000 de insule și insulițe, presărate cu căsuțe roșii tradiționale suedeze — un peisaj pe care nu-l vezi din centrul orașului. Un tur cu barca, de câteva ore, deschide o cu totul altă latură a capitalei suedeze, mult mai liniștită și naturală.</p>
    <a href="https://www.getyourguide.com/stockholm-l50/stockholm-archipelago-boat-tour-t811343/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă tur-ul — Arhipelagul Stockholm</a>

    <h3>Konstanz — Bilet de intrare pe Insula Mainau</h3>
    <p>Insula Mainau, pe Lacul Constanța, e cunoscută ca "insula florilor" — grădini botanice impecabile, un castel baroc și priveliști spectaculoase spre Alpi, la granița dintre Germania, Elveția și Austria. Un loc perfect pentru o zi relaxantă, departe de traseele urbane clasice.</p>
    <a href="https://www.getyourguide.com/konstanz-l204/entrance-ticket-for-the-mainau-island-t561436/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă biletul — Insula Mainau, Konstanz</a>

    <h3>Monaco — Tur panoramic Monaco-Monte Carlo (Hop-on Hop-off)</h3>
    <p>Monaco e mic, dar dens în atracții — Palatul Prințiar, celebrul Cazinou din Monte Carlo și circuitul de Formula 1, toate accesibile cu un singur bilet de autobuz panoramic, cu oprire liberă la fiecare punct de interes, în ritmul tău.</p>
    <a href="https://www.getyourguide.com/monaco-l515/monaco-monte-carlo-hop-on-hop-off-bus-tour-t170400/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă tur-ul — Monaco &amp; Monte Carlo</a>

    <h3>München — Tur ghidat cu trotineta electrică, 2 ore, prin cele mai importante obiective</h3>
    <p>O modalitate rapidă și distractivă de a vedea centrul Münchenului — Marienplatz, Frauenkirche, Grădina Engleză și restul reperelor esențiale — pe trotinetă electrică, ghidat, în doar 2 ore. Ideal pentru cine are puțin timp în oraș dar vrea să vadă cât mai mult, fără oboseala mersului pe jos.</p>
    <a href="https://www.getyourguide.com/munich-l26/munchen-top-sights-2h-guided-e-scooter-tour-t463376/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă tur-ul — München cu trotineta electrică</a>

    <h3>Barcelona — Bilet fără coadă la Sagrada Família</h3>
    <p>Sagrada Família e, probabil, cea mai cunoscută operă neterminată din istoria arhitecturii — capodopera lui Gaudí, cu turnuri ce urcă spre cer și vitralii care transformă lumina în interior într-un spectacol de culoare. Un bilet fără coadă îți economisește ore întregi de așteptare, mai ales în sezonul turistic aglomerat.</p>
    <a href="https://www.getyourguide.com/barcelona-l45/sagrada-familia-skip-the-line-ticket-t50027/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă biletul fără coadă — Sagrada Família</a>

    <h3>Veneția — Bilet fără coadă la Bazilica San Marco, cu aplicație audio</h3>
    <p>Bazilica San Marco, cu mozaicurile ei aurii și cupolele bizantine, e inima Veneției — dar și una dintre cele mai vizitate biserici din lume, cu cozi care pot dura ore în plin sezon. Un bilet fără coadă, cu aplicație audio inclusă, te lasă să te bucuri de interior în ritmul tău, fără să pierzi timpul afară, la rând.</p>
    <a href="https://www.getyourguide.com/venice-l35/venice-st-mark-s-basilica-skip-the-line-ticket-audio-app-t395051/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă biletul fără coadă — Bazilica San Marco, Veneția</a>

    <h3>Florența — Muzeul Interactiv Leonardo da Vinci</h3>
    <p>Un muzeu neobișnuit, dedicat integral geniului lui Leonardo da Vinci — machete funcționale, replici ale invențiilor sale mecanice și exponate interactive, pe care le poți atinge și încerca, nu doar privi de la distanță. O oprire distractivă și educativă, potrivită mai ales pentru familii cu copii.</p>
    <a href="https://www.getyourguide.com/florence-l32/florence-leonardo-interactive-museum-entry-ticket-t86558/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă biletul — Muzeul Interactiv Leonardo, Florența</a>

    <h3>Zürich — Muzeul Lindt Home of Chocolate</h3>
    <p>Cea mai mare fântână de ciocolată din lume, procesul complet de fabricare a ciocolatei explicat pas cu pas, și, desigur, degustări — un muzeu dedicat integral pasiunii elvețienilor pentru ciocolată. O experiență dulce, potrivită pentru orice vârstă, la doar câțiva pași de lacul din Zürich.</p>
    <a href="https://www.getyourguide.com/zurich-l55/lindt-home-of-chocolate-museum-entry-ticket-t396265/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă biletul — Lindt Home of Chocolate, Zürich</a>

    <h3>Berlin — Tur cu ricșa, o zi întreagă, cu preluare de la hotel</h3>
    <p>O variantă neobișnuită și relaxantă de a explora Berlinul — pe ricșa electrică, cu un ghid local care combină istoria orașului cu povești și cultură, într-un ritm mult mai lejer decât un tur clasic pe jos. Include preluare directă de la hotel, deci nu trebuie să-ți faci griji cum ajungi la punctul de întâlnire.</p>
    <a href="https://www.getyourguide.com/berlin-l17/full-day-rickshaw-tour-an-adventure-full-of-culture-and-delight-with-hotel-pickup-t856039/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă tur-ul cu ricșa — Berlin</a>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Planifică toată călătoria, dintr-un singur loc</h3>
      <p class="trip-toolkit-subtitle">Înainte de excursii, ai nevoie de zbor, poate și de o mașină — le găsești chiar aici, fără să mai cauți în altă parte.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=ron&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=ro&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Caută bilete de avion</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Caută cazare</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Închiriază o mașină</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="getTransferWidgetBox" data-widget-src="https://tpembd.com/content?trs=565241&shmarker=767825&locale=en&powered_by=false&border_radius=12&plain=true&color_background=%23f6f6f6&color_button=%23F0813A&promo_id=4674&campaign_id=22"><span class="affiliate-cta-text">🚕 Rezervă un transfer</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="getTransferWidgetBox" class="flight-widget-card" style="display:none"></div>
      </div>
      <div class="gyg-search-widget-wrap">
        <div class="gyg-widget" data-gyg-partner-id="LM6J21N" data-gyg-number-of-items="3" data-gyg-locale-code="ro-RO" data-gyg-type="search"></div>
      </div>
    </div>`,
  },
  {
    slug: "castele-europa",
    title: "Cele mai frumoase castele din Europa",
    intro: "12 castele de poveste, din toată Europa, cu bilete și tururi rezervabile din timp",
    body: `
    <p>De la turnurile care au inspirat parcurile Disney, până la fortărețe medievale ascunse în păduri sau cocoțate pe stânci deasupra unor lacuri glaciare — Europa are unele dintre cele mai spectaculoase castele din lume. Am adunat mai jos 12 dintre cele mai frumoase, cu informații practice și bilete rezervabile din timp, ca să eviți cozile la intrare.</p>

    <h2 class="section-title"><span class="bar"></span>Castelele</h2>

    <h3>🇩🇪 Castelul Neuschwanstein, Germania</h3>
    <p>Castelul care a inspirat direct siluetele din parcurile Disney — turnuri albe, zvelte, ridicate pe un vârf stâncos din Alpii bavarezi. Construit de regele Ludwig al II-lea al Bavariei ca o evadare romantică din realitate, Neuschwanstein rămâne cel mai fotografiat castel din Europa, mai ales toamna, când pădurile din jur se colorează.</p>
    <a href="https://www.getyourguide.com/munich-l26/from-munich-neuschwanstein-linderhof-castle-full-day-trip-t1753/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă excursia — Neuschwanstein &amp; Linderhof, din München</a>

    <h3>🇩🇪 Castelul Eltz, Germania</h3>
    <p>Ascuns adânc într-o pădure de lângă râul Mosela, Eltz e unul dintre puținele castele germane care n-a fost niciodată distrus sau cucerit — și e deținut de aceeași familie de peste 850 de ani. Silueta lui, cu turnuri de epoci diferite înghesuite pe o stâncă îngustă, pare desprinsă direct dintr-un basm.</p>
    <a href="https://www.getyourguide.com/frankfurt-l21/frankfurt-day-trip-to-eltz-castle-on-the-moselle-t40707/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă excursia — Castelul Eltz, din Frankfurt</a>

    <h3>🇩🇪 Castelul Hohenzollern, Germania</h3>
    <p>Reședința ancestrală a familiei regale prusace, ridicată impunător pe un vârf izolat, cu priveliști care se întind peste tot sudul Germaniei în zilele senine. Arhitectura neo-gotică din secolul XIX, cu turnuri și creneluri, face din Hohenzollern unul dintre cele mai dramatice castele vizitabile din Europa.</p>
    <a href="https://www.getyourguide.com/sigmaringen-l100350/sigmaringen-hohenzollern-castle-entry-fee-audio-guide-t849245/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă biletul — Castelul Hohenzollern</a>

    <h3>🇷🇴 Castelul Peleș, România</h3>
    <p>Considerat de mulți cel mai frumos castel din România, Peleș a fost reședința de vară a regelui Carol I — o bijuterie neo-renascentistă, cu interioare somptuoase, ridicată chiar la poalele Munților Bucegi, în Sinaia. Fiecare încăpere are propriul stil decorativ, de la mobilier german până la arme orientale.</p>
    <a href="https://www.getyourguide.com/sinaia-l124688/peles-castle-and-bran-castle-entry-tickets-t1414362/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă biletul combinat — Peleș &amp; Bran</a>

    <h3>🇷🇴 Castelul Corvinilor, România</h3>
    <p>O fortăreață gotico-renascentistă impresionantă, ridicată de Iancu de Hunedoara, cu turnuri, poduri suspendate și legende întunecate despre temnițele din interior. Una dintre cele mai bine păstrate cetăți medievale din Europa de Est, și un decor spectaculos mai ales la apus.</p>
    <a href="https://www.getyourguide.com/corvin-castle-l127588/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă biletul — Castelul Corvinilor, Hunedoara</a>

    <h3>🇷🇴 Castelul Bran, România</h3>
    <p>Cunoscut internațional drept "Castelul lui Dracula", datorită legăturii create de romanul lui Bram Stoker, Bran e o fortăreață medievală spectaculoasă, cocoțată pe o stâncă la granița Transilvaniei. Chiar dacă legătura istorică reală cu Vlad Țepeș e discutabilă, atmosfera gotică a locului nu dezamăgește pe nimeni.</p>
    <a href="https://www.getyourguide.com/bran-l188057/bran-castle-dracula-s-castle-entry-ticket-with-audio-guide-t1380614/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă biletul — Castelul Bran</a>

    <h3>🇵🇹 Palatul Pena, Portugalia</h3>
    <p>Un palat romantic, extravagant colorat (roșu, galben, violet), ridicat pe dealurile Sintrei, chiar deasupra norilor în zilele cu ceață. Un amestec eclectic de stiluri — gotic, manuelin, islamic, renascentist — care face din Pena unul dintre cele mai fotogenice palate din întreaga lume, inclus pe lista UNESCO.</p>
    <a href="https://www.getyourguide.com/lisbon-l42/lisbon-sintra-pena-regaleira-cabo-da-roca-cascais-tour-t881398/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă tur-ul — Sintra, Pena &amp; Cascais, din Lisabona</a>

    <h3>🇪🇸 Alcázar din Segovia, Spania</h3>
    <p>Cu silueta lui ascuțită, ca de vas de piatră plutind deasupra orașului, Alcázarul din Segovia e adesea creditat drept una dintre inspirațiile pentru castelul Cenușăresei din parcurile Disney — o rivalitate simpatică cu Neuschwanstein pentru acest titlu. O fortăreață regală medievală, folosită secole la rând de monarhii castilieni.</p>
    <a href="https://www.getyourguide.com/ro-ro/segovia-spania-l1694/din-madrid-excursie-de-o-zi-la-segovia-cu-bilet-de-intrare-la-alcazar-t1402263/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă excursia — Segovia &amp; Alcázar, din Madrid</a>

    <h3>🇫🇷 Château de Chambord, Franța</h3>
    <p>Cel mai mare castel din Valea Loarei, o capodoperă a Renașterii franceze, cu peste 400 de camere și o celebră scară dublu-elicoidală, atribuită uneori chiar lui Leonardo da Vinci. Grădinile și pădurea din jur, întinse pe mii de hectare, fac din Chambord o experiență de-o zi întreagă, nu doar o vizită rapidă.</p>
    <a href="https://www.getyourguide.com/loire-valley-chateaux-l7956/chambord-skip-the-line-chateau-de-chambord-ticket-t183794/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă biletul fără coadă — Château de Chambord</a>

    <h3>🇨🇭 Castelul Chillon, Elveția</h3>
    <p>Un castel-insulă medieval, ridicat direct pe o stâncă din Lacul Geneva, cu Alpii ca fundal — cel mai vizitat monument istoric din Elveția. Poetul Lord Byron l-a făcut celebru în toată lumea prin poemul "Prizonierul din Chillon", inspirat chiar din temnițele văzute în subsolul castelului.</p>
    <a href="https://www.chillon.ch/" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Vezi programul și biletele — Castelul Chillon (site oficial)</a>

    <h3>🇸🇮 Castelul Bled, Slovenia</h3>
    <p>Cel mai vechi castel din Slovenia, ridicat direct pe o stâncă abruptă, la 130 de metri deasupra Lacului Bled — una dintre cele mai fotografiate priveliști din Europa Centrală, cu mica biserică de pe insula din mijlocul lacului vizibilă chiar de la ziduri.</p>
    <a href="https://www.getyourguide.com/en-au/bled-castle-l140261/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă biletul — Castelul Bled</a>

    <h3>🇵🇱 Castelul Malbork, Polonia</h3>
    <p>Cel mai mare castel din lume, măsurat după suprafață — o fortăreață uriașă din cărămidă gotică roșie, ridicată de Ordinul Teutonic pe malul râului Nogat. Inclus pe lista UNESCO, Malbork impresionează prin pura lui scară, greu de sesizat complet decât văzându-l cu ochii tăi.</p>
    <a href="https://www.getyourguide.com/gdansk-l1960/gdansk-malbork-castle-regular-tour-t218583/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă tur-ul — Castelul Malbork, din Gdańsk</a>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Planifică toată călătoria, dintr-un singur loc</h3>
      <p class="trip-toolkit-subtitle">Înainte de castele, ai nevoie de zbor, cazare, poate și de o mașină — le găsești chiar aici.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=ron&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=ro&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Caută bilete de avion</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Caută cazare</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Închiriază o mașină</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="getTransferWidgetBox" data-widget-src="https://tpembd.com/content?trs=565241&shmarker=767825&locale=en&powered_by=false&border_radius=12&plain=true&color_background=%23f6f6f6&color_button=%23F0813A&promo_id=4674&campaign_id=22"><span class="affiliate-cta-text">🚕 Rezervă un transfer</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="getTransferWidgetBox" class="flight-widget-card" style="display:none"></div>
      </div>
    </div>`,
  },
  {
    slug: "parcuri-distractii-europa",
    title: "Cele mai bune parcuri de distracții din Europa",
    intro: "6 parcuri de top, pentru toate vârstele — de la Disneyland Paris până la cele mai intense rollercoastere",
    body: `
    <p>De la parcurile clasice, cu personaje îndrăgite de copii, până la rollercoastere printre cele mai înalte din lume — Europa are parcuri de distracții pentru orice vârstă și orice nivel de adrenalină. Am grupat mai jos câteva dintre cele mai apreciate, pe categorii, cu bilete rezervabile din timp.</p>

    <h2 class="section-title"><span class="bar"></span>👑 Cele mai populare și vizitate (toate vârstele)</h2>

    <h3>🇫🇷 Disneyland Paris, Franța</h3>
    <p>Cel mai vizitat parc de distracții din Europa — două parcuri tematice complete (Disneyland Park și Walt Disney Studios), unde copiii își pot întâlni personajele preferate din desenele animate, printre castele, parăzi și spectacole zilnice. O experiență completă, ideală pentru o vacanță de 2-3 zile.</p>
    <a href="https://www.getyourguide.com/paris-l16/disneyland-paris-2-parks-ticket-1-2-3-4-5-day-t395320/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă biletul — Disneyland Paris</a>

    <h3>🇩🇪 Europa-Park, Rust, Germania</h3>
    <p>Al doilea cel mai mare parc de distracții din Europa, structurat pe 18 zone tematice, fiecare dedicată unei țări europene. Are 13 rollercoastere spectaculoase, zone blânde pentru cei mici, spectacole zilnice și un parc acvatic masiv (Rulantica) — practic o vacanță completă într-un singur loc.</p>
    <a href="https://www.getyourguide.com/rust-l2882/rust-europa-park-entrance-ticket-t393563/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă biletul — Europa-Park, Rust</a>

    <h2 class="section-title"><span class="bar"></span>🧸 Cele mai bune pentru copii mici și preșcolari</h2>

    <h3>🇳🇱 Efteling, Kaatsheuvel, Țările de Jos</h3>
    <p>Un parc de poveste, faimos pentru atmosfera lui relaxantă din Pădurea Fermecată — personaje din basmele fraților Grimm, cărări pline de verdeață și un ritm mult mai blând decât parcurile axate pe adrenalină. Ideal pentru copiii mici, care se lasă cu ușurință purtați de magia locului.</p>
    <a href="https://www.getyourguide.com/amsterdam-l36/amsterdam-efteling-park-roundtrip-transfer-and-entry-ticket-t501550/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă biletul (cu transfer) — Efteling, din Amsterdam</a>

    <h3>🇩🇰 Legoland Billund, Danemarca</h3>
    <p>Parcul Legoland original, construit special pentru familiile cu copii mici — mini-orașe spectaculoase construite integral din piese Lego, carusele interactive și activități gândite să stimuleze creativitatea, nu doar adrenalina. Un loc unde și părinții se joacă la fel de mult ca cei mici.</p>
    <a href="https://www.getyourguide.com/billund-l87275/legoland-billund-entry-ticket-private-transfer-t1427002/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă biletul (cu transfer) — Legoland Billund</a>

    <h2 class="section-title"><span class="bar"></span>🎢 Cele mai bune pentru aventură și adrenalină (copii mai mari)</h2>

    <h3>🇮🇹 Gardaland, Castelnuovo del Garda, Italia</h3>
    <p>Situat chiar lângă splendidul Lac Garda, Gardaland îmbină rollercoastere intense (precum Oblivion sau Raptor) cu o zonă dedicată celor mici (Peppa Pig Land) — un echilibru rar întâlnit între adrenalină pentru adolescenți și distracție pentru toată familia, în același parc.</p>
    <a href="https://www.getyourguide.com/garda-l145126/gardaland-park-fixed-day-entry-ticket-t225588/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă biletul — Gardaland</a>

    <h3>🇵🇱 Energylandia, Zator, Polonia</h3>
    <p>Cel mai mare parc de distracții din Polonia, recunoscut la nivel european pentru numărul uriaș de rollercoastere moderne — inclusiv Zadra, unul dintre cele mai înalte rollercoastere hibride din lume. Are și o zonă acvatică imensă, plus zone special gândite pentru cei mici, deci nu e doar pentru pasionații de adrenalină.</p>
    <a href="https://www.getyourguide.com/krakow-l40/krakow-energylandia-full-day-ticket-with-optional-pickup-t114202/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rezervă biletul (cu preluare opțională) — Energylandia, din Kraków</a>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Planifică toată călătoria, dintr-un singur loc</h3>
      <p class="trip-toolkit-subtitle">Înainte de parc, ai nevoie de zbor, cazare, poate și de o mașină — le găsești chiar aici.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=ron&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=ro&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Caută bilete de avion</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Caută cazare</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Închiriază o mașină</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="getTransferWidgetBox" data-widget-src="https://tpembd.com/content?trs=565241&shmarker=767825&locale=en&powered_by=false&border_radius=12&plain=true&color_background=%23f6f6f6&color_button=%23F0813A&promo_id=4674&campaign_id=22"><span class="affiliate-cta-text">🚕 Rezervă un transfer</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="getTransferWidgetBox" class="flight-widget-card" style="display:none"></div>
      </div>
    </div>`,
  },
]

exports.TRAVEL_GUIDES_EN = [
  {
    slug: "transport",
    title: "How to get to the big tourist sights, efficiently",
    intro: "Urban and regional transport guide",
    body: `
    <p>A good itinerary depends a lot on how you move between sights. When you want to visit museums, castles, or historic monuments, the connection between cities and the local logistics make the difference between a relaxed day and one lost in stations and stops.</p>
    <p>For long distances or between historic regions, trains remain the most popular option — Europe's rail network connects most capitals with smaller towns, often along scenic routes. Coaches fill in the gaps well, especially toward towns or mountain areas trains don't reach directly, and usually cost less.</p>
    <p>If you land at the airport with a lot of luggage or travel as a group, a pre-booked private transfer removes the hassle of switching between modes of transport — it takes you straight from the terminal to the castle gate or the hotel. Planning these connections ahead is what turns a hectic trip into a stress-free one.</p>
    <div class="plan-visit-block" style="display:block">
      ${TRAVEL_GUIDES_MONETIZATION_READY
        ? `
      <a href="${escapeHtml(getTransferLinkFor())}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking-alt">🚕 Book a private transfer</a>`
        : `<p class="plan-visit-hint">${comingSoonTextFor("uk")}</p>`}
    </div>`,
  },
  {
    slug: "parking",
    title: "How to handle parking near historic areas",
    intro: "A driver's guide to parking in old town centres",
    body: `
    <p>Driving your own or a rental car gives you a freedom of movement other transport modes can't match — but historic city centres are known for traffic restrictions and a chronic shortage of parking.</p>
    <p>Leaving your car just anywhere risks a fine, or even a tow. The safest option remains a secure, privately-run underground or above-ground car park — many let you book a spot ahead of time, which matters most on weekends or during peak season, when the sights are busiest.</p>
    <p>A well-chosen car park, a short walk from the museum or the old town, leaves you free to explore at your own pace, without worrying about the car. Check availability ahead of time and book online — it's worth it, especially on a busy weekend.</p>
    <div class="plan-visit-block" style="display:block">
      ${TRAVEL_GUIDES_MONETIZATION_READY
        ? `<a href="https://www.awin1.com/cread.php?awinmid=18633&awinaffid=3051943&campaign=Your%20Parking%20Space&ued=https%3A%2F%2Fwww.yourparkingspace.co.uk%2F" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking">🅿️ UK Parking — book a spot in advance</a>
      <p class="plan-visit-hint">🅿️ EU Parking — coming soon</p>`
        : `<p class="plan-visit-hint">${comingSoonTextFor("uk")}</p>`}
    </div>`,
  },
  {
    slug: "restaurants",
    title: "How to plan a perfect day out",
    intro: "Matching opening hours with meal times",
    body: `
    <p>A great day out is about balancing culture and rest. If you build your day around a museum's or a gallery's hours, it's worth planning your meal breaks in advance too — otherwise you risk showing up hungry right when every place nearby is full.</p>
    <p>Major sights draw thousands of visitors daily, and the areas around them get busy fast, especially at lunch and dinner. Booking ahead through an online platform guarantees you a table without queueing or scrambling for a free spot at the last minute.</p>
    <p>The most efficient pattern: visit exhibitions early in the morning, when it's quiet, then close the day with a meal booked in advance at a local restaurant — a simple day out becomes a memory worth keeping.</p>
    <div class="plan-visit-block" style="display:block">
      ${TRAVEL_GUIDES_MONETIZATION_READY
        ? `<a href="${escapeHtml(linkTheForkAffiliate || "https://www.thefork.com/")}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-booking">🍽️ Search on TheFork (France, Italy, Spain)</a>
      <a href="${escapeHtml(linkOpenTableAffiliate || "https://www.opentable.com/")}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking-alt">🍽️ Search on OpenTable (UK, Germany)</a>`
        : `<p class="plan-visit-hint">${comingSoonTextFor("uk")}</p>`}
    </div>`,
  },
  {
    slug: "flights",
    title: "How to find the best flight tickets",
    intro: "Flight search guide, with real-time price comparison",
    body: `
    <p>The flight is usually the biggest expense in a trip — and the easiest one to optimise, if you know where to look. Price differences between airlines, between days of the week, or between nearby airports can add up to hundreds of euros for the same destination.</p>
    <p>A comparator that searches dozens of airlines at once (including low-cost carriers) shows you the cheapest option at a glance, no matter who operates it — much faster than checking every airline's site by hand.</p>
    <p>Search directly below, without leaving the page — enter your departure city and destination, and results appear in real time, with up-to-date prices.</p>
    <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=eur&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Search flight tickets</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>`,
  },
  {
    slug: "airport-transfer",
    title: "How to book a safe airport transfer",
    intro: "Book a private transfer or shuttle from the airport, at a fixed price",
    body: `
    <p>Landing in a new city, the last thing you want is to hunt for a random taxi or haggle over the price with a driver you don't know. A pre-booked transfer has a fixed price, a confirmed driver, and waits for you right at landing time — no surprises, no stress.</p>
    <p>Booking ahead is usually cheaper than a taxi picked up on the spot, and it removes any risk of getting stuck at the airport if your flight is delayed.</p>
    <p>Tap below to search and book your transfer, directly on the partner's platform.</p>
    <a href="https://intui.tpk.lu/xynzx1LU" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚕 Book your airport transfer</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>`,
  },
  {
    slug: "day-trips-tours-europe",
    title: "The best day trips and guided tours in Europe",
    intro: "13 top tours, across Europe, with tickets and slots you can book ahead",
    body: `
    <p>A tour booked ahead means a guaranteed spot, a confirmed guide, and often access to places where you'd otherwise queue for hours. Below are some of the most popular day trips and tours in Europe's major cities — from boat rides on the Danube, to routes through the ancient history of Rome or Athens.</p>

    <h2 class="section-title"><span class="bar"></span>Recommended tours</h2>

    <h3>Bucharest — Snagov Monastery, Mogoșoaia Palace and Slănic Salt Mine</h3>
    <p>A perfect day trip for anyone who wants to see, in one single route, three completely different sides of the area around Bucharest: the quiet of Snagov Monastery's island, the elegance of Mogoșoaia Palace, and the impressive Slănic Salt Mine, carved deep into the mountain. Ideal if you only have one free day in the capital and want to escape the city's bustle.</p>
    <a href="https://www.getyourguide.com/slanic-l91935/snagov-monastery-mogosoaia-salt-mine-day-trip-bucharest-t1221626/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the tour — Snagov, Mogoșoaia and Slănic Salt Mine</a>

    <h3>Bucharest — Danube Delta day trip</h3>
    <p>The Danube Delta is one of Europe's most spectacular nature reserves, with unique biodiversity — pelicans, cormorants and hundreds of bird species, among narrow channels and fishing villages. A day trip from Bucharest, transport included, is the simplest way to catch the Delta's atmosphere without organising your own transport.</p>
    <a href="https://www.getyourguide.com/bucharest-l111/from-bucharest-day-trip-to-danube-delta-t662170/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the tour — Danube Delta</a>

    <h3>Vienna — Danube river cruise, with optional lunch</h3>
    <p>Vienna seen from the water tells a completely different story — historic bridges, imperial buildings and green parks, all drifting past along the Danube's banks. A relaxing cruise, with an optional lunch on board, is a welcome break after a morning of walking through the historic centre.</p>
    <a href="https://www.getyourguide.com/vienna-l7/vienna-city-cruise-with-optional-lunch-t58823/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the cruise — Vienna</a>

    <h3>Budapest — Evening Danube sightseeing cruise</h3>
    <p>Budapest lit up at night is, for many, the most beautiful urban skyline in Central Europe — the Parliament, the Chain Bridge and Buda Castle, all glowing along the Danube's banks. An evening cruise is the classic, almost mandatory way to see the city from just the right angle.</p>
    <a href="https://www.getyourguide.com/budapest-l29/budapest-evening-sightseeing-cruise-on-the-danube-t1117141/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the cruise — Budapest</a>

    <h3>Amsterdam — Bruges day trip</h3>
    <p>Bruges is considered one of Europe's best-preserved medieval towns — canals, stone bridges and Gothic buildings, all packed into a compact historic centre that's easy to explore on foot. A day trip from Amsterdam, with an English or Spanish-speaking guide, is the simple choice for anyone who doesn't want to complicate their own transport.</p>
    <a href="https://www.getyourguide.com/amsterdam-l36/from-amsterdam-bruges-day-tour-in-spanish-or-english-t2633/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program&cmp=amsterdam" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the tour — Bruges, from Amsterdam</a>

    <h3>The Hague — Entry ticket to the Panorama Mesdag Museum</h3>
    <p>Panorama Mesdag is a huge circular painting from 1881, which completely surrounds the visitor with a view of the 19th-century fishing village of Scheveningen — a unique visual experience, hard to imagine until you see it with your own eyes. A small but spectacular museum, just a few steps from the centre of The Hague.</p>
    <a href="https://www.getyourguide.com/the-hague-l1267/the-hague-entry-ticket-to-the-panorama-mesdag-museum-t391318/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the ticket — Panorama Mesdag Museum, The Hague</a>

    <h3>Prague — Vyšehrad Fort, the city's hidden gem</h3>
    <p>While most tourists crowd into Prague Castle, Vyšehrad remains a much quieter choice — a historic fortress on the banks of the Vltava, with superb views and a cemetery where great Czech figures are buried. A perfect spot for anyone who wants Prague without the crowds.</p>
    <a href="https://www.getyourguide.com/prague-l10/prague-s-best-hidden-gem-vysehrad-castle-historic-fort-t1011583/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the tour — Vyšehrad Fort, Prague</a>

    <h3>Rome — Colosseum with arena floor access and the Roman Forum</h3>
    <p>Few visitors ever get to stand on the actual floor of the Colosseum's arena, right where gladiators once fought — special access, available only with dedicated tickets. Combined with a guided visit to the Roman Forum, the tour reconstructs, step by step, everyday life in Ancient Rome.</p>
    <a href="https://www.getyourguide.com/rome-l33/rome-colosseum-gladiator-floor-access-roman-forum-tour-t633431/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the tour — Colosseum and Roman Forum</a>

    <h3>Paris — Small group tour inside Notre-Dame Cathedral</h3>
    <p>After years of restoration, a visit inside Notre-Dame carries special weight — Gothic architecture, stained glass and the cathedral's history, explained by a local guide, in small groups of up to 5 people, for a far more personal experience than an ordinary visit.</p>
    <a href="https://www.getyourguide.com/paris-l16/paris-small-group-interior-tour-of-notre-dame-max-5-people-t607051/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the tour — Inside Notre-Dame Cathedral</a>

    <h3>Madrid — Combo ticket: San Antonio de los Alemanes and the Monastery of San Placido</h3>
    <p>Two of Madrid's lesser-known but spectacular Baroque churches — painted vaults, gilded altars and a rare stillness in the heart of the city. A combo ticket, ideal for anyone who wants to see Madrid beyond its big, crowded museums.</p>
    <a href="https://www.getyourguide.com/madrid-l46/combo-entry-to-san-antonio-de-los-alemanes-and-the-monastery-of-san-placido-t1103055/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the combo ticket — Madrid</a>

    <h3>Bratislava — Panoramic bus tour</h3>
    <p>Bratislava reveals itself quickly and comfortably from a panoramic bus — Bratislava Castle, Michael's Gate and the historic buildings of the Slovak capital, all on one simple, effortless route, ideal especially if you're short on time during a city break.</p>
    <a href="https://www.getyourguide.com/bratislava-l765/bratislava-sightseeing-bus-tour-t28703/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the tour — Bratislava</a>

    <h3>Lisbon — Royal Treasure Museum</h3>
    <p>Crowns, royal jewels and objects of immense historical value, displayed in one of Lisbon's least crowded museums. A short but spectacular stop, for anyone who wants to see another side of the Portuguese monarchy, away from the classic tourist trails.</p>
    <a href="https://www.getyourguide.com/lisbon-l42/lisbon-royal-treasure-museum-entry-ticket-t425344/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the ticket — Royal Treasure Museum, Lisbon</a>

    <h3>Athens — Delphi day trip</h3>
    <p>Delphi, considered in antiquity the "navel of the earth", hosted the most important oracle of the Greek world — impressive ruins, in a spectacular mountain landscape, a few hours from Athens. The tour includes a multilingual audio guide, ideal for anyone who wants ancient history without the hassle of organising it themselves.</p>
    <a href="https://www.getyourguide.com/athens-l91/from-athens-delphi-day-trip-with-multilingual-audioguide-t748369/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the tour — Delphi, from Athens</a>

    <h3>Istanbul — Golden Horn and Bosphorus dinner and show cruise</h3>
    <p>An evening on the water, with Istanbul lit up on both sides of the Bosphorus — dinner on board, live music and traditional dance, on a cruise that combines the city's view with a full cultural experience. A memorable way to close out any visit to Istanbul.</p>
    <a href="https://www.getyourguide.com/istanbul-l56/istanbul-golden-horn-bosphorus-dinner-and-show-t459410/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the dinner cruise — Istanbul</a>

    <h3>Stockholm — Archipelago boat tour</h3>
    <p>Stockholm's archipelago means over 30,000 islands and islets, dotted with traditional red Swedish cottages — a landscape you simply don't see from the city centre. A boat tour lasting a few hours opens up a completely different side of the Swedish capital, much quieter and more natural.</p>
    <a href="https://www.getyourguide.com/stockholm-l50/stockholm-archipelago-boat-tour-t811343/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the tour — Stockholm Archipelago</a>

    <h3>Konstanz — Entrance ticket for Mainau Island</h3>
    <p>Mainau Island, on Lake Constance, is known as the "island of flowers" — immaculate botanical gardens, a Baroque castle and spectacular views towards the Alps, at the border between Germany, Switzerland and Austria. A perfect spot for a relaxing day, away from the usual urban trails.</p>
    <a href="https://www.getyourguide.com/konstanz-l204/entrance-ticket-for-the-mainau-island-t561436/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the ticket — Mainau Island, Konstanz</a>

    <h3>Monaco — Monaco-Monte Carlo panoramic tour (Hop-on Hop-off)</h3>
    <p>Monaco is small but packed with sights — the Prince's Palace, the famous Monte Carlo Casino and the Formula 1 circuit, all accessible with a single panoramic bus ticket, with free stops at every point of interest, at your own pace.</p>
    <a href="https://www.getyourguide.com/monaco-l515/monaco-monte-carlo-hop-on-hop-off-bus-tour-t170400/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the tour — Monaco &amp; Monte Carlo</a>

    <h3>Munich — Guided e-scooter tour, 2 hours, through the top sights</h3>
    <p>A fast and fun way to see central Munich — Marienplatz, the Frauenkirche, the English Garden and the rest of the essential landmarks — on a guided e-scooter, in just 2 hours. Ideal for anyone with little time in the city who still wants to see as much as possible, without the fatigue of walking.</p>
    <a href="https://www.getyourguide.com/munich-l26/munchen-top-sights-2h-guided-e-scooter-tour-t463376/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the tour — Munich e-scooter tour</a>

    <h3>Barcelona — Skip-the-line ticket for Sagrada Família</h3>
    <p>Sagrada Família is arguably the most famous unfinished work in architectural history — Gaudí's masterpiece, with towers reaching for the sky and stained glass that turns the light inside into a display of colour. A skip-the-line ticket saves you hours of waiting, especially during the busy tourist season.</p>
    <a href="https://www.getyourguide.com/barcelona-l45/sagrada-familia-skip-the-line-ticket-t50027/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the skip-the-line ticket — Sagrada Família</a>

    <h3>Venice — Skip-the-line ticket for St Mark's Basilica, with audio app</h3>
    <p>St Mark's Basilica, with its golden mosaics and Byzantine domes, is the heart of Venice — but also one of the most visited churches in the world, with queues that can last hours in peak season. A skip-the-line ticket, with an audio app included, lets you enjoy the interior at your own pace, without wasting time waiting outside.</p>
    <a href="https://www.getyourguide.com/venice-l35/venice-st-mark-s-basilica-skip-the-line-ticket-audio-app-t395051/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the skip-the-line ticket — St Mark's Basilica, Venice</a>

    <h3>Florence — Leonardo da Vinci Interactive Museum</h3>
    <p>An unusual museum, entirely dedicated to the genius of Leonardo da Vinci — working models, replicas of his mechanical inventions, and interactive exhibits you can touch and try, not just view from a distance. A fun and educational stop, especially suited for families with children.</p>
    <a href="https://www.getyourguide.com/florence-l32/florence-leonardo-interactive-museum-entry-ticket-t86558/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the ticket — Leonardo Interactive Museum, Florence</a>

    <h3>Zürich — Lindt Home of Chocolate Museum</h3>
    <p>The world's largest chocolate fountain, the full chocolate-making process explained step by step, and, of course, tastings — a museum entirely dedicated to the Swiss passion for chocolate. A sweet experience, suitable for any age, just a few steps from Lake Zürich.</p>
    <a href="https://www.getyourguide.com/zurich-l55/lindt-home-of-chocolate-museum-entry-ticket-t396265/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the ticket — Lindt Home of Chocolate, Zürich</a>

    <h3>Berlin — Full-day rickshaw tour, with hotel pickup</h3>
    <p>An unusual and relaxing way to explore Berlin — by electric rickshaw, with a local guide who blends the city's history with stories and culture, at a much more leisurely pace than a classic walking tour. Includes direct hotel pickup, so you don't need to worry about getting to a meeting point.</p>
    <a href="https://www.getyourguide.com/berlin-l17/full-day-rickshaw-tour-an-adventure-full-of-culture-and-delight-with-hotel-pickup-t856039/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the rickshaw tour — Berlin</a>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Plan your whole trip, in one place</h3>
      <p class="trip-toolkit-subtitle">Need flights, accommodation, a car or a transfer? Find them all right here.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=eur&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Search flight tickets</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Search accommodation</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Rent a car</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://intui.tpk.lu/xynzx1LU" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚕 Book a transfer</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
      </div>
      <div class="gyg-search-widget-wrap">
        <div class="gyg-widget" data-gyg-partner-id="LM6J21N" data-gyg-number-of-items="3" data-gyg-locale-code="en-US" data-gyg-type="search"></div>
      </div>
    </div>`,
  },
  {
    slug: "castles-europe",
    title: "The most beautiful castles in Europe",
    intro: "12 fairytale castles, across Europe, with tickets and tours you can book ahead",
    body: `
    <p>From the towers that inspired the Disney parks, to medieval fortresses hidden in forests or perched on cliffs above glacial lakes — Europe has some of the most spectacular castles in the world. Below are 12 of the most beautiful, with practical information and tickets you can book ahead, so you can skip the queue at the entrance.</p>

    <h2 class="section-title"><span class="bar"></span>The castles</h2>

    <h3>🇩🇪 Neuschwanstein Castle, Germany</h3>
    <p>The castle that directly inspired the silhouettes in the Disney parks — slender white towers, raised on a rocky peak in the Bavarian Alps. Built by King Ludwig II of Bavaria as a romantic escape from reality, Neuschwanstein remains Europe's most photographed castle, especially in autumn, when the surrounding forests turn to colour.</p>
    <a href="https://www.getyourguide.com/munich-l26/from-munich-neuschwanstein-linderhof-castle-full-day-trip-t1753/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the tour — Neuschwanstein &amp; Linderhof, from Munich</a>

    <h3>🇩🇪 Eltz Castle, Germany</h3>
    <p>Hidden deep in a forest near the Moselle river, Eltz is one of the few German castles never destroyed or conquered — and it's been owned by the same family for over 850 years. Its silhouette, with towers from different eras crowded onto a narrow rock, looks straight out of a fairy tale.</p>
    <a href="https://www.getyourguide.com/frankfurt-l21/frankfurt-day-trip-to-eltz-castle-on-the-moselle-t40707/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the tour — Eltz Castle, from Frankfurt</a>

    <h3>🇩🇪 Hohenzollern Castle, Germany</h3>
    <p>The ancestral seat of the Prussian royal family, standing proudly on an isolated peak, with views stretching across all of southern Germany on clear days. Its 19th-century neo-Gothic architecture, with towers and battlements, makes Hohenzollern one of the most dramatic castles you can visit in Europe.</p>
    <a href="https://www.getyourguide.com/sigmaringen-l100350/sigmaringen-hohenzollern-castle-entry-fee-audio-guide-t849245/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the ticket — Hohenzollern Castle</a>

    <h3>🇷🇴 Peleș Castle, Romania</h3>
    <p>Considered by many the most beautiful castle in Romania, Peleș was the summer residence of King Carol I — a Neo-Renaissance gem, with lavish interiors, built right at the foot of the Bucegi Mountains, in Sinaia. Each room has its own decorative style, from German furniture to Oriental weapons.</p>
    <a href="https://www.getyourguide.com/sinaia-l124688/peles-castle-and-bran-castle-entry-tickets-t1414362/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the combo ticket — Peleș &amp; Bran</a>

    <h3>🇷🇴 Corvin Castle, Romania</h3>
    <p>An impressive Gothic-Renaissance fortress, built by John Hunyadi, with towers, suspended bridges and dark legends about the dungeons inside. One of the best-preserved medieval fortresses in Eastern Europe, and a spectacular sight especially at sunset.</p>
    <a href="https://www.getyourguide.com/corvin-castle-l127588/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the ticket — Corvin Castle, Hunedoara</a>

    <h3>🇷🇴 Bran Castle, Romania</h3>
    <p>Known internationally as "Dracula's Castle", thanks to the link created by Bram Stoker's novel, Bran is a spectacular medieval fortress, perched on a cliff at the edge of Transylvania. Even though the real historical link to Vlad the Impaler is debatable, the place's Gothic atmosphere disappoints no one.</p>
    <a href="https://www.getyourguide.com/bran-l188057/bran-castle-dracula-s-castle-entry-ticket-with-audio-guide-t1380614/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the ticket — Bran Castle</a>

    <h3>🇵🇹 Pena Palace, Portugal</h3>
    <p>A romantic palace, extravagantly coloured (red, yellow, purple), built on the hills of Sintra, right above the clouds on foggy days. An eclectic mix of styles — Gothic, Manueline, Islamic, Renaissance — that makes Pena one of the most photogenic palaces in the world, a UNESCO World Heritage Site.</p>
    <a href="https://www.getyourguide.com/lisbon-l42/lisbon-sintra-pena-regaleira-cabo-da-roca-cascais-tour-t881398/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the tour — Sintra, Pena &amp; Cascais, from Lisbon</a>

    <h3>🇪🇸 Alcázar of Segovia, Spain</h3>
    <p>With its sharp silhouette, like a stone ship floating above the city, the Alcázar of Segovia is often credited as one of the inspirations for Cinderella's castle in the Disney parks — a friendly rivalry with Neuschwanstein for that title. A medieval royal fortress, used for centuries by Castilian monarchs.</p>
    <a href="https://www.getyourguide.com/ro-ro/segovia-spania-l1694/din-madrid-excursie-de-o-zi-la-segovia-cu-bilet-de-intrare-la-alcazar-t1402263/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the tour — Segovia &amp; Alcázar, from Madrid</a>

    <h3>🇫🇷 Château de Chambord, France</h3>
    <p>The largest château in the Loire Valley, a masterpiece of the French Renaissance, with over 400 rooms and a famous double-helix staircase, sometimes attributed to Leonardo da Vinci himself. The surrounding gardens and forest, spanning thousands of hectares, make Chambord a full day's experience, not just a quick visit.</p>
    <a href="https://www.getyourguide.com/loire-valley-chateaux-l7956/chambord-skip-the-line-chateau-de-chambord-ticket-t183794/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the skip-the-line ticket — Château de Chambord</a>

    <h3>🇨🇭 Chillon Castle, Switzerland</h3>
    <p>A medieval island castle, built right on a rock on Lake Geneva, with the Alps as a backdrop — Switzerland's most visited historic monument. The poet Lord Byron made it world-famous through his poem "The Prisoner of Chillon", inspired by the dungeons found in the castle's basement.</p>
    <a href="https://www.chillon.ch/" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">See the schedule and tickets — Chillon Castle (official site)</a>

    <h3>🇸🇮 Bled Castle, Slovenia</h3>
    <p>The oldest castle in Slovenia, built right on a steep cliff, 130 metres above Lake Bled — one of the most photographed views in Central Europe, with the small church on the island in the middle of the lake visible right from its walls.</p>
    <a href="https://www.getyourguide.com/en-au/bled-castle-l140261/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the ticket — Bled Castle</a>

    <h3>🇵🇱 Malbork Castle, Poland</h3>
    <p>The largest castle in the world by surface area — a huge fortress of red Gothic brick, built by the Teutonic Order on the banks of the Nogat river. A UNESCO World Heritage Site, Malbork impresses with its sheer scale, hard to fully grasp until you see it with your own eyes.</p>
    <a href="https://www.getyourguide.com/gdansk-l1960/gdansk-malbork-castle-regular-tour-t218583/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the tour — Malbork Castle, from Gdańsk</a>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Plan your whole trip, in one place</h3>
      <p class="trip-toolkit-subtitle">Need flights, accommodation, a car or a transfer? Find them all right here.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=eur&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Search flight tickets</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Search accommodation</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Rent a car</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://intui.tpk.lu/xynzx1LU" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚕 Book a transfer</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
      </div>
    </div>`,
  },
  {
    slug: "amusement-parks-europe",
    title: "The best amusement parks in Europe",
    intro: "6 top parks, for all ages \u2014 from Disneyland Paris to the most intense rollercoasters",
    body: `
    <p>From classic parks with characters children love, to some of the tallest rollercoasters in the world — Europe has amusement parks for every age and every level of thrill-seeking. Below are some of the most popular, grouped by category, with tickets you can book ahead.</p>

    <h2 class="section-title"><span class="bar"></span>👑 Most popular and most visited (all ages)</h2>

    <h3>🇫🇷 Disneyland Paris, France</h3>
    <p>Europe's most visited amusement park — two full theme parks (Disneyland Park and Walt Disney Studios), where children can meet their favourite cartoon characters, among castles, parades and daily shows. A complete experience, ideal for a 2-3 day holiday.</p>
    <a href="https://www.getyourguide.com/paris-l16/disneyland-paris-2-parks-ticket-1-2-3-4-5-day-t395320/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the ticket — Disneyland Paris</a>

    <h3>🇩🇪 Europa-Park, Rust, Germany</h3>
    <p>Europe's second-largest amusement park, structured across 18 themed areas, each dedicated to a European country. It has 13 spectacular rollercoasters, gentle areas for younger kids, daily shows and a massive water park (Rulantica) — essentially a complete holiday in one place.</p>
    <a href="https://www.getyourguide.com/rust-l2882/rust-europa-park-entrance-ticket-t393563/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the ticket — Europa-Park, Rust</a>

    <h2 class="section-title"><span class="bar"></span>🧸 Best for toddlers and preschoolers</h2>

    <h3>🇳🇱 Efteling, Kaatsheuvel, Netherlands</h3>
    <p>A fairy-tale park, famous for the relaxing atmosphere of its Fairytale Forest — characters from the Brothers Grimm's tales, paths full of greenery and a pace far gentler than thrill-focused parks. Ideal for young children, who easily fall under the spell of the place.</p>
    <a href="https://www.getyourguide.com/amsterdam-l36/amsterdam-efteling-park-roundtrip-transfer-and-entry-ticket-t501550/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the ticket (with transfer) — Efteling, from Amsterdam</a>

    <h3>🇩🇰 Legoland Billund, Denmark</h3>
    <p>The original Legoland park, built specifically for families with young children — spectacular mini-cities built entirely from Lego bricks, interactive rides and activities designed to spark creativity, not just thrills. A place where parents play just as much as the little ones.</p>
    <a href="https://www.getyourguide.com/billund-l87275/legoland-billund-entry-ticket-private-transfer-t1427002/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the ticket (with transfer) — Legoland Billund</a>

    <h2 class="section-title"><span class="bar"></span>🎢 Best for adventure and thrills (older kids)</h2>

    <h3>🇮🇹 Gardaland, Castelnuovo del Garda, Italy</h3>
    <p>Right next to the splendid Lake Garda, Gardaland combines intense rollercoasters (like Oblivion or Raptor) with an area dedicated to little ones (Peppa Pig Land) — a rare balance between thrills for teenagers and fun for the whole family, in the same park.</p>
    <a href="https://www.getyourguide.com/garda-l145126/gardaland-park-fixed-day-entry-ticket-t225588/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the ticket — Gardaland</a>

    <h3>🇵🇱 Energylandia, Zator, Poland</h3>
    <p>Poland's largest amusement park, recognised across Europe for its huge number of modern rollercoasters — including Zadra, one of the tallest hybrid rollercoasters in the world. It also has a massive water area, plus zones specially designed for younger kids, so it's not just for thrill-seekers.</p>
    <a href="https://www.getyourguide.com/krakow-l40/krakow-energylandia-full-day-ticket-with-optional-pickup-t114202/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Book the ticket (with optional pickup) — Energylandia, from Kraków</a>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Plan your whole trip, in one place</h3>
      <p class="trip-toolkit-subtitle">Need flights, accommodation, a car or a transfer? Find them all right here.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=eur&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Search flight tickets</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Search accommodation</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Rent a car</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://intui.tpk.lu/xynzx1LU" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚕 Book a transfer</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
      </div>
    </div>`,
  },
]

exports.TRAVEL_GUIDES_DE = [
  {
    slug: "transport",
    title: "So kommst du effizient zu den großen Sehenswürdigkeiten",
    intro: "Leitfaden für den städtischen und regionalen Transport",
    body: `
    <p>Eine gelungene Reiseroute hängt stark davon ab, wie du dich zwischen den Sehenswürdigkeiten bewegst. Wenn du Museen, Schlösser oder historische Denkmäler besuchen möchtest, machen die Verbindung zwischen den Städten und die lokale Logistik den Unterschied zwischen einem entspannten Tag und einem, der in Bahnhöfen und Haltestellen verloren geht.</p>
    <p>Für lange Strecken oder zwischen historischen Regionen bleibt der Zug die beliebteste Option — das europäische Schienennetz verbindet die meisten Hauptstädte mit kleineren Städten, oft auf landschaftlich reizvollen Strecken. Busse füllen die Lücken gut, besonders in Richtung Orte oder Bergregionen, die der Zug nicht direkt erreicht, und kosten meist weniger.</p>
    <p>Wenn du mit viel Gepäck am Flughafen landest oder in der Gruppe reist, erspart dir ein vorgebuchter privater Transfer den Ärger des Umsteigens zwischen Verkehrsmitteln — er bringt dich direkt vom Terminal zum Schlosstor oder zum Hotel. Diese Verbindungen im Voraus zu planen, macht aus einer hektischen Reise eine stressfreie.</p>
    <div class="plan-visit-block" style="display:block">
      ${TRAVEL_GUIDES_MONETIZATION_READY
        ? `
      <a href="${escapeHtml(getTransferLinkFor())}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking-alt">🚕 Einen privaten Transfer buchen</a>`
        : `<p class="plan-visit-hint">${comingSoonTextFor("de")}</p>`}
    </div>`,
  },
  {
    slug: "parking",
    title: "So gehst du mit dem Parken in der Nähe historischer Gebiete um",
    intro: "Ein Leitfaden für Autofahrer — Parken in Altstädten",
    body: `
    <p>Mit dem eigenen oder einem Mietwagen hast du eine Bewegungsfreiheit, die andere Verkehrsmittel nicht bieten können — aber historische Stadtzentren sind bekannt für Verkehrsbeschränkungen und einen chronischen Mangel an Parkplätzen.</p>
    <p>Wer das Auto irgendwo abstellt, riskiert ein Bußgeld oder sogar das Abschleppen. Die sicherste Option bleibt ein gesichertes, privat betriebenes Tiefgaragen- oder oberirdisches Parkhaus — viele erlauben eine Vorausbuchung, was besonders am Wochenende oder in der Hochsaison wichtig ist, wenn die Sehenswürdigkeiten am stärksten besucht sind.</p>
    <p>Ein gut gewähltes Parkhaus, wenige Schritte vom Museum oder der Altstadt entfernt, lässt dir die Freiheit, in deinem eigenen Tempo zu erkunden, ohne dir Sorgen um das Auto zu machen. Prüfe die Verfügbarkeit im Voraus und buche online — es lohnt sich, besonders an einem stark besuchten Wochenende.</p>
    <div class="plan-visit-block" style="display:block">
      ${TRAVEL_GUIDES_MONETIZATION_READY
        ? `<a href="https://www.awin1.com/cread.php?awinmid=18633&awinaffid=3051943&campaign=Your%20Parking%20Space&ued=https%3A%2F%2Fwww.yourparkingspace.co.uk%2F" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking">🅿️ UK-Parkplatz — im Voraus buchen</a>
      <p class="plan-visit-hint">🅿️ EU-Parkplatz — demnächst</p>`
        : `<p class="plan-visit-hint">${comingSoonTextFor("de")}</p>`}
    </div>`,
  },
  {
    slug: "restaurants",
    title: "So planst du einen perfekten Ausflugstag",
    intro: "Öffnungszeiten mit Essenszeiten abstimmen",
    body: `
    <p>Ein toller Ausflugstag bedeutet, Kultur und Erholung in Einklang zu bringen. Wenn du deinen Tag um die Öffnungszeiten eines Museums oder einer Galerie herum planst, lohnt es sich, auch die Essenspausen im Voraus einzuplanen — sonst läufst du Gefahr, genau dann hungrig anzukommen, wenn alle Lokale in der Nähe voll sind.</p>
    <p>Große Sehenswürdigkeiten ziehen täglich Tausende von Besuchern an, und die umliegenden Gebiete werden schnell voll, besonders mittags und abends. Eine im Voraus über eine Online-Plattform getätigte Reservierung garantiert dir einen Tisch, ohne anzustehen oder in letzter Minute verzweifelt nach einem freien Platz zu suchen.</p>
    <p>Das effizienteste Muster: Besuche Ausstellungen früh am Morgen, wenn es ruhig ist, und beende den Tag mit einem im Voraus reservierten Essen in einem lokalen Restaurant — ein einfacher Ausflugstag wird so zu einer Erinnerung, die man wirklich behalten möchte.</p>
    <div class="plan-visit-block" style="display:block">
      ${TRAVEL_GUIDES_MONETIZATION_READY
        ? `<a href="${escapeHtml(linkTheForkAffiliate || "https://www.thefork.com/")}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-booking">🍽️ Auf TheFork suchen (Frankreich, Italien, Spanien)</a>
      <a href="${escapeHtml(linkOpenTableAffiliate || "https://www.opentable.com/")}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking-alt">🍽️ Auf OpenTable suchen (UK, Deutschland)</a>`
        : `<p class="plan-visit-hint">${comingSoonTextFor("de")}</p>`}
    </div>`,
  },
  {
    slug: "flights",
    title: "So findest du die besten Flugtickets",
    intro: "Flugsuche mit Preisvergleich in Echtzeit",
    body: `
    <p>Der Flug ist meist die größte Ausgabe einer Reise — und die am leichtesten zu optimierende, wenn man weiß, wo man suchen muss. Preisunterschiede zwischen Airlines, Wochentagen oder nahegelegenen Flughäfen können für dasselbe Ziel Hunderte von Euro ausmachen.</p>
    <p>Ein Vergleichsportal, das gleichzeitig Dutzende Airlines durchsucht (auch Low-Cost-Anbieter), zeigt dir auf einen Blick die günstigste Option, egal wer sie betreibt — viel schneller, als jede Airline-Website einzeln zu prüfen.</p>
    <p>Suche direkt unten, ohne die Seite zu verlassen — gib Abflugort und Ziel ein, die Ergebnisse erscheinen in Echtzeit, mit aktuellen Preisen.</p>
    <a href="https://aviasales.tpk.lu/vB6Uc9BC" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">✈️ Flugtickets suchen</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>`,
  },
].concat(exports.TRAVEL_GUIDES_EN.slice(4,5), [
  {
    slug: "day-trips-tours-europe",
    title: "Die besten Tagesausflüge und geführten Touren in Europa",
    intro: "13 Top-Touren in ganz Europa, mit Tickets und Terminen, die du im Voraus buchen kannst",
    body: `
    <p>Eine im Voraus gebuchte Tour bedeutet einen garantierten Platz, einen bestätigten Guide und oft Zugang zu Orten, wo man sonst stundenlang anstehen müsste. Im Folgenden einige der beliebtesten Tagesausflüge und Touren in Europas Großstädten — von Bootsfahrten auf der Donau bis zu Routen durch die antike Geschichte Roms oder Athens.</p>

    <h2 class="section-title"><span class="bar"></span>Empfohlene Touren</h2>

    <h3>Bukarest — Kloster Snagov, Schloss Mogoșoaia und Salzbergwerk Slănic</h3>
    <p>Ein perfekter Tagesausflug für alle, die auf einer einzigen Route drei völlig unterschiedliche Seiten der Umgebung von Bukarest sehen möchten: die Ruhe der Klosterinsel Snagov, die Eleganz von Schloss Mogoșoaia und das beeindruckende Salzbergwerk Slănic, tief in den Berg gehauen. Ideal, wenn du nur einen freien Tag in der Hauptstadt hast und dem Trubel der Stadt entkommen willst.</p>
    <a href="https://www.getyourguide.com/slanic-l91935/snagov-monastery-mogosoaia-salt-mine-day-trip-bucharest-t1221626/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Tour buchen — Snagov, Mogoșoaia und Salzbergwerk Slănic</a>

    <h3>Bukarest — Tagesausflug ins Donaudelta</h3>
    <p>Das Donaudelta ist eines der spektakulärsten Naturschutzgebiete Europas, mit einzigartiger Artenvielfalt — Pelikane, Kormorane und Hunderte Vogelarten, zwischen schmalen Kanälen und Fischerdörfern. Ein Tagesausflug ab Bukarest, Transport inklusive, ist der einfachste Weg, die Atmosphäre des Deltas zu erleben, ohne die Anreise selbst zu organisieren.</p>
    <a href="https://www.getyourguide.com/bucharest-l111/from-bucharest-day-trip-to-danube-delta-t662170/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Tour buchen — Donaudelta</a>

    <h3>Wien — Donau-Flusskreuzfahrt, mit optionalem Mittagessen</h3>
    <p>Wien vom Wasser aus erzählt eine ganz andere Geschichte — historische Brücken, kaiserliche Bauten und grüne Parks ziehen an den Ufern der Donau vorbei. Eine entspannte Kreuzfahrt, mit optionalem Mittagessen an Bord, ist eine willkommene Pause nach einem Vormittag zu Fuß durch die Altstadt.</p>
    <a href="https://www.getyourguide.com/vienna-l7/vienna-city-cruise-with-optional-lunch-t58823/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Kreuzfahrt buchen — Wien</a>

    <h3>Budapest — Abendliche Sightseeing-Kreuzfahrt auf der Donau</h3>
    <p>Budapest bei Nacht beleuchtet gilt für viele als die schönste Stadtsilhouette Mitteleuropas — Parlament, Kettenbrücke und Burgpalast leuchten entlang der Donau. Eine Abendkreuzfahrt ist die klassische, fast unverzichtbare Art, die Stadt aus genau dem richtigen Blickwinkel zu sehen.</p>
    <a href="https://www.getyourguide.com/budapest-l29/budapest-evening-sightseeing-cruise-on-the-danube-t1117141/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Kreuzfahrt buchen — Budapest</a>

    <h3>Amsterdam — Tagesausflug nach Brügge</h3>
    <p>Brügge gilt als eine der am besten erhaltenen mittelalterlichen Städte Europas — Kanäle, Steinbrücken und gotische Gebäude, alles auf engem Raum in einer historischen Altstadt, die man leicht zu Fuß erkunden kann. Ein Tagesausflug ab Amsterdam, mit englisch- oder spanischsprachigem Guide, ist die einfache Wahl für alle, die ihre eigene Anreise nicht komplizieren wollen.</p>
    <a href="https://www.getyourguide.com/amsterdam-l36/from-amsterdam-bruges-day-tour-in-spanish-or-english-t2633/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program&cmp=amsterdam" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Tour buchen — Brügge, ab Amsterdam</a>

    <h3>Den Haag — Eintrittskarte für das Panorama-Mesdag-Museum</h3>
    <p>Das Panorama Mesdag ist ein riesiges Rundgemälde aus dem Jahr 1881, das den Besucher komplett mit dem Blick auf das Fischerdorf Scheveningen des 19. Jahrhunderts umgibt — ein einzigartiges visuelles Erlebnis, das man kaum beschreiben kann, bevor man es mit eigenen Augen gesehen hat. Ein kleines, aber spektakuläres Museum, nur wenige Schritte vom Zentrum Den Haags entfernt.</p>
    <a href="https://www.getyourguide.com/the-hague-l1267/the-hague-entry-ticket-to-the-panorama-mesdag-museum-t391318/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Ticket buchen — Panorama-Mesdag-Museum, Den Haag</a>

    <h3>Prag — Festung Vyšehrad, das versteckte Juwel der Stadt</h3>
    <p>Während sich die meisten Touristen auf der Prager Burg drängen, bleibt Vyšehrad eine viel ruhigere Wahl — eine historische Festung am Ufer der Moldau, mit herrlichem Ausblick und einem Friedhof, auf dem bedeutende tschechische Persönlichkeiten begraben sind. Ein perfekter Ort für alle, die Prag ohne die Menschenmassen erleben möchten.</p>
    <a href="https://www.getyourguide.com/prague-l10/prague-s-best-hidden-gem-vysehrad-castle-historic-fort-t1011583/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Tour buchen — Festung Vyšehrad, Prag</a>

    <h3>Rom — Kolosseum mit Zugang zur Arena und das Forum Romanum</h3>
    <p>Nur wenige Besucher stehen jemals auf dem tatsächlichen Boden der Kolosseum-Arena, genau dort, wo einst Gladiatoren kämpften — ein besonderer Zugang, der nur mit speziellen Tickets möglich ist. Kombiniert mit einer geführten Besichtigung des Forum Romanum rekonstruiert die Tour Schritt für Schritt den Alltag im Alten Rom.</p>
    <a href="https://www.getyourguide.com/rome-l33/rome-colosseum-gladiator-floor-access-roman-forum-tour-t633431/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Tour buchen — Kolosseum und Forum Romanum</a>

    <h3>Paris — Kleingruppen-Tour im Inneren von Notre-Dame</h3>
    <p>Nach Jahren der Restaurierung hat ein Besuch im Inneren von Notre-Dame eine ganz besondere Bedeutung — gotische Architektur, Glasfenster und die Geschichte der Kathedrale, erklärt von einem lokalen Guide, in kleinen Gruppen von bis zu 5 Personen, für ein viel persönlicheres Erlebnis als bei einem gewöhnlichen Besuch.</p>
    <a href="https://www.getyourguide.com/paris-l16/paris-small-group-interior-tour-of-notre-dame-max-5-people-t607051/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Tour buchen — Im Inneren von Notre-Dame</a>

    <h3>Madrid — Kombiticket: San Antonio de los Alemanes und Kloster San Placido</h3>
    <p>Zwei der weniger bekannten, aber spektakulären Barockkirchen Madrids — bemalte Gewölbe, vergoldete Altäre und eine seltene Stille mitten im Herzen der Stadt. Ein Kombiticket, ideal für alle, die Madrid abseits der großen, überfüllten Museen entdecken möchten.</p>
    <a href="https://www.getyourguide.com/madrid-l46/combo-entry-to-san-antonio-de-los-alemanes-and-the-monastery-of-san-placido-t1103055/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Kombiticket buchen — Madrid</a>

    <h3>Bratislava — Panorama-Bustour</h3>
    <p>Bratislava erschließt sich schnell und bequem von einem Panoramabus aus — Burg Bratislava, Michaelertor und die historischen Gebäude der slowakischen Hauptstadt, alles auf einer einzigen, mühelosen Route, ideal besonders bei wenig Zeit während eines Städtetrips.</p>
    <a href="https://www.getyourguide.com/bratislava-l765/bratislava-sightseeing-bus-tour-t28703/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Tour buchen — Bratislava</a>

    <h3>Lissabon — Museum des königlichen Schatzes</h3>
    <p>Kronen, königliche Juwelen und Objekte von immensem historischem Wert, ausgestellt in einem der am wenigsten überlaufenen Museen Lissabons. Ein kurzer, aber spektakulärer Stopp für alle, die eine andere Seite der portugiesischen Monarchie abseits der klassischen Touristenpfade entdecken möchten.</p>
    <a href="https://www.getyourguide.com/lisbon-l42/lisbon-royal-treasure-museum-entry-ticket-t425344/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Ticket buchen — Museum des königlichen Schatzes, Lissabon</a>

    <h3>Athen — Tagesausflug nach Delphi</h3>
    <p>Delphi, in der Antike als „Nabel der Welt“ bezeichnet, beherbergte das wichtigste Orakel der griechischen Welt — beeindruckende Ruinen in einer spektakulären Berglandschaft, wenige Stunden von Athen entfernt. Die Tour beinhaltet einen mehrsprachigen Audioguide, ideal für alle, die antike Geschichte erleben möchten, ohne die Organisation selbst übernehmen zu müssen.</p>
    <a href="https://www.getyourguide.com/athens-l91/from-athens-delphi-day-trip-with-multilingual-audioguide-t748369/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Tour buchen — Delphi, ab Athen</a>

    <h3>Istanbul — Dinner- und Showkreuzfahrt auf dem Goldenen Horn und Bosporus</h3>
    <p>Ein Abend auf dem Wasser, mit beleuchtetem Istanbul auf beiden Seiten des Bosporus — Abendessen an Bord, Live-Musik und traditioneller Tanz, auf einer Kreuzfahrt, die den Blick auf die Stadt mit einem vollständigen kulturellen Erlebnis verbindet. Ein unvergesslicher Abschluss für jeden Istanbul-Besuch.</p>
    <a href="https://www.getyourguide.com/istanbul-l56/istanbul-golden-horn-bosphorus-dinner-and-show-t459410/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Dinner-Kreuzfahrt buchen — Istanbul</a>

    <h3>Stockholm — Bootstour durch den Schärengarten</h3>
    <p>Der Stockholmer Schärengarten besteht aus über 30.000 Inseln und Inselchen, gesprenkelt mit traditionellen roten schwedischen Holzhäusern — eine Landschaft, die man vom Stadtzentrum aus einfach nicht sieht. Eine mehrstündige Bootstour eröffnet eine völlig andere, viel ruhigere und natürlichere Seite der schwedischen Hauptstadt.</p>
    <a href="https://www.getyourguide.com/stockholm-l50/stockholm-archipelago-boat-tour-t811343/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Tour buchen — Stockholmer Schärengarten</a>

    <h3>Konstanz — Eintrittskarte für die Insel Mainau</h3>
    <p>Die Insel Mainau im Bodensee ist bekannt als „Blumeninsel“ — makellose botanische Gärten, ein Barockschloss und spektakuläre Ausblicke auf die Alpen, an der Grenze zwischen Deutschland, der Schweiz und Österreich. Ein perfekter Ort für einen entspannten Tag, abseits der üblichen Städtetouren.</p>
    <a href="https://www.getyourguide.com/konstanz-l204/entrance-ticket-for-the-mainau-island-t561436/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Ticket buchen — Insel Mainau, Konstanz</a>

    <h3>Monaco — Panoramatour Monaco-Monte Carlo (Hop-on Hop-off)</h3>
    <p>Monaco ist klein, aber voller Sehenswürdigkeiten — der Fürstenpalast, das berühmte Casino von Monte Carlo und die Formel-1-Strecke, alles zugänglich mit einem einzigen Panorama-Busticket, mit kostenlosen Stopps an jedem Punkt von Interesse, in deinem eigenen Tempo.</p>
    <a href="https://www.getyourguide.com/monaco-l515/monaco-monte-carlo-hop-on-hop-off-bus-tour-t170400/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Tour buchen — Monaco &amp; Monte Carlo</a>

    <h3>München — Geführte E-Scooter-Tour, 2 Stunden, zu den wichtigsten Sehenswürdigkeiten</h3>
    <p>Eine schnelle und unterhaltsame Art, das Zentrum Münchens zu erleben — Marienplatz, Frauenkirche, Englischer Garten und die übrigen wichtigsten Sehenswürdigkeiten — mit einem geführten E-Scooter, in nur 2 Stunden. Ideal für alle mit wenig Zeit in der Stadt, die trotzdem so viel wie möglich sehen möchten, ohne die Erschöpfung vom Laufen.</p>
    <a href="https://www.getyourguide.com/munich-l26/munchen-top-sights-2h-guided-e-scooter-tour-t463376/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Tour buchen — München E-Scooter-Tour</a>

    <h3>Barcelona — Ticket ohne Warteschlange für die Sagrada Família</h3>
    <p>Die Sagrada Família ist wohl das berühmteste unvollendete Werk der Architekturgeschichte — Gaudís Meisterwerk, mit Türmen, die zum Himmel streben, und Glasfenstern, die das Licht im Inneren in ein Farbenspiel verwandeln. Ein Ticket ohne Warteschlange erspart dir stundenlanges Anstehen, besonders in der Hauptsaison.</p>
    <a href="https://www.getyourguide.com/barcelona-l45/sagrada-familia-skip-the-line-ticket-t50027/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Ticket ohne Warteschlange buchen — Sagrada Família</a>

    <h3>Venedig — Ticket ohne Warteschlange für die Markusbasilika, mit Audio-App</h3>
    <p>Die Markusbasilika, mit ihren goldenen Mosaiken und byzantinischen Kuppeln, ist das Herz Venedigs — aber auch eine der meistbesuchten Kirchen der Welt, mit Warteschlangen, die in der Hochsaison Stunden dauern können. Ein Ticket ohne Warteschlange, mit inklusiver Audio-App, lässt dich das Innere in deinem eigenen Tempo genießen, ohne Zeit mit Warten draußen zu verschwenden.</p>
    <a href="https://www.getyourguide.com/venice-l35/venice-st-mark-s-basilica-skip-the-line-ticket-audio-app-t395051/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Ticket ohne Warteschlange buchen — Markusbasilika, Venedig</a>

    <h3>Florenz — Interaktives Leonardo-da-Vinci-Museum</h3>
    <p>Ein ungewöhnliches Museum, ganz dem Genie Leonardo da Vincis gewidmet — funktionierende Modelle, Nachbauten seiner mechanischen Erfindungen und interaktive Exponate, die man berühren und ausprobieren kann, nicht nur aus der Ferne betrachten. Ein unterhaltsamer und lehrreicher Stopp, besonders geeignet für Familien mit Kindern.</p>
    <a href="https://www.getyourguide.com/florence-l32/florence-leonardo-interactive-museum-entry-ticket-t86558/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Ticket buchen — Leonardo-Interaktivmuseum, Florenz</a>

    <h3>Zürich — Lindt Home of Chocolate</h3>
    <p>Der größte Schokoladenbrunnen der Welt, der komplette Herstellungsprozess Schritt für Schritt erklärt, und natürlich Verkostungen — ein Museum, das ganz der Schweizer Leidenschaft für Schokolade gewidmet ist. Ein süßes Erlebnis für jedes Alter, nur wenige Schritte vom Zürichsee entfernt.</p>
    <a href="https://www.getyourguide.com/zurich-l55/lindt-home-of-chocolate-museum-entry-ticket-t396265/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Ticket buchen — Lindt Home of Chocolate, Zürich</a>

    <h3>Berlin — Ganztägige Rikscha-Tour, mit Hotelabholung</h3>
    <p>Eine ungewöhnliche und entspannte Art, Berlin zu erkunden — mit einer elektrischen Rikscha und einem lokalen Guide, der die Geschichte der Stadt mit Geschichten und Kultur verbindet, in einem viel gemächlicheren Tempo als bei einer klassischen Stadtführung zu Fuß. Inklusive direkter Hotelabholung, sodass du dich nicht um die Anreise zu einem Treffpunkt kümmern musst.</p>
    <a href="https://www.getyourguide.com/berlin-l17/full-day-rickshaw-tour-an-adventure-full-of-culture-and-delight-with-hotel-pickup-t856039/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Rikscha-Tour buchen — Berlin</a>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Plane deine ganze Reise, an einem Ort</h3>
      <p class="trip-toolkit-subtitle">Brauchst du Flüge, eine Unterkunft, ein Auto oder einen Transfer? Hier findest du alles.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=eur&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Flugtickets suchen</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Unterkunft suchen</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Auto mieten</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://intui.tpk.lu/xynzx1LU" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚕 Transfer buchen</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
      </div>
      <div class="gyg-search-widget-wrap">
        <div class="gyg-widget" data-gyg-partner-id="LM6J21N" data-gyg-number-of-items="3" data-gyg-locale-code="en-US" data-gyg-type="search"></div>
      </div>
    </div>`,
  },
  {
    slug: "castles-europe",
    title: "Die schönsten Schlösser Europas",
    intro: "12 märchenhafte Schlösser in ganz Europa, mit Tickets und Touren, die du im Voraus buchen kannst",
    body: `
    <p>Von den Türmen, die die Disney-Parks inspirierten, bis zu mittelalterlichen Festungen, versteckt in Wäldern oder auf Klippen über Gletscherseen thronend — Europa hat einige der spektakulärsten Schlösser der Welt. Im Folgenden 12 der schönsten, mit praktischen Informationen und Tickets, die du im Voraus buchen kannst, um die Warteschlange am Eingang zu umgehen.</p>

    <h2 class="section-title"><span class="bar"></span>Die Schlösser</h2>

    <h3>🇩🇪 Schloss Neuschwanstein, Deutschland</h3>
    <p>Das Schloss, das direkt die Silhouetten in den Disney-Parks inspirierte — schlanke weiße Türme, erhoben auf einem Felsgipfel in den bayerischen Alpen. Von König Ludwig II. von Bayern als romantische Flucht aus der Realität erbaut, bleibt Neuschwanstein Europas meistfotografiertes Schloss, besonders im Herbst, wenn sich die umliegenden Wälder verfärben.</p>
    <a href="https://www.getyourguide.com/munich-l26/from-munich-neuschwanstein-linderhof-castle-full-day-trip-t1753/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Tour buchen — Neuschwanstein &amp; Schloss Linderhof, ab München</a>

    <h3>🇩🇪 Burg Eltz, Deutschland</h3>
    <p>Tief in einem Wald nahe der Mosel versteckt, ist Eltz eine der wenigen deutschen Burgen, die nie zerstört oder erobert wurde — und sie gehört seit über 850 Jahren derselben Familie. Ihre Silhouette, mit Türmen aus verschiedenen Epochen dicht auf einem schmalen Felsen, sieht aus wie direkt aus einem Märchen.</p>
    <a href="https://www.getyourguide.com/frankfurt-l21/frankfurt-day-trip-to-eltz-castle-on-the-moselle-t40707/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Tour buchen — Burg Eltz, ab Frankfurt</a>

    <h3>🇩🇪 Burg Hohenzollern, Deutschland</h3>
    <p>Der Stammsitz der preußischen Königsfamilie, stolz auf einem isolierten Gipfel gelegen, mit einer Aussicht, die sich an klaren Tagen über ganz Süddeutschland erstreckt. Die neugotische Architektur aus dem 19. Jahrhundert, mit Türmen und Zinnen, macht Hohenzollern zu einer der eindrucksvollsten Burgen, die man in Europa besuchen kann.</p>
    <a href="https://www.getyourguide.com/sigmaringen-l100350/sigmaringen-hohenzollern-castle-entry-fee-audio-guide-t849245/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Ticket buchen — Burg Hohenzollern</a>

    <h3>🇷🇴 Schloss Peleș, Rumänien</h3>
    <p>Von vielen als das schönste Schloss Rumäniens angesehen, war Peleș die Sommerresidenz von König Carol I. — ein Juwel der Neorenaissance mit üppigen Innenräumen, erbaut direkt am Fuß des Bucegi-Gebirges, in Sinaia. Jeder Raum hat seinen eigenen Dekorationsstil, von deutschen Möbeln bis zu orientalischen Waffen.</p>
    <a href="https://www.getyourguide.com/sinaia-l124688/peles-castle-and-bran-castle-entry-tickets-t1414362/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Kombiticket buchen — Peleș &amp; Bran</a>

    <h3>🇷🇴 Burg Corvin, Rumänien</h3>
    <p>Eine beeindruckende gotisch-renaissancistische Festung, erbaut von Johann Hunyadi, mit Türmen, Hängebrücken und düsteren Legenden über die Verliese im Inneren. Eine der am besten erhaltenen mittelalterlichen Festungen Osteuropas und ein besonders bei Sonnenuntergang spektakulärer Anblick.</p>
    <a href="https://www.getyourguide.com/corvin-castle-l127588/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Ticket buchen — Burg Corvin, Hunedoara</a>

    <h3>🇷🇴 Schloss Bran, Rumänien</h3>
    <p>International bekannt als „Draculas Schloss“, dank der Verbindung, die Bram Stokers Roman schuf, ist Bran eine spektakuläre mittelalterliche Festung, hoch auf einer Klippe am Rand Transsilvaniens. Auch wenn der tatsächliche historische Bezug zu Vlad dem Pfähler umstritten ist, enttäuscht die gotische Atmosphäre des Ortes niemanden.</p>
    <a href="https://www.getyourguide.com/bran-l188057/bran-castle-dracula-s-castle-entry-ticket-with-audio-guide-t1380614/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Ticket buchen — Schloss Bran</a>

    <h3>🇵🇹 Palácio da Pena, Portugal</h3>
    <p>Ein romantischer, extravagant bunter Palast (rot, gelb, lila), erbaut auf den Hügeln von Sintra, oft über den Wolken an nebligen Tagen. Ein eklektischer Stilmix — Gotik, Manuelinik, islamische und Renaissance-Elemente — macht Pena zu einem der fotogensten Paläste der Welt, ein UNESCO-Weltkulturerbe.</p>
    <a href="https://www.getyourguide.com/lisbon-l42/lisbon-sintra-pena-regaleira-cabo-da-roca-cascais-tour-t881398/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Tour buchen — Sintra, Pena &amp; Cascais, ab Lissabon</a>

    <h3>🇪🇸 Alcázar von Segovia, Spanien</h3>
    <p>Mit seiner markanten Silhouette, wie ein steinernes Schiff über der Stadt schwebend, gilt der Alcázar von Segovia oft als eine der Inspirationen für Cinderellas Schloss in den Disney-Parks — eine freundliche Rivalität mit Neuschwanstein um diesen Titel. Eine mittelalterliche königliche Festung, jahrhundertelang von kastilischen Monarchen genutzt.</p>
    <a href="https://www.getyourguide.com/ro-ro/segovia-spania-l1694/din-madrid-excursie-de-o-zi-la-segovia-cu-bilet-de-intrare-la-alcazar-t1402263/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Tour buchen — Segovia &amp; Alcázar, ab Madrid</a>

    <h3>🇫🇷 Schloss Chambord, Frankreich</h3>
    <p>Das größte Schloss im Loiretal, ein Meisterwerk der französischen Renaissance, mit über 400 Zimmern und einer berühmten doppelhelixförmigen Wendeltreppe, manchmal Leonardo da Vinci selbst zugeschrieben. Die umliegenden Gärten und Wälder, die sich über tausende Hektar erstrecken, machen Chambord zu einem vollen Tageserlebnis, nicht nur einem kurzen Besuch.</p>
    <a href="https://www.getyourguide.com/loire-valley-chateaux-l7956/chambord-skip-the-line-chateau-de-chambord-ticket-t183794/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Ticket ohne Warteschlange buchen — Schloss Chambord</a>

    <h3>🇨🇭 Schloss Chillon, Schweiz</h3>
    <p>Eine mittelalterliche Inselburg, direkt auf einem Felsen im Genfersee erbaut, mit den Alpen als Kulisse — das meistbesuchte historische Baudenkmal der Schweiz. Der Dichter Lord Byron machte es mit seinem Gedicht „Der Gefangene von Chillon“ weltberühmt, inspiriert von den Verliesen im Kellergeschoss der Burg.</p>
    <a href="https://www.chillon.ch/" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Fahrplan und Tickets ansehen — Schloss Chillon (offizielle Website)</a>

    <h3>🇸🇮 Burg Bled, Slowenien</h3>
    <p>Die älteste Burg Sloweniens, direkt auf einer steilen Klippe erbaut, 130 Meter über dem Bleder See — einer der meistfotografierten Ausblicke Mitteleuropas, mit der kleinen Kirche auf der Insel in der Seemitte, sichtbar direkt von ihren Mauern aus.</p>
    <a href="https://www.getyourguide.com/en-au/bled-castle-l140261/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Ticket buchen — Burg Bled</a>

    <h3>🇵🇱 Burg Malbork, Polen</h3>
    <p>Die flächenmäßig größte Burg der Welt — eine riesige Festung aus rotem gotischem Backstein, erbaut vom Deutschen Orden am Ufer der Nogat. Ein UNESCO-Weltkulturerbe, beeindruckt Malbork durch seine schiere Größe, die man kaum begreift, bevor man sie mit eigenen Augen sieht.</p>
    <a href="https://www.getyourguide.com/gdansk-l1960/gdansk-malbork-castle-regular-tour-t218583/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Tour buchen — Burg Malbork, ab Gdańsk</a>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Plane deine ganze Reise, an einem Ort</h3>
      <p class="trip-toolkit-subtitle">Brauchst du Flüge, eine Unterkunft, ein Auto oder einen Transfer? Hier findest du alles.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=eur&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Flugtickets suchen</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Unterkunft suchen</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Auto mieten</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://intui.tpk.lu/xynzx1LU" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚕 Transfer buchen</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
      </div>
    </div>`,
  },
  {
    slug: "amusement-parks-europe",
    title: "Die besten Freizeitparks Europas",
    intro: "6 Top-Parks für jedes Alter — von Disneyland Paris bis zu den intensivsten Achterbahnen",
    body: `
    <p>Von klassischen Parks mit Figuren, die Kinder lieben, bis zu einigen der höchsten Achterbahnen der Welt — Europa hat Freizeitparks für jedes Alter und jeden Grad an Nervenkitzel. Im Folgenden einige der beliebtesten, nach Kategorie gruppiert, mit Tickets, die du im Voraus buchen kannst.</p>

    <h2 class="section-title"><span class="bar"></span>👑 Am beliebtesten und meistbesucht (alle Altersgruppen)</h2>

    <h3>🇫🇷 Disneyland Paris, Frankreich</h3>
    <p>Europas meistbesuchter Freizeitpark — zwei vollständige Themenparks (Disneyland Park und Walt Disney Studios), in denen Kinder ihre Lieblingsfiguren aus Zeichentrickfilmen treffen können, zwischen Schlössern, Paraden und täglichen Shows. Ein komplettes Erlebnis, ideal für einen 2-3-tägigen Urlaub.</p>
    <a href="https://www.getyourguide.com/paris-l16/disneyland-paris-2-parks-ticket-1-2-3-4-5-day-t395320/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Ticket buchen — Disneyland Paris</a>

    <h3>🇩🇪 Europa-Park, Rust, Deutschland</h3>
    <p>Europas zweitgrößter Freizeitpark, gegliedert in 18 Themenbereiche, jeder einem europäischen Land gewidmet. Er verfügt über 13 spektakuläre Achterbahnen, sanftere Bereiche für kleinere Kinder, tägliche Shows und einen riesigen Wasserpark (Rulantica) — im Grunde ein kompletter Urlaub an einem einzigen Ort.</p>
    <a href="https://www.getyourguide.com/rust-l2882/rust-europa-park-entrance-ticket-t393563/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Ticket buchen — Europa-Park, Rust</a>

    <h2 class="section-title"><span class="bar"></span>🧸 Am besten für Kleinkinder und Vorschulkinder</h2>

    <h3>🇳🇱 Efteling, Kaatsheuvel, Niederlande</h3>
    <p>Ein Märchenpark, bekannt für die entspannte Atmosphäre seines Märchenwalds — Figuren aus den Geschichten der Gebrüder Grimm, Wege voller Grün und ein deutlich gemächlicheres Tempo als bei nervenkitzel-fokussierten Parks. Ideal für kleine Kinder, die dem Zauber des Ortes leicht erliegen.</p>
    <a href="https://www.getyourguide.com/amsterdam-l36/amsterdam-efteling-park-roundtrip-transfer-and-entry-ticket-t501550/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Ticket (mit Transfer) buchen — Efteling, ab Amsterdam</a>

    <h3>🇩🇰 Legoland Billund, Dänemark</h3>
    <p>Der ursprüngliche Legoland-Park, speziell für Familien mit kleinen Kindern gebaut — spektakuläre Mini-Städte, komplett aus Lego-Steinen gebaut, interaktive Fahrgeschäfte und Aktivitäten, die die Kreativität anregen sollen, nicht nur den Nervenkitzel. Ein Ort, an dem Eltern genauso viel spielen wie die Kleinen.</p>
    <a href="https://www.getyourguide.com/billund-l87275/legoland-billund-entry-ticket-private-transfer-t1427002/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Ticket (mit Transfer) buchen — Legoland Billund</a>

    <h2 class="section-title"><span class="bar"></span>🎢 Am besten für Abenteuer und Nervenkitzel (ältere Kinder)</h2>

    <h3>🇮🇹 Gardaland, Castelnuovo del Garda, Italien</h3>
    <p>Direkt am herrlichen Gardasee gelegen, verbindet Gardaland intensive Achterbahnen (wie Oblivion oder Raptor) mit einem den Kleinsten gewidmeten Bereich (Peppa Pig Land) — eine seltene Balance zwischen Nervenkitzel für Teenager und Spaß für die ganze Familie, im selben Park.</p>
    <a href="https://www.getyourguide.com/garda-l145126/gardaland-park-fixed-day-entry-ticket-t225588/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Ticket buchen — Gardaland</a>

    <h3>🇵🇱 Energylandia, Zator, Polen</h3>
    <p>Polens größter Freizeitpark, europaweit bekannt für seine enorme Anzahl moderner Achterbahnen — darunter Zadra, eine der höchsten Hybrid-Achterbahnen der Welt. Er verfügt außerdem über einen riesigen Wasserbereich sowie speziell für kleinere Kinder konzipierte Zonen, sodass er nicht nur für Nervenkitzel-Fans geeignet ist.</p>
    <a href="https://www.getyourguide.com/krakow-l40/krakow-energylandia-full-day-ticket-with-optional-pickup-t114202/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Ticket (mit optionaler Abholung) buchen — Energylandia, ab Krakau</a>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Plane deine ganze Reise, an einem Ort</h3>
      <p class="trip-toolkit-subtitle">Brauchst du Flüge, eine Unterkunft, ein Auto oder einen Transfer? Hier findest du alles.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=eur&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Flugtickets suchen</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Unterkunft suchen</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Auto mieten</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://intui.tpk.lu/xynzx1LU" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚕 Transfer buchen</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
      </div>
    </div>`,
  },
])

exports.TRAVEL_GUIDES_FR = [
  {
    slug: "transport",
    title: "Comment se rendre efficacement aux grands sites touristiques",
    intro: "Guide des transports urbains et régionaux",
    body: `
    <p>Un bon itinéraire dépend beaucoup de la façon dont vous vous déplacez entre les sites. Lorsque vous souhaitez visiter des musées, des châteaux ou des monuments historiques, la connexion entre les villes et la logistique locale font la différence entre une journée détendue et une journée perdue dans les gares et les arrêts.</p>
    <p>Pour les longues distances ou entre régions historiques, le train reste l'option la plus populaire — le réseau ferroviaire européen relie la plupart des capitales aux petites villes, souvent par des itinéraires pittoresques. Les autocars comblent bien les lacunes, surtout vers les localités ou zones montagneuses que le train n'atteint pas directement, et coûtent généralement moins cher.</p>
    <p>Si vous atterrissez à l'aéroport avec beaucoup de bagages ou voyagez en groupe, un transfert privé réservé à l'avance vous évite le tracas de changer de mode de transport — il vous emmène directement du terminal à la porte du château ou à l'hôtel. Planifier ces connexions à l'avance transforme un voyage mouvementé en une expérience sans stress.</p>
    <div class="plan-visit-block" style="display:block">
      ${TRAVEL_GUIDES_MONETIZATION_READY
        ? `
      <a href="${escapeHtml(getTransferLinkFor())}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking-alt">🚕 Réserver un transfert privé</a>`
        : `<p class="plan-visit-hint">${comingSoonTextFor("fr")}</p>`}
    </div>`,
  },
  {
    slug: "parking",
    title: "Comment gérer le stationnement près des zones historiques",
    intro: "Guide du conducteur — stationnement dans les vieux centres-villes",
    body: `
    <p>Conduire votre propre voiture ou une voiture de location vous offre une liberté de mouvement que les autres modes de transport ne peuvent égaler — mais les centres-villes historiques sont connus pour leurs restrictions de circulation et leur pénurie chronique de places de stationnement.</p>
    <p>Laisser sa voiture n'importe où risque une amende, voire une mise en fourrière. L'option la plus sûre reste un parking sécurisé, souterrain ou en surface, géré par le secteur privé — beaucoup permettent de réserver une place à l'avance, ce qui compte surtout le week-end ou en haute saison, lorsque les sites sont les plus fréquentés.</p>
    <p>Un parking bien choisi, à quelques pas du musée ou de la vieille ville, vous laisse la liberté d'explorer à votre rythme, sans vous soucier de la voiture. Vérifiez la disponibilité à l'avance et réservez en ligne — cela en vaut la peine, surtout un week-end chargé.</p>
    <div class="plan-visit-block" style="display:block">
      ${TRAVEL_GUIDES_MONETIZATION_READY
        ? `<a href="https://www.awin1.com/cread.php?awinmid=18633&awinaffid=3051943&campaign=Your%20Parking%20Space&ued=https%3A%2F%2Fwww.yourparkingspace.co.uk%2F" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking">🅿️ Parking UK — réservez à l'avance</a>
      <p class="plan-visit-hint">🅿️ Parking UE — bientôt disponible</p>`
        : `<p class="plan-visit-hint">${comingSoonTextFor("fr")}</p>`}
    </div>`,
  },
  {
    slug: "restaurants",
    title: "Comment organiser une journée de sortie parfaite",
    intro: "Faire correspondre les horaires d'ouverture avec les heures de repas",
    body: `
    <p>Une belle journée de sortie repose sur un équilibre entre culture et détente. Si vous construisez votre journée autour des horaires d'un musée ou d'une galerie, il vaut la peine de planifier aussi vos pauses repas à l'avance — sinon vous risquez d'arriver affamé juste quand tous les établissements voisins sont pleins.</p>
    <p>Les grands sites attirent des milliers de visiteurs chaque jour, et les zones environnantes se remplissent vite, surtout au déjeuner et au dîner. Réserver à l'avance via une plateforme en ligne vous garantit une table sans faire la queue ni chercher désespérément une place de dernière minute.</p>
    <p>Le schéma le plus efficace : visitez les expositions tôt le matin, quand c'est calme, puis terminez la journée par un repas réservé à l'avance dans un restaurant local — une simple sortie devient ainsi un souvenir que l'on a vraiment envie de garder.</p>
    <div class="plan-visit-block" style="display:block">
      ${TRAVEL_GUIDES_MONETIZATION_READY
        ? `<a href="${escapeHtml(linkTheForkAffiliate || "https://www.thefork.com/")}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-booking">🍽️ Rechercher sur TheFork (France, Italie, Espagne)</a>
      <a href="${escapeHtml(linkOpenTableAffiliate || "https://www.opentable.com/")}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking-alt">🍽️ Rechercher sur OpenTable (UK, Allemagne)</a>`
        : `<p class="plan-visit-hint">${comingSoonTextFor("fr")}</p>`}
    </div>`,
  },
  {
    slug: "flights",
    title: "Comment trouver les meilleurs billets d'avion",
    intro: "Guide de recherche de vols, avec comparateur de prix en temps réel",
    body: `
    <p>Le billet d'avion est généralement la plus grosse dépense d'un voyage — et la plus facile à optimiser, si l'on sait où chercher. Les écarts de prix entre compagnies, entre jours de la semaine ou entre aéroports proches peuvent atteindre des centaines d'euros pour la même destination.</p>
    <p>Un comparateur qui interroge simultanément des dizaines de compagnies aériennes (y compris low-cost) affiche en un coup d'œil l'option la moins chère, quel que soit l'opérateur — bien plus rapide que de vérifier manuellement le site de chaque compagnie.</p>
    <p>Recherchez directement ci-dessous, sans quitter la page — indiquez la ville de départ et la destination, les résultats apparaissent en temps réel, avec des prix à jour.</p>
    <a href="https://aviasales.tpk.lu/vB6Uc9BC" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">✈️ Rechercher des billets d'avion</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>`,
  },
].concat(exports.TRAVEL_GUIDES_EN.slice(4,5), [
  {
    slug: "day-trips-tours-europe",
    title: "Les meilleures excursions et visites guidées en Europe",
    intro: "13 des meilleures visites, à travers l'Europe, avec billets et créneaux réservables à l'avance",
    body: `
    <p>Réserver une visite à l'avance, c'est s'assurer une place garantie, un guide confirmé, et souvent un accès à des lieux où l'on ferait la queue pendant des heures. Voici quelques-unes des excursions et visites les plus prisées dans les grandes villes d'Europe — des balades en bateau sur le Danube aux parcours à travers l'histoire antique de Rome ou d'Athènes.</p>

    <h2 class="section-title"><span class="bar"></span>Visites recommandées</h2>

    <h3>Bucarest — Monastère de Snagov, palais de Mogoșoaia et mine de sel de Slănic</h3>
    <p>Une excursion parfaite pour qui veut découvrir, en un seul circuit, trois facettes complètement différentes des environs de Bucarest : le calme de l'île du monastère de Snagov, l'élégance du palais de Mogoșoaia et l'impressionnante mine de sel de Slănic, creusée au cœur de la montagne. Idéal si vous ne disposez que d'une journée libre dans la capitale et souhaitez échapper à son agitation.</p>
    <a href="https://www.getyourguide.com/slanic-l91935/snagov-monastery-mogosoaia-salt-mine-day-trip-bucharest-t1221626/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver la visite — Snagov, Mogoșoaia et la mine de sel de Slănic</a>

    <h3>Bucarest — Excursion d'une journée dans le delta du Danube</h3>
    <p>Le delta du Danube est l'une des réserves naturelles les plus spectaculaires d'Europe, avec une biodiversité unique — pélicans, cormorans et des centaines d'espèces d'oiseaux, parmi des canaux étroits et des villages de pêcheurs. Une excursion d'une journée au départ de Bucarest, transport inclus, est le moyen le plus simple de découvrir l'atmosphère du delta sans organiser son propre transport.</p>
    <a href="https://www.getyourguide.com/bucharest-l111/from-bucharest-day-trip-to-danube-delta-t662170/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver la visite — Delta du Danube</a>

    <h3>Vienne — Croisière sur le Danube, avec déjeuner en option</h3>
    <p>Vienne vue depuis l'eau raconte une tout autre histoire — ponts historiques, bâtiments impériaux et parcs verdoyants défilent le long des rives du Danube. Une croisière relaxante, avec déjeuner en option à bord, est une pause bienvenue après une matinée à arpenter le centre historique à pied.</p>
    <a href="https://www.getyourguide.com/vienna-l7/vienna-city-cruise-with-optional-lunch-t58823/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver la croisière — Vienne</a>

    <h3>Budapest — Croisière panoramique nocturne sur le Danube</h3>
    <p>Budapest illuminée la nuit est, pour beaucoup, la plus belle silhouette urbaine d'Europe centrale — le Parlement, le pont des Chaînes et le château de Buda scintillent le long du Danube. Une croisière en soirée est la manière classique, presque incontournable, de voir la ville sous le meilleur angle.</p>
    <a href="https://www.getyourguide.com/budapest-l29/budapest-evening-sightseeing-cruise-on-the-danube-t1117141/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver la croisière — Budapest</a>

    <h3>Amsterdam — Excursion d'une journée à Bruges</h3>
    <p>Bruges est considérée comme l'une des villes médiévales les mieux préservées d'Europe — canaux, ponts de pierre et bâtiments gothiques, le tout réuni dans un centre historique compact, facile à explorer à pied. Une excursion au départ d'Amsterdam, avec un guide parlant anglais ou espagnol, est le choix simple pour qui ne veut pas se compliquer le trajet.</p>
    <a href="https://www.getyourguide.com/amsterdam-l36/from-amsterdam-bruges-day-tour-in-spanish-or-english-t2633/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program&cmp=amsterdam" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver la visite — Bruges, au départ d'Amsterdam</a>

    <h3>La Haye — Billet d'entrée pour le musée du Panorama Mesdag</h3>
    <p>Le Panorama Mesdag est une immense peinture circulaire datant de 1881, qui entoure entièrement le visiteur d'une vue sur le village de pêcheurs de Scheveningen au XIXe siècle — une expérience visuelle unique, difficile à imaginer avant de la voir de ses propres yeux. Un musée petit mais spectaculaire, à quelques pas seulement du centre de La Haye.</p>
    <a href="https://www.getyourguide.com/the-hague-l1267/the-hague-entry-ticket-to-the-panorama-mesdag-museum-t391318/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver le billet — Musée du Panorama Mesdag, La Haye</a>

    <h3>Prague — Forteresse de Vyšehrad, le joyau caché de la ville</h3>
    <p>Alors que la plupart des touristes se pressent au château de Prague, Vyšehrad reste un choix bien plus tranquille — une forteresse historique sur les rives de la Vltava, avec une vue superbe et un cimetière où reposent de grandes figures tchèques. Un endroit parfait pour qui veut découvrir Prague loin de la foule.</p>
    <a href="https://www.getyourguide.com/prague-l10/prague-s-best-hidden-gem-vysehrad-castle-historic-fort-t1011583/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver la visite — Forteresse de Vyšehrad, Prague</a>

    <h3>Rome — Colisée avec accès à l'arène et Forum romain</h3>
    <p>Peu de visiteurs ont l'occasion de fouler le sol même de l'arène du Colisée, là où combattaient autrefois les gladiateurs — un accès spécial, réservé aux billets dédiés. Combinée à une visite guidée du Forum romain, la visite reconstitue, étape par étape, la vie quotidienne dans la Rome antique.</p>
    <a href="https://www.getyourguide.com/rome-l33/rome-colosseum-gladiator-floor-access-roman-forum-tour-t633431/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver la visite — Colisée et Forum romain</a>

    <h3>Paris — Visite en petit groupe à l'intérieur de Notre-Dame</h3>
    <p>Après des années de restauration, une visite à l'intérieur de Notre-Dame revêt une signification particulière — architecture gothique, vitraux et histoire de la cathédrale, expliqués par un guide local, en petits groupes de 5 personnes maximum, pour une expérience bien plus personnelle qu'une visite ordinaire.</p>
    <a href="https://www.getyourguide.com/paris-l16/paris-small-group-interior-tour-of-notre-dame-max-5-people-t607051/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver la visite — À l'intérieur de Notre-Dame</a>

    <h3>Madrid — Billet combiné : San Antonio de los Alemanes et monastère de San Placido</h3>
    <p>Deux des églises baroques de Madrid les moins connues mais les plus spectaculaires — voûtes peintes, autels dorés et un calme rare au cœur de la ville. Un billet combiné, idéal pour qui veut découvrir Madrid au-delà de ses grands musées bondés.</p>
    <a href="https://www.getyourguide.com/madrid-l46/combo-entry-to-san-antonio-de-los-alemanes-and-the-monastery-of-san-placido-t1103055/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver le billet combiné — Madrid</a>

    <h3>Bratislava — Tour panoramique en bus</h3>
    <p>Bratislava se découvre vite et confortablement depuis un bus panoramique — le château de Bratislava, la porte Saint-Michel et les bâtiments historiques de la capitale slovaque, le tout sur un seul circuit simple et sans effort, idéal surtout quand le temps manque lors d'un city-trip.</p>
    <a href="https://www.getyourguide.com/bratislava-l765/bratislava-sightseeing-bus-tour-t28703/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver la visite — Bratislava</a>

    <h3>Lisbonne — Musée du Trésor royal</h3>
    <p>Couronnes, joyaux royaux et objets d'une immense valeur historique, exposés dans l'un des musées les moins fréquentés de Lisbonne. Une étape courte mais spectaculaire, pour qui veut découvrir un autre visage de la monarchie portugaise, loin des sentiers touristiques classiques.</p>
    <a href="https://www.getyourguide.com/lisbon-l42/lisbon-royal-treasure-museum-entry-ticket-t425344/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver le billet — Musée du Trésor royal, Lisbonne</a>

    <h3>Athènes — Excursion d'une journée à Delphes</h3>
    <p>Delphes, considérée dans l'Antiquité comme le « nombril du monde », abritait l'oracle le plus important du monde grec — des ruines impressionnantes, dans un paysage montagneux spectaculaire, à quelques heures d'Athènes. La visite inclut un audioguide multilingue, idéal pour qui veut découvrir l'histoire antique sans avoir à tout organiser soi-même.</p>
    <a href="https://www.getyourguide.com/athens-l91/from-athens-delphi-day-trip-with-multilingual-audioguide-t748369/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver la visite — Delphes, au départ d'Athènes</a>

    <h3>Istanbul — Croisière-dîner avec spectacle sur la Corne d'Or et le Bosphore</h3>
    <p>Une soirée sur l'eau, avec Istanbul illuminée des deux côtés du Bosphore — dîner à bord, musique live et danses traditionnelles, sur une croisière qui allie la vue sur la ville à une expérience culturelle complète. Une façon mémorable de clôturer toute visite d'Istanbul.</p>
    <a href="https://www.getyourguide.com/istanbul-l56/istanbul-golden-horn-bosphorus-dinner-and-show-t459410/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver la croisière-dîner — Istanbul</a>

    <h3>Stockholm — Excursion en bateau dans l'archipel</h3>
    <p>L'archipel de Stockholm compte plus de 30 000 îles et îlots, parsemés de maisonnettes suédoises traditionnelles rouges — un paysage que l'on ne voit tout simplement pas depuis le centre-ville. Une excursion en bateau de quelques heures révèle une facette totalement différente, bien plus paisible et naturelle, de la capitale suédoise.</p>
    <a href="https://www.getyourguide.com/stockholm-l50/stockholm-archipelago-boat-tour-t811343/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver la visite — Archipel de Stockholm</a>

    <h3>Constance — Billet d'entrée pour l'île de Mainau</h3>
    <p>L'île de Mainau, sur le lac de Constance, est connue comme « l'île aux fleurs » — jardins botaniques impeccables, château baroque et vues spectaculaires sur les Alpes, à la frontière entre l'Allemagne, la Suisse et l'Autriche. Un endroit parfait pour une journée de détente, loin des circuits urbains habituels.</p>
    <a href="https://www.getyourguide.com/konstanz-l204/entrance-ticket-for-the-mainau-island-t561436/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver le billet — Île de Mainau, Constance</a>

    <h3>Monaco — Tour panoramique Monaco-Monte-Carlo (Hop-on Hop-off)</h3>
    <p>Monaco est petit mais regorge de sites — le Palais princier, le célèbre casino de Monte-Carlo et le circuit de Formule 1, tous accessibles avec un seul billet de bus panoramique, avec arrêts gratuits à chaque point d'intérêt, à votre rythme.</p>
    <a href="https://www.getyourguide.com/monaco-l515/monaco-monte-carlo-hop-on-hop-off-bus-tour-t170400/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver la visite — Monaco &amp; Monte-Carlo</a>

    <h3>Munich — Visite guidée en trottinette électrique, 2 heures, à travers les sites incontournables</h3>
    <p>Une façon rapide et amusante de découvrir le centre de Munich — Marienplatz, la Frauenkirche, le Jardin anglais et les autres sites essentiels — en trottinette électrique guidée, en seulement 2 heures. Idéal pour qui manque de temps sur place mais veut quand même en voir un maximum, sans la fatigue de la marche.</p>
    <a href="https://www.getyourguide.com/munich-l26/munchen-top-sights-2h-guided-e-scooter-tour-t463376/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver la visite — Tour en trottinette à Munich</a>

    <h3>Barcelone — Billet coupe-file pour la Sagrada Família</h3>
    <p>La Sagrada Família est sans doute l'œuvre inachevée la plus célèbre de l'histoire de l'architecture — le chef-d'œuvre de Gaudí, avec des tours qui s'élancent vers le ciel et des vitraux qui transforment la lumière intérieure en un jeu de couleurs. Un billet coupe-file vous épargne des heures d'attente, surtout en haute saison.</p>
    <a href="https://www.getyourguide.com/barcelona-l45/sagrada-familia-skip-the-line-ticket-t50027/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver le billet coupe-file — Sagrada Família</a>

    <h3>Venise — Billet coupe-file pour la basilique Saint-Marc, avec application audio</h3>
    <p>La basilique Saint-Marc, avec ses mosaïques dorées et ses coupoles byzantines, est le cœur de Venise — mais aussi l'une des églises les plus visitées au monde, avec des files d'attente qui peuvent durer des heures en haute saison. Un billet coupe-file, avec application audio incluse, vous permet de profiter de l'intérieur à votre rythme, sans perdre de temps à attendre dehors.</p>
    <a href="https://www.getyourguide.com/venice-l35/venice-st-mark-s-basilica-skip-the-line-ticket-audio-app-t395051/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver le billet coupe-file — Basilique Saint-Marc, Venise</a>

    <h3>Florence — Musée interactif Léonard de Vinci</h3>
    <p>Un musée original, entièrement consacré au génie de Léonard de Vinci — maquettes fonctionnelles, répliques de ses inventions mécaniques et expositions interactives que l'on peut toucher et essayer, pas seulement observer de loin. Une étape ludique et instructive, particulièrement adaptée aux familles avec enfants.</p>
    <a href="https://www.getyourguide.com/florence-l32/florence-leonardo-interactive-museum-entry-ticket-t86558/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver le billet — Musée interactif Léonard de Vinci, Florence</a>

    <h3>Zurich — Lindt Home of Chocolate</h3>
    <p>La plus grande fontaine de chocolat au monde, tout le processus de fabrication expliqué étape par étape et, bien sûr, des dégustations — un musée entièrement dédié à la passion suisse pour le chocolat. Une expérience gourmande adaptée à tous les âges, à quelques pas seulement du lac de Zurich.</p>
    <a href="https://www.getyourguide.com/zurich-l55/lindt-home-of-chocolate-museum-entry-ticket-t396265/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver le billet — Lindt Home of Chocolate, Zurich</a>

    <h3>Berlin — Visite en pousse-pousse toute la journée, avec prise en charge à l'hôtel</h3>
    <p>Une façon originale et relaxante de découvrir Berlin — en pousse-pousse électrique, avec un guide local qui mêle histoire de la ville, anecdotes et culture, à un rythme bien plus tranquille qu'une visite guidée classique à pied. Prise en charge directe à l'hôtel incluse, pour ne pas se soucier de rejoindre un point de rendez-vous.</p>
    <a href="https://www.getyourguide.com/berlin-l17/full-day-rickshaw-tour-an-adventure-full-of-culture-and-delight-with-hotel-pickup-t856039/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver la visite en pousse-pousse — Berlin</a>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Organisez tout votre voyage, au même endroit</h3>
      <p class="trip-toolkit-subtitle">Besoin d'un vol, d'un hébergement, d'une voiture ou d'un transfert ? Retrouvez tout ici.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=eur&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Rechercher des billets d'avion</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Rechercher un hébergement</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Louer une voiture</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://intui.tpk.lu/xynzx1LU" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚕 Réserver un transfert</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
      </div>
      <div class="gyg-search-widget-wrap">
        <div class="gyg-widget" data-gyg-partner-id="LM6J21N" data-gyg-number-of-items="3" data-gyg-locale-code="en-US" data-gyg-type="search"></div>
      </div>
    </div>`,
  },
  {
    slug: "castles-europe",
    title: "Les plus beaux châteaux d'Europe",
    intro: "12 châteaux de conte de fées, à travers l'Europe, avec billets et visites réservables à l'avance",
    body: `
    <p>Des tours qui ont inspiré les parcs Disney aux forteresses médiévales cachées dans les forêts ou perchées sur des falaises au-dessus de lacs glaciaires — l'Europe compte parmi les plus beaux châteaux du monde. Voici 12 des plus beaux, avec des informations pratiques et des billets réservables à l'avance, pour éviter la file d'attente à l'entrée.</p>

    <h2 class="section-title"><span class="bar"></span>Les châteaux</h2>

    <h3>🇩🇪 Château de Neuschwanstein, Allemagne</h3>
    <p>Le château qui a directement inspiré les silhouettes des parcs Disney — des tours blanches et élancées, dressées sur un pic rocheux des Alpes bavaroises. Construit par le roi Louis II de Bavière comme une évasion romantique de la réalité, Neuschwanstein reste le château le plus photographié d'Europe, surtout en automne, quand les forêts environnantes se parent de couleurs.</p>
    <a href="https://www.getyourguide.com/munich-l26/from-munich-neuschwanstein-linderhof-castle-full-day-trip-t1753/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver la visite — Neuschwanstein &amp; Linderhof, au départ de Munich</a>

    <h3>🇩🇪 Château d'Eltz, Allemagne</h3>
    <p>Caché au cœur d'une forêt près de la Moselle, Eltz est l'un des rares châteaux allemands jamais détruit ni conquis — et il appartient à la même famille depuis plus de 850 ans. Sa silhouette, avec des tours d'époques différentes serrées sur un rocher étroit, semble tout droit sortie d'un conte de fées.</p>
    <a href="https://www.getyourguide.com/frankfurt-l21/frankfurt-day-trip-to-eltz-castle-on-the-moselle-t40707/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver la visite — Château d'Eltz, au départ de Francfort</a>

    <h3>🇩🇪 Château de Hohenzollern, Allemagne</h3>
    <p>Le siège ancestral de la famille royale prussienne, dressé fièrement sur un pic isolé, avec une vue s'étendant sur tout le sud de l'Allemagne les jours de beau temps. Son architecture néogothique du XIXe siècle, avec tours et créneaux, fait de Hohenzollern l'un des châteaux les plus spectaculaires à visiter en Europe.</p>
    <a href="https://www.getyourguide.com/sigmaringen-l100350/sigmaringen-hohenzollern-castle-entry-fee-audio-guide-t849245/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver le billet — Château de Hohenzollern</a>

    <h3>🇷🇴 Château de Peleș, Roumanie</h3>
    <p>Considéré par beaucoup comme le plus beau château de Roumanie, Peleș fut la résidence d'été du roi Carol Ier — un joyau néo-Renaissance aux intérieurs somptueux, construit au pied des montagnes Bucegi, à Sinaia. Chaque pièce possède son propre style décoratif, du mobilier allemand aux armes orientales.</p>
    <a href="https://www.getyourguide.com/sinaia-l124688/peles-castle-and-bran-castle-entry-tickets-t1414362/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver le billet combiné — Peleș &amp; Bran</a>

    <h3>🇷🇴 Château de Corvin, Roumanie</h3>
    <p>Une impressionnante forteresse gothique et Renaissance, construite par Jean Hunyade, avec tours, ponts suspendus et sombres légendes sur les cachots qu'elle abrite. L'une des forteresses médiévales les mieux préservées d'Europe de l'Est, et un spectacle particulièrement saisissant au coucher du soleil.</p>
    <a href="https://www.getyourguide.com/corvin-castle-l127588/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver le billet — Château de Corvin, Hunedoara</a>

    <h3>🇷🇴 Château de Bran, Roumanie</h3>
    <p>Connu à l'international comme le « château de Dracula », grâce au lien créé par le roman de Bram Stoker, Bran est une forteresse médiévale spectaculaire, perchée sur une falaise aux confins de la Transylvanie. Même si le véritable lien historique avec Vlad l'Empaleur reste discutable, l'atmosphère gothique du lieu ne déçoit jamais.</p>
    <a href="https://www.getyourguide.com/bran-l188057/bran-castle-dracula-s-castle-entry-ticket-with-audio-guide-t1380614/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver le billet — Château de Bran</a>

    <h3>🇵🇹 Palais de Pena, Portugal</h3>
    <p>Un palais romantique, aux couleurs extravagantes (rouge, jaune, violet), construit sur les collines de Sintra, souvent au-dessus des nuages les jours de brouillard. Un mélange éclectique de styles — gothique, manuélin, islamique, Renaissance — qui fait de Pena l'un des palais les plus photogéniques au monde, classé au patrimoine mondial de l'UNESCO.</p>
    <a href="https://www.getyourguide.com/lisbon-l42/lisbon-sintra-pena-regaleira-cabo-da-roca-cascais-tour-t881398/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver la visite — Sintra, Pena &amp; Cascais, au départ de Lisbonne</a>

    <h3>🇪🇸 Alcázar de Ségovie, Espagne</h3>
    <p>Avec sa silhouette effilée, telle un navire de pierre flottant au-dessus de la ville, l'Alcázar de Ségovie est souvent cité comme l'une des inspirations du château de Cendrillon dans les parcs Disney — une rivalité amicale avec Neuschwanstein pour ce titre. Une forteresse royale médiévale, utilisée pendant des siècles par les monarques castillans.</p>
    <a href="https://www.getyourguide.com/ro-ro/segovia-spania-l1694/din-madrid-excursie-de-o-zi-la-segovia-cu-bilet-de-intrare-la-alcazar-t1402263/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver la visite — Ségovie &amp; Alcázar, au départ de Madrid</a>

    <h3>🇫🇷 Château de Chambord, France</h3>
    <p>Le plus grand château de la vallée de la Loire, chef-d'œuvre de la Renaissance française, avec plus de 400 pièces et un célèbre escalier à double révolution, parfois attribué à Léonard de Vinci lui-même. Les jardins et la forêt alentour, qui s'étendent sur des milliers d'hectares, font de Chambord une expérience d'une journée entière, pas juste une visite rapide.</p>
    <a href="https://www.getyourguide.com/loire-valley-chateaux-l7956/chambord-skip-the-line-chateau-de-chambord-ticket-t183794/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver le billet coupe-file — Château de Chambord</a>

    <h3>🇨🇭 Château de Chillon, Suisse</h3>
    <p>Un château médiéval insulaire, construit à même un rocher du lac Léman, avec les Alpes en toile de fond — le monument historique le plus visité de Suisse. Le poète Lord Byron l'a rendu célèbre dans le monde entier avec son poème « Le Prisonnier de Chillon », inspiré des cachots situés dans les sous-sols du château.</p>
    <a href="https://www.chillon.ch/" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Voir les horaires et billets — Château de Chillon (site officiel)</a>

    <h3>🇸🇮 Château de Bled, Slovénie</h3>
    <p>Le plus ancien château de Slovénie, construit à flanc de falaise abrupte, à 130 mètres au-dessus du lac de Bled — l'une des vues les plus photographiées d'Europe centrale, avec la petite église de l'île au milieu du lac visible directement depuis ses remparts.</p>
    <a href="https://www.getyourguide.com/en-au/bled-castle-l140261/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver le billet — Château de Bled</a>

    <h3>🇵🇱 Château de Malbork, Pologne</h3>
    <p>Le plus grand château du monde par sa superficie — une immense forteresse de brique gothique rouge, construite par l'ordre Teutonique sur les rives de la Nogat. Classé au patrimoine mondial de l'UNESCO, Malbork impressionne par son ampleur, difficile à saisir avant de la voir de ses propres yeux.</p>
    <a href="https://www.getyourguide.com/gdansk-l1960/gdansk-malbork-castle-regular-tour-t218583/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver la visite — Château de Malbork, au départ de Gdańsk</a>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Organisez tout votre voyage, au même endroit</h3>
      <p class="trip-toolkit-subtitle">Besoin d'un vol, d'un hébergement, d'une voiture ou d'un transfert ? Retrouvez tout ici.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=eur&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Rechercher des billets d'avion</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Rechercher un hébergement</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Louer une voiture</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://intui.tpk.lu/xynzx1LU" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚕 Réserver un transfert</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
      </div>
    </div>`,
  },
  {
    slug: "amusement-parks-europe",
    title: "Les meilleurs parcs d'attractions d'Europe",
    intro: "6 parcs incontournables, pour tous les âges — de Disneyland Paris aux montagnes russes les plus intenses",
    body: `
    <p>Des parcs classiques aux personnages que les enfants adorent, jusqu'à certaines des montagnes russes les plus hautes du monde — l'Europe compte des parcs d'attractions pour tous les âges et tous les niveaux de sensations fortes. Voici quelques-uns des plus populaires, regroupés par catégorie, avec des billets réservables à l'avance.</p>

    <h2 class="section-title"><span class="bar"></span>👑 Les plus populaires et les plus visités (tout âge)</h2>

    <h3>🇫🇷 Disneyland Paris, France</h3>
    <p>Le parc d'attractions le plus visité d'Europe — deux parcs à thème complets (Disneyland Park et Walt Disney Studios), où les enfants peuvent rencontrer leurs personnages de dessins animés préférés, entre châteaux, parades et spectacles quotidiens. Une expérience complète, idéale pour un séjour de 2 à 3 jours.</p>
    <a href="https://www.getyourguide.com/paris-l16/disneyland-paris-2-parks-ticket-1-2-3-4-5-day-t395320/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver le billet — Disneyland Paris</a>

    <h3>🇩🇪 Europa-Park, Rust, Allemagne</h3>
    <p>Le deuxième plus grand parc d'attractions d'Europe, réparti en 18 zones thématiques, chacune consacrée à un pays européen. Il compte 13 montagnes russes spectaculaires, des zones plus douces pour les plus jeunes, des spectacles quotidiens et un immense parc aquatique (Rulantica) — pratiquement des vacances complètes en un seul lieu.</p>
    <a href="https://www.getyourguide.com/rust-l2882/rust-europa-park-entrance-ticket-t393563/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver le billet — Europa-Park, Rust</a>

    <h2 class="section-title"><span class="bar"></span>🧸 Idéal pour les tout-petits et les enfants d'âge préscolaire</h2>

    <h3>🇳🇱 Efteling, Kaatsheuvel, Pays-Bas</h3>
    <p>Un parc féerique, réputé pour l'atmosphère apaisante de sa Forêt des Contes — des personnages tirés des contes des frères Grimm, des sentiers verdoyants et un rythme bien plus doux que dans les parcs axés sur les sensations fortes. Idéal pour les jeunes enfants, qui succombent facilement à la magie du lieu.</p>
    <a href="https://www.getyourguide.com/amsterdam-l36/amsterdam-efteling-park-roundtrip-transfer-and-entry-ticket-t501550/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver le billet (avec transfert) — Efteling, au départ d'Amsterdam</a>

    <h3>🇩🇰 Legoland Billund, Danemark</h3>
    <p>Le parc Legoland original, construit spécialement pour les familles avec de jeunes enfants — des mini-villes spectaculaires entièrement construites en briques Lego, des attractions interactives et des activités pensées pour stimuler la créativité plutôt que les sensations fortes. Un lieu où les parents s'amusent tout autant que les petits.</p>
    <a href="https://www.getyourguide.com/billund-l87275/legoland-billund-entry-ticket-private-transfer-t1427002/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver le billet (avec transfert) — Legoland Billund</a>

    <h2 class="section-title"><span class="bar"></span>🎢 Idéal pour l'aventure et les sensations fortes (enfants plus grands)</h2>

    <h3>🇮🇹 Gardaland, Castelnuovo del Garda, Italie</h3>
    <p>Juste à côté du splendide lac de Garde, Gardaland associe des montagnes russes intenses (comme Oblivion ou Raptor) à un espace dédié aux plus petits (Peppa Pig Land) — un équilibre rare entre sensations fortes pour les adolescents et amusement pour toute la famille, au sein d'un même parc.</p>
    <a href="https://www.getyourguide.com/garda-l145126/gardaland-park-fixed-day-entry-ticket-t225588/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver le billet — Gardaland</a>

    <h3>🇵🇱 Energylandia, Zator, Pologne</h3>
    <p>Le plus grand parc d'attractions de Pologne, reconnu dans toute l'Europe pour son grand nombre de montagnes russes modernes — dont Zadra, l'une des plus hautes montagnes russes hybrides au monde. Il dispose aussi d'un vaste espace aquatique et de zones spécialement conçues pour les plus jeunes, si bien qu'il ne s'adresse pas qu'aux amateurs de sensations fortes.</p>
    <a href="https://www.getyourguide.com/krakow-l40/krakow-energylandia-full-day-ticket-with-optional-pickup-t114202/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Réserver le billet (avec prise en charge en option) — Energylandia, au départ de Cracovie</a>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Organisez tout votre voyage, au même endroit</h3>
      <p class="trip-toolkit-subtitle">Besoin d'un vol, d'un hébergement, d'une voiture ou d'un transfert ? Retrouvez tout ici.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=eur&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Rechercher des billets d'avion</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Rechercher un hébergement</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Louer une voiture</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://intui.tpk.lu/xynzx1LU" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚕 Réserver un transfert</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
      </div>
    </div>`,
  },
])

exports.TRAVEL_GUIDES_ES = [
  {
    slug: "transport",
    title: "Cómo llegar de forma eficiente a las grandes atracciones turísticas",
    intro: "Guía de transporte urbano y regional",
    body: `
    <p>Un buen itinerario depende en gran medida de cómo te muevas entre las atracciones. Cuando quieres visitar museos, castillos o monumentos históricos, la conexión entre ciudades y la logística local marcan la diferencia entre un día relajado y uno perdido entre estaciones y paradas.</p>
    <p>Para distancias largas o entre regiones históricas, el tren sigue siendo la opción más popular — la red ferroviaria europea conecta la mayoría de las capitales con ciudades más pequeñas, a menudo por rutas pintorescas. Los autobuses cubren bien los huecos, especialmente hacia localidades o zonas montañosas a las que el tren no llega directamente, y suelen costar menos.</p>
    <p>Si aterrizas en el aeropuerto con mucho equipaje o viajas en grupo, un traslado privado reservado con antelación elimina el engorro de cambiar de medio de transporte — te lleva directamente desde la terminal hasta la puerta del castillo o el hotel. Planificar estas conexiones con antelación convierte un viaje ajetreado en uno sin estrés.</p>
    <div class="plan-visit-block" style="display:block">
      ${TRAVEL_GUIDES_MONETIZATION_READY
        ? `
      <a href="${escapeHtml(getTransferLinkFor())}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking-alt">🚕 Reservar un traslado privado</a>`
        : `<p class="plan-visit-hint">${comingSoonTextFor("es")}</p>`}
    </div>`,
  },
  {
    slug: "parking",
    title: "Cómo gestionar el aparcamiento cerca de zonas históricas",
    intro: "Guía del conductor — aparcamiento en los cascos antiguos",
    body: `
    <p>Conducir tu propio coche o uno de alquiler te da una libertad de movimiento que otros medios de transporte no pueden igualar — pero los centros históricos de las ciudades son conocidos por sus restricciones de tráfico y su crónica escasez de aparcamiento.</p>
    <p>Dejar el coche en cualquier sitio conlleva el riesgo de multa, o incluso de que se lo lleve la grúa. La opción más segura sigue siendo un aparcamiento seguro, subterráneo o en superficie, gestionado de forma privada — muchos permiten reservar plaza con antelación, algo que importa especialmente los fines de semana o en temporada alta, cuando las atracciones están más concurridas.</p>
    <p>Un aparcamiento bien elegido, a pocos pasos del museo o del casco antiguo, te da la libertad de explorar a tu ritmo, sin preocuparte por el coche. Comprueba la disponibilidad con antelación y reserva online — merece la pena, sobre todo en un fin de semana con mucha afluencia.</p>
    <div class="plan-visit-block" style="display:block">
      ${TRAVEL_GUIDES_MONETIZATION_READY
        ? `<a href="https://www.awin1.com/cread.php?awinmid=18633&awinaffid=3051943&campaign=Your%20Parking%20Space&ued=https%3A%2F%2Fwww.yourparkingspace.co.uk%2F" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking">🅿️ Aparcamiento UK — reserva con antelación</a>
      <p class="plan-visit-hint">🅿️ Aparcamiento UE — próximamente</p>`
        : `<p class="plan-visit-hint">${comingSoonTextFor("es")}</p>`}
    </div>`,
  },
  {
    slug: "restaurants",
    title: "Cómo planificar un día de excursión perfecto",
    intro: "Coordinar los horarios de apertura con las comidas",
    body: `
    <p>Un gran día de excursión consiste en equilibrar cultura y descanso. Si organizas tu día en torno al horario de un museo o una galería, merece la pena planificar también tus pausas para comer con antelación — de lo contrario, corres el riesgo de llegar hambriento justo cuando todos los locales cercanos están llenos.</p>
    <p>Las grandes atracciones reciben miles de visitantes cada día, y las zonas a su alrededor se llenan rápido, sobre todo a la hora de comer y cenar. Reservar con antelación a través de una plataforma online te garantiza una mesa sin hacer cola ni buscar desesperadamente un sitio libre a última hora.</p>
    <p>El patrón más eficiente: visita las exposiciones a primera hora de la mañana, cuando hay tranquilidad, y termina el día con una comida reservada con antelación en un restaurante local — una simple excursión se convierte así en un recuerdo que de verdad querrás conservar.</p>
    <div class="plan-visit-block" style="display:block">
      ${TRAVEL_GUIDES_MONETIZATION_READY
        ? `<a href="${escapeHtml(linkTheForkAffiliate || "https://www.thefork.com/")}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-booking">🍽️ Buscar en TheFork (Francia, Italia, España)</a>
      <a href="${escapeHtml(linkOpenTableAffiliate || "https://www.opentable.com/")}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking-alt">🍽️ Buscar en OpenTable (Reino Unido, Alemania)</a>`
        : `<p class="plan-visit-hint">${comingSoonTextFor("es")}</p>`}
    </div>`,
  },
  {
    slug: "flights",
    title: "Cómo encontrar los mejores billetes de avión",
    intro: "Guía de búsqueda de vuelos, con comparador de precios en tiempo real",
    body: `
    <p>El billete de avión suele ser el gasto más grande de un viaje — y el más fácil de optimizar, si sabes dónde buscar. Las diferencias de precio entre aerolíneas, entre días de la semana o entre aeropuertos cercanos pueden llegar a cientos de euros para el mismo destino.</p>
    <p>Un comparador que busca a la vez en decenas de aerolíneas (incluidas las low-cost) te muestra de un vistazo la opción más barata, sin importar quién la opere — mucho más rápido que revisar manualmente la web de cada aerolínea.</p>
    <p>Busca aquí abajo directamente, sin salir de la página — indica la ciudad de origen y el destino, y los resultados aparecen en tiempo real, con precios actualizados.</p>
    <a href="https://aviasales.tpk.lu/vB6Uc9BC" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">✈️ Busca billetes de avión</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>`,
  },
].concat(exports.TRAVEL_GUIDES_EN.slice(4,5), [
  {
    slug: "day-trips-tours-europe",
    title: "Las mejores excursiones y visitas guiadas en Europa",
    intro: "13 de las mejores visitas, por toda Europa, con entradas y horarios que puedes reservar con antelación",
    body: `
    <p>Reservar un tour con antelación significa una plaza garantizada, un guía confirmado y, a menudo, acceso a lugares donde de otro modo tendrías que hacer cola durante horas. A continuación, algunas de las excursiones y tours más populares en las grandes ciudades de Europa — desde paseos en barco por el Danubio hasta rutas por la historia antigua de Roma o Atenas.</p>

    <h2 class="section-title"><span class="bar"></span>Tours recomendados</h2>

    <h3>Bucarest — Monasterio de Snagov, palacio de Mogoșoaia y mina de sal de Slănic</h3>
    <p>Una excursión perfecta para quienes quieren ver, en una sola ruta, tres facetas completamente distintas de los alrededores de Bucarest: la calma de la isla del monasterio de Snagov, la elegancia del palacio de Mogoșoaia y la impresionante mina de sal de Slănic, excavada en lo profundo de la montaña. Ideal si solo tienes un día libre en la capital y quieres escapar del bullicio de la ciudad.</p>
    <a href="https://www.getyourguide.com/slanic-l91935/snagov-monastery-mogosoaia-salt-mine-day-trip-bucharest-t1221626/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la excursión — Snagov, Mogoșoaia y la mina de sal de Slănic</a>

    <h3>Bucarest — Excursión de un día al delta del Danubio</h3>
    <p>El delta del Danubio es una de las reservas naturales más espectaculares de Europa, con una biodiversidad única — pelícanos, cormoranes y cientos de especies de aves, entre canales estrechos y pueblos de pescadores. Una excursión de un día desde Bucarest, con transporte incluido, es la forma más sencilla de vivir el ambiente del delta sin organizar tu propio transporte.</p>
    <a href="https://www.getyourguide.com/bucharest-l111/from-bucharest-day-trip-to-danube-delta-t662170/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la excursión — Delta del Danubio</a>

    <h3>Viena — Crucero por el Danubio, con almuerzo opcional</h3>
    <p>Viena vista desde el agua cuenta una historia completamente distinta — puentes históricos, edificios imperiales y parques verdes desfilan junto a las orillas del Danubio. Un crucero relajante, con almuerzo opcional a bordo, es un descanso muy bienvenido tras una mañana recorriendo a pie el centro histórico.</p>
    <a href="https://www.getyourguide.com/vienna-l7/vienna-city-cruise-with-optional-lunch-t58823/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar el crucero — Viena</a>

    <h3>Budapest — Crucero panorámico nocturno por el Danubio</h3>
    <p>Budapest iluminada de noche es, para muchos, el skyline urbano más bello de Europa Central — el Parlamento, el Puente de las Cadenas y el Castillo de Buda brillan a lo largo del Danubio. Un crucero al atardecer es la forma clásica, casi obligatoria, de ver la ciudad desde el ángulo perfecto.</p>
    <a href="https://www.getyourguide.com/budapest-l29/budapest-evening-sightseeing-cruise-on-the-danube-t1117141/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar el crucero — Budapest</a>

    <h3>Ámsterdam — Excursión de un día a Brujas</h3>
    <p>Brujas está considerada una de las ciudades medievales mejor conservadas de Europa — canales, puentes de piedra y edificios góticos, todo reunido en un centro histórico compacto y fácil de recorrer a pie. Una excursión desde Ámsterdam, con guía en inglés o español, es la opción sencilla para quien no quiere complicarse con el transporte.</p>
    <a href="https://www.getyourguide.com/amsterdam-l36/from-amsterdam-bruges-day-tour-in-spanish-or-english-t2633/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program&cmp=amsterdam" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la excursión — Brujas, desde Ámsterdam</a>

    <h3>La Haya — Entrada para el museo Panorama Mesdag</h3>
    <p>El Panorama Mesdag es una enorme pintura circular de 1881 que envuelve por completo al visitante con una vista del pueblo pesquero de Scheveningen del siglo XIX — una experiencia visual única, difícil de imaginar hasta verla con tus propios ojos. Un museo pequeño pero espectacular, a pocos pasos del centro de La Haya.</p>
    <a href="https://www.getyourguide.com/the-hague-l1267/the-hague-entry-ticket-to-the-panorama-mesdag-museum-t391318/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la entrada — Museo Panorama Mesdag, La Haya</a>

    <h3>Praga — Fortaleza de Vyšehrad, la joya escondida de la ciudad</h3>
    <p>Mientras la mayoría de los turistas se agolpan en el Castillo de Praga, Vyšehrad sigue siendo una opción mucho más tranquila — una fortaleza histórica a orillas del Moldava, con vistas magníficas y un cementerio donde descansan grandes figuras checas. Un lugar perfecto para quien quiere ver Praga sin las multitudes.</p>
    <a href="https://www.getyourguide.com/prague-l10/prague-s-best-hidden-gem-vysehrad-castle-historic-fort-t1011583/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la visita — Fortaleza de Vyšehrad, Praga</a>

    <h3>Roma — Coliseo con acceso al suelo de la arena y Foro Romano</h3>
    <p>Pocos visitantes llegan a pisar el suelo real de la arena del Coliseo, justo donde antaño combatían los gladiadores — un acceso especial, disponible solo con entradas dedicadas. Combinada con una visita guiada al Foro Romano, la excursión reconstruye, paso a paso, la vida cotidiana en la Roma antigua.</p>
    <a href="https://www.getyourguide.com/rome-l33/rome-colosseum-gladiator-floor-access-roman-forum-tour-t633431/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la visita — Coliseo y Foro Romano</a>

    <h3>París — Visita en grupo reducido al interior de Notre-Dame</h3>
    <p>Tras años de restauración, visitar el interior de Notre-Dame tiene un significado especial — arquitectura gótica, vidrieras e historia de la catedral, explicadas por un guía local, en grupos pequeños de hasta 5 personas, para una experiencia mucho más personal que una visita corriente.</p>
    <a href="https://www.getyourguide.com/paris-l16/paris-small-group-interior-tour-of-notre-dame-max-5-people-t607051/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la visita — Interior de Notre-Dame</a>

    <h3>Madrid — Entrada combinada: San Antonio de los Alemanes y monasterio de San Plácido</h3>
    <p>Dos de las iglesias barrocas menos conocidas pero más espectaculares de Madrid — bóvedas pintadas, altares dorados y una rara calma en pleno corazón de la ciudad. Una entrada combinada, ideal para quien quiere descubrir Madrid más allá de sus grandes y abarrotados museos.</p>
    <a href="https://www.getyourguide.com/madrid-l46/combo-entry-to-san-antonio-de-los-alemanes-and-the-monastery-of-san-placido-t1103055/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la entrada combinada — Madrid</a>

    <h3>Bratislava — Tour panorámico en autobús</h3>
    <p>Bratislava se descubre rápida y cómodamente desde un autobús panorámico — el castillo de Bratislava, la Puerta de San Miguel y los edificios históricos de la capital eslovaca, todo en una única ruta sencilla y sin esfuerzo, ideal sobre todo cuando el tiempo apremia en una escapada urbana.</p>
    <a href="https://www.getyourguide.com/bratislava-l765/bratislava-sightseeing-bus-tour-t28703/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar el tour — Bratislava</a>

    <h3>Lisboa — Museo del Tesoro Real</h3>
    <p>Coronas, joyas reales y objetos de un valor histórico inmenso, expuestos en uno de los museos menos concurridos de Lisboa. Una parada corta pero espectacular para quien quiere ver otra cara de la monarquía portuguesa, lejos de los circuitos turísticos clásicos.</p>
    <a href="https://www.getyourguide.com/lisbon-l42/lisbon-royal-treasure-museum-entry-ticket-t425344/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la entrada — Museo del Tesoro Real, Lisboa</a>

    <h3>Atenas — Excursión de un día a Delfos</h3>
    <p>Delfos, considerada en la Antigüedad el «ombligo del mundo», albergaba el oráculo más importante del mundo griego — ruinas impresionantes, en un paisaje montañoso espectacular, a pocas horas de Atenas. La excursión incluye audioguía multilingüe, ideal para quien quiere disfrutar de la historia antigua sin tener que organizarla por su cuenta.</p>
    <a href="https://www.getyourguide.com/athens-l91/from-athens-delphi-day-trip-with-multilingual-audioguide-t748369/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la excursión — Delfos, desde Atenas</a>

    <h3>Estambul — Crucero con cena y espectáculo por el Cuerno de Oro y el Bósforo</h3>
    <p>Una noche sobre el agua, con Estambul iluminada a ambos lados del Bósforo — cena a bordo, música en vivo y danzas tradicionales, en un crucero que combina las vistas de la ciudad con una experiencia cultural completa. Una forma inolvidable de cerrar cualquier visita a Estambul.</p>
    <a href="https://www.getyourguide.com/istanbul-l56/istanbul-golden-horn-bosphorus-dinner-and-show-t459410/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar el crucero con cena — Estambul</a>

    <h3>Estocolmo — Excursión en barco por el archipiélago</h3>
    <p>El archipiélago de Estocolmo son más de 30.000 islas e islotes, salpicados de tradicionales casitas suecas rojas — un paisaje que simplemente no se ve desde el centro de la ciudad. Una excursión en barco de unas horas revela una cara totalmente distinta, mucho más tranquila y natural, de la capital sueca.</p>
    <a href="https://www.getyourguide.com/stockholm-l50/stockholm-archipelago-boat-tour-t811343/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la excursión — Archipiélago de Estocolmo</a>

    <h3>Constanza — Entrada para la isla de Mainau</h3>
    <p>La isla de Mainau, en el lago de Constanza, es conocida como la «isla de las flores» — jardines botánicos impecables, un castillo barroco y vistas espectaculares hacia los Alpes, en la frontera entre Alemania, Suiza y Austria. Un lugar perfecto para un día relajado, lejos de los circuitos urbanos habituales.</p>
    <a href="https://www.getyourguide.com/konstanz-l204/entrance-ticket-for-the-mainau-island-t561436/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la entrada — Isla de Mainau, Constanza</a>

    <h3>Mónaco — Tour panorámico Mónaco-Montecarlo (Hop-on Hop-off)</h3>
    <p>Mónaco es pequeño pero está lleno de lugares de interés — el Palacio Principesco, el famoso casino de Montecarlo y el circuito de Fórmula 1, todo accesible con un único billete de autobús panorámico, con paradas gratuitas en cada punto de interés, a tu propio ritmo.</p>
    <a href="https://www.getyourguide.com/monaco-l515/monaco-monte-carlo-hop-on-hop-off-bus-tour-t170400/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar el tour — Mónaco y Montecarlo</a>

    <h3>Múnich — Tour guiado en patinete eléctrico, 2 horas, por los lugares imprescindibles</h3>
    <p>Una forma rápida y divertida de conocer el centro de Múnich — Marienplatz, la Frauenkirche, el Jardín Inglés y el resto de los lugares esenciales — en patinete eléctrico guiado, en solo 2 horas. Ideal para quien tiene poco tiempo en la ciudad pero aun así quiere ver lo máximo posible, sin el cansancio de caminar.</p>
    <a href="https://www.getyourguide.com/munich-l26/munchen-top-sights-2h-guided-e-scooter-tour-t463376/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar el tour — Tour en patinete por Múnich</a>

    <h3>Barcelona — Entrada sin colas para la Sagrada Família</h3>
    <p>La Sagrada Família es probablemente la obra inacabada más famosa de la historia de la arquitectura — la obra maestra de Gaudí, con torres que se elevan hacia el cielo y vidrieras que convierten la luz del interior en un juego de colores. Una entrada sin colas te ahorra horas de espera, especialmente en temporada alta.</p>
    <a href="https://www.getyourguide.com/barcelona-l45/sagrada-familia-skip-the-line-ticket-t50027/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la entrada sin colas — Sagrada Família</a>

    <h3>Venecia — Entrada sin colas para la Basílica de San Marcos, con app de audioguía</h3>
    <p>La Basílica de San Marcos, con sus mosaicos dorados y sus cúpulas bizantinas, es el corazón de Venecia — pero también una de las iglesias más visitadas del mundo, con colas que pueden durar horas en temporada alta. Una entrada sin colas, con app de audioguía incluida, te permite disfrutar del interior a tu ritmo, sin perder tiempo esperando fuera.</p>
    <a href="https://www.getyourguide.com/venice-l35/venice-st-mark-s-basilica-skip-the-line-ticket-audio-app-t395051/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la entrada sin colas — Basílica de San Marcos, Venecia</a>

    <h3>Florencia — Museo interactivo Leonardo da Vinci</h3>
    <p>Un museo original, dedicado por completo al genio de Leonardo da Vinci — maquetas funcionales, réplicas de sus inventos mecánicos y exposiciones interactivas que se pueden tocar y probar, no solo mirar de lejos. Una parada divertida y educativa, especialmente adecuada para familias con niños.</p>
    <a href="https://www.getyourguide.com/florence-l32/florence-leonardo-interactive-museum-entry-ticket-t86558/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la entrada — Museo interactivo Leonardo da Vinci, Florencia</a>

    <h3>Zúrich — Lindt Home of Chocolate</h3>
    <p>La fuente de chocolate más grande del mundo, todo el proceso de elaboración explicado paso a paso y, por supuesto, degustaciones — un museo dedicado por completo a la pasión suiza por el chocolate. Una experiencia dulce, apta para cualquier edad, a pocos pasos del lago de Zúrich.</p>
    <a href="https://www.getyourguide.com/zurich-l55/lindt-home-of-chocolate-museum-entry-ticket-t396265/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la entrada — Lindt Home of Chocolate, Zúrich</a>

    <h3>Berlín — Tour en rickshaw de día completo, con recogida en el hotel</h3>
    <p>Una forma original y relajante de descubrir Berlín — en rickshaw eléctrico, con un guía local que combina la historia de la ciudad con anécdotas y cultura, a un ritmo mucho más pausado que un tour a pie clásico. Incluye recogida directa en el hotel, para no preocuparse de llegar a un punto de encuentro.</p>
    <a href="https://www.getyourguide.com/berlin-l17/full-day-rickshaw-tour-an-adventure-full-of-culture-and-delight-with-hotel-pickup-t856039/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar el tour en rickshaw — Berlín</a>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Organiza todo tu viaje, en un solo lugar</h3>
      <p class="trip-toolkit-subtitle">¿Necesitas vuelo, alojamiento, coche o traslado? Encuéntralo todo aquí.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=eur&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Buscar billetes de avión</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Buscar alojamiento</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Alquilar un coche</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://intui.tpk.lu/xynzx1LU" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚕 Reservar un traslado</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
      </div>
      <div class="gyg-search-widget-wrap">
        <div class="gyg-widget" data-gyg-partner-id="LM6J21N" data-gyg-number-of-items="3" data-gyg-locale-code="en-US" data-gyg-type="search"></div>
      </div>
    </div>`,
  },
  {
    slug: "castles-europe",
    title: "Los castillos más bonitos de Europa",
    intro: "12 castillos de cuento, por toda Europa, con entradas y tours que puedes reservar con antelación",
    body: `
    <p>Desde las torres que inspiraron los parques Disney hasta fortalezas medievales escondidas en bosques o encaramadas en acantilados sobre lagos glaciares — Europa tiene algunos de los castillos más espectaculares del mundo. A continuación, 12 de los más bonitos, con información práctica y entradas que puedes reservar con antelación, para saltarte la cola en la entrada.</p>

    <h2 class="section-title"><span class="bar"></span>Los castillos</h2>

    <h3>🇩🇪 Castillo de Neuschwanstein, Alemania</h3>
    <p>El castillo que inspiró directamente las siluetas de los parques Disney — esbeltas torres blancas, alzadas sobre un pico rocoso en los Alpes bávaros. Construido por el rey Luis II de Baviera como una huida romántica de la realidad, Neuschwanstein sigue siendo el castillo más fotografiado de Europa, especialmente en otoño, cuando los bosques que lo rodean se tiñen de color.</p>
    <a href="https://www.getyourguide.com/munich-l26/from-munich-neuschwanstein-linderhof-castle-full-day-trip-t1753/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar el tour — Neuschwanstein y Linderhof, desde Múnich</a>

    <h3>🇩🇪 Castillo de Eltz, Alemania</h3>
    <p>Escondido en lo profundo de un bosque cerca del río Mosela, Eltz es uno de los pocos castillos alemanes que nunca fue destruido ni conquistado — y pertenece a la misma familia desde hace más de 850 años. Su silueta, con torres de diferentes épocas apiñadas sobre una roca estrecha, parece sacada directamente de un cuento de hadas.</p>
    <a href="https://www.getyourguide.com/frankfurt-l21/frankfurt-day-trip-to-eltz-castle-on-the-moselle-t40707/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar el tour — Castillo de Eltz, desde Fráncfort</a>

    <h3>🇩🇪 Castillo de Hohenzollern, Alemania</h3>
    <p>La sede ancestral de la familia real prusiana, orgullosamente alzada sobre un pico aislado, con vistas que se extienden por todo el sur de Alemania en los días despejados. Su arquitectura neogótica del siglo XIX, con torres y almenas, hace de Hohenzollern uno de los castillos más impresionantes que se pueden visitar en Europa.</p>
    <a href="https://www.getyourguide.com/sigmaringen-l100350/sigmaringen-hohenzollern-castle-entry-fee-audio-guide-t849245/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la entrada — Castillo de Hohenzollern</a>

    <h3>🇷🇴 Castillo de Peleș, Rumanía</h3>
    <p>Considerado por muchos el castillo más bello de Rumanía, Peleș fue la residencia de verano del rey Carol I — una joya neorrenacentista de interiores suntuosos, construida a los pies de las montañas Bucegi, en Sinaia. Cada habitación tiene su propio estilo decorativo, desde mobiliario alemán hasta armas orientales.</p>
    <a href="https://www.getyourguide.com/sinaia-l124688/peles-castle-and-bran-castle-entry-tickets-t1414362/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la entrada combinada — Peleș y Bran</a>

    <h3>🇷🇴 Castillo de Corvin, Rumanía</h3>
    <p>Una impresionante fortaleza gótico-renacentista, construida por Juan Hunyadi, con torres, puentes colgantes y oscuras leyendas sobre las mazmorras que esconde. Una de las fortalezas medievales mejor conservadas de Europa del Este, y una vista especialmente espectacular al atardecer.</p>
    <a href="https://www.getyourguide.com/corvin-castle-l127588/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la entrada — Castillo de Corvin, Hunedoara</a>

    <h3>🇷🇴 Castillo de Bran, Rumanía</h3>
    <p>Conocido internacionalmente como el «castillo de Drácula», gracias al vínculo creado por la novela de Bram Stoker, Bran es una espectacular fortaleza medieval, encaramada sobre un acantilado en el límite de Transilvania. Aunque el vínculo histórico real con Vlad el Empalador es discutible, el ambiente gótico del lugar nunca decepciona.</p>
    <a href="https://www.getyourguide.com/bran-l188057/bran-castle-dracula-s-castle-entry-ticket-with-audio-guide-t1380614/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la entrada — Castillo de Bran</a>

    <h3>🇵🇹 Palacio de la Pena, Portugal</h3>
    <p>Un palacio romántico, de colores extravagantes (rojo, amarillo, morado), construido en las colinas de Sintra, a menudo por encima de las nubes en los días de niebla. Una mezcla ecléctica de estilos — gótico, manuelino, islámico, renacentista — que convierte a Pena en uno de los palacios más fotogénicos del mundo, Patrimonio de la Humanidad por la UNESCO.</p>
    <a href="https://www.getyourguide.com/lisbon-l42/lisbon-sintra-pena-regaleira-cabo-da-roca-cascais-tour-t881398/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar el tour — Sintra, Pena y Cascais, desde Lisboa</a>

    <h3>🇪🇸 Alcázar de Segovia, España</h3>
    <p>Con su silueta afilada, como un barco de piedra flotando sobre la ciudad, el Alcázar de Segovia suele citarse como una de las inspiraciones del castillo de Cenicienta en los parques Disney — una rivalidad amistosa con Neuschwanstein por ese título. Una fortaleza real medieval, utilizada durante siglos por los monarcas castellanos.</p>
    <a href="https://www.getyourguide.com/ro-ro/segovia-spania-l1694/din-madrid-excursie-de-o-zi-la-segovia-cu-bilet-de-intrare-la-alcazar-t1402263/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar el tour — Segovia y Alcázar, desde Madrid</a>

    <h3>🇫🇷 Castillo de Chambord, Francia</h3>
    <p>El castillo más grande del Valle del Loira, obra maestra del Renacimiento francés, con más de 400 estancias y una famosa escalera de doble hélice, atribuida en ocasiones al propio Leonardo da Vinci. Los jardines y el bosque circundante, que se extienden por miles de hectáreas, hacen de Chambord una experiencia de día completo, no solo una visita rápida.</p>
    <a href="https://www.getyourguide.com/loire-valley-chateaux-l7956/chambord-skip-the-line-chateau-de-chambord-ticket-t183794/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la entrada sin colas — Castillo de Chambord</a>

    <h3>🇨🇭 Castillo de Chillon, Suiza</h3>
    <p>Un castillo medieval insular, construido directamente sobre una roca del lago Lemán, con los Alpes como telón de fondo — el monumento histórico más visitado de Suiza. El poeta Lord Byron lo hizo mundialmente famoso con su poema «El prisionero de Chillon», inspirado en las mazmorras del sótano del castillo.</p>
    <a href="https://www.chillon.ch/" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Ver horarios y entradas — Castillo de Chillon (sitio oficial)</a>

    <h3>🇸🇮 Castillo de Bled, Eslovenia</h3>
    <p>El castillo más antiguo de Eslovenia, construido justo sobre un acantilado escarpado, 130 metros por encima del lago Bled — una de las vistas más fotografiadas de Europa Central, con la pequeña iglesia de la isla en medio del lago visible directamente desde sus murallas.</p>
    <a href="https://www.getyourguide.com/en-au/bled-castle-l140261/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la entrada — Castillo de Bled</a>

    <h3>🇵🇱 Castillo de Malbork, Polonia</h3>
    <p>El castillo más grande del mundo por superficie — una enorme fortaleza de ladrillo gótico rojo, construida por la Orden Teutónica a orillas del río Nogat. Patrimonio de la Humanidad por la UNESCO, Malbork impresiona por su escala, difícil de asimilar hasta verla con tus propios ojos.</p>
    <a href="https://www.getyourguide.com/gdansk-l1960/gdansk-malbork-castle-regular-tour-t218583/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar el tour — Castillo de Malbork, desde Gdansk</a>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Organiza todo tu viaje, en un solo lugar</h3>
      <p class="trip-toolkit-subtitle">¿Necesitas vuelo, alojamiento, coche o traslado? Encuéntralo todo aquí.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=eur&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Buscar billetes de avión</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Buscar alojamiento</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Alquilar un coche</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://intui.tpk.lu/xynzx1LU" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚕 Reservar un traslado</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
      </div>
    </div>`,
  },
  {
    slug: "amusement-parks-europe",
    title: "Los mejores parques de atracciones de Europa",
    intro: "6 parques imprescindibles, para todas las edades — desde Disneyland Paris hasta las montañas rusas más intensas",
    body: `
    <p>Desde parques clásicos con personajes que encantan a los niños hasta algunas de las montañas rusas más altas del mundo — Europa tiene parques de atracciones para todas las edades y todos los niveles de adrenalina. A continuación, algunos de los más populares, agrupados por categoría, con entradas que puedes reservar con antelación.</p>

    <h2 class="section-title"><span class="bar"></span>👑 Los más populares y visitados (todas las edades)</h2>

    <h3>🇫🇷 Disneyland Paris, Francia</h3>
    <p>El parque de atracciones más visitado de Europa — dos parques temáticos completos (Disneyland Park y Walt Disney Studios), donde los niños pueden conocer a sus personajes de dibujos animados favoritos, entre castillos, desfiles y espectáculos diarios. Una experiencia completa, ideal para unas vacaciones de 2 o 3 días.</p>
    <a href="https://www.getyourguide.com/paris-l16/disneyland-paris-2-parks-ticket-1-2-3-4-5-day-t395320/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la entrada — Disneyland Paris</a>

    <h3>🇩🇪 Europa-Park, Rust, Alemania</h3>
    <p>El segundo parque de atracciones más grande de Europa, estructurado en 18 zonas temáticas, cada una dedicada a un país europeo. Cuenta con 13 espectaculares montañas rusas, zonas más tranquilas para los más pequeños, espectáculos diarios y un enorme parque acuático (Rulantica) — prácticamente unas vacaciones completas en un solo lugar.</p>
    <a href="https://www.getyourguide.com/rust-l2882/rust-europa-park-entrance-ticket-t393563/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la entrada — Europa-Park, Rust</a>

    <h2 class="section-title"><span class="bar"></span>🧸 Lo mejor para los más pequeños y preescolares</h2>

    <h3>🇳🇱 Efteling, Kaatsheuvel, Países Bajos</h3>
    <p>Un parque de cuento, famoso por el ambiente relajante de su Bosque de los Cuentos — personajes de los relatos de los hermanos Grimm, senderos llenos de vegetación y un ritmo mucho más tranquilo que el de los parques centrados en la adrenalina. Ideal para los niños pequeños, que caen fácilmente bajo el hechizo del lugar.</p>
    <a href="https://www.getyourguide.com/amsterdam-l36/amsterdam-efteling-park-roundtrip-transfer-and-entry-ticket-t501550/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la entrada (con traslado) — Efteling, desde Ámsterdam</a>

    <h3>🇩🇰 Legoland Billund, Dinamarca</h3>
    <p>El parque Legoland original, construido especialmente para familias con niños pequeños — espectaculares miniciudades hechas por completo de piezas de Lego, atracciones interactivas y actividades pensadas para estimular la creatividad, no solo la adrenalina. Un lugar donde los padres juegan tanto como los pequeños.</p>
    <a href="https://www.getyourguide.com/billund-l87275/legoland-billund-entry-ticket-private-transfer-t1427002/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la entrada (con traslado) — Legoland Billund</a>

    <h2 class="section-title"><span class="bar"></span>🎢 Lo mejor para la aventura y la adrenalina (niños más mayores)</h2>

    <h3>🇮🇹 Gardaland, Castelnuovo del Garda, Italia</h3>
    <p>Justo al lado del espléndido lago de Garda, Gardaland combina montañas rusas intensas (como Oblivion o Raptor) con una zona dedicada a los más pequeños (Peppa Pig Land) — un equilibrio poco habitual entre adrenalina para los adolescentes y diversión para toda la familia, en el mismo parque.</p>
    <a href="https://www.getyourguide.com/garda-l145126/gardaland-park-fixed-day-entry-ticket-t225588/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la entrada — Gardaland</a>

    <h3>🇵🇱 Energylandia, Zator, Polonia</h3>
    <p>El parque de atracciones más grande de Polonia, reconocido en toda Europa por su enorme número de montañas rusas modernas — entre ellas Zadra, una de las montañas rusas híbridas más altas del mundo. También cuenta con una gran zona acuática y áreas pensadas especialmente para los más pequeños, por lo que no es solo para los amantes de la adrenalina.</p>
    <a href="https://www.getyourguide.com/krakow-l40/krakow-energylandia-full-day-ticket-with-optional-pickup-t114202/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Reservar la entrada (con recogida opcional) — Energylandia, desde Cracovia</a>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Organiza todo tu viaje, en un solo lugar</h3>
      <p class="trip-toolkit-subtitle">¿Necesitas vuelo, alojamiento, coche o traslado? Encuéntralo todo aquí.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=eur&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Buscar billetes de avión</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Buscar alojamiento</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Alquilar un coche</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://intui.tpk.lu/xynzx1LU" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚕 Reservar un traslado</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
      </div>
    </div>`,
  },
])

exports.TRAVEL_GUIDES_IT = [
  {
    slug: "transport",
    title: "Come raggiungere in modo efficiente le grandi attrazioni turistiche",
    intro: "Guida ai trasporti urbani e regionali",
    body: `
    <p>Un buon itinerario dipende molto da come ci si sposta tra le attrazioni. Quando si vogliono visitare musei, castelli o monumenti storici, il collegamento tra le città e la logistica locale fanno la differenza tra una giornata rilassata e una persa tra stazioni e fermate.</p>
    <p>Per le lunghe distanze o tra regioni storiche, il treno resta l'opzione più popolare — la rete ferroviaria europea collega la maggior parte delle capitali con le città più piccole, spesso lungo percorsi panoramici. I pullman coprono bene i vuoti, soprattutto verso località o zone montane non raggiunte direttamente dal treno, e di solito costano meno.</p>
    <p>Se atterri in aeroporto con molti bagagli o viaggi in gruppo, un trasferimento privato prenotato in anticipo elimina il fastidio di cambiare mezzo di trasporto — ti porta direttamente dal terminal al cancello del castello o all'hotel. Pianificare questi collegamenti in anticipo trasforma un viaggio caotico in uno senza stress.</p>
    <div class="plan-visit-block" style="display:block">
      ${TRAVEL_GUIDES_MONETIZATION_READY
        ? `
      <a href="${escapeHtml(getTransferLinkFor())}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking-alt">🚕 Prenota un trasferimento privato</a>`
        : `<p class="plan-visit-hint">${comingSoonTextFor("it")}</p>`}
    </div>`,
  },
  {
    slug: "parking",
    title: "Come gestire il parcheggio vicino alle zone storiche",
    intro: "Guida per l'automobilista — parcheggiare nei centri storici",
    body: `
    <p>Guidare la propria auto o una a noleggio offre una libertà di movimento che altri mezzi di trasporto non possono eguagliare — ma i centri storici delle città sono noti per le restrizioni al traffico e la cronica carenza di parcheggi.</p>
    <p>Lasciare l'auto ovunque comporta il rischio di una multa, o persino del carro attrezzi. L'opzione più sicura resta un parcheggio sicuro, sotterraneo o in superficie, a gestione privata — molti permettono di prenotare un posto in anticipo, cosa che conta soprattutto nei weekend o in alta stagione, quando le attrazioni sono più affollate.</p>
    <p>Un parcheggio ben scelto, a pochi passi dal museo o dal centro storico, ti lascia libero di esplorare al tuo ritmo, senza pensieri per l'auto. Controlla la disponibilità in anticipo e prenota online — ne vale la pena, soprattutto in un weekend affollato.</p>
    <div class="plan-visit-block" style="display:block">
      ${TRAVEL_GUIDES_MONETIZATION_READY
        ? `<a href="https://www.awin1.com/cread.php?awinmid=18633&awinaffid=3051943&campaign=Your%20Parking%20Space&ued=https%3A%2F%2Fwww.yourparkingspace.co.uk%2F" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking">🅿️ Parcheggio UK — prenota in anticipo</a>
      <p class="plan-visit-hint">🅿️ Parcheggio UE — prossimamente</p>`
        : `<p class="plan-visit-hint">${comingSoonTextFor("it")}</p>`}
    </div>`,
  },
  {
    slug: "restaurants",
    title: "Come organizzare una giornata di visita perfetta",
    intro: "Far coincidere gli orari di apertura con i pasti",
    body: `
    <p>Una bella giornata di visita è questione di equilibrio tra cultura e relax. Se costruisci la giornata attorno agli orari di un museo o di una galleria, vale la pena pianificare in anticipo anche le pause pranzo — altrimenti rischi di arrivare affamato proprio quando tutti i locali nei dintorni sono pieni.</p>
    <p>Le grandi attrazioni attirano migliaia di visitatori ogni giorno, e le zone circostanti si riempiono in fretta, soprattutto a pranzo e a cena. Prenotare in anticipo tramite una piattaforma online ti garantisce un tavolo senza fare la fila o cercare disperatamente un posto libero all'ultimo minuto.</p>
    <p>Lo schema più efficiente: visita le mostre presto al mattino, quando c'è calma, poi chiudi la giornata con un pasto prenotato in anticipo in un ristorante locale — una semplice giornata di visita diventa così un ricordo che vale davvero la pena conservare.</p>
    <div class="plan-visit-block" style="display:block">
      ${TRAVEL_GUIDES_MONETIZATION_READY
        ? `<a href="${escapeHtml(linkTheForkAffiliate || "https://www.thefork.com/")}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-booking">🍽️ Cerca su TheFork (Francia, Italia, Spagna)</a>
      <a href="${escapeHtml(linkOpenTableAffiliate || "https://www.opentable.com/")}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking-alt">🍽️ Cerca su OpenTable (UK, Germania)</a>`
        : `<p class="plan-visit-hint">${comingSoonTextFor("it")}</p>`}
    </div>`,
  },
  {
    slug: "flights",
    title: "Come trovare i migliori biglietti aerei",
    intro: "Guida alla ricerca di voli, con comparatore di prezzi in tempo reale",
    body: `
    <p>Il biglietto aereo è di solito la spesa più grande di un viaggio — ed è anche la più facile da ottimizzare, se si sa dove cercare. Le differenze di prezzo tra compagnie, tra i giorni della settimana o tra aeroporti vicini possono arrivare a centinaia di euro per la stessa destinazione.</p>
    <p>Un comparatore che cerca contemporaneamente tra decine di compagnie aeree (incluse le low-cost) mostra a colpo d'occhio l'opzione più economica, chiunque la operi — molto più veloce che controllare manualmente il sito di ogni compagnia.</p>
    <p>Cerca qui sotto direttamente, senza lasciare la pagina — inserisci la città di partenza e la destinazione, e i risultati appaiono in tempo reale, con prezzi aggiornati.</p>
    <a href="https://aviasales.tpk.lu/vB6Uc9BC" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">✈️ Cerca biglietti aerei</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>`,
  },
].concat(exports.TRAVEL_GUIDES_EN.slice(4,5), [
  {
    slug: "day-trips-tours-europe",
    title: "Le migliori gite di un giorno e i tour guidati in Europa",
    intro: "13 tour tra i migliori, in tutta Europa, con biglietti e orari prenotabili in anticipo",
    body: `
    <p>Prenotare un tour in anticipo significa un posto garantito, una guida confermata e spesso l'accesso a luoghi dove altrimenti si farebbe la fila per ore. Ecco alcune delle gite ed escursioni più popolari nelle grandi città europee — da giri in barca sul Danubio a percorsi nella storia antica di Roma o Atene.</p>

    <h2 class="section-title"><span class="bar"></span>Tour consigliati</h2>

    <h3>Bucarest — Monastero di Snagov, Palazzo Mogoșoaia e miniera di sale di Slănic</h3>
    <p>Una gita perfetta per chi vuole scoprire, in un unico itinerario, tre facce completamente diverse dei dintorni di Bucarest: la quiete dell'isola del monastero di Snagov, l'eleganza del Palazzo Mogoșoaia e l'impressionante miniera di sale di Slănic, scavata nel cuore della montagna. Ideale se hai solo un giorno libero nella capitale e vuoi sfuggire al caos della città.</p>
    <a href="https://www.getyourguide.com/slanic-l91935/snagov-monastery-mogosoaia-salt-mine-day-trip-bucharest-t1221626/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il tour — Snagov, Mogoșoaia e la miniera di sale di Slănic</a>

    <h3>Bucarest — Gita di un giorno al delta del Danubio</h3>
    <p>Il delta del Danubio è una delle riserve naturali più spettacolari d'Europa, con una biodiversità unica — pellicani, cormorani e centinaia di specie di uccelli, tra canali stretti e villaggi di pescatori. Una gita di un giorno da Bucarest, trasporto incluso, è il modo più semplice per vivere l'atmosfera del delta senza organizzare il proprio trasporto.</p>
    <a href="https://www.getyourguide.com/bucharest-l111/from-bucharest-day-trip-to-danube-delta-t662170/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il tour — Delta del Danubio</a>

    <h3>Vienna — Crociera sul Danubio, con pranzo facoltativo</h3>
    <p>Vienna vista dall'acqua racconta una storia completamente diversa — ponti storici, edifici imperiali e parchi verdi scorrono lungo le rive del Danubio. Una crociera rilassante, con pranzo facoltativo a bordo, è una pausa gradita dopo una mattinata a piedi nel centro storico.</p>
    <a href="https://www.getyourguide.com/vienna-l7/vienna-city-cruise-with-optional-lunch-t58823/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota la crociera — Vienna</a>

    <h3>Budapest — Crociera panoramica serale sul Danubio</h3>
    <p>Budapest illuminata di notte è, per molti, lo skyline urbano più bello dell'Europa centrale — il Parlamento, il Ponte delle Catene e il Castello di Buda brillano lungo il Danubio. Una crociera serale è il modo classico, quasi imprescindibile, di vedere la città dall'angolazione giusta.</p>
    <a href="https://www.getyourguide.com/budapest-l29/budapest-evening-sightseeing-cruise-on-the-danube-t1117141/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota la crociera — Budapest</a>

    <h3>Amsterdam — Gita di un giorno a Bruges</h3>
    <p>Bruges è considerata una delle città medievali meglio conservate d'Europa — canali, ponti in pietra ed edifici gotici, tutti raccolti in un centro storico compatto e facile da esplorare a piedi. Una gita da Amsterdam, con guida in inglese o spagnolo, è la scelta semplice per chi non vuole complicarsi il trasporto.</p>
    <a href="https://www.getyourguide.com/amsterdam-l36/from-amsterdam-bruges-day-tour-in-spanish-or-english-t2633/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program&cmp=amsterdam" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il tour — Bruges, da Amsterdam</a>

    <h3>L'Aia — Biglietto d'ingresso per il museo Panorama Mesdag</h3>
    <p>Il Panorama Mesdag è un enorme dipinto circolare del 1881, che avvolge completamente il visitatore con una vista sul villaggio di pescatori di Scheveningen del XIX secolo — un'esperienza visiva unica, difficile da immaginare prima di vederla con i propri occhi. Un museo piccolo ma spettacolare, a pochi passi dal centro dell'Aia.</p>
    <a href="https://www.getyourguide.com/the-hague-l1267/the-hague-entry-ticket-to-the-panorama-mesdag-museum-t391318/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il biglietto — Museo Panorama Mesdag, L'Aia</a>

    <h3>Praga — Fortezza di Vyšehrad, il gioiello nascosto della città</h3>
    <p>Mentre la maggior parte dei turisti si affolla al Castello di Praga, Vyšehrad resta una scelta molto più tranquilla — una fortezza storica sulle rive della Moldava, con una vista splendida e un cimitero dove riposano grandi figure ceche. Un luogo perfetto per chi vuole vivere Praga senza la folla.</p>
    <a href="https://www.getyourguide.com/prague-l10/prague-s-best-hidden-gem-vysehrad-castle-historic-fort-t1011583/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il tour — Fortezza di Vyšehrad, Praga</a>

    <h3>Roma — Colosseo con accesso all'arena e Foro Romano</h3>
    <p>Pochi visitatori arrivano a calpestare il vero pavimento dell'arena del Colosseo, proprio dove un tempo combattevano i gladiatori — un accesso speciale, disponibile solo con biglietti dedicati. Abbinata a una visita guidata al Foro Romano, la visita ricostruisce, passo dopo passo, la vita quotidiana nell'antica Roma.</p>
    <a href="https://www.getyourguide.com/rome-l33/rome-colosseum-gladiator-floor-access-roman-forum-tour-t633431/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il tour — Colosseo e Foro Romano</a>

    <h3>Parigi — Tour in piccolo gruppo all'interno di Notre-Dame</h3>
    <p>Dopo anni di restauro, visitare l'interno di Notre-Dame ha un significato speciale — architettura gotica, vetrate e storia della cattedrale, spiegate da una guida locale, in piccoli gruppi fino a 5 persone, per un'esperienza molto più personale di una visita ordinaria.</p>
    <a href="https://www.getyourguide.com/paris-l16/paris-small-group-interior-tour-of-notre-dame-max-5-people-t607051/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il tour — Interno di Notre-Dame</a>

    <h3>Madrid — Biglietto combinato: San Antonio de los Alemanes e monastero di San Placido</h3>
    <p>Due delle chiese barocche meno conosciute ma più spettacolari di Madrid — volte dipinte, altari dorati e una rara quiete nel cuore della città. Un biglietto combinato, ideale per chi vuole scoprire Madrid oltre ai suoi grandi musei affollati.</p>
    <a href="https://www.getyourguide.com/madrid-l46/combo-entry-to-san-antonio-de-los-alemanes-and-the-monastery-of-san-placido-t1103055/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il biglietto combinato — Madrid</a>

    <h3>Bratislava — Tour panoramico in autobus</h3>
    <p>Bratislava si scopre in fretta e comodamente da un autobus panoramico — il Castello di Bratislava, la Porta di San Michele e gli edifici storici della capitale slovacca, tutto su un unico percorso semplice e senza sforzo, ideale soprattutto quando il tempo è poco durante una city break.</p>
    <a href="https://www.getyourguide.com/bratislava-l765/bratislava-sightseeing-bus-tour-t28703/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il tour — Bratislava</a>

    <h3>Lisbona — Museo del Tesoro Reale</h3>
    <p>Corone, gioielli reali e oggetti di immenso valore storico, esposti in uno dei musei meno affollati di Lisbona. Una tappa breve ma spettacolare per chi vuole scoprire un altro volto della monarchia portoghese, lontano dai classici percorsi turistici.</p>
    <a href="https://www.getyourguide.com/lisbon-l42/lisbon-royal-treasure-museum-entry-ticket-t425344/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il biglietto — Museo del Tesoro Reale, Lisbona</a>

    <h3>Atene — Gita di un giorno a Delfi</h3>
    <p>Delfi, considerata nell'antichità l'«ombelico del mondo», ospitava l'oracolo più importante del mondo greco — rovine imponenti, in un paesaggio montano spettacolare, a poche ore da Atene. Il tour include un'audioguida multilingue, ideale per chi vuole godersi la storia antica senza doverla organizzare da solo.</p>
    <a href="https://www.getyourguide.com/athens-l91/from-athens-delphi-day-trip-with-multilingual-audioguide-t748369/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il tour — Delfi, da Atene</a>

    <h3>Istanbul — Crociera con cena e spettacolo sul Corno d'Oro e il Bosforo</h3>
    <p>Una serata sull'acqua, con Istanbul illuminata su entrambe le sponde del Bosforo — cena a bordo, musica dal vivo e danze tradizionali, in una crociera che unisce la vista sulla città a un'esperienza culturale completa. Un modo memorabile per chiudere qualsiasi visita a Istanbul.</p>
    <a href="https://www.getyourguide.com/istanbul-l56/istanbul-golden-horn-bosphorus-dinner-and-show-t459410/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota la crociera con cena — Istanbul</a>

    <h3>Stoccolma — Gita in barca nell'arcipelago</h3>
    <p>L'arcipelago di Stoccolma conta oltre 30.000 tra isole e isolotti, punteggiati da tradizionali casette svedesi rosse — un paesaggio che semplicemente non si vede dal centro città. Una gita in barca di qualche ora rivela un lato completamente diverso, molto più tranquillo e naturale, della capitale svedese.</p>
    <a href="https://www.getyourguide.com/stockholm-l50/stockholm-archipelago-boat-tour-t811343/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il tour — Arcipelago di Stoccolma</a>

    <h3>Costanza — Biglietto d'ingresso per l'isola di Mainau</h3>
    <p>L'isola di Mainau, sul Lago di Costanza, è nota come «l'isola dei fiori» — giardini botanici impeccabili, un castello barocco e viste spettacolari sulle Alpi, al confine tra Germania, Svizzera e Austria. Un luogo perfetto per una giornata rilassante, lontano dai soliti giri urbani.</p>
    <a href="https://www.getyourguide.com/konstanz-l204/entrance-ticket-for-the-mainau-island-t561436/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il biglietto — Isola di Mainau, Costanza</a>

    <h3>Monaco — Tour panoramico Monaco-Monte Carlo (Hop-on Hop-off)</h3>
    <p>Monaco è piccola ma piena di attrazioni — il Palazzo del Principe, il celebre casinò di Monte Carlo e il circuito di Formula 1, tutti raggiungibili con un unico biglietto per bus panoramico, con fermate gratuite a ogni punto di interesse, al proprio ritmo.</p>
    <a href="https://www.getyourguide.com/monaco-l515/monaco-monte-carlo-hop-on-hop-off-bus-tour-t170400/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il tour — Monaco &amp; Monte Carlo</a>

    <h3>Monaco di Baviera — Tour guidato in e-scooter, 2 ore, tra le mete principali</h3>
    <p>Un modo veloce e divertente per scoprire il centro di Monaco di Baviera — Marienplatz, la Frauenkirche, il Giardino Inglese e le altre mete essenziali — in e-scooter guidato, in sole 2 ore. Ideale per chi ha poco tempo in città ma vuole comunque vedere il più possibile, senza la stanchezza di camminare.</p>
    <a href="https://www.getyourguide.com/munich-l26/munchen-top-sights-2h-guided-e-scooter-tour-t463376/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il tour — Tour in e-scooter a Monaco di Baviera</a>

    <h3>Barcellona — Biglietto salta fila per la Sagrada Família</h3>
    <p>La Sagrada Família è probabilmente l'opera incompiuta più celebre della storia dell'architettura — il capolavoro di Gaudí, con torri che si slanciano verso il cielo e vetrate che trasformano la luce interna in un gioco di colori. Un biglietto salta fila ti risparmia ore di attesa, soprattutto in alta stagione.</p>
    <a href="https://www.getyourguide.com/barcelona-l45/sagrada-familia-skip-the-line-ticket-t50027/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il biglietto salta fila — Sagrada Família</a>

    <h3>Venezia — Biglietto salta fila per la Basilica di San Marco, con audioguida via app</h3>
    <p>La Basilica di San Marco, con i suoi mosaici dorati e le cupole bizantine, è il cuore di Venezia — ma anche una delle chiese più visitate al mondo, con file che in alta stagione possono durare ore. Un biglietto salta fila, con audioguida via app inclusa, ti permette di goderti l'interno al tuo ritmo, senza perdere tempo in attesa fuori.</p>
    <a href="https://www.getyourguide.com/venice-l35/venice-st-mark-s-basilica-skip-the-line-ticket-audio-app-t395051/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il biglietto salta fila — Basilica di San Marco, Venezia</a>

    <h3>Firenze — Museo interattivo Leonardo da Vinci</h3>
    <p>Un museo insolito, interamente dedicato al genio di Leonardo da Vinci — modelli funzionanti, repliche delle sue invenzioni meccaniche ed esposizioni interattive che si possono toccare e provare, non solo osservare da lontano. Una tappa divertente e istruttiva, particolarmente adatta alle famiglie con bambini.</p>
    <a href="https://www.getyourguide.com/florence-l32/florence-leonardo-interactive-museum-entry-ticket-t86558/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il biglietto — Museo interattivo Leonardo, Firenze</a>

    <h3>Zurigo — Lindt Home of Chocolate</h3>
    <p>La fontana di cioccolato più grande del mondo, l'intero processo di produzione spiegato passo dopo passo e, naturalmente, degustazioni — un museo interamente dedicato alla passione svizzera per il cioccolato. Un'esperienza golosa, adatta a tutte le età, a pochi passi dal Lago di Zurigo.</p>
    <a href="https://www.getyourguide.com/zurich-l55/lindt-home-of-chocolate-museum-entry-ticket-t396265/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il biglietto — Lindt Home of Chocolate, Zurigo</a>

    <h3>Berlino — Tour in risciò per l'intera giornata, con ritiro in hotel</h3>
    <p>Un modo insolito e rilassante per esplorare Berlino — su un risciò elettrico, con una guida locale che intreccia la storia della città con aneddoti e cultura, a un ritmo molto più tranquillo rispetto a un classico tour a piedi. Include il ritiro diretto in hotel, così non devi preoccuparti di raggiungere un punto d'incontro.</p>
    <a href="https://www.getyourguide.com/berlin-l17/full-day-rickshaw-tour-an-adventure-full-of-culture-and-delight-with-hotel-pickup-t856039/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il tour in risciò — Berlino</a>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Organizza tutto il tuo viaggio, in un unico posto</h3>
      <p class="trip-toolkit-subtitle">Hai bisogno di voli, alloggio, un'auto o un transfer? Trovi tutto qui.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=eur&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Cerca biglietti aerei</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Cerca un alloggio</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Noleggia un'auto</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://intui.tpk.lu/xynzx1LU" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚕 Prenota un transfer</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
      </div>
      <div class="gyg-search-widget-wrap">
        <div class="gyg-widget" data-gyg-partner-id="LM6J21N" data-gyg-number-of-items="3" data-gyg-locale-code="en-US" data-gyg-type="search"></div>
      </div>
    </div>`,
  },
  {
    slug: "castles-europe",
    title: "I castelli più belli d'Europa",
    intro: "12 castelli da favola, in tutta Europa, con biglietti e tour prenotabili in anticipo",
    body: `
    <p>Dalle torri che hanno ispirato i parchi Disney alle fortezze medievali nascoste nei boschi o arroccate su scogliere sopra laghi glaciali — l'Europa custodisce alcuni dei castelli più spettacolari del mondo. Ecco 12 dei più belli, con informazioni pratiche e biglietti prenotabili in anticipo, per saltare la fila all'ingresso.</p>

    <h2 class="section-title"><span class="bar"></span>I castelli</h2>

    <h3>🇩🇪 Castello di Neuschwanstein, Germania</h3>
    <p>Il castello che ha direttamente ispirato le silhouette dei parchi Disney — snelle torri bianche, innalzate su un picco roccioso delle Alpi bavaresi. Costruito dal re Ludovico II di Baviera come una fuga romantica dalla realtà, Neuschwanstein resta il castello più fotografato d'Europa, soprattutto in autunno, quando i boschi circostanti si tingono di colore.</p>
    <a href="https://www.getyourguide.com/munich-l26/from-munich-neuschwanstein-linderhof-castle-full-day-trip-t1753/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il tour — Neuschwanstein &amp; Linderhof, da Monaco di Baviera</a>

    <h3>🇩🇪 Castello di Eltz, Germania</h3>
    <p>Nascosto nel profondo di un bosco vicino al fiume Mosella, Eltz è uno dei pochi castelli tedeschi mai distrutto né conquistato — e appartiene alla stessa famiglia da oltre 850 anni. La sua silhouette, con torri di epoche diverse addossate su una roccia stretta, sembra uscita direttamente da una fiaba.</p>
    <a href="https://www.getyourguide.com/frankfurt-l21/frankfurt-day-trip-to-eltz-castle-on-the-moselle-t40707/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il tour — Castello di Eltz, da Francoforte</a>

    <h3>🇩🇪 Castello di Hohenzollern, Germania</h3>
    <p>La sede ancestrale della famiglia reale prussiana, eretta con orgoglio su un picco isolato, con una vista che nelle giornate limpide spazia su tutta la Germania meridionale. La sua architettura neogotica del XIX secolo, con torri e merlature, rende Hohenzollern uno dei castelli più spettacolari da visitare in Europa.</p>
    <a href="https://www.getyourguide.com/sigmaringen-l100350/sigmaringen-hohenzollern-castle-entry-fee-audio-guide-t849245/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il biglietto — Castello di Hohenzollern</a>

    <h3>🇷🇴 Castello di Peleș, Romania</h3>
    <p>Considerato da molti il castello più bello della Romania, Peleș fu la residenza estiva del re Carol I — un gioiello neo-rinascimentale dagli interni sontuosi, costruito ai piedi dei monti Bucegi, a Sinaia. Ogni stanza ha il proprio stile decorativo, dai mobili tedeschi alle armi orientali.</p>
    <a href="https://www.getyourguide.com/sinaia-l124688/peles-castle-and-bran-castle-entry-tickets-t1414362/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il biglietto combinato — Peleș &amp; Bran</a>

    <h3>🇷🇴 Castello di Corvin, Romania</h3>
    <p>Un'imponente fortezza gotico-rinascimentale, costruita da Giovanni Hunyadi, con torri, ponti sospesi e cupe leggende sulle segrete al suo interno. Una delle fortezze medievali meglio conservate dell'Europa dell'Est, uno spettacolo particolarmente suggestivo al tramonto.</p>
    <a href="https://www.getyourguide.com/corvin-castle-l127588/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il biglietto — Castello di Corvin, Hunedoara</a>

    <h3>🇷🇴 Castello di Bran, Romania</h3>
    <p>Conosciuto a livello internazionale come il «castello di Dracula», grazie al legame creato dal romanzo di Bram Stoker, Bran è una spettacolare fortezza medievale, arroccata su una scogliera ai confini della Transilvania. Anche se il vero legame storico con Vlad l'Impalatore è discutibile, l'atmosfera gotica del luogo non delude mai.</p>
    <a href="https://www.getyourguide.com/bran-l188057/bran-castle-dracula-s-castle-entry-ticket-with-audio-guide-t1380614/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il biglietto — Castello di Bran</a>

    <h3>🇵🇹 Palazzo di Pena, Portogallo</h3>
    <p>Un palazzo romantico, dai colori stravaganti (rosso, giallo, viola), costruito sulle colline di Sintra, spesso al di sopra delle nuvole nelle giornate di nebbia. Un mix eclettico di stili — gotico, manuelino, islamico, rinascimentale — che rende Pena uno dei palazzi più fotogenici al mondo, Patrimonio dell'Umanità UNESCO.</p>
    <a href="https://www.getyourguide.com/lisbon-l42/lisbon-sintra-pena-regaleira-cabo-da-roca-cascais-tour-t881398/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il tour — Sintra, Pena &amp; Cascais, da Lisbona</a>

    <h3>🇪🇸 Alcázar di Segovia, Spagna</h3>
    <p>Con la sua sagoma affilata, come una nave di pietra che galleggia sopra la città, l'Alcázar di Segovia è spesso citato come una delle ispirazioni per il castello di Cenerentola nei parchi Disney — una rivalità amichevole con Neuschwanstein per questo titolo. Una fortezza reale medievale, usata per secoli dai monarchi castigliani.</p>
    <a href="https://www.getyourguide.com/ro-ro/segovia-spania-l1694/din-madrid-excursie-de-o-zi-la-segovia-cu-bilet-de-intrare-la-alcazar-t1402263/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il tour — Segovia &amp; Alcázar, da Madrid</a>

    <h3>🇫🇷 Castello di Chambord, Francia</h3>
    <p>Il castello più grande della Valle della Loira, capolavoro del Rinascimento francese, con oltre 400 stanze e una famosa scala a doppia elica, a volte attribuita allo stesso Leonardo da Vinci. I giardini e il bosco circostanti, che si estendono per migliaia di ettari, fanno di Chambord un'esperienza di un'intera giornata, non solo una visita rapida.</p>
    <a href="https://www.getyourguide.com/loire-valley-chateaux-l7956/chambord-skip-the-line-chateau-de-chambord-ticket-t183794/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il biglietto salta fila — Castello di Chambord</a>

    <h3>🇨🇭 Castello di Chillon, Svizzera</h3>
    <p>Un castello medievale insulare, costruito direttamente su una roccia del Lago Lemano, con le Alpi come sfondo — il monumento storico più visitato della Svizzera. Il poeta Lord Byron lo rese famoso in tutto il mondo con il suo poema «Il prigioniero di Chillon», ispirato dalle segrete nei sotterranei del castello.</p>
    <a href="https://www.chillon.ch/" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Vedi orari e biglietti — Castello di Chillon (sito ufficiale)</a>

    <h3>🇸🇮 Castello di Bled, Slovenia</h3>
    <p>Il castello più antico della Slovenia, costruito proprio su una scogliera scoscesa, 130 metri sopra il Lago di Bled — una delle viste più fotografate dell'Europa centrale, con la piccola chiesa sull'isola al centro del lago visibile direttamente dalle sue mura.</p>
    <a href="https://www.getyourguide.com/en-au/bled-castle-l140261/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il biglietto — Castello di Bled</a>

    <h3>🇵🇱 Castello di Malbork, Polonia</h3>
    <p>Il castello più grande al mondo per superficie — un'enorme fortezza di mattoni gotici rossi, costruita dall'Ordine Teutonico sulle rive del fiume Nogat. Patrimonio dell'Umanità UNESCO, Malbork colpisce per la sua scala, difficile da cogliere fino a quando non lo si vede con i propri occhi.</p>
    <a href="https://www.getyourguide.com/gdansk-l1960/gdansk-malbork-castle-regular-tour-t218583/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il tour — Castello di Malbork, da Danzica</a>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Organizza tutto il tuo viaggio, in un unico posto</h3>
      <p class="trip-toolkit-subtitle">Hai bisogno di voli, alloggio, un'auto o un transfer? Trovi tutto qui.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=eur&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Cerca biglietti aerei</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Cerca un alloggio</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Noleggia un'auto</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://intui.tpk.lu/xynzx1LU" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚕 Prenota un transfer</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
      </div>
    </div>`,
  },
  {
    slug: "amusement-parks-europe",
    title: "I migliori parchi divertimento d'Europa",
    intro: "6 parchi imperdibili, per tutte le età — da Disneyland Paris alle montagne russe più estreme",
    body: `
    <p>Dai parchi classici con i personaggi amati dai bambini ad alcune delle montagne russe più alte del mondo — l'Europa offre parchi divertimento per ogni età e ogni livello di adrenalina. Ecco alcuni dei più popolari, raggruppati per categoria, con biglietti prenotabili in anticipo.</p>

    <h2 class="section-title"><span class="bar"></span>👑 I più popolari e visitati (tutte le età)</h2>

    <h3>🇫🇷 Disneyland Paris, Francia</h3>
    <p>Il parco divertimento più visitato d'Europa — due parchi tematici completi (Disneyland Park e Walt Disney Studios), dove i bambini possono incontrare i loro personaggi animati preferiti, tra castelli, parate e spettacoli quotidiani. Un'esperienza completa, ideale per una vacanza di 2-3 giorni.</p>
    <a href="https://www.getyourguide.com/paris-l16/disneyland-paris-2-parks-ticket-1-2-3-4-5-day-t395320/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il biglietto — Disneyland Paris</a>

    <h3>🇩🇪 Europa-Park, Rust, Germania</h3>
    <p>Il secondo parco divertimento più grande d'Europa, strutturato in 18 aree tematiche, ognuna dedicata a un paese europeo. Conta 13 spettacolari montagne russe, aree più tranquille per i bambini piccoli, spettacoli quotidiani e un enorme parco acquatico (Rulantica) — praticamente una vacanza completa in un unico posto.</p>
    <a href="https://www.getyourguide.com/rust-l2882/rust-europa-park-entrance-ticket-t393563/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il biglietto — Europa-Park, Rust</a>

    <h2 class="section-title"><span class="bar"></span>🧸 I migliori per bambini piccoli e in età prescolare</h2>

    <h3>🇳🇱 Efteling, Kaatsheuvel, Paesi Bassi</h3>
    <p>Un parco delle favole, noto per l'atmosfera rilassante della sua Foresta delle Fiabe — personaggi tratti dalle storie dei fratelli Grimm, sentieri immersi nel verde e un ritmo molto più tranquillo rispetto ai parchi incentrati sull'adrenalina. Ideale per i bambini piccoli, che cadono facilmente sotto l'incanto del luogo.</p>
    <a href="https://www.getyourguide.com/amsterdam-l36/amsterdam-efteling-park-roundtrip-transfer-and-entry-ticket-t501550/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il biglietto (con transfer) — Efteling, da Amsterdam</a>

    <h3>🇩🇰 Legoland Billund, Danimarca</h3>
    <p>Il parco Legoland originale, costruito appositamente per le famiglie con bambini piccoli — spettacolari mini-città costruite interamente con mattoncini Lego, attrazioni interattive e attività pensate per stimolare la creatività, non solo l'adrenalina. Un luogo dove i genitori giocano quanto i più piccoli.</p>
    <a href="https://www.getyourguide.com/billund-l87275/legoland-billund-entry-ticket-private-transfer-t1427002/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il biglietto (con transfer) — Legoland Billund</a>

    <h2 class="section-title"><span class="bar"></span>🎢 I migliori per avventura e adrenalina (bambini più grandi)</h2>

    <h3>🇮🇹 Gardaland, Castelnuovo del Garda, Italia</h3>
    <p>Proprio accanto allo splendido Lago di Garda, Gardaland unisce montagne russe intense (come Oblivion o Raptor) a un'area dedicata ai più piccoli (Peppa Pig Land) — un equilibrio raro tra adrenalina per i teenager e divertimento per tutta la famiglia, nello stesso parco.</p>
    <a href="https://www.getyourguide.com/garda-l145126/gardaland-park-fixed-day-entry-ticket-t225588/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il biglietto — Gardaland</a>

    <h3>🇵🇱 Energylandia, Zator, Polonia</h3>
    <p>Il parco divertimento più grande della Polonia, riconosciuto in tutta Europa per l'enorme numero di montagne russe moderne — tra cui Zadra, una delle montagne russe ibride più alte al mondo. Dispone anche di una vasta area acquatica e di zone pensate appositamente per i bambini più piccoli, quindi non è solo per gli amanti dell'adrenalina.</p>
    <a href="https://www.getyourguide.com/krakow-l40/krakow-energylandia-full-day-ticket-with-optional-pickup-t114202/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Prenota il biglietto (con ritiro facoltativo) — Energylandia, da Cracovia</a>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Organizza tutto il tuo viaggio, in un unico posto</h3>
      <p class="trip-toolkit-subtitle">Hai bisogno di voli, alloggio, un'auto o un transfer? Trovi tutto qui.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=eur&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Cerca biglietti aerei</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Cerca un alloggio</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Noleggia un'auto</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://intui.tpk.lu/xynzx1LU" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚕 Prenota un transfer</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
      </div>
    </div>`,
  },
])

exports.TRAVEL_GUIDES_PL = [
  {
    slug: "transport",
    title: "Jak sprawnie dotrzeć do największych atrakcji turystycznych",
    intro: "Przewodnik po transporcie miejskim i regionalnym",
    body: `
    <p>Udany plan podróży zależy w dużej mierze od tego, jak przemieszczasz się między atrakcjami. Gdy chcesz zwiedzić muzea, zamki czy zabytki historyczne, połączenia między miastami i lokalna logistyka decydują o różnicy między spokojnym dniem a takim, który spędzisz na dworcach i przystankach.</p>
    <p>Na dłuższych dystansach lub między regionami historycznymi pociąg pozostaje najpopularniejszą opcją — europejska sieć kolejowa łączy większość stolic z mniejszymi miastami, często malowniczymi trasami. Autokary dobrze uzupełniają lukę, zwłaszcza w kierunku miejscowości lub obszarów górskich, do których pociąg nie dociera bezpośrednio, i zwykle kosztują mniej.</p>
    <p>Jeśli lądujesz na lotnisku z dużą ilością bagażu lub podróżujesz w grupie, wcześniej zarezerwowany prywatny transfer eliminuje kłopoty ze zmianą środków transportu — zawiezie cię prosto z terminalu pod bramę zamku lub do hotelu. Wcześniejsze zaplanowanie tych połączeń zamienia gorączkową podróż w taką bez stresu.</p>
    <div class="plan-visit-block" style="display:block">
      ${TRAVEL_GUIDES_MONETIZATION_READY
        ? `
      <a href="${escapeHtml(getTransferLinkFor())}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking-alt">🚕 Zarezerwuj prywatny transfer</a>`
        : `<p class="plan-visit-hint">${comingSoonTextFor("pl")}</p>`}
    </div>`,
  },
  {
    slug: "parking",
    title: "Jak radzić sobie z parkowaniem w pobliżu zabytkowych dzielnic",
    intro: "Przewodnik dla kierowców — parkowanie w starych centrach miast",
    body: `
    <p>Prowadzenie własnego lub wynajętego samochodu daje swobodę poruszania się, której nie zapewnią inne środki transportu — ale zabytkowe centra miast znane są z ograniczeń w ruchu i chronicznego braku miejsc parkingowych.</p>
    <p>Zostawienie samochodu w przypadkowym miejscu grozi mandatem, a nawet odholowaniem. Najbezpieczniejszą opcją pozostaje strzeżony, prywatnie zarządzany parking podziemny lub naziemny — wiele z nich pozwala zarezerwować miejsce z wyprzedzeniem, co ma szczególne znaczenie w weekendy lub w wysokim sezonie, gdy atrakcje są najbardziej oblegane.</p>
    <p>Dobrze wybrany parking, kilka kroków od muzeum lub starówki, daje swobodę zwiedzania we własnym tempie, bez martwienia się o samochód. Sprawdź dostępność z wyprzedzeniem i zarezerwuj online — warto, zwłaszcza w ruchliwy weekend.</p>
    <div class="plan-visit-block" style="display:block">
      ${TRAVEL_GUIDES_MONETIZATION_READY
        ? `<a href="https://www.awin1.com/cread.php?awinmid=18633&awinaffid=3051943&campaign=Your%20Parking%20Space&ued=https%3A%2F%2Fwww.yourparkingspace.co.uk%2F" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking">🅿️ Parking UK — zarezerwuj z wyprzedzeniem</a>
      <p class="plan-visit-hint">🅿️ Parking UE — wkrótce</p>`
        : `<p class="plan-visit-hint">${comingSoonTextFor("pl")}</p>`}
    </div>`,
  },
  {
    slug: "restaurants",
    title: "Jak zaplanować idealny dzień zwiedzania",
    intro: "Dopasowanie godzin otwarcia do pór posiłków",
    body: `
    <p>Udany dzień zwiedzania to równowaga między kulturą a odpoczynkiem. Jeśli planujesz dzień wokół godzin otwarcia muzeum czy galerii, warto z wyprzedzeniem zaplanować także przerwy na posiłki — inaczej ryzykujesz, że zgłodniejesz akurat wtedy, gdy wszystkie pobliskie lokale są pełne.</p>
    <p>Największe atrakcje przyciągają codziennie tysiące odwiedzających, a okoliczne miejsca szybko się zapełniają, zwłaszcza w porze obiadu i kolacji. Wcześniejsza rezerwacja przez platformę internetową gwarantuje stolik bez czekania w kolejce czy rozpaczliwego szukania wolnego miejsca w ostatniej chwili.</p>
    <p>Najbardziej efektywny schemat: zwiedzaj wystawy wcześnie rano, gdy jest spokojnie, a dzień zakończ posiłkiem zarezerwowanym z wyprzedzeniem w lokalnej restauracji — zwykły dzień zwiedzania staje się wtedy wspomnieniem, które naprawdę warto zachować.</p>
    <div class="plan-visit-block" style="display:block">
      ${TRAVEL_GUIDES_MONETIZATION_READY
        ? `<a href="${escapeHtml(linkTheForkAffiliate || "https://www.thefork.com/")}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-booking">🍽️ Szukaj na TheFork (Francja, Włochy, Hiszpania)</a>
      <a href="${escapeHtml(linkOpenTableAffiliate || "https://www.opentable.com/")}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking-alt">🍽️ Szukaj na OpenTable (UK, Niemcy)</a>`
        : `<p class="plan-visit-hint">${comingSoonTextFor("pl")}</p>`}
    </div>`,
  },
  {
    slug: "flights",
    title: "Jak znaleźć najlepsze bilety lotnicze",
    intro: "Przewodnik po wyszukiwaniu lotów, z porównywarką cen w czasie rzeczywistym",
    body: `
    <p>Bilet lotniczy to zwykle największy wydatek podczas podróży — i najłatwiejszy do zoptymalizowania, jeśli wiesz, gdzie szukać. Różnice cen między liniami lotniczymi, dniami tygodnia czy pobliskimi lotniskami mogą sięgać setek euro dla tego samego kierunku.</p>
    <p>Porównywarka, która przeszukuje jednocześnie dziesiątki linii lotniczych (w tym tanie linie), pokazuje od razu najtańszą opcję, niezależnie od przewoźnika — znacznie szybciej niż ręczne sprawdzanie strony każdej linii z osobna.</p>
    <p>Szukaj bezpośrednio poniżej, bez opuszczania strony — wpisz miasto wylotu i cel podróży, a wyniki pojawią się w czasie rzeczywistym, z aktualnymi cenami.</p>
    <a href="https://aviasales.tpk.lu/vB6Uc9BC" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">✈️ Szukaj biletów lotniczych</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>`,
  },
].concat(exports.TRAVEL_GUIDES_EN.slice(4,5), [
  {
    slug: "day-trips-tours-europe",
    title: "Najlepsze jednodniowe wycieczki i wycieczki z przewodnikiem w Europie",
    intro: "13 najlepszych wycieczek w całej Europie, z biletami i terminami do zarezerwowania z wyprzedzeniem",
    body: `
    <p>Wcześniejsza rezerwacja wycieczki oznacza gwarantowane miejsce, potwierdzonego przewodnika i często dostęp do miejsc, w których inaczej trzeba by stać w kolejce godzinami. Poniżej kilka najpopularniejszych jednodniowych wycieczek i tras w wielkich europejskich miastach — od rejsów łodzią po Dunaju po trasy przez starożytną historię Rzymu czy Aten.</p>

    <h2 class="section-title"><span class="bar"></span>Polecane wycieczki</h2>

    <h3>Bukareszt — klasztor w Snagov, pałac Mogoșoaia i kopalnia soli w Slănic</h3>
    <p>Idealna wycieczka dla tych, którzy chcą zobaczyć, w ramach jednej trasy, trzy zupełnie różne oblicza okolic Bukaresztu: spokój wyspy klasztoru w Snagov, elegancję pałacu Mogoșoaia i imponującą kopalnię soli w Slănic, wydrążoną głęboko w górze. Idealne, jeśli masz tylko jeden wolny dzień w stolicy i chcesz uciec od miejskiego zgiełku.</p>
    <a href="https://www.getyourguide.com/slanic-l91935/snagov-monastery-mogosoaia-salt-mine-day-trip-bucharest-t1221626/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj wycieczkę — Snagov, Mogoșoaia i kopalnia soli w Slănic</a>

    <h3>Bukareszt — jednodniowa wycieczka do delty Dunaju</h3>
    <p>Delta Dunaju to jeden z najbardziej spektakularnych rezerwatów przyrody w Europie, o unikalnej bioróżnorodności — pelikany, kormorany i setki gatunków ptaków, wśród wąskich kanałów i wiosek rybackich. Jednodniowa wycieczka z Bukaresztu, z transportem w cenie, to najprostszy sposób, by poczuć klimat delty bez organizowania własnego transportu.</p>
    <a href="https://www.getyourguide.com/bucharest-l111/from-bucharest-day-trip-to-danube-delta-t662170/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj wycieczkę — delta Dunaju</a>

    <h3>Wiedeń — rejs po Dunaju, z opcjonalnym obiadem</h3>
    <p>Wiedeń widziany z wody opowiada zupełnie inną historię — zabytkowe mosty, cesarskie budowle i zielone parki mijają się wzdłuż brzegów Dunaju. Relaksujący rejs, z opcjonalnym obiadem na pokładzie, to mile widziana przerwa po porannym spacerze po zabytkowym centrum.</p>
    <a href="https://www.getyourguide.com/vienna-l7/vienna-city-cruise-with-optional-lunch-t58823/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj rejs — Wiedeń</a>

    <h3>Budapeszt — wieczorny rejs widokowy po Dunaju</h3>
    <p>Oświetlony nocą Budapeszt jest dla wielu najpiękniejszą panoramą miejską Europy Środkowej — Parlament, Most Łańcuchowy i Zamek Budański lśnią wzdłuż Dunaju. Wieczorny rejs to klasyczny, niemal obowiązkowy sposób na zobaczenie miasta z idealnej perspektywy.</p>
    <a href="https://www.getyourguide.com/budapest-l29/budapest-evening-sightseeing-cruise-on-the-danube-t1117141/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj rejs — Budapeszt</a>

    <h3>Amsterdam — jednodniowa wycieczka do Brugii</h3>
    <p>Brugia uznawana jest za jedno z najlepiej zachowanych średniowiecznych miast w Europie — kanały, kamienne mosty i gotyckie budowle, wszystko skupione w zwartym, zabytkowym centrum, łatwym do zwiedzania pieszo. Wycieczka z Amsterdamu, z przewodnikiem mówiącym po angielsku lub hiszpańsku, to prosty wybór dla tych, którzy nie chcą komplikować sobie dojazdu.</p>
    <a href="https://www.getyourguide.com/amsterdam-l36/from-amsterdam-bruges-day-tour-in-spanish-or-english-t2633/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program&cmp=amsterdam" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj wycieczkę — Brugia, z Amsterdamu</a>

    <h3>Haga — bilet wstępu do muzeum Panorama Mesdag</h3>
    <p>Panorama Mesdag to ogromny okrągły obraz z 1881 roku, który całkowicie otacza zwiedzającego widokiem na XIX-wieczną wioskę rybacką Scheveningen — wyjątkowe doświadczenie wizualne, trudne do wyobrażenia, zanim zobaczy się je na własne oczy. Małe, ale spektakularne muzeum, tuż obok centrum Hagi.</p>
    <a href="https://www.getyourguide.com/the-hague-l1267/the-hague-entry-ticket-to-the-panorama-mesdag-museum-t391318/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj bilet — muzeum Panorama Mesdag, Haga</a>

    <h3>Praga — twierdza Wyszehrad, ukryty klejnot miasta</h3>
    <p>Podczas gdy większość turystów tłoczy się na Zamku Praskim, Wyszehrad pozostaje znacznie spokojniejszym wyborem — historyczna twierdza nad brzegiem Wełtawy, z pięknym widokiem i cmentarzem, na którym spoczywają wielkie postacie czeskiej kultury. Idealne miejsce dla tych, którzy chcą poznać Pragę bez tłumów.</p>
    <a href="https://www.getyourguide.com/prague-l10/prague-s-best-hidden-gem-vysehrad-castle-historic-fort-t1011583/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj wycieczkę — twierdza Wyszehrad, Praga</a>

    <h3>Rzym — Koloseum z wejściem na arenę i Forum Romanum</h3>
    <p>Niewielu zwiedzających staje na prawdziwej posadzce areny Koloseum, tam, gdzie kiedyś walczyli gladiatorzy — specjalny dostęp, dostępny tylko z dedykowanymi biletami. Połączona ze zwiedzaniem Forum Romanum z przewodnikiem, wycieczka krok po kroku odtwarza codzienne życie w starożytnym Rzymie.</p>
    <a href="https://www.getyourguide.com/rome-l33/rome-colosseum-gladiator-floor-access-roman-forum-tour-t633431/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj wycieczkę — Koloseum i Forum Romanum</a>

    <h3>Paryż — wycieczka w małej grupie po wnętrzu Notre-Dame</h3>
    <p>Po latach renowacji zwiedzanie wnętrza katedry Notre-Dame nabiera szczególnego znaczenia — architektura gotycka, witraże i historia katedry, wyjaśniane przez lokalnego przewodnika, w małych grupach liczących maksymalnie 5 osób, dla dużo bardziej osobistego doświadczenia niż zwykłe zwiedzanie.</p>
    <a href="https://www.getyourguide.com/paris-l16/paris-small-group-interior-tour-of-notre-dame-max-5-people-t607051/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj wycieczkę — wnętrze Notre-Dame</a>

    <h3>Madryt — bilet łączony: San Antonio de los Alemanes i klasztor San Placido</h3>
    <p>Dwa mniej znane, ale spektakularne barokowe kościoły w Madrycie — malowane sklepienia, złocone ołtarze i rzadki spokój w samym sercu miasta. Bilet łączony, idealny dla tych, którzy chcą poznać Madryt poza wielkimi, zatłoczonymi muzeami.</p>
    <a href="https://www.getyourguide.com/madrid-l46/combo-entry-to-san-antonio-de-los-alemanes-and-the-monastery-of-san-placido-t1103055/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj bilet łączony — Madryt</a>

    <h3>Bratysława — panoramiczna wycieczka autobusem</h3>
    <p>Bratysławę można poznać szybko i wygodnie z panoramicznego autobusu — Zamek Bratysławski, Bramę Michalską i zabytkowe budynki słowackiej stolicy, wszystko w ramach jednej, prostej i bezwysiłkowej trasy, idealnej zwłaszcza gdy brakuje czasu podczas city breaku.</p>
    <a href="https://www.getyourguide.com/bratislava-l765/bratislava-sightseeing-bus-tour-t28703/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj wycieczkę — Bratysława</a>

    <h3>Lizbona — Muzeum Skarbu Królewskiego</h3>
    <p>Korony, klejnoty koronne i przedmioty o ogromnej wartości historycznej, wystawione w jednym z najmniej zatłoczonych muzeów Lizbony. Krótki, ale spektakularny przystanek dla tych, którzy chcą poznać inne oblicze portugalskiej monarchii, z dala od klasycznych szlaków turystycznych.</p>
    <a href="https://www.getyourguide.com/lisbon-l42/lisbon-royal-treasure-museum-entry-ticket-t425344/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj bilet — Muzeum Skarbu Królewskiego, Lizbona</a>

    <h3>Ateny — jednodniowa wycieczka do Delf</h3>
    <p>Delfy, uważane w starożytności za „pępek świata”, były siedzibą najważniejszej wyroczni świata greckiego — imponujące ruiny, w spektakularnym górskim krajobrazie, kilka godzin od Aten. Wycieczka obejmuje audioprzewodnik w kilku językach, idealny dla tych, którzy chcą poznać starożytną historię bez samodzielnej organizacji.</p>
    <a href="https://www.getyourguide.com/athens-l91/from-athens-delphi-day-trip-with-multilingual-audioguide-t748369/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj wycieczkę — Delfy, z Aten</a>

    <h3>Stambuł — rejs z kolacją i pokazem na Złotym Rogu i Bosforze</h3>
    <p>Wieczór na wodzie, z Stambułem oświetlonym po obu stronach Bosforu — kolacja na pokładzie, muzyka na żywo i tradycyjne tańce, na rejsie, który łączy widok na miasto z pełnym doświadczeniem kulturowym. Niezapomniany sposób na zakończenie każdej wizyty w Stambule.</p>
    <a href="https://www.getyourguide.com/istanbul-l56/istanbul-golden-horn-bosphorus-dinner-and-show-t459410/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj rejs z kolacją — Stambuł</a>

    <h3>Sztokholm — wycieczka łodzią po archipelagu</h3>
    <p>Archipelag sztokholmski to ponad 30 000 wysp i wysepek, usianych tradycyjnymi czerwonymi szwedzkimi domkami — krajobraz, którego po prostu nie widać z centrum miasta. Kilkugodzinna wycieczka łodzią ukazuje zupełnie inne, znacznie spokojniejsze i bardziej naturalne oblicze szwedzkiej stolicy.</p>
    <a href="https://www.getyourguide.com/stockholm-l50/stockholm-archipelago-boat-tour-t811343/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj wycieczkę — archipelag sztokholmski</a>

    <h3>Konstancja — bilet wstępu na wyspę Mainau</h3>
    <p>Wyspa Mainau na Jeziorze Bodeńskim znana jest jako „wyspa kwiatów” — nieskazitelne ogrody botaniczne, barokowy zamek i spektakularne widoki na Alpy, na granicy Niemiec, Szwajcarii i Austrii. Idealne miejsce na relaksujący dzień, z dala od typowych miejskich szlaków.</p>
    <a href="https://www.getyourguide.com/konstanz-l204/entrance-ticket-for-the-mainau-island-t561436/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj bilet — wyspa Mainau, Konstancja</a>

    <h3>Monako — panoramiczna wycieczka Monako-Monte Carlo (Hop-on Hop-off)</h3>
    <p>Monako jest małe, ale pełne atrakcji — Pałac Książęcy, słynne kasyno w Monte Carlo i tor Formuły 1, wszystko dostępne z jednym biletem na panoramiczny autobus, z darmowymi przystankami przy każdym punkcie zainteresowania, w Twoim własnym tempie.</p>
    <a href="https://www.getyourguide.com/monaco-l515/monaco-monte-carlo-hop-on-hop-off-bus-tour-t170400/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj wycieczkę — Monako i Monte Carlo</a>

    <h3>Monachium — wycieczka z przewodnikiem na hulajnodze elektrycznej, 2 godziny, po głównych atrakcjach</h3>
    <p>Szybki i przyjemny sposób na poznanie centrum Monachium — Marienplatz, kościół Frauenkirche, Ogród Angielski i pozostałe najważniejsze miejsca — na hulajnodze elektrycznej z przewodnikiem, w zaledwie 2 godziny. Idealne dla tych, którzy mają mało czasu w mieście, a mimo to chcą zobaczyć jak najwięcej, bez zmęczenia chodzeniem.</p>
    <a href="https://www.getyourguide.com/munich-l26/munchen-top-sights-2h-guided-e-scooter-tour-t463376/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj wycieczkę — wycieczka na hulajnodze po Monachium</a>

    <h3>Barcelona — bilet bez kolejki do Sagrada Família</h3>
    <p>Sagrada Família to prawdopodobnie najsłynniejsze niedokończone dzieło w historii architektury — arcydzieło Gaudiego, z wieżami wznoszącymi się ku niebu i witrażami, które zamieniają wewnętrzne światło w grę kolorów. Bilet bez kolejki oszczędza godziny czekania, zwłaszcza w wysokim sezonie.</p>
    <a href="https://www.getyourguide.com/barcelona-l45/sagrada-familia-skip-the-line-ticket-t50027/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj bilet bez kolejki — Sagrada Família</a>

    <h3>Wenecja — bilet bez kolejki do Bazyliki św. Marka, z audioprzewodnikiem w aplikacji</h3>
    <p>Bazylika św. Marka, ze złotymi mozaikami i bizantyjskimi kopułami, jest sercem Wenecji — ale też jednym z najczęściej odwiedzanych kościołów na świecie, z kolejkami trwającymi w wysokim sezonie godzinami. Bilet bez kolejki, z audioprzewodnikiem w aplikacji w cenie, pozwala cieszyć się wnętrzem we własnym tempie, bez tracenia czasu na czekanie na zewnątrz.</p>
    <a href="https://www.getyourguide.com/venice-l35/venice-st-mark-s-basilica-skip-the-line-ticket-audio-app-t395051/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj bilet bez kolejki — Bazylika św. Marka, Wenecja</a>

    <h3>Florencja — Interaktywne Muzeum Leonarda da Vinci</h3>
    <p>Nietypowe muzeum, w całości poświęcone geniuszowi Leonarda da Vinci — działające modele, repliki jego mechanicznych wynalazków i interaktywne eksponaty, które można dotknąć i wypróbować, a nie tylko oglądać z daleka. Zabawny i pouczający przystanek, szczególnie odpowiedni dla rodzin z dziećmi.</p>
    <a href="https://www.getyourguide.com/florence-l32/florence-leonardo-interactive-museum-entry-ticket-t86558/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj bilet — Interaktywne Muzeum Leonarda, Florencja</a>

    <h3>Zurych — Lindt Home of Chocolate</h3>
    <p>Największa fontanna czekolady na świecie, cały proces produkcji wyjaśniony krok po kroku i oczywiście degustacje — muzeum w całości poświęcone szwajcarskiej pasji do czekolady. Słodkie doświadczenie odpowiednie dla każdego wieku, tuż obok Jeziora Zuryskiego.</p>
    <a href="https://www.getyourguide.com/zurich-l55/lindt-home-of-chocolate-museum-entry-ticket-t396265/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj bilet — Lindt Home of Chocolate, Zurych</a>

    <h3>Berlin — całodniowa wycieczka riksząją, z odbiorem z hotelu</h3>
    <p>Nietypowy i relaksujący sposób na zwiedzanie Berlina — elektryczną rikszą, z lokalnym przewodnikiem, który łączy historię miasta z anegdotami i kulturą, w znacznie spokojniejszym tempie niż klasyczne zwiedzanie pieszo. W cenie bezpośredni odbiór z hotelu, więc nie musisz martwić się dotarciem do punktu zbiórki.</p>
    <a href="https://www.getyourguide.com/berlin-l17/full-day-rickshaw-tour-an-adventure-full-of-culture-and-delight-with-hotel-pickup-t856039/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj wycieczkę riksząją — Berlin</a>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Zaplanuj całą podróż w jednym miejscu</h3>
      <p class="trip-toolkit-subtitle">Potrzebujesz lotu, noclegu, samochodu lub transferu? Wszystko znajdziesz tutaj.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=eur&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Szukaj biletów lotniczych</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Szukaj noclegu</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Wynajmij samochód</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://intui.tpk.lu/xynzx1LU" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚕 Zarezerwuj transfer</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
      </div>
      <div class="gyg-search-widget-wrap">
        <div class="gyg-widget" data-gyg-partner-id="LM6J21N" data-gyg-number-of-items="3" data-gyg-locale-code="en-US" data-gyg-type="search"></div>
      </div>
    </div>`,
  },
  {
    slug: "castles-europe",
    title: "Najpiękniejsze zamki Europy",
    intro: "12 bajkowych zamków w całej Europie, z biletami i wycieczkami do zarezerwowania z wyprzedzeniem",
    body: `
    <p>Od wież, które zainspirowały parki Disneya, po średniowieczne twierdze ukryte w lasach lub przycupnięte na klifach nad lodowcowymi jeziorami — Europa ma jedne z najbardziej spektakularnych zamków na świecie. Poniżej 12 najpiękniejszych, z praktycznymi informacjami i biletami do zarezerwowania z wyprzedzeniem, żeby ominąć kolejkę przy wejściu.</p>

    <h2 class="section-title"><span class="bar"></span>Zamki</h2>

    <h3>🇩🇪 Zamek Neuschwanstein, Niemcy</h3>
    <p>Zamek, który bezpośrednio zainspirował sylwetki w parkach Disneya — smukłe, białe wieże wzniesione na skalistym szczycie w Alpach Bawarskich. Zbudowany przez króla Ludwika II Bawarskiego jako romantyczna ucieczka od rzeczywistości, Neuschwanstein pozostaje najczęściej fotografowanym zamkiem w Europie, zwłaszcza jesienią, gdy okoliczne lasy nabierają kolorów.</p>
    <a href="https://www.getyourguide.com/munich-l26/from-munich-neuschwanstein-linderhof-castle-full-day-trip-t1753/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj wycieczkę — Neuschwanstein i Linderhof, z Monachium</a>

    <h3>🇩🇪 Zamek Eltz, Niemcy</h3>
    <p>Ukryty głęboko w lesie w pobliżu rzeki Mozeli, Eltz to jeden z nielicznych niemieckich zamków, który nigdy nie został zniszczony ani zdobyty — i od ponad 850 lat należy do tej samej rodziny. Jego sylwetka, z wieżami z różnych epok stłoczonymi na wąskiej skale, wygląda jak żywcem wyjęta z bajki.</p>
    <a href="https://www.getyourguide.com/frankfurt-l21/frankfurt-day-trip-to-eltz-castle-on-the-moselle-t40707/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj wycieczkę — zamek Eltz, z Frankfurtu</a>

    <h3>🇩🇪 Zamek Hohenzollern, Niemcy</h3>
    <p>Rodowa siedziba pruskiej rodziny królewskiej, dumnie wznosząca się na odosobnionym szczycie, z widokiem sięgającym w bezchmurne dni na całe południowe Niemcy. Jego XIX-wieczna neogotycka architektura, z wieżami i blankami, sprawia, że Hohenzollern jest jednym z najbardziej spektakularnych zamków, jakie można zwiedzić w Europie.</p>
    <a href="https://www.getyourguide.com/sigmaringen-l100350/sigmaringen-hohenzollern-castle-entry-fee-audio-guide-t849245/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj bilet — zamek Hohenzollern</a>

    <h3>🇷🇴 Zamek Peleș, Rumunia</h3>
    <p>Uznawany przez wielu za najpiękniejszy zamek w Rumunii, Peleș był letnią rezydencją króla Karola I — neorenesansowa perła o bogatych wnętrzach, zbudowana u podnóża gór Bucegi, w Sinai. Każde pomieszczenie ma swój własny styl dekoracyjny, od niemieckich mebli po orientalną broń.</p>
    <a href="https://www.getyourguide.com/sinaia-l124688/peles-castle-and-bran-castle-entry-tickets-t1414362/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj bilet łączony — Peleș i Bran</a>

    <h3>🇷🇴 Zamek Corvin, Rumunia</h3>
    <p>Imponująca gotycko-renesansowa twierdza, zbudowana przez Jana Hunyadego, z wieżami, wiszącymi mostami i mrocznymi legendami o lochach w jej wnętrzu. Jedna z najlepiej zachowanych średniowiecznych twierdz Europy Wschodniej, widok szczególnie spektakularny o zachodzie słońca.</p>
    <a href="https://www.getyourguide.com/corvin-castle-l127588/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj bilet — zamek Corvin, Hunedoara</a>

    <h3>🇷🇴 Zamek Bran, Rumunia</h3>
    <p>Znany na całym świecie jako „zamek Draculi”, dzięki powiązaniu stworzonemu przez powieść Brama Stokera, Bran to spektakularna średniowieczna twierdza, wznosząca się na klifie na skraju Transylwanii. Choć prawdziwy historyczny związek z Włodem Palownikiem jest dyskusyjny, gotycka atmosfera tego miejsca nigdy nie zawodzi.</p>
    <a href="https://www.getyourguide.com/bran-l188057/bran-castle-dracula-s-castle-entry-ticket-with-audio-guide-t1380614/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj bilet — zamek Bran</a>

    <h3>🇵🇹 Pałac Pena, Portugalia</h3>
    <p>Romantyczny pałac o ekstrawaganckich kolorach (czerwień, żółć, fiolet), zbudowany na wzgórzach Sintry, często ponad chmurami w mgliste dni. Eklektyczna mieszanka stylów — gotyckiego, manueliańskiego, islamskiego i renesansowego — sprawia, że Pena jest jednym z najbardziej fotogenicznych pałaców na świecie, wpisanym na listę światowego dziedzictwa UNESCO.</p>
    <a href="https://www.getyourguide.com/lisbon-l42/lisbon-sintra-pena-regaleira-cabo-da-roca-cascais-tour-t881398/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj wycieczkę — Sintra, Pena i Cascais, z Lizbony</a>

    <h3>🇪🇸 Alcázar w Segowii, Hiszpania</h3>
    <p>Ze swoją ostrą sylwetką, przypominającą kamienny statek unoszący się nad miastem, Alcázar w Segowii często jest wymieniany jako jedna z inspiracji dla zamku Kopciuszka w parkach Disneya — przyjazna rywalizacja z Neuschwansteinem o ten tytuł. Średniowieczna twierdza królewska, używana przez wieki przez monarchów kastylijskich.</p>
    <a href="https://www.getyourguide.com/ro-ro/segovia-spania-l1694/din-madrid-excursie-de-o-zi-la-segovia-cu-bilet-de-intrare-la-alcazar-t1402263/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj wycieczkę — Segowia i Alcázar, z Madrytu</a>

    <h3>🇫🇷 Zamek Chambord, Francja</h3>
    <p>Największy zamek w Dolinie Loary, arcydzieło francuskiego renesansu, z ponad 400 pomieszczeniami i słynnymi podwójnymi spiralnymi schodami, czasem przypisywanymi samemu Leonardowi da Vinci. Otaczające ogrody i las, rozciągające się na tysiącach hektarów, sprawiają, że Chambord to doświadczenie na cały dzień, a nie tylko szybka wizyta.</p>
    <a href="https://www.getyourguide.com/loire-valley-chateaux-l7956/chambord-skip-the-line-chateau-de-chambord-ticket-t183794/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj bilet bez kolejki — zamek Chambord</a>

    <h3>🇨🇭 Zamek Chillon, Szwajcaria</h3>
    <p>Średniowieczny zamek na wyspie, zbudowany bezpośrednio na skale Jeziora Genewskiego, z Alpami w tle — najczęściej odwiedzany zabytek historyczny w Szwajcarii. Poeta Lord Byron rozsławił go na całym świecie swoim poematem „Więzień Chillonu”, zainspirowanym lochami w podziemiach zamku.</p>
    <a href="https://www.chillon.ch/" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zobacz godziny i bilety — zamek Chillon (oficjalna strona)</a>

    <h3>🇸🇮 Zamek Bled, Słowenia</h3>
    <p>Najstarszy zamek w Słowenii, zbudowany na stromym klifie, 130 metrów nad Jeziorem Bled — jeden z najczęściej fotografowanych widoków Europy Środkowej, z małym kościółkiem na wyspie na środku jeziora widocznym bezpośrednio z jego murów.</p>
    <a href="https://www.getyourguide.com/en-au/bled-castle-l140261/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj bilet — zamek Bled</a>

    <h3>🇵🇱 Zamek w Malborku, Polska</h3>
    <p>Największy zamek na świecie pod względem powierzchni — ogromna twierdza z czerwonej gotyckiej cegły, zbudowana przez zakon krzyżacki nad brzegiem Nogatu. Wpisany na listę światowego dziedzictwa UNESCO, Malbork robi wrażenie swoją skalą, trudną do ogarnięcia, zanim zobaczy się go na własne oczy.</p>
    <a href="https://www.getyourguide.com/gdansk-l1960/gdansk-malbork-castle-regular-tour-t218583/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj wycieczkę — zamek w Malborku, z Gdańska</a>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Zaplanuj całą podróż w jednym miejscu</h3>
      <p class="trip-toolkit-subtitle">Potrzebujesz lotu, noclegu, samochodu lub transferu? Wszystko znajdziesz tutaj.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=eur&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Szukaj biletów lotniczych</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Szukaj noclegu</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Wynajmij samochód</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://intui.tpk.lu/xynzx1LU" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚕 Zarezerwuj transfer</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
      </div>
    </div>`,
  },
  {
    slug: "amusement-parks-europe",
    title: "Najlepsze parki rozrywki w Europie",
    intro: "6 najlepszych parków, dla każdego wieku — od Disneylandu w Paryżu po najbardziej ekstremalne kolejki górskie",
    body: `
    <p>Od klasycznych parków z postaciami uwielbianymi przez dzieci po jedne z najwyższych kolejek górskich na świecie — Europa oferuje parki rozrywki dla każdego wieku i każdego poziomu emocji. Poniżej kilka najpopularniejszych, pogrupowanych według kategorii, z biletami do zarezerwowania z wyprzedzeniem.</p>

    <h2 class="section-title"><span class="bar"></span>👑 Najpopularniejsze i najczęściej odwiedzane (każdy wiek)</h2>

    <h3>🇫🇷 Disneyland Paris, Francja</h3>
    <p>Najczęściej odwiedzany park rozrywki w Europie — dwa pełne parki tematyczne (Disneyland Park i Walt Disney Studios), gdzie dzieci mogą spotkać swoje ulubione postacie z kreskówek, wśród zamków, parad i codziennych pokazów. Kompletne doświadczenie, idealne na 2-3-dniowy wypad.</p>
    <a href="https://www.getyourguide.com/paris-l16/disneyland-paris-2-parks-ticket-1-2-3-4-5-day-t395320/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj bilet — Disneyland Paris</a>

    <h3>🇩🇪 Europa-Park, Rust, Niemcy</h3>
    <p>Drugi co do wielkości park rozrywki w Europie, podzielony na 18 stref tematycznych, każda poświęcona innemu europejskiemu krajowi. Ma 13 spektakularnych kolejek górskich, łagodniejsze strefy dla młodszych dzieci, codzienne pokazy i ogromny park wodny (Rulantica) — praktycznie kompletny urlop w jednym miejscu.</p>
    <a href="https://www.getyourguide.com/rust-l2882/rust-europa-park-entrance-ticket-t393563/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj bilet — Europa-Park, Rust</a>

    <h2 class="section-title"><span class="bar"></span>🧸 Najlepsze dla maluchów i przedszkolaków</h2>

    <h3>🇳🇱 Efteling, Kaatsheuvel, Holandia</h3>
    <p>Bajkowy park, znany z relaksującej atmosfery swojego Lasu Baśni — postacie z opowieści braci Grimm, ścieżki pełne zieleni i znacznie spokojniejsze tempo niż w parkach nastawionych na mocne wrażenia. Idealny dla małych dzieci, które łatwo ulegają magii tego miejsca.</p>
    <a href="https://www.getyourguide.com/amsterdam-l36/amsterdam-efteling-park-roundtrip-transfer-and-entry-ticket-t501550/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj bilet (z transferem) — Efteling, z Amsterdamu</a>

    <h3>🇩🇰 Legoland Billund, Dania</h3>
    <p>Oryginalny park Legoland, zbudowany specjalnie dla rodzin z małymi dziećmi — spektakularne miasteczka zbudowane w całości z klocków Lego, interaktywne atrakcje i zajęcia zaprojektowane, by pobudzać kreatywność, a nie tylko dostarczać emocji. Miejsce, w którym rodzice bawią się tak samo jak maluchy.</p>
    <a href="https://www.getyourguide.com/billund-l87275/legoland-billund-entry-ticket-private-transfer-t1427002/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj bilet (z transferem) — Legoland Billund</a>

    <h2 class="section-title"><span class="bar"></span>🎢 Najlepsze dla przygody i mocnych wrażeń (starsze dzieci)</h2>

    <h3>🇮🇹 Gardaland, Castelnuovo del Garda, Włochy</h3>
    <p>Tuż obok wspaniałego Jeziora Garda, Gardaland łączy intensywne kolejki górskie (jak Oblivion czy Raptor) ze strefą przeznaczoną dla najmłodszych (Peppa Pig Land) — rzadka równowaga między emocjami dla nastolatków a zabawą dla całej rodziny, w tym samym parku.</p>
    <a href="https://www.getyourguide.com/garda-l145126/gardaland-park-fixed-day-entry-ticket-t225588/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj bilet — Gardaland</a>

    <h3>🇵🇱 Energylandia, Zator, Polska</h3>
    <p>Największy park rozrywki w Polsce, znany w całej Europie z ogromnej liczby nowoczesnych kolejek górskich — w tym Zadra, jednej z najwyższych hybrydowych kolejek górskich na świecie. Ma też ogromną strefę wodną oraz strefy zaprojektowane specjalnie dla młodszych dzieci, więc nie jest tylko dla miłośników mocnych wrażeń.</p>
    <a href="https://www.getyourguide.com/krakow-l40/krakow-energylandia-full-day-ticket-with-optional-pickup-t114202/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Zarezerwuj bilet (z opcjonalnym odbiorem) — Energylandia, z Krakowa</a>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Zaplanuj całą podróż w jednym miejscu</h3>
      <p class="trip-toolkit-subtitle">Potrzebujesz lotu, noclegu, samochodu lub transferu? Wszystko znajdziesz tutaj.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=eur&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Szukaj biletów lotniczych</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Szukaj noclegu</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Wynajmij samochód</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://intui.tpk.lu/xynzx1LU" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚕 Zarezerwuj transfer</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
      </div>
    </div>`,
  },
])

exports.TRAVEL_GUIDES_NL = [
  {
    slug: "transport",
    title: "Zo kom je efficiënt bij de grote toeristische attracties",
    intro: "Gids voor stedelijk en regionaal vervoer",
    body: `
    <p>Een goede reisroute hangt sterk af van hoe je je tussen attracties verplaatst. Als je musea, kastelen of historische monumenten wilt bezoeken, maken de verbinding tussen steden en de lokale logistiek het verschil tussen een ontspannen dag en een dag verloren in stations en haltes.</p>
    <p>Voor lange afstanden of tussen historische regio's blijft de trein de populairste optie — het Europese spoornetwerk verbindt de meeste hoofdsteden met kleinere steden, vaak via schilderachtige routes. Bussen vullen de gaten goed op, vooral naar plaatsen of berggebieden die de trein niet rechtstreeks bereikt, en kosten meestal minder.</p>
    <p>Als je met veel bagage op de luchthaven landt of in groep reist, bespaart een vooraf geboekte privétransfer je de rompslomp van het wisselen tussen vervoermiddelen — je gaat rechtstreeks van de terminal naar de poort van het kasteel of het hotel. Deze verbindingen vooraf plannen maakt van een hectische reis een stressvrije.</p>
    <div class="plan-visit-block" style="display:block">
      ${TRAVEL_GUIDES_MONETIZATION_READY
        ? `
      <a href="${escapeHtml(getTransferLinkFor())}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking-alt">🚕 Boek een privétransfer</a>`
        : `<p class="plan-visit-hint">${comingSoonTextFor("nl")}</p>`}
    </div>`,
  },
  {
    slug: "parking",
    title: "Zo ga je om met parkeren bij historische gebieden",
    intro: "Een gids voor automobilisten — parkeren in oude stadscentra",
    body: `
    <p>Met je eigen of een huurauto rijden geeft je een bewegingsvrijheid die andere vervoermiddelen niet kunnen evenaren — maar historische stadscentra staan bekend om verkeersbeperkingen en een chronisch tekort aan parkeerplaatsen.</p>
    <p>Je auto ergens achterlaten riskeert een boete, of zelfs wegslepen. De veiligste optie blijft een beveiligde, particulier beheerde ondergrondse of bovengrondse parkeergarage — bij veel garages kun je vooraf een plek reserveren, wat vooral in het weekend of hoogseizoen belangrijk is, wanneer de attracties het drukst zijn.</p>
    <p>Een goed gekozen parkeerplaats, op een paar stappen van het museum of de oude binnenstad, geeft je de vrijheid om in je eigen tempo te verkennen, zonder je zorgen te maken over de auto. Controleer de beschikbaarheid vooraf en boek online — het is de moeite waard, vooral in een druk weekend.</p>
    <div class="plan-visit-block" style="display:block">
      ${TRAVEL_GUIDES_MONETIZATION_READY
        ? `<a href="https://www.awin1.com/cread.php?awinmid=18633&awinaffid=3051943&campaign=Your%20Parking%20Space&ued=https%3A%2F%2Fwww.yourparkingspace.co.uk%2F" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking">🅿️ UK-parkeerplaats — vooraf boeken</a>
      <p class="plan-visit-hint">🅿️ EU-parkeerplaats — binnenkort</p>`
        : `<p class="plan-visit-hint">${comingSoonTextFor("nl")}</p>`}
    </div>`,
  },
  {
    slug: "restaurants",
    title: "Zo plan je een perfecte dag uit",
    intro: "Openingstijden afstemmen op etenstijden",
    body: `
    <p>Een geweldige dag uit draait om de balans tussen cultuur en rust. Als je je dag opbouwt rond de openingstijden van een museum of galerie, is het de moeite waard om ook je eetpauzes vooraf te plannen — anders loop je het risico hongerig aan te komen net wanneer alle tentjes in de buurt vol zitten.</p>
    <p>Grote attracties trekken dagelijks duizenden bezoekers, en de omliggende gebieden raken snel druk, vooral tijdens lunch en diner. Vooraf reserveren via een online platform garandeert je een tafel zonder in de rij te staan of op het laatste moment wanhopig naar een vrije plek te zoeken.</p>
    <p>Het meest efficiënte patroon: bezoek tentoonstellingen vroeg in de ochtend, wanneer het rustig is, en sluit de dag af met een vooraf gereserveerde maaltijd in een lokaal restaurant — een gewone dag uit wordt zo een herinnering die je echt wilt bewaren.</p>
    <div class="plan-visit-block" style="display:block">
      ${TRAVEL_GUIDES_MONETIZATION_READY
        ? `<a href="${escapeHtml(linkTheForkAffiliate || "https://www.thefork.com/")}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-booking">🍽️ Zoek op TheFork (Frankrijk, Italië, Spanje)</a>
      <a href="${escapeHtml(linkOpenTableAffiliate || "https://www.opentable.com/")}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking-alt">🍽️ Zoek op OpenTable (VK, Duitsland)</a>`
        : `<p class="plan-visit-hint">${comingSoonTextFor("nl")}</p>`}
    </div>`,
  },
  {
    slug: "flights",
    title: "Hoe vind je de beste vliegtickets",
    intro: "Gids voor het zoeken van vluchten, met prijsvergelijking in real time",
    body: `
    <p>Het vliegticket is meestal de grootste uitgave van een reis — en de gemakkelijkste om te optimaliseren, als je weet waar je moet zoeken. Prijsverschillen tussen luchtvaartmaatschappijen, tussen dagen van de week of tussen nabijgelegen luchthavens kunnen honderden euro's schelen voor dezelfde bestemming.</p>
    <p>Een vergelijker die tegelijk tientallen luchtvaartmaatschappijen doorzoekt (inclusief low-cost) toont je in één oogopslag de goedkoopste optie, ongeacht wie de vlucht uitvoert — veel sneller dan handmatig de site van elke maatschappij te checken.</p>
    <p>Zoek hieronder direct, zonder de pagina te verlaten — vul de vertrekstad en bestemming in, en de resultaten verschijnen in real time, met actuele prijzen.</p>
    <a href="https://aviasales.tpk.lu/vB6Uc9BC" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">✈️ Zoek vliegtickets</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>`,
  },
].concat(exports.TRAVEL_GUIDES_EN.slice(4,5), [
  {
    slug: "day-trips-tours-europe",
    title: "De beste dagtochten en rondleidingen in Europa",
    intro: "13 topexcursies, door heel Europa, met tickets en tijdsloten die je vooraf kunt boeken",
    body: `
    <p>Een vooraf geboekte tour betekent een gegarandeerde plek, een bevestigde gids en vaak toegang tot plekken waar je anders urenlang zou moeten wachten. Hieronder enkele van de populairste dagtochten en tours in de grote steden van Europa — van bootochtjes op de Donau tot routes door de oude geschiedenis van Rome of Athene.</p>

    <h2 class="section-title"><span class="bar"></span>Aanbevolen tours</h2>

    <h3>Boekarest — klooster Snagov, paleis Mogoșoaia en zoutmijn Slănic</h3>
    <p>Een perfecte dagtocht voor wie in één route drie totaal verschillende kanten van de omgeving van Boekarest wil zien: de rust van het kloostereiland Snagov, de elegantie van paleis Mogoșoaia en de indrukwekkende zoutmijn van Slănic, diep uitgehouwen in de berg. Ideaal als je maar één vrije dag hebt in de hoofdstad en aan de drukte van de stad wilt ontsnappen.</p>
    <a href="https://www.getyourguide.com/slanic-l91935/snagov-monastery-mogosoaia-salt-mine-day-trip-bucharest-t1221626/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek de tour — Snagov, Mogoșoaia en de zoutmijn van Slănic</a>

    <h3>Boekarest — dagtocht naar de Donaudelta</h3>
    <p>De Donaudelta is een van de meest spectaculaire natuurreservaten van Europa, met een unieke biodiversiteit — pelikanen, aalscholvers en honderden vogelsoorten, tussen smalle kanalen en vissersdorpjes door. Een dagtocht vanuit Boekarest, inclusief vervoer, is de eenvoudigste manier om de sfeer van de delta te ervaren zonder zelf vervoer te regelen.</p>
    <a href="https://www.getyourguide.com/bucharest-l111/from-bucharest-day-trip-to-danube-delta-t662170/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek de tour — Donaudelta</a>

    <h3>Wenen — Donau-riviercruise, met optionele lunch</h3>
    <p>Wenen gezien vanaf het water vertelt een heel ander verhaal — historische bruggen, keizerlijke gebouwen en groene parken glijden voorbij langs de oevers van de Donau. Een ontspannen cruise, met optionele lunch aan boord, is een welkome pauze na een ochtend wandelen door het historische centrum.</p>
    <a href="https://www.getyourguide.com/vienna-l7/vienna-city-cruise-with-optional-lunch-t58823/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek de cruise — Wenen</a>

    <h3>Boedapest — avondlijke panoramische cruise op de Donau</h3>
    <p>Boedapest 's avonds verlicht is voor velen de mooiste stadssilhouet van Midden-Europa — het parlement, de Kettingbrug en het Burchtpaleis glanzen langs de Donau. Een avondcruise is de klassieke, bijna onmisbare manier om de stad vanuit precies de juiste hoek te zien.</p>
    <a href="https://www.getyourguide.com/budapest-l29/budapest-evening-sightseeing-cruise-on-the-danube-t1117141/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek de cruise — Boedapest</a>

    <h3>Amsterdam — dagtocht naar Brugge</h3>
    <p>Brugge geldt als een van de best bewaarde middeleeuwse steden van Europa — grachten, stenen bruggen en gotische gebouwen, allemaal samengebald in een compact historisch centrum dat gemakkelijk te voet te verkennen is. Een dagtocht vanuit Amsterdam, met een Engels- of Spaanstalige gids, is de eenvoudige keuze voor wie het vervoer niet ingewikkeld wil maken.</p>
    <a href="https://www.getyourguide.com/amsterdam-l36/from-amsterdam-bruges-day-tour-in-spanish-or-english-t2633/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program&cmp=amsterdam" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek de tour — Brugge, vanuit Amsterdam</a>

    <h3>Den Haag — toegangsticket voor het Panorama Mesdag-museum</h3>
    <p>Panorama Mesdag is een enorm rond schilderij uit 1881, dat de bezoeker volledig omringt met een uitzicht op het 19e-eeuwse vissersdorp Scheveningen — een unieke visuele ervaring, moeilijk voor te stellen totdat je het met eigen ogen ziet. Een klein maar spectaculair museum, op een paar stappen van het centrum van Den Haag.</p>
    <a href="https://www.getyourguide.com/the-hague-l1267/the-hague-entry-ticket-to-the-panorama-mesdag-museum-t391318/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek het ticket — Panorama Mesdag-museum, Den Haag</a>

    <h3>Praag — Vyšehrad-vesting, het verborgen juweel van de stad</h3>
    <p>Terwijl de meeste toeristen zich verdringen bij het Praagse kasteel, blijft Vyšehrad een veel rustigere keuze — een historische vesting aan de oevers van de Moldau, met een prachtig uitzicht en een begraafplaats waar grote Tsjechische figuren rusten. Een perfecte plek voor wie Praag zonder de drukte wil zien.</p>
    <a href="https://www.getyourguide.com/prague-l10/prague-s-best-hidden-gem-vysehrad-castle-historic-fort-t1011583/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek de tour — Vyšehrad-vesting, Praag</a>

    <h3>Rome — Colosseum met toegang tot de arenavloer en het Forum Romanum</h3>
    <p>Weinig bezoekers krijgen de kans om te staan op de echte vloer van de Colosseum-arena, precies waar ooit gladiatoren vochten — speciale toegang, alleen beschikbaar met specifieke tickets. Gecombineerd met een rondleiding door het Forum Romanum reconstrueert de tour, stap voor stap, het dagelijks leven in het oude Rome.</p>
    <a href="https://www.getyourguide.com/rome-l33/rome-colosseum-gladiator-floor-access-roman-forum-tour-t633431/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek de tour — Colosseum en Forum Romanum</a>

    <h3>Parijs — kleine-groepstour binnen in de Notre-Dame</h3>
    <p>Na jaren van restauratie heeft een bezoek aan het binnenste van de Notre-Dame een speciale betekenis — gotische architectuur, glas-in-loodramen en de geschiedenis van de kathedraal, uitgelegd door een lokale gids, in kleine groepen van maximaal 5 personen, voor een veel persoonlijkere ervaring dan een gewoon bezoek.</p>
    <a href="https://www.getyourguide.com/paris-l16/paris-small-group-interior-tour-of-notre-dame-max-5-people-t607051/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek de tour — binnenin de Notre-Dame</a>

    <h3>Madrid — combiticket: San Antonio de los Alemanes en het klooster van San Placido</h3>
    <p>Twee van de minder bekende maar spectaculaire barokke kerken van Madrid — beschilderde gewelven, verguld altaren en een zeldzame rust in het hart van de stad. Een combiticket, ideaal voor wie Madrid wil ontdekken voorbij de grote, drukke musea.</p>
    <a href="https://www.getyourguide.com/madrid-l46/combo-entry-to-san-antonio-de-los-alemanes-and-the-monastery-of-san-placido-t1103055/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek het combiticket — Madrid</a>

    <h3>Bratislava — panoramische bustour</h3>
    <p>Bratislava ontdek je snel en comfortabel vanuit een panoramische bus — het kasteel van Bratislava, de Michielspoort en de historische gebouwen van de Slowaakse hoofdstad, allemaal op één eenvoudige, moeiteloze route, ideaal vooral als je weinig tijd hebt tijdens een citytrip.</p>
    <a href="https://www.getyourguide.com/bratislava-l765/bratislava-sightseeing-bus-tour-t28703/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek de tour — Bratislava</a>

    <h3>Lissabon — Museum van de Koninklijke Schat</h3>
    <p>Kronen, koninklijke juwelen en voorwerpen van immense historische waarde, tentoongesteld in een van de minst drukke musea van Lissabon. Een korte maar spectaculaire stop voor wie een andere kant van de Portugese monarchie wil zien, weg van de klassieke toeristenpaden.</p>
    <a href="https://www.getyourguide.com/lisbon-l42/lisbon-royal-treasure-museum-entry-ticket-t425344/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek het ticket — Museum van de Koninklijke Schat, Lissabon</a>

    <h3>Athene — dagtocht naar Delphi</h3>
    <p>Delphi, in de oudheid beschouwd als de „navel van de wereld”, herbergde het belangrijkste orakel van de Griekse wereld — indrukwekkende ruïnes, in een spectaculair berglandschap, enkele uren van Athene. De tour omvat een meertalige audiogids, ideaal voor wie oude geschiedenis wil beleven zonder het zelf te hoeven organiseren.</p>
    <a href="https://www.getyourguide.com/athens-l91/from-athens-delphi-day-trip-with-multilingual-audioguide-t748369/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek de tour — Delphi, vanuit Athene</a>

    <h3>Istanbul — dinercruise met show op de Gouden Hoorn en de Bosporus</h3>
    <p>Een avond op het water, met Istanbul verlicht aan beide kanten van de Bosporus — diner aan boord, livemuziek en traditionele dans, op een cruise die het uitzicht op de stad combineert met een volledige culturele ervaring. Een onvergetelijke manier om elk bezoek aan Istanbul af te sluiten.</p>
    <a href="https://www.getyourguide.com/istanbul-l56/istanbul-golden-horn-bosphorus-dinner-and-show-t459410/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek de dinercruise — Istanbul</a>

    <h3>Stockholm — boottocht door de archipel</h3>
    <p>De archipel van Stockholm telt meer dan 30.000 eilanden en eilandjes, bezaaid met traditionele rode Zweedse huisjes — een landschap dat je gewoon niet ziet vanuit het stadscentrum. Een boottocht van een paar uur onthult een totaal andere, veel rustigere en natuurlijkere kant van de Zweedse hoofdstad.</p>
    <a href="https://www.getyourguide.com/stockholm-l50/stockholm-archipelago-boat-tour-t811343/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek de tour — archipel van Stockholm</a>

    <h3>Konstanz — toegangsticket voor het eiland Mainau</h3>
    <p>Het eiland Mainau, in het Bodenmeer, staat bekend als het „bloemeneiland” — onberispelijke botanische tuinen, een barok kasteel en spectaculair uitzicht op de Alpen, op de grens tussen Duitsland, Zwitserland en Oostenrijk. Een perfecte plek voor een ontspannen dag, weg van de gebruikelijke stadstrips.</p>
    <a href="https://www.getyourguide.com/konstanz-l204/entrance-ticket-for-the-mainau-island-t561436/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek het ticket — eiland Mainau, Konstanz</a>

    <h3>Monaco — panoramische tour Monaco-Monte Carlo (Hop-on Hop-off)</h3>
    <p>Monaco is klein maar boordevol bezienswaardigheden — het Prinselijk Paleis, het beroemde casino van Monte Carlo en het Formule 1-circuit, allemaal te bereiken met één panoramisch busticket, met gratis stops bij elk interessepunt, in jouw eigen tempo.</p>
    <a href="https://www.getyourguide.com/monaco-l515/monaco-monte-carlo-hop-on-hop-off-bus-tour-t170400/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek de tour — Monaco &amp; Monte Carlo</a>

    <h3>München — begeleide e-stepptour, 2 uur, langs de topbezienswaardigheden</h3>
    <p>Een snelle en leuke manier om het centrum van München te ontdekken — Marienplatz, de Frauenkirche, de Engelse Tuin en de overige essentiële bezienswaardigheden — op een begeleide e-step, in slechts 2 uur. Ideaal voor wie weinig tijd heeft in de stad maar toch zoveel mogelijk wil zien, zonder de vermoeidheid van lopen.</p>
    <a href="https://www.getyourguide.com/munich-l26/munchen-top-sights-2h-guided-e-scooter-tour-t463376/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek de tour — e-steptour door München</a>

    <h3>Barcelona — ticket zonder wachtrij voor de Sagrada Família</h3>
    <p>De Sagrada Família is misschien wel het beroemdste onafgemaakte werk in de architectuurgeschiedenis — Gaudí's meesterwerk, met torens die naar de hemel reiken en glas-in-loodramen die het licht binnen omtoveren tot een kleurenspel. Een ticket zonder wachtrij bespaart je uren wachten, vooral in het hoogseizoen.</p>
    <a href="https://www.getyourguide.com/barcelona-l45/sagrada-familia-skip-the-line-ticket-t50027/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek het ticket zonder wachtrij — Sagrada Família</a>

    <h3>Venetië — ticket zonder wachtrij voor de San Marco-basiliek, met audio-app</h3>
    <p>De San Marco-basiliek, met haar gouden mozaïeken en Byzantijnse koepels, is het hart van Venetië — maar ook een van de meest bezochte kerken ter wereld, met wachtrijen die in het hoogseizoen uren kunnen duren. Een ticket zonder wachtrij, met audio-app inbegrepen, laat je het interieur in je eigen tempo bewonderen, zonder buiten te hoeven wachten.</p>
    <a href="https://www.getyourguide.com/venice-l35/venice-st-mark-s-basilica-skip-the-line-ticket-audio-app-t395051/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek het ticket zonder wachtrij — San Marco-basiliek, Venetië</a>

    <h3>Florence — Interactief Leonardo da Vinci-museum</h3>
    <p>Een ongewoon museum, volledig gewijd aan het genie van Leonardo da Vinci — werkende modellen, replica's van zijn mechanische uitvindingen en interactieve exposities die je kunt aanraken en uitproberen, niet alleen van een afstand bekijken. Een leuke en leerzame stop, vooral geschikt voor gezinnen met kinderen.</p>
    <a href="https://www.getyourguide.com/florence-l32/florence-leonardo-interactive-museum-entry-ticket-t86558/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek het ticket — interactief Leonardo-museum, Florence</a>

    <h3>Zürich — Lindt Home of Chocolate</h3>
    <p>De grootste chocoladefontein ter wereld, het hele productieproces stap voor stap uitgelegd en natuurlijk proeverijen — een museum volledig gewijd aan de Zwitserse passie voor chocolade. Een zoete ervaring, geschikt voor elke leeftijd, op een paar stappen van het meer van Zürich.</p>
    <a href="https://www.getyourguide.com/zurich-l55/lindt-home-of-chocolate-museum-entry-ticket-t396265/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek het ticket — Lindt Home of Chocolate, Zürich</a>

    <h3>Berlijn — hele dag riksjatour, met ophaalservice vanaf het hotel</h3>
    <p>Een ongewone en ontspannen manier om Berlijn te ontdekken — met een elektrische riksja, met een lokale gids die de geschiedenis van de stad combineert met anekdotes en cultuur, in een veel rustiger tempo dan een klassieke wandeltour. Inclusief directe ophaalservice vanaf het hotel, zodat je je geen zorgen hoeft te maken over het bereiken van een verzamelpunt.</p>
    <a href="https://www.getyourguide.com/berlin-l17/full-day-rickshaw-tour-an-adventure-full-of-culture-and-delight-with-hotel-pickup-t856039/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek de riksjatour — Berlijn</a>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Plan je hele reis, op één plek</h3>
      <p class="trip-toolkit-subtitle">Vlucht, accommodatie, auto of transfer nodig? Je vindt alles hier.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=eur&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Vliegtickets zoeken</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Accommodatie zoeken</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Auto huren</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://intui.tpk.lu/xynzx1LU" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚕 Transfer boeken</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
      </div>
      <div class="gyg-search-widget-wrap">
        <div class="gyg-widget" data-gyg-partner-id="LM6J21N" data-gyg-number-of-items="3" data-gyg-locale-code="en-US" data-gyg-type="search"></div>
      </div>
    </div>`,
  },
  {
    slug: "castles-europe",
    title: "De mooiste kastelen van Europa",
    intro: "12 sprookjesachtige kastelen, door heel Europa, met tickets en rondleidingen die je vooraf kunt boeken",
    body: `
    <p>Van de torens die de Disney-parken inspireerden tot middeleeuwse burchten verscholen in bossen of gebouwd op kliffen boven gletsjermeren — Europa telt enkele van de meest spectaculaire kastelen ter wereld. Hieronder 12 van de mooiste, met praktische informatie en tickets die je vooraf kunt boeken, zodat je de wachtrij bij de ingang overslaat.</p>

    <h2 class="section-title"><span class="bar"></span>De kastelen</h2>

    <h3>🇩🇪 Slot Neuschwanstein, Duitsland</h3>
    <p>Het kasteel dat rechtstreeks de silhouetten in de Disney-parken inspireerde — slanke witte torens, opgetrokken op een rotstop in de Beierse Alpen. Gebouwd door koning Lodewijk II van Beieren als een romantische ontsnapping aan de werkelijkheid, blijft Neuschwanstein het meest gefotografeerde kasteel van Europa, vooral in de herfst, wanneer de omliggende bossen kleuren.</p>
    <a href="https://www.getyourguide.com/munich-l26/from-munich-neuschwanstein-linderhof-castle-full-day-trip-t1753/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek de tour — Neuschwanstein &amp; Linderhof, vanuit München</a>

    <h3>🇩🇪 Slot Eltz, Duitsland</h3>
    <p>Diep verscholen in een bos bij de rivier de Moezel, is Eltz een van de weinige Duitse kastelen die nooit is verwoest of veroverd — en het is al meer dan 850 jaar in het bezit van dezelfde familie. De silhouet, met torens uit verschillende tijdperken dicht op elkaar op een smalle rots, lijkt zo uit een sprookje geplukt.</p>
    <a href="https://www.getyourguide.com/frankfurt-l21/frankfurt-day-trip-to-eltz-castle-on-the-moselle-t40707/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek de tour — Slot Eltz, vanuit Frankfurt</a>

    <h3>🇩🇪 Burcht Hohenzollern, Duitsland</h3>
    <p>De voorouderlijke zetel van de Pruisische koninklijke familie, trots gelegen op een geïsoleerde top, met een uitzicht dat op heldere dagen reikt over heel Zuid-Duitsland. De neogotische 19e-eeuwse architectuur, met torens en kantelen, maakt Hohenzollern een van de meest indrukwekkende kastelen die je in Europa kunt bezoeken.</p>
    <a href="https://www.getyourguide.com/sigmaringen-l100350/sigmaringen-hohenzollern-castle-entry-fee-audio-guide-t849245/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek het ticket — burcht Hohenzollern</a>

    <h3>🇷🇴 Kasteel Peleș, Roemenië</h3>
    <p>Door velen beschouwd als het mooiste kasteel van Roemenië, was Peleș de zomerresidentie van koning Carol I — een neorenaissance-juweel met weelderige interieurs, gebouwd aan de voet van het Bucegi-gebergte, in Sinaia. Elke kamer heeft zijn eigen decoratieve stijl, van Duits meubilair tot oosterse wapens.</p>
    <a href="https://www.getyourguide.com/sinaia-l124688/peles-castle-and-bran-castle-entry-tickets-t1414362/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek het combiticket — Peleș &amp; Bran</a>

    <h3>🇷🇴 Kasteel Corvin, Roemenië</h3>
    <p>Een indrukwekkende gotisch-renaissancistische vesting, gebouwd door Johannes Hunyadi, met torens, hangende bruggen en duistere legendes over de kerkers erin. Een van de best bewaarde middeleeuwse vestingen van Oost-Europa, en een bijzonder spectaculair gezicht bij zonsondergang.</p>
    <a href="https://www.getyourguide.com/corvin-castle-l127588/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek het ticket — kasteel Corvin, Hunedoara</a>

    <h3>🇷🇴 Kasteel Bran, Roemenië</h3>
    <p>Internationaal bekend als het „kasteel van Dracula”, dankzij de link die de roman van Bram Stoker creëerde, is Bran een spectaculaire middeleeuwse vesting, hoog op een klif aan de rand van Transsylvanië. Ook al is de echte historische link met Vlad de Spietser discutabel, de gotische sfeer van de plek stelt nooit teleur.</p>
    <a href="https://www.getyourguide.com/bran-l188057/bran-castle-dracula-s-castle-entry-ticket-with-audio-guide-t1380614/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek het ticket — kasteel Bran</a>

    <h3>🇵🇹 Paleis van Pena, Portugal</h3>
    <p>Een romantisch paleis, in extravagante kleuren (rood, geel, paars), gebouwd op de heuvels van Sintra, vaak boven de wolken op mistige dagen. Een eclectische mix van stijlen — gotisch, Manuelijns, islamitisch, renaissance — maakt Pena een van de meest fotogenieke paleizen ter wereld, een UNESCO-werelderfgoed.</p>
    <a href="https://www.getyourguide.com/lisbon-l42/lisbon-sintra-pena-regaleira-cabo-da-roca-cascais-tour-t881398/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek de tour — Sintra, Pena &amp; Cascais, vanuit Lissabon</a>

    <h3>🇪🇸 Alcázar van Segovia, Spanje</h3>
    <p>Met zijn scherpe silhouet, als een stenen schip dat boven de stad zweeft, wordt de Alcázar van Segovia vaak genoemd als een van de inspiraties voor het kasteel van Assepoester in de Disney-parken — een vriendschappelijke rivaliteit met Neuschwanstein om die titel. Een middeleeuwse koninklijke vesting, eeuwenlang gebruikt door Castiliaanse vorsten.</p>
    <a href="https://www.getyourguide.com/ro-ro/segovia-spania-l1694/din-madrid-excursie-de-o-zi-la-segovia-cu-bilet-de-intrare-la-alcazar-t1402263/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek de tour — Segovia &amp; Alcázar, vanuit Madrid</a>

    <h3>🇫🇷 Kasteel van Chambord, Frankrijk</h3>
    <p>Het grootste kasteel in de Loirevallei, een meesterwerk van de Franse renaissance, met meer dan 400 kamers en een beroemde dubbele wenteltrap, soms toegeschreven aan Leonardo da Vinci zelf. De omliggende tuinen en het bos, die zich uitstrekken over duizenden hectaren, maken van Chambord een hele dag ervaring, niet slechts een snel bezoek.</p>
    <a href="https://www.getyourguide.com/loire-valley-chateaux-l7956/chambord-skip-the-line-chateau-de-chambord-ticket-t183794/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek het ticket zonder wachtrij — kasteel van Chambord</a>

    <h3>🇨🇭 Kasteel van Chillon, Zwitserland</h3>
    <p>Een middeleeuws eilandkasteel, rechtstreeks gebouwd op een rots in het meer van Genève, met de Alpen als decor — het meest bezochte historische monument van Zwitserland. Dichter Lord Byron maakte het wereldberoemd met zijn gedicht „De gevangene van Chillon”, geïnspireerd door de kerkers in de kelders van het kasteel.</p>
    <a href="https://www.chillon.ch/" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Bekijk tijden en tickets — kasteel van Chillon (officiële site)</a>

    <h3>🇸🇮 Kasteel van Bled, Slovenië</h3>
    <p>Het oudste kasteel van Slovenië, rechtstreeks gebouwd op een steile klif, 130 meter boven het meer van Bled — een van de meest gefotografeerde uitzichten van Midden-Europa, met het kleine kerkje op het eiland midden in het meer direct zichtbaar vanaf de muren.</p>
    <a href="https://www.getyourguide.com/en-au/bled-castle-l140261/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek het ticket — kasteel van Bled</a>

    <h3>🇵🇱 Kasteel van Malbork, Polen</h3>
    <p>Het grootste kasteel ter wereld qua oppervlakte — een enorme vesting van rode gotische baksteen, gebouwd door de Duitse Orde aan de oevers van de Nogat. Een UNESCO-werelderfgoed, Malbork maakt indruk door zijn omvang, moeilijk te bevatten totdat je het met eigen ogen ziet.</p>
    <a href="https://www.getyourguide.com/gdansk-l1960/gdansk-malbork-castle-regular-tour-t218583/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek de tour — kasteel van Malbork, vanuit Gdańsk</a>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Plan je hele reis, op één plek</h3>
      <p class="trip-toolkit-subtitle">Vlucht, accommodatie, auto of transfer nodig? Je vindt alles hier.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=eur&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Vliegtickets zoeken</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Accommodatie zoeken</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Auto huren</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://intui.tpk.lu/xynzx1LU" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚕 Transfer boeken</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
      </div>
    </div>`,
  },
  {
    slug: "amusement-parks-europe",
    title: "De beste pretparken van Europa",
    intro: "6 topparken, voor elke leeftijd — van Disneyland Paris tot de heftigste achtbanen",
    body: `
    <p>Van klassieke parken met personages waar kinderen dol op zijn tot enkele van de hoogste achtbanen ter wereld — Europa heeft pretparken voor elke leeftijd en elk niveau van spanning. Hieronder enkele van de populairste, gegroepeerd per categorie, met tickets die je vooraf kunt boeken.</p>

    <h2 class="section-title"><span class="bar"></span>👑 Meest populair en meest bezocht (alle leeftijden)</h2>

    <h3>🇫🇷 Disneyland Paris, Frankrijk</h3>
    <p>Het meest bezochte pretpark van Europa — twee volledige themaparken (Disneyland Park en Walt Disney Studios), waar kinderen hun favoriete tekenfilmpersonages kunnen ontmoeten, tussen kastelen, parades en dagelijkse shows. Een complete ervaring, ideaal voor een vakantie van 2-3 dagen.</p>
    <a href="https://www.getyourguide.com/paris-l16/disneyland-paris-2-parks-ticket-1-2-3-4-5-day-t395320/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek het ticket — Disneyland Paris</a>

    <h3>🇩🇪 Europa-Park, Rust, Duitsland</h3>
    <p>Het op één na grootste pretpark van Europa, opgedeeld in 18 themagebieden, elk gewijd aan een Europees land. Het heeft 13 spectaculaire achtbanen, rustigere zones voor jongere kinderen, dagelijkse shows en een enorm waterpark (Rulantica) — praktisch een complete vakantie op één plek.</p>
    <a href="https://www.getyourguide.com/rust-l2882/rust-europa-park-entrance-ticket-t393563/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek het ticket — Europa-Park, Rust</a>

    <h2 class="section-title"><span class="bar"></span>🧸 Het beste voor peuters en kleuters</h2>

    <h3>🇳🇱 Efteling, Kaatsheuvel, Nederland</h3>
    <p>Een sprookjespark, bekend om de ontspannende sfeer van het Sprookjesbos — personages uit de verhalen van de gebroeders Grimm, groene paden en een veel rustiger tempo dan bij parken die draaien om spanning. Ideaal voor jonge kinderen, die gemakkelijk onder de betovering van de plek raken.</p>
    <a href="https://www.getyourguide.com/amsterdam-l36/amsterdam-efteling-park-roundtrip-transfer-and-entry-ticket-t501550/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek het ticket (met transfer) — Efteling, vanuit Amsterdam</a>

    <h3>🇩🇰 Legoland Billund, Denemarken</h3>
    <p>Het originele Legoland-park, speciaal gebouwd voor gezinnen met jonge kinderen — spectaculaire miniatuursteden volledig opgebouwd uit Lego-stenen, interactieve attracties en activiteiten die ontworpen zijn om creativiteit te stimuleren, niet alleen spanning. Een plek waar ouders net zoveel spelen als de kleintjes.</p>
    <a href="https://www.getyourguide.com/billund-l87275/legoland-billund-entry-ticket-private-transfer-t1427002/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek het ticket (met transfer) — Legoland Billund</a>

    <h2 class="section-title"><span class="bar"></span>🎢 Het beste voor avontuur en spanning (oudere kinderen)</h2>

    <h3>🇮🇹 Gardaland, Castelnuovo del Garda, Italië</h3>
    <p>Vlak naast het schitterende Gardameer combineert Gardaland intense achtbanen (zoals Oblivion of Raptor) met een gebied gewijd aan de allerkleinsten (Peppa Pig Land) — een zeldzame balans tussen spanning voor tieners en plezier voor het hele gezin, in hetzelfde park.</p>
    <a href="https://www.getyourguide.com/garda-l145126/gardaland-park-fixed-day-entry-ticket-t225588/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek het ticket — Gardaland</a>

    <h3>🇵🇱 Energylandia, Zator, Polen</h3>
    <p>Het grootste pretpark van Polen, in heel Europa erkend om zijn enorme aantal moderne achtbanen — waaronder Zadra, een van de hoogste hybride achtbanen ter wereld. Het heeft ook een groot waterpark en zones speciaal ontworpen voor jongere kinderen, dus het is niet alleen voor liefhebbers van spanning.</p>
    <a href="https://www.getyourguide.com/krakow-l40/krakow-energylandia-full-day-ticket-with-optional-pickup-t114202/?partner_id=LM6J21N&utm_medium=affiliate&utm_source=partner_program" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">Boek het ticket (met optionele ophaalservice) — Energylandia, vanuit Krakau</a>

    <div class="trip-toolkit-card">
      <h3 class="trip-toolkit-title">🧳 Plan je hele reis, op één plek</h3>
      <p class="trip-toolkit-subtitle">Vlucht, accommodatie, auto of transfer nodig? Je vindt alles hier.</p>
      <div class="trip-toolkit-buttons">
        <button type="button" class="affiliate-btn affiliate-btn-temu widget-reveal-btn" data-widget-target="aviasalesToolkitWidget" data-widget-src="https://tpembd.com/content?currency=eur&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100"><span class="affiliate-cta-text">✈️ Vliegtickets zoeken</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></button><div id="aviasalesToolkitWidget" class="flight-widget-card" style="display:none"></div>
        <a href="https://www.booking.com/index.html" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🏨 Accommodatie zoeken</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://www.discovercars.com/?a_aid=23ea55cb" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚗 Auto huren</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
        <a href="https://intui.tpk.lu/xynzx1LU" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-temu"><span class="affiliate-cta-text">🚕 Transfer boeken</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>
      </div>
    </div>`,
  },
])

exports.GUIDES_PAGE_LABELS = {
  uk: { home: "Home", guidesTitle: "Travel Guides", guidesDesc: "Practical tips for travellers: transport, parking, and restaurant bookings near the big tourist sights.", otherGuides: "Other guides", footer: "practical travel guides, alongside up-to-date opening hours for every sight." },
  // Bug real, semnalat direct: lipsea complet "ro" din această mapă — un
  // vizitator de pe .eu care alegea limba română pentru pagina de Ghiduri
  // vedea tot conținutul în engleză (cădea pe fallback-ul .uk), deși
  // antetul ("Ghiduri →") arăta deja corect în română (acela venea din
  // NAV_LABELS, o mapă separată, care AVEA deja "ro"). Reutilizăm text
  // deja existent, potrivit exact aceluiași scop (pagina RO de /ghiduri).
  ro: { home: "Acasă", guidesTitle: "Ghiduri de călătorie", guidesDesc: "Sfaturi practice pentru călători: transport, parcare și rezervări la restaurant, aproape de marile obiective turistice.", otherGuides: "Alte ghiduri utile", footer: "ghiduri practice de călătorie, alături de programul actualizat al fiecărui obiectiv." },
  de: { home: "Startseite", guidesTitle: "Reiseführer", guidesDesc: "Praktische Tipps für Reisende: Transport, Parken und Restaurantreservierungen in der Nähe der großen Sehenswürdigkeiten.", otherGuides: "Weitere Reiseführer", footer: "praktische Reiseführer, zusammen mit aktuellen Öffnungszeiten für jede Sehenswürdigkeit." },
  fr: { home: "Accueil", guidesTitle: "Guides de voyage", guidesDesc: "Conseils pratiques pour les voyageurs : transport, stationnement et réservations de restaurants près des grands sites touristiques.", otherGuides: "Autres guides", footer: "guides de voyage pratiques, ainsi que les horaires d'ouverture à jour pour chaque site." },
  es: { home: "Inicio", guidesTitle: "Guías de viaje", guidesDesc: "Consejos prácticos para viajeros: transporte, aparcamiento y reservas de restaurantes cerca de las grandes atracciones turísticas.", otherGuides: "Otras guías", footer: "guías de viaje prácticas, junto con los horarios de apertura actualizados de cada lugar." },
  it: { home: "Home", guidesTitle: "Guide di viaggio", guidesDesc: "Consigli pratici per i viaggiatori: trasporti, parcheggio e prenotazioni al ristorante vicino alle grandi attrazioni turistiche.", otherGuides: "Altre guide", footer: "guide di viaggio pratiche, insieme agli orari di apertura aggiornati di ogni attrazione." },
  pl: { home: "Strona główna", guidesTitle: "Przewodniki podróżnicze", guidesDesc: "Praktyczne wskazówki dla podróżnych: transport, parkowanie i rezerwacje restauracji w pobliżu głównych atrakcji turystycznych.", otherGuides: "Inne przewodniki", footer: "praktyczne przewodniki podróżnicze wraz z aktualnymi godzinami otwarcia każdej atrakcji." },
  nl: { home: "Home", guidesTitle: "Reisgidsen", guidesDesc: "Praktische tips voor reizigers: vervoer, parkeren en restaurantreserveringen in de buurt van de grote toeristische attracties.", otherGuides: "Andere gidsen", footer: "praktische reisgidsen, samen met actuele openingstijden voor elke attractie." },
}

exports.NAV_LABELS = {
  uk: { guides: "Guides", itinerary: "Itinerary" },
  ro: { guides: "Ghiduri", itinerary: "Itinerar" },
  de: { guides: "Reiseführer", itinerary: "Reiseroute" },
  fr: { guides: "Guides", itinerary: "Itinéraire" },
  es: { guides: "Guías", itinerary: "Itinerario" },
  it: { guides: "Guide", itinerary: "Itinerario" },
  pl: { guides: "Przewodniki", itinerary: "Plan podróży" },
  nl: { guides: "Gidsen", itinerary: "Reisroute" },
  da: { guides: "Guider", itinerary: "Rejseplan" },
  cz: { guides: "Průvodci", itinerary: "Trasa" },
  ee: { guides: "Juhendid", itinerary: "Marsruut" },
  fi: { guides: "Oppaat", itinerary: "Matkasuunnitelma" },
  gr: { guides: "Οδηγοί", itinerary: "Δρομολόγιο" },
  hr: { guides: "Vodiči", itinerary: "Itinerar" },
  hu: { guides: "Útikalauzok", itinerary: "Útiterv" },
  lt: { guides: "Vadovai", itinerary: "Maršrutas" },
  lv: { guides: "Ceļveži", itinerary: "Maršruts" },
  pt: { guides: "Guias", itinerary: "Itinerário" },
  se: { guides: "Guider", itinerary: "Resplan" },
  si: { guides: "Vodniki", itinerary: "Itinerar" },
  sk: { guides: "Sprievodcovia", itinerary: "Itinerár" },
}

exports.FLIGHT_SEARCH_LABELS = {
  uk: "✈️ Search flights to",
  ro: "✈️ Caută zboruri către",
  de: "✈️ Flüge suchen nach",
  fr: "✈️ Rechercher des vols vers",
  es: "✈️ Buscar vuelos a",
  it: "✈️ Cerca voli per",
  pl: "✈️ Szukaj lotów do",
  nl: "✈️ Zoek vluchten naar",
  da: "✈️ Søg flyrejser til",
  cz: "✈️ Hledat lety do",
  ee: "✈️ Otsi lende sihtkohta",
  fi: "✈️ Etsi lentoja kohteeseen",
  gr: "✈️ Αναζήτηση πτήσεων προς",
  hr: "✈️ Traži letove za",
  hu: "✈️ Repülőjegyek keresése ide",
  lt: "✈️ Ieškoti skrydžių į",
  lv: "✈️ Meklēt lidojumus uz",
  pt: "✈️ Procurar voos para",
  se: "✈️ Sök flyg till",
  si: "✈️ Iskanje letov v",
  sk: "✈️ Hľadať lety do",
}

exports.CAR_RENTAL_LABELS = {
  uk: "🚗 Rent a car",
  ro: "🚗 Închiriază o mașină",
  de: "🚗 Mieten Sie ein Auto",
  fr: "🚗 Louer une voiture",
  es: "🚗 Alquilar un coche",
  it: "🚗 Noleggia un'auto",
  pl: "🚗 Wynajmij samochód",
  nl: "🚗 Huur een auto",
  da: "🚗 Lej en bil",
  cz: "🚗 Půjčit si auto",
  ee: "🚗 Rendi auto",
  fi: "🚗 Vuokraa auto",
  gr: "🚗 Ενοικίαση αυτοκινήτου",
  hr: "🚗 Iznajmi auto",
  hu: "🚗 Béreljen autót",
  lt: "🚗 Išsinuomoti automobilį",
  lv: "🚗 Nomāt automašīnu",
  pt: "🚗 Alugar um carro",
  se: "🚗 Hyr en bil",
  si: "🚗 Najemi avto",
  sk: "🚗 Prenajmi si auto",
}

exports.TRIP_TYPE_LABELS = {
  uk: { any: "Any", family: "Family (with kids)", couple: "Couple", solo: "Solo", friends: "Friends", label: "Who's going:" },
  ro: { any: "Oricare", family: "Familie (cu copii)", couple: "Cuplu", solo: "Singur/ă", friends: "Prieteni", label: "Cine merge:" },
  de: { any: "Beliebig", family: "Familie (mit Kindern)", couple: "Paar", solo: "Alleine", friends: "Freunde", label: "Wer reist mit:" },
  fr: { any: "Peu importe", family: "Famille (avec enfants)", couple: "Couple", solo: "Solo", friends: "Amis", label: "Qui voyage :" },
  es: { any: "Cualquiera", family: "Familia (con niños)", couple: "Pareja", solo: "Solo/a", friends: "Amigos", label: "Quién viaja:" },
  it: { any: "Qualsiasi", family: "Famiglia (con bambini)", couple: "Coppia", solo: "Da solo/a", friends: "Amici", label: "Chi viaggia:" },
  pl: { any: "Dowolny", family: "Rodzina (z dziećmi)", couple: "Para", solo: "Solo", friends: "Znajomi", label: "Kto jedzie:" },
  nl: { any: "Willekeurig", family: "Gezin (met kinderen)", couple: "Stel", solo: "Alleen", friends: "Vrienden", label: "Wie reist mee:" },
  da: { any: "Alle", family: "Familie (med børn)", couple: "Par", solo: "Alene", friends: "Venner", label: "Hvem rejser:" },
  cz: { any: "Jakýkoli", family: "Rodina (s dětmi)", couple: "Pár", solo: "Sám/sama", friends: "Přátelé", label: "Kdo cestuje:" },
  ee: { any: "Suvaline", family: "Pere (lastega)", couple: "Paar", solo: "Üksi", friends: "Sõbrad", label: "Kes reisib:" },
  fi: { any: "Mikä tahansa", family: "Perhe (lapsia)", couple: "Pari", solo: "Yksin", friends: "Ystävät", label: "Kuka matkustaa:" },
  gr: { any: "Οποιοδήποτε", family: "Οικογένεια (με παιδιά)", couple: "Ζευγάρι", solo: "Μόνος/η", friends: "Φίλοι", label: "Ποιος ταξιδεύει:" },
  hr: { any: "Bilo koji", family: "Obitelj (s djecom)", couple: "Par", solo: "Sam/a", friends: "Prijatelji", label: "Tko putuje:" },
  hu: { any: "Bármelyik", family: "Család (gyerekekkel)", couple: "Pár", solo: "Egyedül", friends: "Barátok", label: "Ki utazik:" },
  lt: { any: "Bet koks", family: "Šeima (su vaikais)", couple: "Pora", solo: "Vienas/a", friends: "Draugai", label: "Kas keliauja:" },
  lv: { any: "Jebkurš", family: "Ģimene (ar bērniem)", couple: "Pāris", solo: "Viens/viena", friends: "Draugi", label: "Kas ceļo:" },
  pt: { any: "Qualquer", family: "Família (com crianças)", couple: "Casal", solo: "Sozinho/a", friends: "Amigos", label: "Quem viaja:" },
  se: { any: "Valfri", family: "Familj (med barn)", couple: "Par", solo: "Ensam", friends: "Vänner", label: "Vem reser:" },
  si: { any: "Katerikoli", family: "Družina (z otroki)", couple: "Par", solo: "Sam/a", friends: "Prijatelji", label: "Kdo potuje:" },
  sk: { any: "Akýkoľvek", family: "Rodina (s deťmi)", couple: "Pár", solo: "Sám/sama", friends: "Priatelia", label: "Kto cestuje:" },
}

exports.VIBE_LABELS = {
  uk: { any: "Any", relaxed: "Relaxed & slow-paced", adventurous: "Adventurous & active", photogenic: "Photogenic / Instagram-worthy", label: "Vibe:" },
  ro: { any: "Oricare", relaxed: "Relaxat, în ritm lejer", adventurous: "Aventuros, plin de acțiune", photogenic: "Instagramabil / spectaculos", label: "Stilul călătoriei:" },
  de: { any: "Beliebig", relaxed: "Entspannt & gemütlich", adventurous: "Abenteuerlich & aktiv", photogenic: "Fotogen / instagram-tauglich", label: "Stimmung:" },
  fr: { any: "Peu importe", relaxed: "Détendu, rythme tranquille", adventurous: "Aventureux et actif", photogenic: "Photogénique / Instagram", label: "Ambiance :" },
  es: { any: "Cualquiera", relaxed: "Relajado, ritmo tranquilo", adventurous: "Aventurero y activo", photogenic: "Fotogénico / para Instagram", label: "Ambiente:" },
  it: { any: "Qualsiasi", relaxed: "Rilassato, ritmo tranquillo", adventurous: "Avventuroso e attivo", photogenic: "Fotogenico / da Instagram", label: "Atmosfera:" },
  pl: { any: "Dowolny", relaxed: "Zrelaksowany, spokojne tempo", adventurous: "Pełen przygód i akcji", photogenic: "Fotogeniczny / na Instagram", label: "Nastrój:" },
  nl: { any: "Willekeurig", relaxed: "Ontspannen, rustig tempo", adventurous: "Avontuurlijk en actief", photogenic: "Fotogeniek / Instagram-waardig", label: "Sfeer:" },
  da: { any: "Alle", relaxed: "Afslappet, roligt tempo", adventurous: "Eventyrlig og aktiv", photogenic: "Fotogent / Instagram-værdigt", label: "Stemning:" },
  cz: { any: "Jakýkoli", relaxed: "Uvolněné, pomalé tempo", adventurous: "Dobrodružné a aktivní", photogenic: "Fotogenické / na Instagram", label: "Nálada:" },
  ee: { any: "Suvaline", relaxed: "Lõõgastav, rahulik tempo", adventurous: "Seiklusrikas ja aktiivne", photogenic: "Fotogeeniline / Instagrami jaoks", label: "Meeleolu:" },
  fi: { any: "Mikä tahansa", relaxed: "Rento, rauhallinen tahti", adventurous: "Seikkailullinen ja aktiivinen", photogenic: "Valokuvauksellinen / Instagramiin", label: "Tunnelma:" },
  gr: { any: "Οποιοδήποτε", relaxed: "Χαλαρό, αργός ρυθμός", adventurous: "Περιπετειώδες και δραστήριο", photogenic: "Φωτογενές / για Instagram", label: "Διάθεση:" },
  hr: { any: "Bilo koji", relaxed: "Opušteno, spor tempo", adventurous: "Pustolovno i aktivno", photogenic: "Fotogenično / za Instagram", label: "Raspoloženje:" },
  hu: { any: "Bármelyik", relaxed: "Laza, nyugodt tempó", adventurous: "Kalandos és aktív", photogenic: "Fotogén / Instagramra való", label: "Hangulat:" },
  lt: { any: "Bet koks", relaxed: "Atsipalaidavęs, lėtas tempas", adventurous: "Nuotykingas ir aktyvus", photogenic: "Fotogeniškas / Instagramui", label: "Nuotaika:" },
  lv: { any: "Jebkurš", relaxed: "Atslābināts, lēns temps", adventurous: "Piedzīvojumiem bagāts un aktīvs", photogenic: "Fotogēnisks / Instagram cienīgs", label: "Noskaņa:" },
  pt: { any: "Qualquer", relaxed: "Relaxado, ritmo tranquilo", adventurous: "Aventureiro e ativo", photogenic: "Fotogénico / para Instagram", label: "Ambiente:" },
  se: { any: "Valfri", relaxed: "Avslappnat, lugnt tempo", adventurous: "Äventyrligt och aktivt", photogenic: "Fotogent / Instagram-värdigt", label: "Stämning:" },
  si: { any: "Katerikoli", relaxed: "Sproščeno, počasen tempo", adventurous: "Pustolovsko in aktivno", photogenic: "Fotogenično / za Instagram", label: "Vzdušje:" },
  sk: { any: "Akýkoľvek", relaxed: "Uvoľnené, pomalé tempo", adventurous: "Dobrodružné a aktívne", photogenic: "Fotogenické / na Instagram", label: "Nálada:" },
}

exports.BUDGET_LABELS = {
  uk: { any: "Any", backpacker: "Smart backpacker", mid: "Mid-range local experiences", luxury: "Discreet luxury", label: "Budget:" },
  ro: { any: "Oricare", backpacker: "Backpacker deștept", mid: "Experiențe locale, preț mediu", luxury: "Lux discret", label: "Buget:" },
  de: { any: "Beliebig", backpacker: "Sparfuchs-Backpacker", mid: "Lokale Erlebnisse, mittleres Budget", luxury: "Dezenter Luxus", label: "Budget:" },
  fr: { any: "Peu importe", backpacker: "Routard malin", mid: "Expériences locales, budget moyen", luxury: "Luxe discret", label: "Budget :" },
  es: { any: "Cualquiera", backpacker: "Mochilero inteligente", mid: "Experiencias locales, precio medio", luxury: "Lujo discreto", label: "Presupuesto:" },
  it: { any: "Qualsiasi", backpacker: "Backpacker intelligente", mid: "Esperienze locali, prezzo medio", luxury: "Lusso discreto", label: "Budget:" },
  pl: { any: "Dowolny", backpacker: "Sprytny backpacker", mid: "Lokalne doświadczenia, średnia cena", luxury: "Dyskretny luksus", label: "Budżet:" },
  nl: { any: "Willekeurig", backpacker: "Slimme backpacker", mid: "Lokale ervaringen, middenklasse", luxury: "Discrete luxe", label: "Budget:" },
  da: { any: "Alle", backpacker: "Smart rygsækrejsende", mid: "Lokale oplevelser, mellemklasse", luxury: "Diskret luksus", label: "Budget:" },
  cz: { any: "Jakýkoli", backpacker: "Chytrý batohář", mid: "Místní zážitky, střední cena", luxury: "Diskrétní luxus", label: "Rozpočet:" },
  ee: { any: "Suvaline", backpacker: "Nutikas seljakotirändur", mid: "Kohalikud elamused, keskmine hind", luxury: "Diskreetne luksus", label: "Eelarve:" },
  fi: { any: "Mikä tahansa", backpacker: "Fiksu reppureissaaja", mid: "Paikalliset elämykset, keskihinta", luxury: "Hillitty ylellisyys", label: "Budjetti:" },
  gr: { any: "Οποιοδήποτε", backpacker: "Έξυπνος backpacker", mid: "Τοπικές εμπειρίες, μεσαία τιμή", luxury: "Διακριτική πολυτέλεια", label: "Προϋπολογισμός:" },
  hr: { any: "Bilo koji", backpacker: "Pametan backpacker", mid: "Lokalna iskustva, srednja cijena", luxury: "Diskretan luksuz", label: "Proračun:" },
  hu: { any: "Bármelyik", backpacker: "Okos hátizsákos", mid: "Helyi élmények, közepes ár", luxury: "Diszkrét luxus", label: "Költségvetés:" },
  lt: { any: "Bet koks", backpacker: "Protingas kuprinę nešantis keliautojas", mid: "Vietiniai potyriai, vidutinė kaina", luxury: "Diskretiška prabanga", label: "Biudžetas:" },
  lv: { any: "Jebkurš", backpacker: "Gudrs mugursomnieks", mid: "Vietējā pieredze, vidēja cena", luxury: "Diskrēta greznība", label: "Budžets:" },
  pt: { any: "Qualquer", backpacker: "Mochileiro esperto", mid: "Experiências locais, preço médio", luxury: "Luxo discreto", label: "Orçamento:" },
  se: { any: "Valfri", backpacker: "Smart ryggsäcksresenär", mid: "Lokala upplevelser, mellanpris", luxury: "Diskret lyx", label: "Budget:" },
  si: { any: "Katerikoli", backpacker: "Pameten nahrbtnik popotnik", mid: "Lokalne izkušnje, srednja cena", luxury: "Diskreten luksuz", label: "Proračun:" },
  sk: { any: "Akýkoľvek", backpacker: "Šikovný batohár", mid: "Miestne zážitky, stredná cena", luxury: "Diskrétny luxus", label: "Rozpočet:" },
}

exports.ITINERARY_COPY_UNIVERSAL = {
  ro: { placeholder: "Orașul (ex: Paris, Berlin, Roma, Brașov)", intro: "Spune-ne orașul și câte zile ai la dispoziție — transformăm călătoria ta într-un itinerar de neuitat, gata în câteva secunde, din obiectivele turistice pe care le avem deja verificate." },
  uk: { placeholder: "The city (e.g. Paris, Berlin, Rome, Brașov)", intro: "Tell us the city and how many days you've got — we'll turn your trip into an unforgettable itinerary, ready in seconds, built from tourist attractions we've already verified." },
  de: { placeholder: "Die Stadt (z. B. Paris, Berlin, Rom, Brașov)", intro: "Sag uns die Stadt und wie viele Tage du hast — wir verwandeln deine Reise in Sekunden in eine unvergessliche Reiseroute, aus bereits geprüften Sehenswürdigkeiten." },
  fr: { placeholder: "La ville (ex : Paris, Berlin, Rome, Brașov)", intro: "Dites-nous la ville et le nombre de jours dont vous disposez — nous transformons votre voyage en un itinéraire inoubliable, prêt en quelques secondes, à partir d'attractions déjà vérifiées." },
  es: { placeholder: "La ciudad (ej: París, Berlín, Roma, Brașov)", intro: "Dinos la ciudad y cuántos días tienes — convertimos tu viaje en un itinerario inolvidable, listo en segundos, a partir de atracciones turísticas ya verificadas." },
  it: { placeholder: "La città (es: Parigi, Berlino, Roma, Brașov)", intro: "Dicci la città e quanti giorni hai a disposizione — trasformiamo il tuo viaggio in un itinerario indimenticabile, pronto in pochi secondi, dalle attrazioni turistiche già verificate." },
  pl: { placeholder: "Miasto (np. Paryż, Berlin, Rzym, Brașov)", intro: "Podaj miasto i liczbę dni, którymi dysponujesz — zamienimy Twoją podróż w niezapomniany plan zwiedzania, gotowy w kilka sekund, z już zweryfikowanych atrakcji turystycznych." },
  nl: { placeholder: "De stad (bijv. Parijs, Berlijn, Rome, Brașov)", intro: "Vertel ons de stad en hoeveel dagen je hebt — we maken van je reis een onvergetelijke reisroute, klaar in enkele seconden, uit al geverifieerde bezienswaardigheden." },
  da: { placeholder: "Byen (f.eks. Paris, Berlin, Rom, Brașov)", intro: "Fortæl os byen og hvor mange dage du har — vi gør din rejse til en uforglemmelig rejseplan, klar på få sekunder, fra allerede verificerede seværdigheder." },
  cz: { placeholder: "Město (např. Paříž, Berlín, Řím, Brašov)", intro: "Řekněte nám město a kolik dní máte k dispozici — proměníme váš výlet v nezapomenutelnou trasu, hotovou během pár sekund, z již ověřených turistických atrakcí." },
  ee: { placeholder: "Linn (nt Pariis, Berliin, Rooma, Brașov)", intro: "Ütle meile linna ja mitu päeva sul on — muudame su reisi unustamatuks marsruudiks, valmis mõne sekundiga, juba kontrollitud vaatamisväärsuste põhjal." },
  fi: { placeholder: "Kaupunki (esim. Pariisi, Berliini, Rooma, Brașov)", intro: "Kerro kaupunki ja kuinka monta päivää sinulla on käytössä — muutamme matkasi unohtumattomaksi matkasuunnitelmaksi muutamassa sekunnissa, jo tarkistetuista nähtävyyksistä." },
  gr: { placeholder: "Η πόλη (π.χ. Παρίσι, Βερολίνο, Ρώμη, Brașov)", intro: "Πες μας την πόλη και πόσες μέρες έχεις — μετατρέπουμε το ταξίδι σου σε ένα αξέχαστο δρομολόγιο, έτοιμο σε δευτερόλεπτα, από αξιοθέατα που έχουμε ήδη επαληθεύσει." },
  hr: { placeholder: "Grad (npr. Pariz, Berlin, Rim, Brašov)", intro: "Reci nam grad i koliko dana imaš na raspolaganju — pretvaramo tvoje putovanje u nezaboravan itinerar, spreman za nekoliko sekundi, od već provjerenih turističkih atrakcija." },
  hu: { placeholder: "A város (pl. Párizs, Berlin, Róma, Brassó)", intro: "Mondd meg a várost és hány napod van — pár másodperc alatt felejthetetlen útitervvé varázsoljuk az utazásodat, már ellenőrzött turisztikai látványosságokból." },
  lt: { placeholder: "Miestas (pvz. Paryžius, Berlynas, Roma, Brašovas)", intro: "Pasakykite miestą ir kiek dienų turite — jūsų kelionę paverčiame nepamirštamu maršrutu, paruoštu per kelias sekundes, iš jau patikrintų lankytinų vietų." },
  lv: { placeholder: "Pilsēta (piem. Parīze, Berlīne, Roma, Brašova)", intro: "Pasakiet mums pilsētu un cik dienu jums ir — jūsu ceļojumu pārvērtīsim neaizmirstamā maršrutā, gatavā dažu sekunžu laikā, no jau pārbaudītām apskates vietām." },
  pt: { placeholder: "A cidade (ex: Paris, Berlim, Roma, Brasóvia)", intro: "Diz-nos a cidade e quantos dias tens — transformamos a tua viagem num itinerário inesquecível, pronto em segundos, a partir de atrações turísticas já verificadas." },
  se: { placeholder: "Staden (t.ex. Paris, Berlin, Rom, Brașov)", intro: "Berätta staden och hur många dagar du har — vi förvandlar din resa till en oförglömlig reseplan, klar på några sekunder, från redan verifierade sevärdheter." },
  si: { placeholder: "Mesto (npr. Pariz, Berlin, Rim, Brašov)", intro: "Povej nam mesto in koliko dni imaš na voljo — tvoje potovanje spremenimo v nepozaben itinerar, pripravljen v nekaj sekundah, iz že preverjenih turističnih znamenitosti." },
  sk: { placeholder: "Mesto (napr. Paríž, Berlín, Rím, Brašov)", intro: "Povedz nám mesto a koľko dní máš k dispozícii — tvoj výlet premeníme na nezabudnuteľný itinerár, hotový za pár sekúnd, z už overených turistických atrakcií." },
}

