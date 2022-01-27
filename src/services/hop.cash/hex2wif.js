const wif = require("wif");
const hex2wif = function(hexStr) {
    var privateKey = Buffer.from(hexStr, "hex");
    return wif.encode(128, privateKey, true)
}

module.exports = hex2wif