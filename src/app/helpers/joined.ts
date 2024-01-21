const lf = new Intl.ListFormat("en");

export function joined(input: string[]) {
  return lf.format(input);
}

export function theyAlso(a: string[], b: string[]) {
  const aJoined = joined(a);
  const bJoined = joined(b);

  if (aJoined === bJoined) {
    return `They also`;
  } else {
    return bJoined;
  }
}
