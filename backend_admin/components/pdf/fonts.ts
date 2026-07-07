import { Font } from '@react-pdf/renderer';

const registeredBases = new Set<string>();

export function resolvePdfAssetSrc(path: string, baseUrl = '') {
  if (!path) return path;
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
  if (!baseUrl) return path;

  return new URL(path, baseUrl).toString();
}

export function registerPdfFonts(baseUrl = '') {
  const normalizedBase = baseUrl.replace(/\/$/, '');

  if (registeredBases.has(normalizedBase)) {
    return;
  }

  registeredBases.add(normalizedBase);

  Font.register({
    family: 'Helvetica',
    fonts: [
      { src: resolvePdfAssetSrc('/fonts/Helvetica.ttf', normalizedBase) },
      {
        src: resolvePdfAssetSrc('/fonts/Helvetica-Bold.ttf', normalizedBase),
        fontWeight: 'bold',
      },
      {
        src: resolvePdfAssetSrc('/fonts/Helvetica-Oblique.ttf', normalizedBase),
        fontStyle: 'italic',
      },
    ],
  });

  Font.register({
    family: 'Times',
    fonts: [
      { src: resolvePdfAssetSrc('/fonts/Times New Roman.ttf', normalizedBase) },
      {
        src: resolvePdfAssetSrc('/fonts/Times New Roman - Bold.ttf', normalizedBase),
        fontWeight: 'bold',
      },
      {
        src: resolvePdfAssetSrc('/fonts/Times New Roman - Italic.ttf', normalizedBase),
        fontStyle: 'italic',
      },
    ],
  });
}
