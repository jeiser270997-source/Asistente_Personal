import os
import subprocess
import sys

IGNORE_PATTERNS = [
    "**/node_modules/**", "**/.git/**", "**/dist/**", "**/build/**",
    "**/*.png", "**/*.jpg", "**/*.mp4", "**/*.pdf", "**/*.json", "**/*.lock", "**/*.exe"
]

def generate_context(include_paths, output_name):
    ignore_str = ",".join(IGNORE_PATTERNS)
    include_str = ",".join(include_paths)
    cmd = f'npx repomix --style markdown --ignore "{ignore_str}" --include "{include_str}" --output "{output_name}"'
    print(f"Generando {output_name}...")
    try:
        subprocess.run(cmd, shell=True, check=True)
        print(f"✓ Creado exitosamente: {output_name}")
    except subprocess.CalledProcessError as e:
        print(f"✗ Error al generar {output_name}: {e}", file=sys.stderr)

def main():
    print("Iniciando empaquetado de contexto modular...\n")
    base = "E:/PROYECTOS/Proyectos_GitHub"
    
    # MÓDULO QA BOOTCAMP
    generate_context([
        f"{base}/01_Estudio_y_Desafios - playwright/**/*.md",
        f"{base}/01_Estudio_y_Desafios - awesome-playwright/**/*.md",
        f"{base}/01_Estudio_y_Desafios - cypress-realworld-app/**/*.md"
    ], "ctx-qa.md")
    
    # MÓDULO FUNDAMENTOS
    generate_context([
        f"{base}/01_Estudio_y_Desafios - odin-project/**/*.md",
        f"{base}/01_Estudio_y_Desafios - developer-roadmap/**/*.md"
    ], "ctx-fundamentos.md")

    print("\nProceso finalizado. Archivos listos para Llama/Qwen.")

if __name__ == "__main__":
    main()
