export function calculateMedian(input: number[]) {
  const sorted = input.sort((a, b) => a - b);
  const half = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[half];
  }

  return (sorted[half - 1] + sorted[half]) / 2.0;
}
