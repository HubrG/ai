export const tonesList = {
    assertive: "Assertive and confident",
    friendly: "Friendly and approachable",
    professional: "Professional and authoritative",
    energetic: "Energetic and enthusiastic",
    calm: "Calm and soothing",
    inspirational: "Inspirational and uplifting",
    witty: "Witty and humorous",
    sincere: "Sincere and empathetic",
    bold: "Bold and daring",
    scholarly: "Scholarly and analytical",
    casual: "Casual and conversational",
    formal: "Formal and respectful",
    passionate: "Passionate and persuasive",
    straightforward: "Straightforward and no-nonsense",
    playful: "Playful and lighthearted",
} as const;
  
export const toneToKey = (personality: string) => {
    return Object.keys(tonesList).find(key => tonesList[key as keyof typeof tonesList] === personality)
}
