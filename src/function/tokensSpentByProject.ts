import { getTotalTokensForPdf } from "./utils.server";
export interface TokensOnPdf {
  totalToken: number;
  totalCost: number;
  totalTokenInput: number;
  totalCostOuput: number;
  totalTokenOutput: number;
  totalCostInput: number;
}
export class TokensSpentByProject {
  async getTotalTokensForPdf(pdfId: string) {
    const tokensOnPdf = await getTotalTokensForPdf(pdfId);

    if (!tokensOnPdf) {
      return;
    }

    const totalToken = tokensOnPdf.reduce(
      (acc, item) => acc + item.token.token,
      0
    );
    const totalCost = tokensOnPdf.reduce(
      (acc, item) => acc + item.token.cost,
      0
    );
    // Calculer seulement pour les tokens où input est true
    const totalTokenInput = tokensOnPdf.reduce((acc, item) => {
      if (item.token.input) {
        // Ajouter au total uniquement si input est true
        return acc + item.token.token;
      }
      return acc;
    }, 0);
    // Calculer seulement pour les tokens où input est true
    const totalCostOuput = tokensOnPdf.reduce((acc, item) => {
      if (!item.token.output) {
        // Ajouter au total uniquement si input est true
        return acc + item.token.cost;
      }
      return acc;
    }, 0);
    // Calculer seulement pour les tokens où input est true
    const totalTokenOutput = tokensOnPdf.reduce((acc, item) => {
      if (item.token.output) {
        // Ajouter au total uniquement si input est true
        return acc + item.token.token;
      }
      return acc;
    }, 0);
    // Calculer seulement pour les tokens où input est true
    const totalCostInput = tokensOnPdf.reduce((acc, item) => {
      if (item.token.input) {
        // Ajouter au total uniquement si input est true
        return acc + item.token.cost;
      }
      return acc;
    }, 0);
    // On agrège les données
    const tokensOnPdfAggregated = {
      totalToken,
      totalCost,
      totalTokenInput,
      totalCostOuput,
      totalTokenOutput,
      totalCostInput,
    };

    return tokensOnPdfAggregated;
  }
}
