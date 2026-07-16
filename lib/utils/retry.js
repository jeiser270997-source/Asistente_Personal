async function withRetry(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries) throw err;
      const delay = baseDelay * Math.pow(2, i);
      console.warn(`[Retry] Intento ${i+1}/${maxRetries} - esperando ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
module.exports = { withRetry };
