export function generateTriggerPath(): string {
  const randomBytes = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return `/t/${randomBytes}`;
}
