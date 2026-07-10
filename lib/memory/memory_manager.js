const fs = require("fs");

class MemoryManager {

    getEstadoVivo(){

        const file =
        "data/state/contexto_maestro/ESTADO_VIVO.md";

        if(!fs.existsSync(file))
            return "";

        return fs.readFileSync(file,"utf8");
    }
}

module.exports = MemoryManager;
