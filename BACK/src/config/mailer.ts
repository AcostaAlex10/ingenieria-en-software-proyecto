/**
 * Envío de emails transaccionales con la API HTTP de Brevo (ex-Sendinblue).
 * Usa el fetch nativo de Node 18+, sin librerías extra. Credenciales por env:
 *   BREVO_API_KEY -> la API key (xkeysib-...)
 *   BREVO_SENDER  -> email remitente verificado en Brevo
 * Si no están configuradas devuelve false (el flujo sigue igual, sin mail).
 */
export async function enviarMail(para: string, asunto: string, html: string): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY ?? '';
  const remitente = process.env.BREVO_SENDER ?? '';
  if (!apiKey || !remitente) return false;

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: remitente, name: 'SGSO' },
        to: [{ email: para }],
        subject: asunto,
        htmlContent: html,
      }),
      signal: AbortSignal.timeout(12000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
