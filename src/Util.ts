export function parseIntegerArguments() {
  return process.argv.slice(3).map(raw => {
    return parseInt(raw.trim());
  });
}
