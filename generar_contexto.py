import os
import subprocess
import sys

# =====================================================================
# SISTEMA DE GENERACIÓN DE CONTEXTO MODULAR (AHORRO DE TOKENS)
# =====================================================================
# Este script genera paquetes de contexto divididos semánticamente
# para evitar enviar todo el repositorio a los LLMs.
# Optimizador para maximizar el uso de Context Caching de Gemini.
# =====================================================================

# Patrones globales de exclusión para ambos contextos
IGNORE_PATTERNS = [
    "**/node_modules/**",
    "**/.venv/**",
    "**/venv/**",
    "**/dist/**",
    "**/.next/**",
    "**/build/**",
    "**/out/**",
    "Contexto_Maestro/archivo/**",
    "Laboratorios/REPOSITORIOS_VIBECODEADOS/**",
    "Laboratorios/02_TypeScript/pruebas-tecnicas-midudev/web/**",
    "**/master-javascript-exercises/**",
    "**/roadmap-retos-mouredev/**",
    "**/anthropic-courses/**",
    "**/*.ipynb",
    "**/.tmp.driveupload/**",
    "**/*.pdf",
    "**/*.png",
    "**/*.jpg",
    "**/*.jpeg",
    "**/*.ttf",
    "**/*.woff2",
    "**/*.svg",
    "**/*.mp3",
    "**/*.mp4",
    "ctx-estudio.md",
    "ctx-legal.md"
]

def generate_context(include_paths, output_name):
    ignore_str = ",".join(IGNORE_PATTERNS)
    include_str = ",".join(include_paths)
    
    cmd = f'npx repomix --style markdown --ignore "{ignore_str}" --include "{include_str}" --output "{output_name}"'
    print(f"Generando {output_name}...")
    
    try:
        # Ejecutar repomix con los overrides del módulo
        subprocess.run(cmd, shell=True, check=True)
        print(f"✓ Creado exitosamente: {output_name}")
    except subprocess.CalledProcessError as e:
        print(f"✗ Error al generar {output_name}: {e}", file=sys.stderr)

def main():
    print("Iniciando empaquetado de contexto modular...\n")
    
    # Módulo 1: ctx-estudio (Solo material de estudio y ejercicios prácticos)
    generate_context(
        include_paths=["Tecnicatura_Comprimida/**", "Laboratorios/**"],
        output_name="ctx-estudio.md"
    )
    
    # Módulo 2: ctx-legal (DIAN, Finanzas, Identidad y Bitácoras de vida)
    generate_context(
        include_paths=["Finanzas_y_DIAN/**", "Contexto_Maestro/**"],
        output_name="ctx-legal.md"
    )
    
    print("\nProceso finalizado. Archivos listos en la raíz de tu proyecto.")

if __name__ == "__main__":
    main()
