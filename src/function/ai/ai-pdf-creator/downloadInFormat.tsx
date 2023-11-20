import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import htmlToPdfmake from "html-to-pdfmake";
import {
  Document,
  TextRun,
  HeadingLevel,
  Bookmark,
  Packer,
  ExternalHyperlink,
  Paragraph,
} from "docx";
import { saveAs } from "file-saver";
import Showdown from "showdown";
const converter = new Showdown.Converter();

pdfMake.vfs = pdfFonts.pdfMake.vfs;

pdfMake.fonts = {
  Nunito: {
    normal: "./Nunito-Regular.ttf",
    bold: "./Nunito-Regular.ttf",
    italics: "./Nunito-Regular.ttf",
    bolditalics: "./Nunito-Regular.ttf",
  },

  // download default Roboto font from cdnjs.com
  Roboto: {
    normal:
      "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf",
    bold: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf",
    italics:
      "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Italic.ttf",
    bolditalics:
      "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-MediumItalic.ttf",
  },
};

export const downloadPdf = (htmlContent: string, title: string) => {
  // Crée une nouvelle version du contenu HTML avec des IDs uniques
  let newHtmlContent = htmlContent;
  const idRegex = /id="[^"]+"/g; // Regex pour trouver tous les attributs id
  let match;
  let idCount = 0;

  // Remplace chaque id par un id unique
  while ((match = idRegex.exec(htmlContent)) !== null) {
    const originalId = match[0]; // ex: id="hackdegnie"
    const uniqueId = `id="unique${idCount++}"`; // ex: id="unique0"
    newHtmlContent = newHtmlContent.replace(originalId, uniqueId);
  }

  const documentDefinition = {
    content: htmlToPdfmake(newHtmlContent),

    defaultStyle: {
      font: "Roboto",
    },
  };

  pdfMake.createPdf(documentDefinition).download(title + ".pdf");
};

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
  const createTextRun = (text:string, style = {}) => {
    return new TextRun({
      text: text,
      color: "000000", // Noir
      ...style,
    });
  };

  const getHeadingLevel = (level: number): HeadingLevel => {
    switch (level) {
      case 1: return HeadingLevel.HEADING_1;
      case 2: return HeadingLevel.HEADING_2;
      case 3: return HeadingLevel.HEADING_3;
      case 4: return HeadingLevel.HEADING_4;
      case 5: return HeadingLevel.HEADING_5;
      case 6: return HeadingLevel.HEADING_6;
      default: return HeadingLevel.HEADING_1; // ou une autre valeur par défaut
    }
  };
  // Traite chaque segment de texte Markdown
  const processSegment = (segment:string) => {
    // En-têtes
    if (/^ *#{1,6} /.test(segment)) {
      const match = segment.match(/^ *#+/);
      if (match) {
        const level = match[0].trim().length;
        return new Paragraph({
          children: [createTextRun(segment.replace(/^ *#+/, ''))],
          heading: getHeadingLevel(level),
        });
      }
    }
    // Texte en gras
    else if (segment.startsWith("**")) {
      return createTextRun(segment.substring(2, segment.length - 2), { bold: true });
    }
    // Texte en italique
    else if (segment.startsWith("*")) {
      return createTextRun(segment.substring(1, segment.length - 1), { italics: true });
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
      return createTextRun(segment);
    }
  };

  // Découpage du texte en segments et traitement de chaque segment
  const segments = markdownText.split(/(\n|#{1,6} .*|\*\*.*?\*\*|\*.*?\*|\- .*|\> .*|```.*?```|\[.*?\]\(.*?\))/);
  const children = segments.map(segment => processSegment(segment));

  return new Paragraph({
    children: children as [],
  });
}


export const downloadDocx = async (allContent: string, fileName: string) => {
  let markdownContent = converter.makeMarkdown(allContent);
  markdownContent = markdownContent.replace(/\\/g, "");
  // Convertir le contenu Markdown en éléments DOCX
  const docElements = markdownContent.split("\n").map(processMarkdownElement);

  // Filtrer les éléments undefined
  const filteredDocElements = docElements.filter(
    (element) => element !== undefined
  ) as Paragraph[];

  // Créer un nouveau document DOCX
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: filteredDocElements, // Utilisez le tableau filtré ici
      },
    ],
  });

  // Générer et télécharger le document DOCX
  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, `${fileName}.docx`);
  });
};
