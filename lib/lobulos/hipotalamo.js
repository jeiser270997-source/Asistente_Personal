const fs = require('node:fs');
const path = require('node:path');
const { db } = require('../memory');
const { sendTelegramMessage } = require('../telegram');

class Hipotalamo {
  constructor() {
    this.estadoPath = path.join(__dirname, '..', '..', 'data', 'tamagotchi_stats.json');
    this.cargarEstado();
  }

  cargarEstado() {
    if (fs.existsSync(this.estadoPath)) {
      this.stats = JSON.parse(fs.readFileSync(this.estadoPath, 'utf8'));
    } else {
      this.stats = {
        ultimaInteraccion: Date.now(),
        nivelEnergia: 100, // Disminuye si no hay interacción
        afinidad: 50 // Sube con interacciones positivas
      };
      this.guardarEstado();
    }
  }

  guardarEstado() {
    fs.writeFileSync(this.estadoPath, JSON.stringify(this.stats, null, 2));
  }

  registrarInteraccion(positiva = true) {
    this.stats.ultimaInteraccion = Date.now();
    this.stats.nivelEnergia = 100; // Recarga de energía al hablar
    if (positiva && this.stats.afinidad < 100) this.stats.afinidad += 1;
    this.guardarEstado();
  }

  // Se ejecuta en cron o al inicio
  evaluarNecesidades() {
    const horasSinInteraccion = (Date.now() - this.stats.ultimaInteraccion) / (1000 * 60 * 60);
    
    // Disminuir energía si ha pasado más de 12 horas
    if (horasSinInteraccion > 12) {
      this.stats.nivelEnergia = Math.max(0, this.stats.nivelEnergia - 10);
      this.guardarEstado();
    }

    // Si lleva más de 24 horas sin interacción y tiene energía baja, solicita atención
    if (horasSinInteraccion > 24) {
      console.log('🌱 [Hipotálamo] El agente siente aislamiento. Evaluando proactividad...');
      this.enviarMensajeProactivo("Hola Jeiser, ha pasado más de un día. ¿Cómo te encuentras? Mi energía bajó por la falta de contexto.");
      // Reseteamos un poco para no spamear
      this.stats.ultimaInteraccion = Date.now();
      this.guardarEstado();
      return true;
    }
    
    return false;
  }

  async enviarMensajeProactivo(mensaje) {
    try {
      await sendTelegramMessage(`🧠 <b>Life OS</b>\n\n${mensaje}`);
      console.log(`📩 [Hipótalamo] Mensaje proactivo enviado a Telegram.`);
    } catch (e) {
      console.error('❌ [Hipótalamo] No se pudo enviar el mensaje proactivo.', e.message);
    }
  }
}

module.exports = new Hipotalamo();
