/* PasteFromWeb — code hôte ExtendScript (Premiere Pro) */

// Renvoie le dossier du projet (.prproj), ou "ERR:..."
function PFW_getProjectDir() {
    try {
        if (!app.project || !app.project.path) return "ERR:aucun projet ouvert";
        var projFile = new File(app.project.path);
        return projFile.parent.fsName;
    } catch (e) {
        return "ERR:" + e.toString();
    }
}

// Trouve (ou crée) le bin "image web" à la racine du projet
function PFW_getWebBin() {
    var root = app.project.rootItem;
    for (var i = 0; i < root.children.numItems; i++) {
        var it = root.children[i];
        if (it.type === ProjectItemType.BIN && it.name === "image web") {
            return it;
        }
    }
    return root.createBin("image web");
}

// Une piste vidéo est-elle libre sur le créneau [startSec, startSec+durSec] ?
function PFW_isVideoTrackFreeAt(track, startSec, durSec) {
    var endSec = startSec + durSec;
    for (var c = 0; c < track.clips.numItems; c++) {
        var clip = track.clips[c];
        // chevauchement si le clip commence avant la fin du créneau
        // ET se termine après le début du créneau
        if (clip.start.seconds < endSec && clip.end.seconds > startSec) {
            return false;
        }
    }
    return true;
}

// Première piste vidéo non verrouillée libre sur ce créneau, sinon null
function PFW_firstFreeVideoTrack(seq, startSec, durSec) {
    for (var t = 0; t < seq.videoTracks.numTracks; t++) {
        var vt = seq.videoTracks[t];
        if (vt.isLocked()) continue;
        if (PFW_isVideoTrackFreeAt(vt, startSec, durSec)) return vt;
    }
    return null;
}

// Ajoute une piste vidéo via QE. Les noms/signatures changent selon la
// version de Premiere : on tente plusieurs variantes et on valide en
// comparant le nombre de pistes avant/après. Renvoie true si réussi.
function PFW_addVideoTrack() {
    app.enableQE();
    var qeSeq = qe.project.getActiveSequence();
    if (!qeSeq) return false;

    var before = app.project.activeSequence.videoTracks.numTracks;

    var attempts = [
        function () { qeSeq.addVideoTrack(); },
        function () { qeSeq.addTracks(1, before, 0, 0, 0, 0); },
        function () { qeSeq.addTracks(1, before); },
        function () { qeSeq.addTracks(1); },
        function () { qeSeq.addTracks(1, before, 0, 0); }
    ];

    for (var i = 0; i < attempts.length; i++) {
        try {
            attempts[i]();
            var after = app.project.activeSequence.videoTracks.numTracks;
            if (after > before) return true;
        } catch (e) {}
    }
    return false;
}

// Importe le fichier dans le bin "image web" et l'insère au playhead
// de la séquence active. filePath = chemin POSIX absolu.
function PFW_importAndInsert(filePath) {
    try {
        var seq = app.project.activeSequence;
        if (!seq) return "ERR:aucune séquence active";

        var bin = PFW_getWebBin();

        // mémoriser les items présents pour repérer le nouvel import
        var before = {};
        for (var i = 0; i < bin.children.numItems; i++) {
            before[bin.children[i].nodeId] = true;
        }

        var ok = app.project.importFiles(
            [filePath],
            true,            // suppressUI
            bin,             // bin cible
            false            // pas de séquences importées
        );
        if (!ok) return "ERR:import refusé";

        // récupérer le projectItem fraîchement importé
        var newItem = null;
        for (var j = 0; j < bin.children.numItems; j++) {
            var c = bin.children[j];
            if (!before[c.nodeId]) { newItem = c; break; }
        }
        if (!newItem) {
            // fallback : dernier item du bin
            if (bin.children.numItems > 0) newItem = bin.children[bin.children.numItems - 1];
        }
        if (!newItem) return "ERR:item importé introuvable";

        // mettre l'image à l'échelle de la séquence (sinon trop petite/grande)
        try { newItem.setScaleToFrameSize(); } catch (e) {}

        // position de la tête de lecture (objet Time)
        var playhead = seq.getPlayerPosition();
        var playheadSec = playhead.seconds;

        // durée de l'image importée (pour tester le créneau)
        var durSec = 5; // durée par défaut d'un fixe si on n'a pas mieux
        try {
            var ip = newItem.getInPoint(), op = newItem.getOutPoint();
            if (ip && op) {
                var d = op.seconds - ip.seconds;
                if (d > 0) durSec = d;
            }
        } catch (e) {}

        // chercher une piste vidéo LIBRE au playhead ; sinon en créer une
        var track = PFW_firstFreeVideoTrack(seq, playheadSec, durSec);
        var createdTrack = false;
        if (!track) {
            if (!PFW_addVideoTrack()) {
                return "ERR:impossible d'ajouter une piste vidéo (QE)";
            }
            createdTrack = true;

            // re-récupérer la séquence : la collection videoTracks de l'ancienne
            // référence ne voit pas toujours la piste fraîchement créée.
            seq = app.project.activeSequence;

            // la nouvelle piste (en haut) est forcément libre
            track = PFW_firstFreeVideoTrack(seq, playheadSec, durSec);
            if (!track && seq.videoTracks.numTracks > 0) {
                track = seq.videoTracks[seq.videoTracks.numTracks - 1];
            }
        }
        if (!track) return "ERR:impossible de créer/trouver une piste vidéo";

        // La piste est libre sur le créneau -> overwriteClip ne recouvre rien
        // et ne décale pas les autres pistes.
        track.overwriteClip(newItem, playhead);

        return "OK" + (createdTrack ? " (nouvelle piste créée)" : "");
    } catch (e) {
        return "ERR:" + e.toString();
    }
}
