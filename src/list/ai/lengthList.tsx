
export const lengthList = {
  short: "Short",
  medium: "Medium",
  long: "Long",
} as const;

export const lengthToKey = (length: string) => {
  return Object.keys(lengthList).find(
    (key) => lengthList[key as keyof typeof lengthList] === length
  );
};