'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Eye, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, X } from 'lucide-react';
import { LogoMark, LogoWord } from '@/components/Logo';
import { signOut } from '@/app/admin/actions';
import { mainNav, settingsNav, isActive, type CountKey, type NavItem } from './nav';
import { PaletteProvider, usePalette, type SearchItem } from './CommandPalette';
import { ToastProvider } from './Toasts';
import { useModalDialog } from './useModalDialog';
import { UnsavedProvider, useGuardedClick, useLeaveGuard } from './unsaved';

type Props = {
  counts: Partial<Record<CountKey, number>>;
  items: SearchItem[];
  userName: string;
  children: ReactNode;
};

const STORAGE_KEY = 'mc-admin-sidebar';

/**
 * Cadre de l'admin : barre latérale (248 px, repliable à 76 px, état gardé dans le navigateur),
 * tiroir sur mobile, recherche ⌘K et toasts.
 */
export function AdminShell(props: Props) {
  return (
    <ToastProvider>
      <UnsavedProvider>
        <PaletteProvider items={props.items}>
          <Frame {...props} />
        </PaletteProvider>
      </UnsavedProvider>
    </ToastProvider>
  );
}

function Frame({ counts, userName, children }: Props) {
  const pathname = usePathname();
  const palette = usePalette();
  // L'état replié est posé sur <html> avant le premier affichage (script de admin/layout) : pas de saut.
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => setCollapsed(document.documentElement.dataset.sidebar === 'collapsed'), []);
  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (next) document.documentElement.dataset.sidebar = 'collapsed';
    else delete document.documentElement.dataset.sidebar;
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'collapsed' : 'open');
    } catch {
      // Stockage indisponible (navigation privée) : l'état ne sera simplement pas retenu.
    }
  };

  const [drawer, setDrawer] = useState(false);
  const drawerDialog = useModalDialog(drawer, () => setDrawer(false));
  useEffect(() => {
    drawerDialog.ref.current?.close();
  }, [pathname, drawerDialog.ref]);

  return (
    <div className="adm-app">
      <a className="skip" href="#adm-main">
        Aller au contenu
      </a>

      <aside className="adm-side" aria-label="Menu de l’admin">
        <SideContent counts={counts} userName={userName} pathname={pathname} collapsed={collapsed}>
          <button
            type="button"
            className="adm-icon-btn adm-side__toggle"
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Déplier le menu' : 'Replier le menu'}
            data-tip={collapsed ? 'Déplier le menu' : undefined}
          >
            {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
          </button>
        </SideContent>
      </aside>

      {/* Mobile : barre du haut et tiroir. */}
      <div className="adm-top glass">
        <BrandLink />
        <div className="adm-top__actions">
          <button type="button" className="adm-icon-btn" onClick={() => palette.open()} aria-label="Rechercher">
            <Search aria-hidden="true" />
          </button>
          <button
            type="button"
            className="adm-icon-btn"
            onClick={() => setDrawer(true)}
            aria-expanded={drawer}
            aria-haspopup="dialog"
            aria-label="Ouvrir le menu"
          >
            <Menu aria-hidden="true" />
          </button>
        </div>
      </div>
      <dialog {...drawerDialog} className="adm-drawer glass" aria-label="Menu de l’admin">
        {drawer && (
          <SideContent counts={counts} userName={userName} pathname={pathname} collapsed={false}>
            <button type="button" className="adm-icon-btn" onClick={() => drawerDialog.ref.current?.close()} aria-label="Fermer le menu">
              <X aria-hidden="true" />
            </button>
          </SideContent>
        )}
      </dialog>

      <main id="adm-main" className="adm-main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

function SideContent({
  counts,
  userName,
  pathname,
  collapsed,
  children,
}: {
  counts: Props['counts'];
  userName: string;
  pathname: string;
  collapsed: boolean;
  children: ReactNode;
}) {
  return (
    <div className="adm-side__in">
      <div className="adm-side__top">
        <BrandLink tip={collapsed ? 'Vue d’ensemble' : undefined} withWord />
        {children}
      </div>

      <p className="adm-side__label" aria-hidden="true">
        Menu
      </p>
      <nav aria-label="Sections">
        <ul className="adm-nav">
          {mainNav.map((item) => (
            <li key={item.href}>
              <NavLink item={item} pathname={pathname} count={item.count ? counts[item.count] : undefined} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="adm-side__bottom">
        <ul className="adm-nav">
          <li>
            <a className="adm-link" href="/fr" target="_blank" rel="noopener noreferrer" data-tip="Voir le site">
              <Eye aria-hidden="true" />
              <span className="adm-link__label">
                Voir le site<span className="sr"> (nouvel onglet)</span>
              </span>
            </a>
          </li>
          <li>
            <NavLink item={settingsNav} pathname={pathname} />
          </li>
        </ul>
        <div className="adm-user">
          <span className="adm-user__avatar" aria-hidden="true">
            {userName.charAt(0)}
          </span>
          <span className="adm-user__text">
            <strong>{userName}</strong>
            <span>Administrateur</span>
          </span>
          <LogoutForm>
            <button type="submit" className="adm-icon-btn" aria-label="Se déconnecter" data-tip="Se déconnecter">
              <LogOut aria-hidden="true" />
            </button>
          </LogoutForm>
        </div>
      </div>
    </div>
  );
}

function NavLink({ item, pathname, count }: { item: NavItem; pathname: string; count?: number }) {
  const router = useRouter();
  const onClick = useGuardedClick(item.href, (h) => router.push(h));
  const Icon = item.icon;
  const active = isActive(pathname, item.href);
  return (
    <Link
      className="adm-link"
      href={item.href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      data-tip={item.label}
    >
      <Icon aria-hidden="true" />
      <span className="adm-link__label">{item.label}</span>
      {count !== undefined && (
        <span className="adm-count">
          <span className="sr"> (</span>
          {count}
          <span className="sr"> {count > 1 ? 'éléments' : 'élément'})</span>
        </span>
      )}
    </Link>
  );
}

/** Logo : retour à la vue d'ensemble, protégé contre la perte de modifications. */
function BrandLink({ tip, withWord }: { tip?: string; withWord?: boolean }) {
  const router = useRouter();
  const onClick = useGuardedClick('/admin', (h) => router.push(h));
  return (
    <Link href="/admin" className="adm-brand" aria-label="Admin MoussaCode, vue d’ensemble" data-tip={tip} onClick={onClick}>
      <LogoMark className="adm-brand__mark" />
      {withWord && <LogoWord className="adm-brand__word" />}
    </Link>
  );
}

/** Déconnexion : avec des modifications en attente, confirmation d'abord. */
function LogoutForm({ children }: { children: ReactNode }) {
  const { guard, blocked } = useLeaveGuard();
  return (
    <form
      action={signOut}
      className="adm-user__out"
      onSubmit={(e) => {
        if (!blocked()) return;
        e.preventDefault();
        const form = e.currentTarget;
        guard(() => form.requestSubmit());
      }}
    >
      {children}
    </form>
  );
}
