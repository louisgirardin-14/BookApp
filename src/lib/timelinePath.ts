export type ConnectorStyle = 'wave' | 'zigzag' | 'straight';

export interface PathPoint {
  x: number;
  y: number;
}

// Builds the `d` attribute for the winding connector that runs down the
// timeline export. `wave` uses smooth S-curve cubic Beziers between each
// point (horizontal control points at the midpoint height produce a clean
// sine-like curve); `zigzag` connects the same points with straight
// segments for a sharper, more graphic look; `straight` ignores the
// alternating points entirely and draws a single vertical line.
export function buildConnectorPath(points: PathPoint[], style: ConnectorStyle): string {
  if (points.length === 0) return '';

  if (style === 'straight' || points.length === 1) {
    const first = points[0];
    const last = points[points.length - 1];
    return `M ${first.x} ${first.y} L ${last.x} ${last.y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    if (style === 'zigzag') {
      d += ` L ${p1.x} ${p1.y}`;
    } else {
      const midY = (p0.y + p1.y) / 2;
      d += ` C ${p0.x} ${midY}, ${p1.x} ${midY}, ${p1.x} ${p1.y}`;
    }
  }
  return d;
}
