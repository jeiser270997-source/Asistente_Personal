# Pipeline de Empleo

```
Fuente externa (Computrabajo, LinkedIn, Indeed, correo, etc)
        │
        ▼
[1] Normalizer ─── convierte datos crudos a JobPosting
        │
        ▼
[2] Scorer ─── evalúa contra CandidateProfile → ScoreBreakdown
        │
        ▼
[3] GapAnalyzer ─── identifica brechas y fortalezas → GapReport
        │
        ▼
[4] CVStrategy ─── define cómo adaptar el CV → TailoringPlan
        │
        ▼
[5] Critic ─── revisión independiente del plan → CriticReview
        │
        ▼
[6] Decision ─── ¿aplicar? → ApplicationDecision
        │
        ├── skip → fin
        │
        └── apply
              │
              ▼
        [7] CV Tailorer ─── genera CV adaptado
              │
              ▼
        [8] Cover Letter ─── genera carta de presentación
              │
              ▼
        [9] Apply ─── envía la postulación
              │
              ▼
       [10] InterviewPrep ─── preparación para entrevista
              │
              ▼
       [11] FeedbackEngine ─── aprende de resultados
```

## Flujo de decisión

```
score > threshold.apply    → aplicar automáticamente
score > threshold.maybe    → preguntar al usuario
score < threshold.maybe    → skip automático
```

Los thresholds se cargan desde `data/config/jobs/scoring_weights.json`
