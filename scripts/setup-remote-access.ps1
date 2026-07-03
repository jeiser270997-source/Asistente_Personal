param([switch]$Elevated)

$ErrorActionPreference = "Stop"
$logFile = "$env:USERPROFILE\Desktop\remote-access-setup.log"

function Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp | $Message" | Out-File -FilePath $logFile -Append -Encoding UTF8
    Write-Host "$timestamp | $Message"
}

Log "=== INICIO SETUP REMOTE ACCESS ==="
Log "Usuario: $(whoami)"

# ── 1. INSTALAR OPENSSH SERVER ──
Log "[1/4] Instalando OpenSSH Server..."
try {
    $cap = Get-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
    if ($cap.State -eq "Installed") {
        Log "  OpenSSH Server ya está instalado."
    } else {
        Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
        Log "  OpenSSH Server instalado correctamente."
    }
} catch {
    Log "  ERROR instalando OpenSSH Server: $_"
}

# ── 2. CONFIGURAR SERVICIO SSH ──
Log "[2/4] Configurando servicio sshd..."
try {
    Set-Service -Name sshd -StartupType Automatic
    Log "  sshd → StartupType Automatic"
    Start-Service sshd
    Log "  sshd iniciado."
    
    $svc = Get-Service sshd
    Log "  Estado: $($svc.Status), Startup: $($svc.StartType)"
    
    # Verificar puerto 22
    $portCheck = Get-NetTCPConnection -LocalPort 22 -ErrorAction SilentlyContinue
    if ($portCheck) {
        Log "  Puerto 22: ABIERTO y escuchando."
    } else {
        Log "  Puerto 22: No se detectó escucha activa (puede tardar unos segundos)."
    }
} catch {
    Log "  ERROR configurando sshd: $_"
}

# ── 3. REGLA DE FIREWALL ──
Log "[3/4] Configurando Firewall..."
try {
    $existing = Get-NetFirewallRule -DisplayName "OpenSSH SSH Server (sshd)" -ErrorAction SilentlyContinue
    if (-not $existing) {
        New-NetFirewallRule -DisplayName "OpenSSH SSH Server (sshd)" -Direction Inbound -Protocol TCP -LocalPort 22 -Action Allow -RemoteAddress "100.64.0.0/10", "LocalSubnet"
        Log "  Regla de Firewall creada: TCP/22 IN允许."
    } else {
        Log "  Regla de Firewall ya existe: TCP/22 IN允许."
    }
    
    # Verificar
    $rule = Get-NetFirewallRule -DisplayName "OpenSSH SSH Server (sshd)" -ErrorAction SilentlyContinue
    if ($rule.Enabled -eq $true) { Log "  Firewall: HABILITADO" }
} catch {
    Log "  ERROR en Firewall: $_"
}

# ── 4. INSTALAR TAILSCALE ──
Log "[4/4] Instalando Tailscale..."
try {
    $ts = Get-Command tailscale -ErrorAction SilentlyContinue
    if (-not $ts) {
        & winget install Tailscale.Tailscale --silent --accept-package-agreements --accept-source-agreements
        Log "  Tailscale instalado."
    } else {
        Log "  Tailscale ya instalado."
    }
    $tsVer = & tailscale version 2>$null
    Log "  Versión Tailscale: $tsVer"
} catch {
    Log "  ERROR instalando Tailscale: $_"
}

# ── REPORTE FINAL ──
Log ""
Log "=== REPORTE FINAL ==="
$user = whoami
$hostname = hostname
$svcFinal = Get-Service sshd -ErrorAction SilentlyContinue

Log "Windows User:      $user"
Log "Hostname:          $hostname"
Log "SSH Service:       $($svcFinal.Status) ($($svcFinal.StartType))"

# Intentar obtener IP de Tailscale si ya está logueado
$tsIP = & tailscale ip -4 2>$null
if ($tsIP) {
    Log "Tailscale IP:      $tsIP"
    Log "Tailscale Status:  CONECTADO"
} else {
    $tsStatus = & tailscale status 2>$null
    Log "Tailscale Status:  NO LOGUEADO (inicia sesión en la bandeja de Windows)"
    Log "Tailscale IP:      Pendiente de login"
}

Log "Puerto SSH:        22"
Log "=== FIN ==="

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  REPORTE GUARDADO EN: $logFile" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
