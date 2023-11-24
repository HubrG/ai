// On créé une classe
export class Counting {
  // On créé une méthode
  countWords(str: string) {
    // Supprimer les espaces en début et fin de chaîne et remplacer les séquences d'espaces par un seul espace
    str = str.trim().replace(/\s+/g, " ");

    // Si la chaîne est vide, retourner 0
    if (str === "") {
      return 0;
    }

    // Sinon, diviser la chaîne en mots et compter leur nombre
    return str.split(" ").length;
  }

  countCharacters(str: string) {
    // Supprimer les espaces en début et fin de chaîne
    str = str.trim();

    // Si la chaîne est vide, retourner 0
    if (str === "") {
      return 0;
    }

    // Sinon, compter le nombre de caractères
    return str.length;
  }

  countSentences(str: string) {
    // Supprimer les espaces en début et fin de chaîne
    str = str.trim();

    // Si la chaîne est vide, retourner 0
    if (str === "") {
      return 0;
    }

    // Sinon, compter le nombre de phrases
    return str.split(/[.!?]+/).length;
  }

  countParagraphs(str: string) {
    // Supprimer les espaces en début et fin de chaîne
    str = str.trim();

    // Si la chaîne est vide, retourner 0
    if (str === "") {
      return 0;
    }

    // Sinon, compter le nombre de paragraphes
    return str.split(/\n+/).length;
  }

  countReadingTime(str: string, format: string) {
    // Compter le nombre de mots
    const wordsCount = this.countWords(str);

    // Diviser le nombre de mots par 200 (vitesse moyenne de lecture)
    // et arrondir le résultat à l'entier supérieur
    // On formate en xHxx
    if (format === "format") {
      const totalMinutes = Math.ceil(wordsCount / 200);

      // Calculer les heures et les minutes
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      // Formater la sortie
      if (hours > 0) {
        return `${hours}h${minutes}`;
      } else {
        return `${minutes}mn`;
      }
    }

    return Math.ceil(wordsCount / 200);
  }
  // Nombre de page sur A4
  countPages(str: string) {
    // Compter le nombre de mots
    const wordsCount = this.countWords(str);
    //   On cherche en moyenne le nombre de mots par page
    const wordsPerPage = 350;
    // On divise le nombre de mots par le nombre de mots par page
    const pagesCount = Math.ceil(wordsCount / wordsPerPage);
    return pagesCount;
  }
}
