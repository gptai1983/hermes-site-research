import { spawn } from 'child_process';

export interface HermesResult {
  success: boolean;
  output?: string;
  error?: string;
  provider?: string;
}

export async function executeResearchTask(sessionId: number, prompt: string, url?: string): Promise<HermesResult> {
  const fullPrompt = `Исследуй сайт ${url || 'unknown'}. Задача: ${prompt}. Используй браузер для навигации и сбора данных. Верни результат в JSON формате.`;

  return new Promise((resolve) => {
    const hermes = spawn('hermes', [
      'agent', 'run',
      `"${fullPrompt}"`,
      '--output-format', 'json',
      '--no-stream'
    ], {
      shell: true,
      env: { ...process.env, HERMES_NO_ANSI: '1' }
    });

    let output = '';
    let errorOutput = '';

    hermes.stdout.on('data', (data) => { output += data.toString(); });
    hermes.stderr.on('data', (data) => { errorOutput += data.toString(); });

    hermes.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output });
      } else {
        resolve({ success: false, error: errorOutput });
      }
    });

    hermes.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}
