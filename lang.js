/* Langue : le français est la langue d'origine ; l'anglais est appliqué au DOM par dictionnaire */
(function(){
  var L='';try{L=localStorage.getItem('bb_lang')||''}catch(e){}
  if(!L)L=/^fr/i.test(navigator.language||'fr')?'fr':'en';
  document.documentElement.lang=L;
  var sel=document.getElementById('langSel');if(sel)sel.value=L;
  window.setLang=function(v){try{localStorage.setItem('bb_lang',v)}catch(e){}location.reload()};
  if(L==='fr')return;
  document.title='Stringwalker';
  var NAV={'Calcul':'Calc','Calibrer':'Calibrate','Mesures':'Data','Palette':'Tab','Réglages':'Settings'};
  var DS=[
['Calcul de volée','Shot calculator'],
['Pente du poste (montée ou descente)','Slope at the peg (uphill or downhill)'],
['Faible ≈ 10° · Moyenne ≈ 20° · Forte ≈ 30°. Le dénivelé (en m), s’il est rempli, remplace le niveau choisi.','Slight ≈ 10° · Moderate ≈ 20° · Steep ≈ 30°. If filled in, the height difference (in m) replaces the selected level.'],
['Pianotage conseillé','Recommended string walk'],['Pianotage','String Walking'],
['Entrez une distance','Enter a distance'],['Ajuster sur le terrain','Adjust in the field'],['Mode terrain','Field mode'],
['Courbe de réglage','Tuning curve'],['Table de tir','Shooting table'],['Repère','Mark'],
['Ajustement terrain','Field adjustment'],['Distance de tir (m)','Shooting distance (m)'],['Valeur théorique','Theoretical value'],
['Où vont les flèches ?','Where are the arrows going?'],['Au centre','In the centre'],
['Trop haut — descendre le pianotage','Too high — lower the string walk'],['Trop bas — monter le pianotage','Too low — raise the string walk'],
['Affiner','Fine-tune'],['− ½ couture','− ½ stitch'],['+ ½ couture','+ ½ stitch'],
['Position retenue (mm)','Chosen position (mm)'],['Enregistrer la correction','Save correction'],
['Nouvelle mesure','New measurement'],['— choisir —','— choose —'],['Enregistrer','Save'],
['Courbe et cohérence','Curve and consistency'],['Distances conseillées pour calibrer','Suggested distances to calibrate'],
['Mesures du profil','Profile measurements'],['Télécharger en CSV','Download as CSV'],['Sauvegarder (fichier)','Back up (file)'],['Restaurer (fichier)','Restore (file)'],['Exporter en image (PNG)','Export as image (PNG)'],['Affinez une distance à partir du calcul de l’appli : indiquez où vont vos flèches ou décalez d’un pas, puis enregistrez. Cela met à jour la mesure de cette distance.','Fine-tune a distance starting from the app’s calculation: say where your arrows go or shift by one step, then save. This updates the measurement for that distance.'],['Saisissez ici une position que vous connaissez pour une distance (par exemple réglée et validée au tir). Ces mesures sont la base de la courbe.','Enter here a position you know for a distance (for example set and checked by shooting). These measurements are the basis of the curve.'],
['Palette — aperçu des distances','Tab — distances overview'],['Afficher','Show'],['Mes distances mesurées','My measured distances'],['Toutes les 5 m','Every 5 m'],
['Le repère (couture) est en gros, la position en mm en petit. Aperçu à plat, sans pente.','The mark (stitch) is large, the position in mm is small. Flat preview, without slope.'],
['Mode hors ligne','Offline mode'],['Vérification…','Checking…'],
['Profil de matériel','Equipment profile'],['Nom du profil','Profile name'],['Nouveau','New'],['Dupliquer','Duplicate'],['Supprimer','Delete'],
['Calcul','Calculation'],['Courbe (monotone)','Curve (monotone)'],['Linéaire','Linear'],
['Polynôme : une courbe lisse « théorique » ajustée à l’ensemble de vos mesures (recommandé). Elle peut s’écarter un peu de chaque mesure : l’écart est visible dans le graphique et dans l’onglet Mesures. « Courbe monotone » passe exactement par vos mesures ; « Linéaire » les relie par des droites.','Polynomial: a smooth “theoretical” curve fitted to all your measurements (recommended). It may deviate slightly from each measurement: the gap is shown in the graph and in the Data tab. “Monotone curve” passes exactly through your measurements; “Linear” joins them with straight lines.'],
['Polynôme (courbe lissée)','Polynomial (smoothed curve)'],['Degré du polynôme','Polynomial degree'],['Automatique','Automatic'],['1 (droite)','1 (straight line)'],['2 (parabole)','2 (parabola)'],['3 (cubique)','3 (cubic)'],['Écart','Deviation'],['Courbe théorique (polynôme)','Theoretical curve (polynomial)'],
['Pente : ajustement','Slope: adjustment'],
['Par défaut, montée et descente donnent la même distance utile (la géométrie est symétrique). Si vos flèches partent plus haut ou plus bas dans un sens, corrigez ici en demi-coutures (positif = monter le pianotage). Appliqué dès que la pente n’est pas « Plat ».','By default, uphill and downhill give the same effective distance (the geometry is symmetric). If your arrows land higher or lower in one direction, correct here in half-stitches (positive = raise the string walk). Applied whenever the slope is not “Flat”.'],
['Montée (½ couture)','Uphill (½ stitch)'],['Descente (½ couture)','Downhill (½ stitch)'],['Coutures','Stitches'],
['Posez le zéro de la règle au début du fil de la première couture, puis mesurez jusqu\x27au début du fil de la dernière.','Place the ruler zero at the start of the first stitch thread, then measure to the start of the last stitch thread.'],
['Sens de comptage','Counting direction'],['Du bas vers le haut','Bottom to top'],['Du haut vers le bas','Top to bottom'],
['1ère couture (mm)','1st stitch (mm)'],['Dernière couture (mm)','Last stitch (mm)'],['Nombre de coutures','Number of stitches'],
['Fermer','Close'],['Montée','Uphill'],['Descente','Downhill'],['Pente','Slope'],['Moins','Less'],['Plus','More'],
['Plat','Flat'],['Faible','Slight'],['Moyenne','Moderate'],['Forte','Steep'],['Encoche','Nock'],['Palette','Tab'],['Gant','Glove'],['Protection des doigts','Finger protection'],
['Votre matériel','Your equipment'],
['Quelques réglages suffisent pour commencer. Vous pourrez tout modifier plus tard dans Réglages.','A few settings are enough to get started. You can change everything later in Settings.'],
['Suivant','Next'],['Retour','Back'],['Passer cette étape','Skip this step'],['Terminer','Finish'],
['Vos premières mesures','Your first measurements'],
['Entrez la position du pianotage (en mm) qui touche le centre à deux distances éloignées, par exemple une courte et une longue. Vous en ajouterez d’autres ensuite.','Enter the string walk position (in mm) that hits the centre at two distances far apart, for example a short one and a long one. You will add more later.'],
['Mesure 1','Measurement 1'],['Mesure 2','Measurement 2'],
['Astuce : ouvrez l’appli une fois avec du réseau pour l’utiliser ensuite hors ligne.','Tip: open the app once with a network to use it offline afterwards.'],
['ex : 30','e.g. 30'],['Ou dénivelé estimé cible ↔ pas de tir (m)','Or estimated height difference target ↔ peg (m)'],
['Schéma de la palette','Tab diagram'],['Courbe distance et position','Distance and position curve'],['Distances sur la palette','Distances on the tab'],
['ex : Arc 38 lb — flèches carbone','e.g. 38 lb bow — carbon arrows']
  ];
  var PS=[
['Stockage indisponible','Storage unavailable'],['Nom du nouveau profil :','New profile name:'],['Nouveau matériel','New equipment'],
['Profil créé','Profile created'],[' (copie)',' (copy)'],['Profil dupliqué','Profile duplicated'],['Gardez au moins un profil','Keep at least one profile'],
['Supprimer le profil « ','Delete profile “'],[' » ?','” ?'],[' (hors règle)',' (off ruler)'],
['Espacement : ~','Spacing: ~'],[' mm entre 2 coutures',' mm between 2 stitches'],['Couture ','Stitch '],
['Au moins 2 mesures nécessaires','At least 2 measurements needed'],['Plage mesurée : ','Measured range: '],
[' · distance utile ',' · effective distance '],[' m (pente ',' m (slope '],['montante','uphill'],['descendante','downhill'],['Distance utile ','Effective distance '],
['Distance et position requises','Distance and position required'],['Correction enregistrée','Correction saved'],['Supprimer cette mesure ?','Delete this measurement?'],
['Copie impossible','Copy failed'],['CSV copié','CSV copied'],['Sauvegarde copiée','Backup copied'],['Collez la sauvegarde JSON :','Paste the JSON backup:'],
['Importé','Imported'],['Sauvegarde restaurée','Backup restored'],['JSON invalide','Invalid JSON'],
['Sens inversé autour de ','Direction reversed around '],[' : la courbe monte puis redescend',': the curve rises then falls back'],
['Variation brutale autour de ','Sudden change around '],[' : revérifiez cette mesure',': recheck this measurement'],
[' m : position hors de la règle de coutures',' m: position outside the stitch ruler'],
['Extrapolé — à vérifier au tir','Extrapolated — check by shooting'],['Extrapolé','Extrapolated'],['Interpolé entre vos mesures','Interpolated between your measurements'],
['Mesures à vérifier','Check measurements'],['Mesures insuffisantes','Not enough measurements'],['Ajoutez au moins 2 mesures','Add at least 2 measurements'],
['Aucune mesure','No measurements'],['Au moins 2 mesures','At least 2 measurements'],['Mesures cohérentes','Consistent measurements'],
['Mesurez d’abord 2 distances éloignées (une courte, une longue).','First measure 2 distances far apart (a short one, a long one).'],
['Plage bien couverte : aucun écart supérieur à 8 m.','Range well covered: no gap larger than 8 m.'],
['Fichier local : fonctionne sans réseau. Gardez une sauvegarde JSON (onglet Mesures).','Local file: works without a network. Keep a JSON backup (Data tab).'],
['Prêt hors ligne : l’appli est en cache sur cet appareil.','Ready offline: the app is cached on this device.'],
['Pas encore en cache : ouvrez l’appli une fois avec du réseau, puis rechargez la page.','Not cached yet: open the app once with a network, then reload the page.'],
['Données protégées contre le nettoyage automatique.','Data protected from automatic cleanup.'],
['État indisponible dans cet aperçu : téléchargez les fichiers pour un usage hors ligne.','Status unavailable in this preview: download the files to use offline.'],
['Mise en cache indisponible ici : utilisez le fichier HTML en local.','Caching unavailable here: use the local HTML file.'],
['Mon matériel','My equipment'],['Mesure enregistrée','Measurement saved'],
['Étape ','Step '],['ex : ','e.g. '],['Vérifiez les coutures et leurs positions','Check the stitches and their positions'],
['Complétez distance et position, ou laissez vide','Fill in distance and position, or leave both empty'],
['Deux distances différentes sont nécessaires','Two different distances are needed'],['Prêt ! Bon tir.','Ready! Happy shooting.'],
['Plat','Flat'],['Faible','Slight'],['Moyenne','Moderate'],['Forte','Steep']
  ];
  var D={};DS.forEach(function(x){D[x[0]]=x[1]});
  PS.sort(function(a,b){return b[0].length-a[0].length});
  function tr(s,el){
    var core=s.trim();if(!core)return s;
    var i=s.indexOf(core),lead=s.slice(0,i),tail=s.slice(i+core.length),o;
    if(el&&el.closest&&el.closest('nav')&&NAV[core])o=NAV[core];
    else if(D[core])o=D[core];
    else{o=core;PS.forEach(function(p){if(o.indexOf(p[0])>-1)o=o.split(p[0]).join(p[1])})}
    o=o.replace(/([0-9]),([0-9])/g,'$1.$2');
    return lead+o+tail;
  }
  var AT=['placeholder','aria-label','title'];
  function walk(n){
    if(n.nodeType===3){var v=n.nodeValue,t=tr(v,n.parentElement);if(t!==v)n.nodeValue=t;return}
    if(n.nodeType!==1||/^(SCRIPT|STYLE)$/.test(n.tagName))return;
    AT.forEach(function(a){var v=n.getAttribute(a);if(v){var t=tr(v);if(t!==v)n.setAttribute(a,t)}});
    for(var c=n.firstChild;c;c=c.nextSibling)walk(c);
  }
  var _p=window.prompt,_c=window.confirm;
  window.prompt=function(m,d){return _p.call(window,tr(m),d==null?d:tr(d))};
  window.confirm=function(m){return _c.call(window,tr(m))};
  walk(document.body);
  new MutationObserver(function(ms){
    ms.forEach(function(m){
      if(m.type==='childList')m.addedNodes.forEach(walk);
      else if(m.type==='characterData')walk(m.target);
      else walk(m.target);
    });
  }).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:AT});
})();
