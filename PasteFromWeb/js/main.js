/* PasteFromWeb — logique principale (CEP / Node) */
(function () {
    "use strict";

    var cs = new CSInterface();
    var btn = document.getElementById("paste");
    var statusEl = document.getElementById("status");

    function setStatus(msg, cls) {
        statusEl.textContent = msg;
        statusEl.className = cls || "";
    }

    // require Node : CEP 11 (Premiere 2025) expose window.cep_node.require
    var nodeRequire = (typeof require !== "undefined") ? require
        : (typeof window.cep_node !== "undefined" ? window.cep_node.require : null);

    if (!nodeRequire) {
        setStatus("Node.js indisponible dans le panneau. Vérifie --enable-nodejs (manifest) et relance Premiere.", "err");
        btn.disabled = true;
        return;
    }

    var fs, os, path, child, https, http;
    try {
        fs = nodeRequire("fs");
        os = nodeRequire("os");
        path = nodeRequire("path");
        child = nodeRequire("child_process");
        https = nodeRequire("https");
        http = nodeRequire("http");
    } catch (e) {
        setStatus("Modules Node KO : " + e.message, "err");
        btn.disabled = true;
        return;
    }

    // --- Mise à jour ----------------------------------------------------
    var PFW_VERSION = "1.0.0";                       // version de ce panneau
    var PFW_REPO = "SalashPyta/colle-moi-l-web";     // dépôt GitHub
    var PFW_BRANCH = "main";

    function run(cmd) {
        // exécute une commande shell, renvoie stdout (Buffer)
        // windowsHide: évite le flash d'une fenêtre console PowerShell à chaque collage
        return child.execSync(cmd, { maxBuffer: 1024 * 1024 * 64, windowsHide: true });
    }

    var isWin = (os.platform() === "win32");

    // Affiche le bon raccourci dans l'astuce : Ctrl sur Windows, ⌘ sur Mac
    (function () {
        var km = document.getElementById("kbdMod");
        if (km && isWin) km.textContent = "Ctrl";
    })();

    // --- 1. Lire le presse-papier (cross-platform) ----------------------
    // Retourne { kind: "image", buffer } ou { kind: "url", url } ou null
    function readClipboard() {
        return isWin ? readClipboardWin() : readClipboardMac();
    }

    // macOS : image via «class PNGf» (osascript), URL via pbpaste
    function readClipboardMac() {
        var tmpPng = path.join(os.tmpdir(), "pfw_clip_" + Date.now() + ".png");
        var asScript =
            'try\n' +
            '  set theData to the clipboard as «class PNGf»\n' +
            '  set theFile to open for access POSIX file "' + tmpPng + '" with write permission\n' +
            '  write theData to theFile\n' +
            '  close access theFile\n' +
            '  return "OK"\n' +
            'on error\n' +
            '  try\n      close access theFile\n  end try\n' +
            '  return "NOIMG"\n' +
            'end try';
        var out = "";
        try {
            out = run("osascript -e " + shellQuote(asScript)).toString().trim();
        } catch (e) {
            out = "NOIMG";
        }
        if (out === "OK" && fs.existsSync(tmpPng) && fs.statSync(tmpPng).size > 0) {
            var buf = fs.readFileSync(tmpPng);
            try { fs.unlinkSync(tmpPng); } catch (e) {}
            return { kind: "image", buffer: buf };
        }
        var txt = "";
        try { txt = run("pbpaste").toString().trim(); } catch (e) {}
        if (/^https?:\/\/\S+/i.test(txt)) {
            return { kind: "url", url: txt.split(/\s+/)[0] };
        }
        return null;
    }

    // Windows : image + texte via PowerShell (System.Windows.Forms.Clipboard)
    function readClipboardWin() {
        var stamp = Date.now();
        var tmpPng = path.join(os.tmpdir(), "pfw_clip_" + stamp + ".png");
        var ps1 = path.join(os.tmpdir(), "pfw_clip_" + stamp + ".ps1");
        var script =
            "Add-Type -AssemblyName System.Windows.Forms\n" +
            "Add-Type -AssemblyName System.Drawing\n" +
            "$img = [System.Windows.Forms.Clipboard]::GetImage()\n" +
            "if ($img -ne $null) {\n" +
            "  $img.Save('" + tmpPng + "', [System.Drawing.Imaging.ImageFormat]::Png)\n" +
            "  Write-Output 'IMG'\n" +
            "} else {\n" +
            "  Write-Output ('TXT:' + [System.Windows.Forms.Clipboard]::GetText())\n" +
            "}\n";
        var out = "";
        try {
            fs.writeFileSync(ps1, script);
            out = run('powershell -NoProfile -STA -ExecutionPolicy Bypass -File "' + ps1 + '"').toString().trim();
        } catch (e) { out = ""; }
        try { fs.unlinkSync(ps1); } catch (e) {}

        if (out.indexOf("IMG") === 0 && fs.existsSync(tmpPng) && fs.statSync(tmpPng).size > 0) {
            var buf = fs.readFileSync(tmpPng);
            try { fs.unlinkSync(tmpPng); } catch (e) {}
            return { kind: "image", buffer: buf };
        }
        if (out.indexOf("TXT:") === 0) {
            var txt = out.substring(4).trim();
            if (/^https?:\/\/\S+/i.test(txt)) return { kind: "url", url: txt.split(/\s+/)[0] };
        }
        return null;
    }

    function shellQuote(s) {
        return "'" + String(s).replace(/'/g, "'\\''") + "'";
    }

    // --- 2. Télécharger une URL -----------------------------------------
    function download(url, destNoExt, cb) {
        var mod = url.indexOf("https:") === 0 ? https : http;
        var req = mod.get(url, { headers: { "User-Agent": "Mozilla/5.0 PasteFromWeb" } }, function (res) {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return download(res.headers.location, destNoExt, cb);
            }
            if (res.statusCode !== 200) {
                return cb(new Error("HTTP " + res.statusCode));
            }
            var ct = (res.headers["content-type"] || "").toLowerCase();
            var ext = ".jpg";
            if (ct.indexOf("png") >= 0) ext = ".png";
            else if (ct.indexOf("webp") >= 0) ext = ".webp";
            else if (ct.indexOf("gif") >= 0) ext = ".gif";
            else if (ct.indexOf("jpeg") >= 0 || ct.indexOf("jpg") >= 0) ext = ".jpg";
            else { var m = url.split("?")[0].match(/\.(png|jpe?g|webp|gif)$/i); if (m) ext = "." + m[1].toLowerCase(); }

            var dest = destNoExt + ext;
            var file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on("finish", function () { file.close(function () { cb(null, dest); }); });
            file.on("error", function (e) { cb(e); });
        });
        req.on("error", function (e) { cb(e); });
        req.setTimeout(20000, function () { req.destroy(new Error("timeout")); });
    }

    // --- 3. Convertir WebP -> PNG si besoin (Premiere ne lit pas WebP) ---
    function ensurePremiereReadable(filePath, cb) {
        if (!/\.webp$/i.test(filePath)) return cb(null, filePath);
        // Conversion via sips (macOS uniquement). Sur Windows on tente l'import tel quel.
        if (isWin) return cb(null, filePath);
        var pngPath = filePath.replace(/\.webp$/i, ".png");
        try {
            // sips est natif macOS et gère le webp
            run("sips -s format png " + shellQuote(filePath) + " --out " + shellQuote(pngPath));
            try { fs.unlinkSync(filePath); } catch (e) {}
            cb(null, pngPath);
        } catch (e) {
            cb(null, filePath); // on tente quand même l'import du webp
        }
    }

    // --- 4. Demander à ExtendScript le dossier du projet ----------------
    function getProjectDir(cb) {
        cs.evalScript("PFW_getProjectDir()", function (res) {
            if (!res || res === "EvalScript error." || res.indexOf("ERR:") === 0) {
                return cb(new Error(res || "pas de projet ouvert"));
            }
            cb(null, res);
        });
    }

    function uniqueName(dir, base) {
        var n = 1, name;
        do {
            name = base + "_" + ("000" + n).slice(-4);
            n++;
        } while (fs.existsSync(path.join(dir, name + ".png")) ||
                 fs.existsSync(path.join(dir, name + ".jpg")) ||
                 fs.existsSync(path.join(dir, name + ".webp")));
        return name;
    }

    // --- 5. Orchestration ------------------------------------------------
    function paste() {
      try {
        btn.disabled = true;
        setStatus("Lecture du presse-papier…");

        var clip = readClipboard();
        if (!clip) {
            setStatus("Aucune image dans le presse-papier.", "err");
            btn.disabled = false;
            return;
        }

        getProjectDir(function (err, projDir) {
            if (err) {
                setStatus("Erreur : " + err.message, "err");
                btn.disabled = false;
                return;
            }
            var webDir = path.join(projDir, "image web");
            try { if (!fs.existsSync(webDir)) fs.mkdirSync(webDir, { recursive: true }); }
            catch (e) { setStatus("Impossible de créer le dossier : " + e.message, "err"); btn.disabled = false; return; }

            var base = uniqueName(webDir, "web");

            function finish(savedPath) {
                ensurePremiereReadable(savedPath, function (e2, finalPath) {
                    setStatus("Import dans Premiere…");
                    var jsxArg = JSON.stringify(finalPath);
                    cs.evalScript("PFW_importAndInsert(" + jsxArg + ")", function (res) {
                        if (res && res.indexOf("OK") === 0) {
                            setStatus("✓ Image collée dans la séquence.", "ok");
                        } else {
                            setStatus("Erreur Premiere : " + res, "err");
                        }
                        btn.disabled = false;
                    });
                });
            }

            if (clip.kind === "image") {
                var dest = path.join(webDir, base + ".png");
                try { fs.writeFileSync(dest, clip.buffer); }
                catch (e) { setStatus("Écriture échouée : " + e.message, "err"); btn.disabled = false; return; }
                setStatus("Image enregistrée…");
                finish(dest);
            } else {
                setStatus("Téléchargement…");
                download(clip.url, path.join(webDir, base), function (e, dest) {
                    if (e) { setStatus("Téléchargement échoué : " + e.message, "err"); btn.disabled = false; return; }
                    finish(dest);
                });
            }
        });
      } catch (err) {
        setStatus("Erreur : " + (err && err.message ? err.message : err), "err");
        btn.disabled = false;
      }
    }

    btn.addEventListener("click", paste);

    // Cmd+V quand le panneau a le focus
    document.addEventListener("keydown", function (ev) {
        if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "v") {
            ev.preventDefault();
            paste();
        }
    });

    // Serveur local : le helper externe (raccourci Cmd+Shift+V) tape ici
    // pour déclencher le collage sans que le panneau ait le focus.
    var PFW_PORT = 48295;
    var busy = false;
    try {
        var server = http.createServer(function (req, res) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            if (req.url.indexOf("/paste") === 0) {
                res.writeHead(200); res.end("ok");
                if (!busy) { busy = true; try { paste(); } finally { setTimeout(function () { busy = false; }, 300); } }
            } else if (req.url.indexOf("/ping") === 0) {
                res.writeHead(200); res.end("pong");
            } else {
                res.writeHead(404); res.end();
            }
        });
        server.on("error", function (e) {
            setStatus("Serveur local indisponible (" + e.code + ") — le raccourci ne marchera pas.", "err");
        });
        server.listen(PFW_PORT, "127.0.0.1");
    } catch (e) {}

    // --- Mise à jour depuis GitHub --------------------------------------
    function rawUrl(p) {
        return "https://raw.githubusercontent.com/" + PFW_REPO + "/" + PFW_BRANCH + "/" + p + "?t=" + Date.now();
    }
    function httpGetText(url, cb) {
        var mod = url.indexOf("https:") === 0 ? https : http;
        mod.get(url, { headers: { "User-Agent": "ColleMoiWeb" } }, function (res) {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return httpGetText(res.headers.location, cb);
            }
            if (res.statusCode !== 200) return cb(new Error("HTTP " + res.statusCode));
            var data = ""; res.setEncoding("utf8");
            res.on("data", function (c) { data += c; });
            res.on("end", function () { cb(null, data); });
        }).on("error", cb);
    }
    function cmpVer(a, b) { // 1 si a>b, -1 si a<b, 0 égal
        var pa = String(a).split("."), pb = String(b).split(".");
        for (var i = 0; i < 3; i++) {
            var x = parseInt(pa[i], 10) || 0, y = parseInt(pb[i], 10) || 0;
            if (x > y) return 1; if (x < y) return -1;
        }
        return 0;
    }
    function applyUpdate(latest) {
        var extDir = cs.getSystemPath("extension");
        var files = ["index.html", "js/main.js", "jsx/host.jsx"];
        var done = 0, failed = 0;
        setStatus("Téléchargement v" + latest + "…");
        files.forEach(function (rel) {
            httpGetText(rawUrl("PasteFromWeb/" + rel), function (er, body) {
                if (er || !body || body.length < 10) { failed++; }
                else {
                    try { fs.writeFileSync(path.join(extDir, rel.replace(/\//g, path.sep)), body); }
                    catch (w) { failed++; }
                }
                if (++done === files.length) {
                    if (failed) setStatus("Mise à jour partielle (" + failed + " échec) — réessaie.", "err");
                    else setStatus("✓ Mis à jour en v" + latest + " — ferme et rouvre le panneau.", "ok");
                }
            });
        });
    }
    function checkUpdate(silent) {
        if (!silent) setStatus("Recherche de mise à jour…");
        httpGetText(rawUrl("version.json"), function (e, txt) {
            if (e) { if (!silent) setStatus("Mise à jour indisponible : " + e.message, "err"); return; }
            var latest;
            try { latest = JSON.parse(txt).version; } catch (x) { if (!silent) setStatus("version.json invalide.", "err"); return; }
            if (cmpVer(latest, PFW_VERSION) > 0) {
                if (silent && updBtn) { updBtn.textContent = "Mise à jour dispo (v" + latest + ") ↓"; updBtn.classList.add("hasupd"); }
                else applyUpdate(latest);
            } else if (!silent) {
                setStatus("Déjà à jour (v" + PFW_VERSION + ").", "ok");
            }
        });
    }
    var updBtn = document.getElementById("update");
    if (updBtn) {
        updBtn.addEventListener("click", function () { checkUpdate(false); });
        setTimeout(function () { checkUpdate(true); }, 1500); // vérif discrète au lancement
    }
})();
