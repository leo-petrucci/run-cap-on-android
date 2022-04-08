export const removeLineEndings = (): string => {
  return `| tr -d $'\r' | tr -d $'\n'`;
};
