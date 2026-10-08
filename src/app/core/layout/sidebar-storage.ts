const SIDEBAR_KEY = 'mini-shop:console-sidebar-collapsed';

export function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeSidebarCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0');
  } catch {
    /* stockage indisponible : l'état reste en mémoire */
  }
}
