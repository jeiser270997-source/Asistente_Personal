class ContextBuilder {

    build(domain) {

        switch(domain){

            case "jobs":
                return [
                    "data/jobs",
                    "data/sources/jobs",
                    "data/state/contexto_maestro/ESTADO_VIVO.md"
                ];

            case "study":
                return [
                    "data/state/contexto_maestro/ALERTAS_SENA.md",
                    "data/state/contexto_maestro/REGISTRO_DE_ESTUDIO.md"
                ];

            case "personal":
                return [
                    "data/user/perfil.md",
                    "data/user/metas.md",
                    "data/user/finanzas.md",
                    "data/state/contexto_maestro/ESTADO_VIVO.md"
                ];

            default:
                return [
                    "data/state/contexto_maestro/ESTADO_VIVO.md"
                ];
        }
    }
}

module.exports = ContextBuilder;
