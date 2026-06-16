/* CSInterface minimal — pont CEP <-> ExtendScript.
   Suffisant pour PasteFromWeb (evalScript). Pour l'API complète,
   remplace ce fichier par le CSInterface.js officiel d'Adobe. */
function CSInterface() {}

CSInterface.prototype.evalScript = function (script, callback) {
    if (typeof window.__adobe_cep__ !== "object") {
        if (callback) callback("ERR:CEP indisponible");
        return;
    }
    if (callback === null || callback === undefined) {
        callback = function () {};
    }
    window.__adobe_cep__.evalScript(script, callback);
};

CSInterface.prototype.getSystemPath = function (type) {
    if (typeof window.__adobe_cep__ !== "object") return "";
    var path = decodeURIComponent(window.__adobe_cep__.getSystemPath(type));
    return path;
};

CSInterface.prototype.getExtensionID = function () {
    return window.__adobe_cep__ ? window.__adobe_cep__.getExtensionId() : "";
};
