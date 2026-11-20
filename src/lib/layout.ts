/**
 * Groups panels into page rows: a wide panel takes a full row, normal panels are
 * paired two per row. A normal panel left without a partner gets its own row.
 */
export function buildRows<T extends { wide: boolean }>(panels: T[]): T[][] {
  const rows: T[][] = [];
  let i = 0;
  while (i < panels.length) {
    const current = panels[i];
    const next = panels[i + 1];
    if (!current.wide && next && !next.wide) {
      rows.push([current, next]);
      i += 2;
    } else {
      rows.push([current]);
      i += 1;
    }
  }
  return rows;
}

/** Aspect ratio (width / height) used to display a panel. */
export function panelAspect(fullRow: boolean): number {
  return fullRow ? 1.75 : 1;
}
