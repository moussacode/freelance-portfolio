/** Chargement d'une page de l'admin : squelettes (immobiles en version calme). */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Chargement">
      <div className="adm-head">
        <div>
          <span className="adm-skel adm-skel--line" style={{ width: 120 }} />
          <span className="adm-skel adm-skel--title" style={{ width: 260 }} />
        </div>
      </div>
      <div className="adm-skel-grid">
        {[0, 1, 2].map((i) => (
          <span key={i} className="adm-skel adm-skel--card" />
        ))}
      </div>
    </div>
  );
}
