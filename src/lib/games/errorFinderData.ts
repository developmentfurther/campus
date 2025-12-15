export const ERROR_FINDER_EN = [
  { sentence: "She go to school every day.", wrongWord: "go", correctWord: "goes" },
  { sentence: "He don't like vegetables.", wrongWord: "don't", correctWord: "doesn't" },
  { sentence: "They is playing in the park.", wrongWord: "is", correctWord: "are" },
  { sentence: "My brother have a new job.", wrongWord: "have", correctWord: "has" },
  { sentence: "The movie was very interested.", wrongWord: "interested", correctWord: "interesting" },
  { sentence: "I am here since two hours.", wrongWord: "since", correctWord: "for" },
  { sentence: "She didn't went to the party.", wrongWord: "went", correctWord: "go" },
  { sentence: "We was tired after the trip.", wrongWord: "was", correctWord: "were" },
  { sentence: "He speaks English very good.", wrongWord: "good", correctWord: "well" },
  { sentence: "This is the book what I bought.", wrongWord: "what", correctWord: "that" },
];

export const ERROR_FINDER_ES = [
  { sentence: "Voy a ir a el cine mañana.", wrongWord: "a el", correctWord: "al" },
  { sentence: "La clima está muy fría hoy.", wrongWord: "La", correctWord: "El" },
  { sentence: "Me se cayó el vaso.", wrongWord: "Me se", correctWord: "Se me" },
  { sentence: "Han llegado muchas gente.", wrongWord: "muchas", correctWord: "mucha" },
  { sentence: "Dijistes que venías temprano.", wrongWord: "Dijistes", correctWord: "Dijiste" },
  { sentence: "La problema todavía no se resolvió.", wrongWord: "La", correctWord: "El" },
  { sentence: "Hubieron muchas personas.", wrongWord: "Hubieron", correctWord: "Hubo" },
  { sentence: "Pásame la agua, por favor.", wrongWord: "la", correctWord: "el" },
  { sentence: "Más mejor no lo podría hacer.", wrongWord: "Más mejor", correctWord: "Mejor" },
  { sentence: "Fuistes muy amable conmigo.", wrongWord: "Fuistes", correctWord: "Fuiste" },
];

export const ERROR_FINDER_PT = [
  { sentence: "Ele não sabe nadar muito bom.", wrongWord: "bom", correctWord: "bem" },
  { sentence: "Ela foi no médico ontem.", wrongWord: "no", correctWord: "ao" },
  { sentence: "Eu vi ela ontem.", wrongWord: "ela", correctWord: "a ela" },
  { sentence: "Nós vamos ir ao parque.", wrongWord: "vamos ir", correctWord: "vamos" },
  { sentence: "Faz dois anos que moro aqui.", wrongWord: "Faz", correctWord: "Fazem" },
  { sentence: "Ele tem menos livros do que eu tenho.", wrongWord: "do que eu tenho", correctWord: "que eu" },
  { sentence: "Ela está meia cansada.", wrongWord: "meia", correctWord: "meio" },
  { sentence: "Assisti o filme ontem.", wrongWord: "o", correctWord: "ao" },
  { sentence: "Ela falou para mim fazer isso.", wrongWord: "para mim", correctWord: "para eu" },
  { sentence: "Ele é mais melhor que eu.", wrongWord: "mais melhor", correctWord: "melhor" },
];

export const ERROR_FINDER_IT = [
  { sentence: "Io sono andato al mare ieri.", wrongWord: "andato", correctWord: "andata" },
  { sentence: "Lei ha molta fame.", wrongWord: "molta", correctWord: "remove" },
  { sentence: "Noi abbiamo molti amici.", wrongWord: "molti", correctWord: "tanti" },
];

export const ERROR_FINDER_FR = [
  { sentence: "Je suis allé à la maison de mon ami.", wrongWord: "à la", correctWord: "chez" },
  { sentence: "Elle a plus meilleur résultat que moi.", wrongWord: "plus meilleur", correctWord: "meilleur" },
  { sentence: "Je veux que tu viens avec moi.", wrongWord: "viens", correctWord: "viennes" },
  { sentence: "Il a beaucoup des amis.", wrongWord: "des", correctWord: "d'" },
  { sentence: "Je suis en train d'attendre pour toi.", wrongWord: "pour", correctWord: "remove" },
  { sentence: "Il regarde la télévision à le salon.", wrongWord: "à le", correctWord: "au" },
  { sentence: "Je ne sais pas rien.", wrongWord: "pas rien", correctWord: "rien" },
  { sentence: "Elle est plus belle que sa sœur est.", wrongWord: "est", correctWord: "remove" },
  { sentence: "C'est la livre que j'ai acheté.", wrongWord: "la livre", correctWord: "le livre" },
  { sentence: "Je dois étudier à soir.", wrongWord: "à soir", correctWord: "ce soir" },
];

export function getErrorFinderBank(lang: string) {
  switch (lang) {
    case "es": return ERROR_FINDER_ES;
    case "pt": return ERROR_FINDER_PT;
    case "it": return ERROR_FINDER_IT;
    case "fr": return ERROR_FINDER_FR;
    case "en":
    default:
      return ERROR_FINDER_EN;
  }
}