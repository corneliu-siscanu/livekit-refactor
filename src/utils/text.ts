export function cleanText(value?: string | null): string {
  return (value ?? '').trim();
}
