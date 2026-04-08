export function normalizePath(path: string) {
  if (!path || path === '/') return '/'
  return path.endsWith('/') ? path.slice(0, -1) : path
}
