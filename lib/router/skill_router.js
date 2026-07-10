class SkillRouter {

    route(text){

        const q = text.toLowerCase();

        if(q.match(/empleo|trabajo|vacante|cv|linkedin|computrabajo/))
            return "jobs";

        if(q.match(/sena|cesde|estudio|curso|materia/))
            return "study";

        if(q.match(/meta|objetivo|finanza|dinero|ahorro/))
            return "personal";

        return "general";
    }
}

module.exports = SkillRouter;
