// /lib/games/idioms.ts

export type IdiomItem = {
  emojis: string;
  answers: string[];
  hint?: string;
  explain?: string;
};

// =======================================================
// 🇺🇸 ENGLISH BANK
// =======================================================
export const IDIOMS_EN = [
  { emojis: "🌧️🐱🐶", answers: ["raining cats and dogs"], hint: "Heavy rain", explain: "Very strong rain." },
  { emojis: "🧊😄", answers: ["break the ice"], hint: "Start talking", explain: "Start a conversation." },
  { emojis: "🧁🍰", answers: ["piece of cake"], hint: "Very easy", explain: "Something very simple." },
  { emojis: "🐘🛋️", answers: ["the elephant in the room"], hint: "Avoided topic", explain: "A big but ignored problem." },
  { emojis: "🧵😬", answers: ["hang by a thread"], hint: "Risky", explain: "Being in a very fragile situation." },
  { emojis: "😴🗣️", answers: ["spill the beans"], hint: "Reveal a secret", explain: "Tell something confidential." },
  { emojis: "🥶🧱", answers: ["cold shoulder"], hint: "Ignore", explain: "Be distant intentionally." },
  { emojis: "👀🍎", answers: ["apple of my eye"], hint: "Special person", explain: "Someone cherished." },
  { emojis: "🛣️🧔‍♂️🧔‍♀️", answers: ["the long road"], hint: "Takes time", explain: "A long, difficult path." },
  { emojis: "🔥🛢️", answers: ["add fuel to the fire"], hint: "Make worse", explain: "Intensify a bad situation." },
  { emojis: "🤐🤞", answers: ["bite your tongue"], hint: "Stay quiet", explain: "Avoid saying something." },
  { emojis: "🐦🐦🤏", answers: ["kill two birds with one stone"], hint: "Efficiency", explain: "Achieve 2 things at once." },
  { emojis: "🧠🪨", answers: ["rock your brain", "rack your brain"], hint: "Think hard", explain: "Try very hard to remember." },
  { emojis: "⏰💸", answers: ["time is money"], hint: "Value time", explain: "Time is valuable like money." },
  { emojis: "⛄🔥", answers: ["snowball effect"], hint: "Grows", explain: "Something that increases rapidly." },
  { emojis: "🌪️📦", answers: ["out of the blue"], hint: "Unexpected", explain: "Something sudden or surprising." },
  { emojis: "🧵🙅‍♂️", answers: ["cut from the same cloth"], hint: "Similar", explain: "People who are very alike." },
  { emojis: "🐎🏃‍♂️", answers: ["hold your horses"], hint: "Wait", explain: "Slow down, be patient." },
  { emojis: "🧱🛣️", answers: ["hit a wall"], hint: "Stuck", explain: "Can't progress further." },
  { emojis: "😡☕", answers: ["lose your temper"], hint: "Anger", explain: "Get very angry." },
];

// =======================================================
// 🇪🇸 SPANISH IDIOMS (CASTELLANO)
// =======================================================
export const IDIOMS_ES = [
  { emojis: "🧊🤝", answers: ["romper el hielo"], hint: "Empezar charla", explain: "Iniciar una conversación." },
  { emojis: "🐶🩸", answers: ["buscarle tres pies al gato"], hint: "Complicar", explain: "Complicar algo innecesariamente." },
  { emojis: "🔥🧉", answers: ["estar al horno"], hint: "Problemas", explain: "Estar en una situación difícil." },
  { emojis: "⚽❌", answers: ["meter la pata"], hint: "Error", explain: "Cometer un error." },
  { emojis: "💤🌕", answers: ["estar en la luna"], hint: "Distraído", explain: "Estar muy distraído." },
  { emojis: "🎯🕒", answers: ["al pie del cañón"], hint: "Constante", explain: "Seguir firme trabajando." },
  { emojis: "🕳️🤑", answers: ["ser un agujero negro"], hint: "Gastar mucho", explain: "Persona que gasta demasiado." },
  { emojis: "🐔😱", answers: ["ser un gallina"], hint: "Miedo", explain: "Ser cobarde." },
  { emojis: "🐟💬", answers: ["estar como pez en el agua"], hint: "Cómodo", explain: "Sentirse muy cómodo." },
  { emojis: "❗🧊", answers: ["quedarse helado"], hint: "Shock", explain: "Sorprenderse mucho." },
  { emojis: "🧠💡", answers: ["caer la ficha"], hint: "Entender", explain: "Comprender algo de repente." },
  { emojis: "✋🚫", answers: ["parar el carro"], hint: "Detener", explain: "Poner límites a alguien." },
  { emojis: "🥚💥", answers: ["romper los huevos"], hint: "Molestar", explain: "Fastidiar a alguien." },
  { emojis: "🌧️😞", answers: ["llover sobre mojado"], hint: "Peor", explain: "Empeorar una situación." },
  { emojis: "🪣💧", answers: ["estar hasta las manos"], hint: "Compromiso", explain: "Estar muy involucrado." },
  { emojis: "📚🔥", answers: ["ponerse las pilas"], hint: "Esforzarse", explain: "Tomarse algo en serio." },
  { emojis: "🧂😒", answers: ["estar salado"], hint: "Mala suerte", explain: "Que algo sale mal constantemente." },
  { emojis: "🧱🤕", answers: ["darse contra la pared"], hint: "Fracaso", explain: "Tener un choque con la realidad." },
  { emojis: "🎭😶‍🌫️", answers: ["hacerse el boludo"], hint: "Disimular", explain: "Ignorar intencionalmente." },
  { emojis: "😵‍💫🔄", answers: ["estar perdido"], hint: "Confusión", explain: "No entender qué pasa." },
];


