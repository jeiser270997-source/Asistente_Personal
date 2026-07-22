$ErrorActionPreference = "Continue"
$logFile = "$env:USERPROFILE\Desktop\remote-access-setup.log"

function Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp | $Message" | Out-File -FilePath $logFile -Append -Encoding UTF8
    Write-Host "$timestamp | $Message"
}

Log "=== CONTINUACIÓN SETUP ==="

# ── 2. CONFIGURAR SERVICIO SSH ──
Log "[2/4] Configurando servicio sshd..."
try {
    Set-Service -Name sshd -StartupType Automatic
    Log "  sshd → StartupType: Automatic"
    Start-Service sshd
    Log "  sshd iniciado."
    
    $svc = Get-Service sshd
    Log "  Estado: $($svc.Status)"
    
    Start-Sleep -Seconds 3
    $portCheck = Get-NetTCPConnection -LocalPort 22 -ErrorAction SilentlyContinue
    if ($portCheck) { Log "  Puerto 22: ABIERTO" }
    else { Log "  Puerto 22: no detectado aún" }
} catch { Log "  ERROR sshd: $_" }

# ── 3. FIREWALL ──
Log "[3/4] Configurando Firewall..."
try {
    $existing = Get-NetFirewallRule -DisplayName "OpenSSH SSH Server (sshd)" -ErrorAction SilentlyContinue
    if (-not $existing) {
        New-NetFirewallRule -DisplayName "OpenSSH SSH Server (sshd)" -Direction Inbound -Protocol TCP -LocalPort 22 -Action Allow
        Log "  Regla Firewall TCP/22 IN: CREADA"
    } else { Log "  Regla Firewall TCP/22 IN: YA EXISTE" }
} catch { Log "  ERROR Firewall: $_" }

# ── 4. TAILSCALE ──
Log "[4/4] Instalando Tailscale..."
try {
    $ts = Get-Command tailscale -ErrorAction SilentlyContinue
    if (-not $ts) {
        & winget install Tailscale.Tailscale --silent --accept-package-agreements --accept-source-agreements
        Log "  Tailscale instalado."
    } else { Log "  Tailscale ya instalado." }
    $tsVer = & tailscale version 2>$null
    Log "  Versión: $tsVer"
} catch { Log "  ERROR Tailscale: $_" }

# ── REPORTE ──
Log ""
Log "=== REPORTE FINAL ==="
$user = whoami
Log "Windows User: $user"
$svcFinal = Get-Service sshd
Log "SSH Service:  $($svcFinal.Status) / $($svcFinal.StartType)"
$tsIP = & tailscale ip -4 2>$null
if ($tsIP) { Log "Tailscale IP: $tsIP (CONECTADO)" }
else { Log "Tailscale: NO LOGUEADO (inicia sesión manual)" }
Log "Puerto SSH:   22"

Write-Host "`n═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  LOG: $logFile" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
