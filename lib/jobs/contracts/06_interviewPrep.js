/**
 * InterviewPrep
 * Genera material de preparación para entrevista basado en la oferta y el CV enviado.
 *
 * Input:  JobPosting, CandidateProfile, TailoringPlan
 * Output: InterviewPack
 */

const CONTRACT = {
  input: 'JobPosting, CandidateProfile, TailoringPlan',
  output: 'InterviewPack',
  methods: [
    {
      name: 'prepare(job, profile, plan)',
      returns: 'InterviewPack',
      description: 'Genera el paquete completo de preparación',
    },
    {
      name: 'generateSTAR(situation, task, action, result)',
      returns: 'string',
      description: 'Construye una historia STAR estructurada',
    },
    {
      name: 'mockQuestions(pack)',
      returns: 'string[]',
      description: 'Simula preguntas del entrevistador para practicar',
    },
  ],
};

module.exports = { CONTRACT };
