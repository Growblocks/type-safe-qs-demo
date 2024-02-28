export const stringifyConfig = {
  // adds ? to the beginning of the string
  addQueryPrefix: true,
  // skips encoding values
  encodeValuesOnly: true,
  // access nested objects by dot notation e.g region.US syntax
  allowDots: true,
};

export const parseConfig = {
  // ignores ? in the beginning of the string
  ignoreQueryPrefix: true,
  // access nested objects by dot notation e.g region.US syntax
  allowDots: true,
};
