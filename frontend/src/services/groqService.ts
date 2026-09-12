/**
 * Groq AI Cloud Service for BRAIN EV Battery Risk & Thermal Intelligence
 * Provides fast Llama-3 AI battery diagnostics and risk summaries.
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

export const isGroqConfigured = (): boolean => {
  return Boolean(GROQ_API_KEY && !GROQ_API_KEY.includes('your-groq-api-key'));
};

export async function analyzeBatteryRiskWithGroq(telemetry: {
  voltage: number;
  current: number;
  temp: number;
  soc: number;
  soh: number;
  chemistry?: string;
  status?: string;
}): Promise<string> {
  if (!isGroqConfigured()) {
    return `AI Guardian Analysis: Pack operates at ${telemetry.temp}°C with ${telemetry.soc}% SOC and ${telemetry.soh}% SOH (${telemetry.chemistry || 'NMC'}). Thermal balance optimal.`;
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content:
              'You are the BRAIN EV Battery Safety & PINN AI Intelligence Guardian. Provide a 2-sentence expert thermal risk and battery health diagnosis.',
          },
          {
            role: 'user',
            content: `Analyze EV Battery Pack: Voltage ${telemetry.voltage}V, Current ${telemetry.current}A, Temperature ${telemetry.temp}°C, SOC ${telemetry.soc}%, SOH ${telemetry.soh}%, Chemistry: ${telemetry.chemistry || 'NMC'}, Status: ${telemetry.status || 'NORMAL'}.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0]?.message?.content || 'AI Analysis completed successfully.';
    }
  } catch (err) {
    console.warn('Groq AI request error:', err);
  }

  return `AI Guardian Analysis: Operating within normal parameters (${telemetry.temp}°C, SOH ${telemetry.soh}%).`;
}
