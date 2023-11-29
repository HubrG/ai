import {
  Document,
  TextRun,
  HeadingLevel,
  Packer,
  ExternalHyperlink,
  AlignmentType,
  Paragraph,
} from "docx";
import { saveAs } from "file-saver";
import Showdown from "showdown";
const converter = new Showdown.Converter();
import { unified } from "unified";
import markdown from "remark-parse";
import docx from "remark-docx";
import  convert  from '@adobe/helix-md2docx';


export const downloadMarkdown = (markdownContent: string, filename: string) => {
  // Créer un élément d'ancrage
  const element = document.createElement("a");
  // Créer un fichier Blob avec le contenu Markdown
  const file = new Blob([markdownContent], { type: "text" });
  // Créer un URL pour le Blob
  element.href = URL.createObjectURL(file);
  // Définir l'attribut de téléchargement avec le nom de fichier souhaité
  element.download = `${filename}.md`;
  // Ajouter l'élément au document et cliquer dessus pour déclencher le téléchargement
  document.body.appendChild(element); // Required for this to work in FireFox
  element.click();
  // Nettoyer en supprimant l'élément d'ancrage
  document.body.removeChild(element);
};

export const downloadHtml = (htmlContent: string, filename: string) => {
  // Créer un élément d'ancrage
  const element = document.createElement("a");
  // Créer un fichier Blob avec le contenu HTML
  const file = new Blob([htmlContent], { type: "text/html" });
  // Créer un URL pour le Blob
  element.href = URL.createObjectURL(file);
  // Définir l'attribut de téléchargement avec le nom de fichier souhaité
  element.download = `${filename}.html`;
  // Ajouter l'élément au document et cliquer dessus pour déclencher le téléchargement
  document.body.appendChild(element); // Nécessaire pour Firefox
  element.click();
  // Nettoyer en supprimant l'élément d'ancrage
  document.body.removeChild(element);
};

function processMarkdownElement(markdownText: string) {
  // Crée un TextRun avec la couleur noire par défaut
  const createTextRun = (text: string, style = {}) => {
    return new TextRun({
      text: text,
      color: "000000", // Noir
      ...style,
    });
  };
  const getHeadingLevel = (level: 1 | 2 | 3 | 4 | 5 | 6): HeadingLevel => {
    switch (level) {
      case 1:
        return HeadingLevel.HEADING_1;
      case 2:
        return HeadingLevel.HEADING_2;
      case 3:
        return HeadingLevel.HEADING_3;
      case 4:
        return HeadingLevel.HEADING_4;
      case 5:
        return HeadingLevel.HEADING_5;
      case 6:
        return HeadingLevel.HEADING_6;
      default:
        return HeadingLevel.HEADING_1;
    }
  };
  // Traite chaque segment de texte Markdown
  const processSegment = (segment: string) => {
    // En-têtes
    if (/^ *#{1,6} /.test(segment)) {
      const match = segment.match(/^ *#+/);
      if (match) {
        const level = match[0].trim().length;
        const text = segment.replace(/^ *#+ */, ""); // Supprime les # et les espaces avant le texte de l'en-tête

        // Vous pouvez ajouter ici des styles supplémentaires si nécessaire
        let headingStyle = {};
        switch (level) {
          case 1:
            headingStyle = { bold: true, size: 54 }; // Exemple de style pour un en-tête de niveau 1
            break;
          case 2:
            headingStyle = { bold: true, size: 48 }; // Exemple de style pour un en-tête de niveau 2
            break;
          case 3:
            headingStyle = { bold: true, size: 42 }; // Exemple de style pour un en-tête de niveau 3
            break;
          case 4:
            headingStyle = { bold: true, size: 36 }; // Exemple de style pour un en-tête de niveau 4
            break;
          // Ajoutez des cas pour les niveaux 3 à 6 si nécessaire
        }

        return createTextRun(text, headingStyle);
      }
    }
    // Texte en gras
    else if (segment.startsWith("**")) {
      return createTextRun(segment.substring(2, segment.length - 2), {
        bold: true,
      });
    }
    // Texte en gras
    else if (segment.startsWith("**")) {
      return createTextRun(segment.substring(2, segment.length - 2), {
        bold: true,
        textSize: 28,
      });
    }
    // Texte en italique
    else if (segment.startsWith("*")) {
      return createTextRun(segment.substring(1, segment.length - 1), {
        italics: true,
      });
    }
    // Liste à puces
    else if (segment.startsWith("- ")) {
      return new Paragraph({
        children: [createTextRun(segment.substring(2))],
        bullet: {
          level: 0,
        },
      });
    }
    // Citations
    else if (segment.startsWith("> ")) {
      return new Paragraph({
        children: [createTextRun(segment.substring(2))],
        style: "Quote",
      });
    }

    // Blocs de code
    else if (segment.startsWith("```")) {
      return new Paragraph({
        children: [createTextRun(segment.substring(3, segment.length - 3))],
        style: "Code",
      });
    }
    // Lien
    else if (segment.startsWith("[")) {
      const linkParts = /\[(.*?)\]\((.*?)\)/.exec(segment);
      if (linkParts) {
        const linkText = linkParts[1];
        const linkUrl = linkParts[2];
        return new Paragraph({
          children: [
            new ExternalHyperlink({
              children: [createTextRun(linkText)],
              link: linkUrl,
            }),
          ],
        });
      }
    }
    // Texte normal
    else {
      return createTextRun(segment, {
        color: "000000", // Noir
        size: 28,
        font: "Times",
        alignment: AlignmentType.JUSTIFIED,
      });
    }
  };

  // Découpage du texte en segments et traitement de chaque segment
  const segments = markdownText.split(
    /(\n|#{1,6} .*|\*\*.*?\*\*|\*.*?\*|\- .*|\> .*|```.*?```|\[.*?\]\(.*?\))/
  );
  const children = segments.map((segment) => processSegment(segment));

  return new Paragraph({
    children: children as [],
    alignment: AlignmentType.JUSTIFIED,
  });
}

export async function downloadDocx(markdownContent:string, filename:string) {
  try {
    const toMarkdown = converter.makeMarkdown(markdownContent);
    // Préparer le corps de la requête
    const requestBody = { markdown: toMarkdown };

    // Appeler l'API de conversion
    const response = await fetch('/api/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Erreur: ${response.statusText}`);
    }

    // Obtenir le Blob du fichier DOCX à partir de la réponse
    const blob = await response.blob();

    // Créer un lien pour télécharger le fichier
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.docx`;

    // Simuler un clic pour déclencher le téléchargement
    document.body.appendChild(link);
    link.click();

    // Nettoyer
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("Erreur lors du téléchargement:", error);
  }
}
export const downloadToTxt = (text: string, filename: string) => {
  // Créer un élément d'ancrage
  const element = document.createElement("a");
  // Créer un fichier Blob avec le contenu Markdown
  const file = new Blob([text], { type: "text" });
  // Créer un URL pour le Blob
  element.href = URL.createObjectURL(file);
  // Définir l'attribut de téléchargement avec le nom de fichier souhaité
  element.download = `${filename}.txt`;
  // Ajouter l'élément au document et cliquer dessus pour déclencher le téléchargement
  document.body.appendChild(element); // Required for this to work in FireFox
  element.click();
  // Nettoyer en supprimant l'élément d'ancrage
  document.body.removeChild(element);
}
