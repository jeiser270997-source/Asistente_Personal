const { sendTelegramMessage } = require('../lib/telegram.js');

const msg = `📱 *SSH desde Termux (Android) - Guía Rápida*

**1. Instalar Termux**
F-Droid → Termux + Termux:API (recomendado)

**2. Setup Básico**
\`\`\`bash
pkg update && pkg upgrade -y
pkg install openssh git -y
termux-setup-storage
\`\`\`

**3. Generar Clave SSH**
\`\`\`bash
ssh-keygen -t ed25519 -C "jeiser@s23ultra"
cat ~/.ssh/id_ed25519.pub
\`\`\`

**4. En PC (PowerShell Admin)**
\`\`\`powershell
# Instalar SSH Server
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
Start-Service sshd
Set-Service sshd -StartupType Automatic

# Firewall
New-NetFirewallRule -Name 'SSHD' -DisplayName 'OpenSSH' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22

# Agregar tu clave pública (copia el output del paso 3)
$key = "TU_CLAVE_PUBLICA_AQUI"
Add-Content -Path "$env:USERPROFILE\\.ssh\\authorized_keys" -Value $key

# Config sshd_config
notepad $env:PROGRAMDATA\\ssh\\sshd_config
\`\`\`
*En sshd_config descomenta/cambia:*
\`\`\`
PubkeyAuthentication yes
PasswordAuthentication no
AllowUsers TU_USUARIO_WINDOWS
\`\`\`

\`\`\`powershell
Restart-Service sshd
\`\`\`

**5. Conectar desde Termux**
\`\`\`bash
ssh usuario@IP_DE_TU_PC
# O con Tailscale (recomendado, sin IP pública):
# pkg install tailscale && tailscale up
# ssh usuario@NOMBRE_PC_TAILSCALE
\`\`\`

**6. Alias rápido (opcional)**
\`\`\`bash
echo 'alias pc="ssh usuario@IP_DE_TU_PC"' >> ~/.bashrc && source ~/.bashrc
\`\`\`
*Luego solo escribes: \`pc\`*

---
🔐 *Seguridad: Ed25519 + PasswordAuthentication no + Tailscale = cero exposición pública*`;

sendTelegramMessage(msg).then(() => console.log('✅ Enviado a Telegram')).catch(e => console.error('❌ Error:', e.message));