// =======================================================
// 🇵🇹 PORTUGUESE
// =======================================================
export const IDIOMS_PT = [
  { emojis: "🧊🤝", answers: ["quebrar o gelo"], hint: "Iniciar conversa", explain: "Começar um diálogo." },
  { emojis: "🧠💡", answers: ["dar um branco"], hint: "Esquecer", explain: "Ter um apagão mental." },
  { emojis: "😡☕", answers: ["ficar de cabeça quente"], hint: "Raiva", explain: "Estar muito irritado." },
  { emojis: "🐍🍵", answers: ["meter o pé na jaca"], hint: "Exagerar", explain: "Perder o controle." },
  { emojis: "🐟🌊", answers: ["ficar de molho"], hint: "Descansar", explain: "Ficar parado sem fazer nada." },
  { emojis: "📦🚪", answers: ["cair a ficha"], hint: "Entender", explain: "Compreender algo de repente." },
  { emojis: "📞❌", answers: ["dar bolo"], hint: "No-show", explain: "Não aparecer sem avisar." },
  { emojis: "🧱🧠", answers: ["bater na mesma tecla"], hint: "Insistir", explain: "Repetir o mesmo ponto." },
  { emojis: "🚪🏃‍♂️", answers: ["sair pela culatra"], hint: "Erro", explain: "Plano que dá errado." },
  { emojis: "😌🫠", answers: ["enfiar o pé na lama"], hint: "Bagunça", explain: "Fazer besteira." },
  { emojis: "🎩💨", answers: ["tirar do chapéu"], hint: "Impressionar", explain: "Fazer algo inesperado." },
  { emojis: "📚🔥", answers: ["quebrar a cabeça"], hint: "Pensar muito", explain: "Raciocinar bastante." },
  { emojis: "🎯🤞", answers: ["dar sorte"], hint: "Sorte", explain: "Acontecer algo bom sem esperar." },
  { emojis: "🥶👋", answers: ["dar um gelo"], hint: "Ignorar", explain: "Cortar contato." },
  { emojis: "👂🐜", answers: ["ficar com a pulga atrás da orelha"], hint: "Desconfiança", explain: "Desconfiar de algo." },
  { emojis: "⏰💨", answers: ["matar o tempo"], hint: "Passar o tempo", explain: "Fazer algo só para esperar." },
  { emojis: "😵‍💫📘", answers: ["viajar na maionese"], hint: "Fantasioso", explain: "Falar coisas sem sentido." },
  { emojis: "🍵🪤", answers: ["armar uma arapuca"], hint: "Trampa", explain: "Criar uma armadilha." },
  { emojis: "🏃‍♂️🔥", answers: ["correr atrás"], hint: "Buscar", explain: "Lutar por algo que quer." },
  { emojis: "🧠⚡", answers: ["ter um estalo"], hint: "Insight", explain: "Ter uma ideia súbita." },
];


