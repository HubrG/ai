export const calculateTokenPercentage = (tokenRemaining:number, tokenByMonth:number) => {
  
    if (tokenRemaining !== undefined && tokenByMonth !== undefined && tokenByMonth > 0) {
      return (tokenRemaining / tokenByMonth) * 100;
    } else {
      return 0; // Retourner 0 si tokenByMonth est 0 ou si les valeurs ne sont pas définies
    }
  };