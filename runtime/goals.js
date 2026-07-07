/**
 * runtime/goals.js
 *
 * Metas del sistema. Definen el "para que existo" de Jarvis.
 * Cada goal tiene prioridad, métrica, target, y estado.
 */
const goals = [
  {
    id: 'mejorar_empleo',
    label: 'Mejorar empleo',
    priority: 10,
    metric: 'salario_estimado',
    target: 'increase',
    description: 'Conseguir trabajo formal en QA Automation',
    active: true,
  },
  {
    id: 'completar_estudio',
    label: 'Completar estudio SENA',
    priority: 9,
    metric: 'progreso_sena',
    target: 'increase',
    description: 'Terminar los 4 modulos del curso',
    active: true,
  },
  {
    id: 'estabilidad_financiera',
    label: 'Estabilidad financiera',
    priority: 8,
    metric: 'deuda_dian',
    target: 'decrease',
    description: 'Resolver situacion con DIAN y reducir deudas',
    active: true,
  },
  {
    id: 'reducir_estres',
    label: 'Reducir estres',
    priority: 7,
    metric: 'carga_mental',
    target: 'decrease',
    description: 'Mantener inbox zero y evitar sobrecarga',
    active: true,
  },
  {
    id: 'impugnar_simit',
    label: 'Resolver multas SIMIT',
    priority: 8,
    metric: 'casos_simit_abiertos',
    target: 'decrease',
    description: 'Cerrar los casos legales de transito',
    active: true,
  },
];

function getActive() {
  return goals.filter(g => g.active).sort((a, b) => b.priority - a.priority);
}

module.exports = { goals, getActive };
