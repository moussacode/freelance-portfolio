/** Statistiques affichées par la carte « Visites » (type partagé, sans code serveur). */
export type Visits = {
  visitors: number;
  pageviews: number;
  /** Une entrée par jour, du plus ancien au plus récent ; 0 pour un jour sans visite. */
  daily: { date: string; pageviews: number; visitors: number }[];
  pages: { path: string; pageviews: number }[];
  sources: { host: string | null; visitors: number }[];
};
