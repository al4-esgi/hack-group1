export const toIdArray = ({ value }: { value?: string | string[] }): number[] | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  const source = Array.isArray(value) ? value.join(',') : String(value);
  const ids = source
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => parseInt(s, 10))
    .filter(n => Number.isFinite(n));
  return ids.length ? ids : undefined;
};
