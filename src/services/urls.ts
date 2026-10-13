/** App paths that work both at a domain root and under GitHub Pages' project path. */
export function appPath(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const suffix = path.replace(/^\/+/, '');
  return suffix ? `${base}${suffix}` : base;
}

export function doctorPublicPath(slug: string): string {
  return appPath(`/doctors/${encodeURIComponent(slug)}`);
}

export function doctorPublicUrl(slug: string): string {
  return new URL(doctorPublicPath(slug), window.location.origin).toString();
}
