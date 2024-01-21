export function calculateAverage(input: number[]) {
  return input.reduce((a, b) => a + b, 0) / input.length;
}
