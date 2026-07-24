export type CanvasTransform = {
  x: number;
  y: number;
  k: number;
};

export type CanvasPanBounds = {
  contentWidth: number;
  contentHeight: number;
  viewport: { left: number; top: number; right: number; bottom: number };
};

const PAN_EDGE_MARGIN = 160;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function clampCanvasTransform(
  transform: CanvasTransform,
  bounds: CanvasPanBounds
): CanvasTransform {
  const { contentWidth, contentHeight, viewport } = bounds;
  if (
    !Number.isFinite(transform.k) ||
    transform.k <= 0 ||
    !Number.isFinite(contentWidth) ||
    !Number.isFinite(contentHeight) ||
    contentWidth <= 0 ||
    contentHeight <= 0 ||
    viewport.right <= viewport.left ||
    viewport.bottom <= viewport.top
  ) {
    return transform;
  }

  const constrainAxis = (position: number, contentSize: number, start: number, end: number) => {
    const minimum = end - contentSize * transform.k - PAN_EDGE_MARGIN;
    const maximum = start + PAN_EDGE_MARGIN;
    return minimum > maximum
      ? start + (end - start - contentSize * transform.k) / 2
      : clamp(position, minimum, maximum);
  };
  const x = constrainAxis(transform.x, contentWidth, viewport.left, viewport.right);
  const y = constrainAxis(transform.y, contentHeight, viewport.top, viewport.bottom);

  return x === transform.x && y === transform.y ? transform : { ...transform, x, y };
}
