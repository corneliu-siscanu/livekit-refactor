export function logSection(title: string, details?: unknown) {
  console.log(`\n=== ${title} ===`);
  if (details !== undefined) {
    console.log(details);
  }
}
