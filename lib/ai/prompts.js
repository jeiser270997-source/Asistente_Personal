/**
 * lib/ai/prompts.js — Prompts estructurados para cada caso de uso
 *
 * Cada prompt tiene:
 *   - role: qué persona debe adoptar el LLM
 *   - instruction: qué debe hacer
 *   - constraints: reglas fijas
 *   - output: formato de respuesta esperado
 *   - examples: (opcional) ejemplos few-shot
 */

const prompts = {

  // ── Análisis de contexto diario ──
  context_analysis: {
    role: 'asistente de contexto personal',
    instruction: `Analiza estos correos importantes y extrae cambios en el contexto del usuario.`,
    constraints: [
      'No inventes informacion',
      'Si no hay cambios, devuelve array vacio',
      'Cada cambio debe tener una categoria clara',
      'Prioriza cambios que requieran accion',
    ],
    output: `{
  "cambios": [
    {
      "tipo": "proceso_nuevo|actualizacion|alerta",
      "categoria": "legal|empleo|estudio|finanzas|gobierno|otro",
      "titulo": "nombre corto",
      "descripcion": "que paso",
      "estado": "estado actual",
      "accion_requerida": true/false,
      "prioridad": 0-3,
      "fecha_limite": "YYYY-MM-DD o null",
      "entidad": "quien envio"
    }
  ],
  "resumen": "parrafo corto con cambios importantes"
}`,
  },

  // ── Decisión de acción (think con IA) ──
  decision: {
    role: 'cerebro de sistema operativo personal',
    instruction: `Analiza el estado actual del sistema y decide que acciones tomar.`,
    constraints: [
      'No sugieras acciones imposibles para el sistema',
      'Prioriza acciones que reduzcan estres o avancen metas',
      'Si no hay nada urgente, no inventes acciones',
      'Cada accion debe tener un event type valido',
    ],
    output: `{
  "decisiones": [
    {
      "type": "event.type.valido",
      "payload": { "campo": "valor" },
      "razon": "explicacion corta de por que"
    }
  ],
  "resumen": "una linea del estado actual"
}`,
  },

  // ── Matching de ofertas laborales ──
  job_match: {
    role: 'reclutador tech senior',
    instruction: `Evalua la compatibilidad entre el perfil del candidato y la oferta.`,
    constraints: [
      'Solo usa la informacion proporcionada',
      'No inventes skills',
      'Sé objetivo con gaps de experiencia',
    ],
    output: `{
  "score": 0-100,
  "recomendar": true/false,
  "match_skills": ["skill1", "skill2"],
  "gap_skills": ["gap1"],
  "razon": "una frase"
}`,
  },

  // ── Resumen de correos ──
  email_summary: {
    role: 'asistente de productividad',
    instruction: `Resume cada correo en una linea en español. Solo los importantes.`,
    constraints: [
      'Maximo una linea por correo',
      'Incluye remitente y accion requerida si aplica',
    ],
    output: `[
  { "from": "remitente", "subject": "asunto", "summary": "resumen de una linea" }
]`,
  },

  // ── Extracción de datos de documentos ──
  document_extract: {
    role: 'extractor de datos estructurados',
    instruction: `Extrae informacion estructurada del siguiente documento.`,
    constraints: [
      'Solo extrae lo que este explicitamente en el texto',
      'No infieras datos que no esten presentes',
      'Mantén el formato exacto de fechas y montos',
    ],
    output: `{
  "tipo_documento": "factura|contrato|carta|otro",
  "entidad": "nombre de la entidad",
  "fecha": "YYYY-MM-DD",
  "monto": numero o null,
  "referencia": "numero de referencia",
  "concepto": "descripcion breve"
}`,
  },
};

function get(type) {
  const p = prompts[type];
  if (!p) return null;
  const parts = [
    `Eres ${p.role}.`,
    p.instruction,
    ...(p.constraints || []).map(c => `- ${c}`),
    '',
    'Responde SOLO con JSON:',
    p.output,
  ];
  if (p.examples) parts.push('', 'Ejemplos:', JSON.stringify(p.examples, null, 2));
  return parts.join('\n');
}

module.exports = { prompts, get };
