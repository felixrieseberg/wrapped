import chalk from "chalk";

/**
 * Print a little mini table with a header column
 */
export function outputMiniTable(rows: Array<Array<string>>, bump?: boolean) {
  const columns = rows[0].length;
  const widths = Array(columns).fill(0);

  if (bump) {
    console.log();
  }

  for (const row of rows) {
    for (let i = 0; i < columns; i++) {
      widths[i] = Math.max(widths[i], row[i].length);
    }
  }

  for (const row of rows) {
    let text = "";
    for (let i = 0; i < columns; i++) {
      if (i === 0) {
        // Header column
        text += `${chalk.bold.inverse(` ${row[i]} `.padEnd(widths[i] + 2))}  `;
      } else {
        // Normal column
        text += row[i].padEnd(widths[i] + 2);
      }
    }

    console.log(text);
  }

  if (bump) {
    console.log();
  }
}
