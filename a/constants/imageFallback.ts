const encodeSvg = (svg: string) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

export const createPlaceholderImage = (
  label: string,
  width = 800,
  height = 400
) => {
  const safeLabel = String(label || "Mongolia").slice(0, 40);
  const fontSize = width >= 700 ? 40 : 28;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" />
      <circle cx="${width * 0.82}" cy="${height * 0.2}" r="${Math.min(width, height) * 0.18}" fill="rgba(255,255,255,0.12)" />
      <circle cx="${width * 0.16}" cy="${height * 0.82}" r="${Math.min(width, height) * 0.22}" fill="rgba(255,255,255,0.08)" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        fill="#f8fafc" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700">
        ${safeLabel}
      </text>
    </svg>
  `;

  return encodeSvg(svg.replace(/\s+/g, " ").trim());
};
