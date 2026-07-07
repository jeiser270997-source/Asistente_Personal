import fitz
import os

src = "C:/Users/dev/Downloads/Evidencia_AA2_Colegio_San_Jorge.pdf"
doc = fitz.open(src)

# PDF 1: Portada + Evidencia 1 (pages 1-4)
pdf1 = fitz.open()
pdf1.insert_pdf(doc, from_page=0, to_page=3)
out1 = "C:/Users/dev/Downloads/Evidencia_AA2_Cuadro_Comparativo.pdf"
pdf1.save(out1)
pdf1.close()
print("PDF 1: " + out1 + " (" + str(os.path.getsize(out1)) + " bytes)")

# PDF 2: Portada + Evidencia 2 (page 1, then pages 5-13)
pdf2 = fitz.open()
pdf2.insert_pdf(doc, from_page=0, to_page=0)
pdf2.insert_pdf(doc, from_page=4, to_page=12)
out2 = "C:/Users/dev/Downloads/Evidencia_AA2_Taller_Colegio_San_Jorge.pdf"
pdf2.save(out2)
pdf2.close()
print("PDF 2: " + out2 + " (" + str(os.path.getsize(out2)) + " bytes)")

doc.close()
print("Listo")
