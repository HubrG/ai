export const personalitiesList = {
  provocative: "Provocative Professor",
  deep: "Deep Thinker",
  charismatic: "Charismatic Leader",
  compassionate: "Compassionate Mentor",
  sarcastic: "Sarcastic Comedian",
  wise: "Wise Sage",
  creative: "Creative Innovator",
  nurturing: "Nurturing Coach",
  adventurous: "Adventurous Explorer",
  meticulous: "Meticulous Analyst",
  gentle: "Gentle Guide",
  quirky: "Quirky Enthusiast",
  stoic: "Stoic Philosopher",
  visionary: "Visionary Dreamer",
  tactical: "Tactical Strategist",
} as const;


export const personalityToKey = (personality: string) => {
  return Object.keys(personalitiesList).find(key => personalitiesList[key as keyof typeof personalitiesList] === personality)
}