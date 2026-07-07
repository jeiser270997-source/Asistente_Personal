import fitz
doc = fitz.open("C:/Users/dev/Downloads/Evidencia_AA2_Colegio_San_Jorge.pdf")
print("Paginas:", len(doc))
print("---")
for i, page in enumerate(doc):
    txt = page.get_text()
    lines = txt.split("\n")
    first = lines[0][:80] if lines else "(vacio)"
    print(f"Pag {i+1}: {first}")
print("---")
# Check all content sections
full = "".join(page.get_text() for page in doc)
sections = [
    "PORTADA" if "SENA" in full else "",
    "PREGUNTAS REFLEXION" if "Pregunta 1" in full else "",
    "TIPOS DATOS" if "Alfanum" in full else "",
    "TIPOS BD" if "Relacionales" in full else "",
    "REFLEXION PERSONAL" if "Conocer los diferentes" in full else "",
    "TALLER COLEGIO SAN JORGE" if "Colegio San Jorge" in full else "",
    "ENTIDAD PROFESORES" if "cod_profesor" in full else "",
    "ENTIDAD ESTUDIANTES" if "cod_estudiante" in full else "",
    "ENTIDAD MATERIAS" if "cod_materia" in full else "",
    "ENTIDAD CURSOS" if "cod_curso" in full else "",
    "ENTIDAD ASIGNACION" if "Asignacion_Materias_Curso" in full else "",
    "REGISTROS 10" if "2001" in full and "2002" in full else "",
    "CARDINALIDAD" if "cardinalidad" in full.lower() or "1:M" in full else "",
    "CONCLUSION" if "conclusion" in full.lower() or "conceptual" in full.lower() == False else "",
]
print("\nSecciones detectadas:")
for s in sections:
    if s:
        print(f"  ✅ {s}")
print(f"\nTotal caracteres: {len(full)}")
