/**
 * Script exécuté dans <head>, avant le premier affichage : il applique le thème choisi
 * et le niveau d'animation, pour éviter tout flash au chargement.
 */
export const bootScript = `(function(){var d=document.documentElement;try{var t=localStorage.getItem('mc-theme');if(t==='light'||t==='dark')d.dataset.theme=t;var m=localStorage.getItem('mc-motion');d.dataset.motion=(m==='calm'||(m!=='full'&&matchMedia('(prefers-reduced-motion: reduce)').matches))?'calm':'full'}catch(e){d.dataset.motion=matchMedia('(prefers-reduced-motion: reduce)').matches?'calm':'full'}})()`;