// =======================================================
// 🇮🇹 ITALIAN
// =======================================================
export const IDIOMS_IT = [
  { emojis: "🧊🤝", answers: ["rompere il ghiaccio"], hint: "Iniziare", explain: "Sciogliere la tensione." },
  { emojis: "🧠⚡", answers: ["avere un colpo di genio"], hint: "Idea", explain: "Avere una buona intuizione." },
  { emojis: "💧🀄", answers: ["essere al verde"], hint: "Senza soldi", explain: "Non avere soldi." },
  { emojis: "🐶⬇️", answers: ["essere giù di corda"], hint: "Triste", explain: "Essere demoralizzato." },
  { emojis: "🤫👄", answers: ["mordersi la lingua"], hint: "Zitto", explain: "Trattenersi dal parlare." },
  { emojis: "🧱🤦‍♂️", answers: ["darsi la zappa sui piedi"], hint: "Autogol", explain: "Farsi del male da soli." },
  { emojis: "🤐📦", answers: ["avere un segreto"], hint: "Segretezza", explain: "Tenere qualcosa nascosto." },
  { emojis: "🗣️🔥", answers: ["metterci la faccia"], hint: "Responsabilità", explain: "Assumersi responsabilità." },
  { emojis: "🐦🐦🤏", answers: ["prendere due piccioni con una fava"], hint: "Due problemi", explain: "Risolvere due problemi insieme." },
  { emojis: "📚💥", answers: ["fare i compiti"], hint: "Preparazione", explain: "Essere ben preparato." },
  { emojis: "💤🤯", answers: ["essere fuori di testa"], hint: "Pazzia", explain: "Essere folle." },
  { emojis: "🦶💨", answers: ["tirare il pacco"], hint: "Dare bolo", explain: "Non presentarsi." },
  { emojis: "🧠🧊", answers: ["avere le idee chiare"], hint: "Chiarezza", explain: "Essere molto sicuri." },
  { emojis: "👃⬆️", answers: ["avere la puzza sotto il naso"], hint: "Snob", explain: "Essere arrogante." },
  { emojis: "😵‍💫🔄", answers: ["andare in tilt"], hint: "Blocco", explain: "Non riuscire a ragionare." },
  { emojis: "🐟💬", answers: ["muto come un pesce"], hint: "Silenzio", explain: "Non dire nulla." },
  { emojis: "🔥👁️", answers: ["gettare fumo negli occhi"], hint: "Inganno", explain: "Cercare di ingannare." },
  { emojis: "📦🧹", answers: ["fare piazza pulita"], hint: "Ripulire", explain: "Eliminare tutto." },
  { emojis: "🤝❤️", answers: ["avere il cuore in mano"], hint: "Generoso", explain: "Essere molto buono." },
  { emojis: "🧱🛣️", answers: ["sbattere contro un muro"], hint: "Bloccare", explain: "Non riuscire ad avanzare." },
];


// =======================================================
// 🇫🇷 FRENCH
// =======================================================
export const IDIOMS_FR = [
  { emojis: "🧊🤝", answers: ["briser la glace"], hint: "Commencer", explain: "Démarrer une conversation." },
  { emojis: "🧠⚡", answers: ["avoir un déclic"], hint: "Comprendre", explain: "Sudden realization." },
  { emojis: "🛏️💤", answers: ["faire la grasse matinée"], hint: "Dormir mucho", explain: "Dormir jusqu'à tard." },
  { emojis: "👃⬆️", answers: ["prendre la grosse tête"], hint: "Arrogance", explain: "Devenir prétentieux." },
  { emojis: "🔪🔙", answers: ["planter un couteau dans le dos"], hint: "Traición", explain: "Trahir quelqu'un." },
  { emojis: "🍞🇫🇷", answers: ["être dans le pétrin"], hint: "Problemas", explain: "Être dans une situation difficile." },
  { emojis: "🧠🧊", answers: ["garder son sang-froid"], hint: "Calma", explain: "Rester calme." },
  { emojis: "👀🪤", answers: ["tomber dans le piège"], hint: "Engaño", explain: "Se faire duper." },
  { emojis: "🐦🥐", answers: ["avoir un appétit d'oiseau"], hint: "Come poco", explain: "Manger très peu." },
  { emojis: "🐱👠", answers: ["donner sa langue au chat"], hint: "Rendición", explain: "Abandonner et demander la réponse." },
  { emojis: "😵‍💫🗯️", answers: ["perdre la boule"], hint: "Confusión", explain: "Perdre la tête." },
  { emojis: "🔁🤨", answers: ["faire d'une pierre deux coups"], hint: "2 problemas", explain: "Régler deux choses à la fois." },
  { emojis: "💢🕳️", answers: ["mettre les pieds dans le plat"], hint: "Meter la pata", explain: "Dire quelque chose de gênant." },
  { emojis: "🍽️😤", answers: ["avoir le cafard"], hint: "Tristeza", explain: "Être déprimé." },
  { emojis: "🧱🚫", answers: ["aller droit dans le mur"], hint: "Fracaso", explain: "Se diriger vers un échec." },
  { emojis: "📚💡", answers: ["être sur la même longueur d’onde"], hint: "Alineación", explain: "Bien se comprendre." },
  { emojis: "😴🧠", answers: ["avoir un trou de mémoire"], hint: "Olvido", explain: "Oublier soudainement." },
  { emojis: "🍲🔥", answers: ["mettre de l’huile sur le feu"], hint: "Empeorar", explain: "Aggraver la situation." },
  { emojis: "🐟🤐", answers: ["muet comme une carpe"], hint: "Silencio", explain: "Ne rien dire." },
  { emojis: "🏃‍♂️🏃‍♀️", answers: ["courir comme un dératé"], hint: "Muy rápido", explain: "Courir très vite." },
];


// =======================================================
// 🌍 ACCESSOR — Seleccionar banco por idioma
// =======================================================
export function getIdiomsBank(lang: string): IdiomItem[] {
  switch (lang.toLowerCase()) {
    case "es": return IDIOMS_ES;
    case "pt": return IDIOMS_PT;
    case "it": return IDIOMS_IT;
    case "fr": return IDIOMS_FR;
    default:   return IDIOMS_EN;
  }
}
