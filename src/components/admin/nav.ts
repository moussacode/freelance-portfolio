import {
  BriefcaseBusiness,
  FolderOpen,
  LayoutGrid,
  MessageCircleQuestion,
  Quote,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export type CountKey = 'services' | 'works' | 'faq' | 'testimonials';

export type NavItem = { href: string; label: string; icon: LucideIcon; count?: CountKey; add?: string };

/** Menu principal de l'admin, dans l'ordre de la barre latérale. */
export const mainNav: NavItem[] = [
  { href: '/admin', label: 'Vue d’ensemble', icon: LayoutGrid },
  { href: '/admin/services', label: 'Services', icon: BriefcaseBusiness, count: 'services', add: 'Ajouter un service' },
  { href: '/admin/realisations', label: 'Réalisations', icon: FolderOpen, count: 'works', add: 'Ajouter une réalisation' },
  { href: '/admin/questions', label: 'Questions', icon: MessageCircleQuestion, count: 'faq', add: 'Ajouter une question' },
  { href: '/admin/avis', label: 'Avis', icon: Quote, count: 'testimonials', add: 'Ajouter un avis' },
];

export const settingsNav: NavItem = { href: '/admin/reglages', label: 'Réglages', icon: Settings };

export const isActive = (pathname: string, href: string) =>
  href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);
