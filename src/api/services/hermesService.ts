import { spawn } from 'child_process';

export interface HermesResult {
  success: boolean;
  output?: string;
  error?: string;
  provider?: string;
}

type LogCallback = (log: string) => void;

export async function executeResearchTask(sessionId: number, prompt: string, onLog?: LogCallback): Promise<HermesResult> {
  console.log(`[HermesService] Starting task ${sessionId}`);

  return new Promise((resolve) => {
    const hermes = spawn('hermes', ['-z', prompt], {
      shell: false,
    });

    let output = '';
    let errorOutput = '';

    hermes.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(`[Hermes] ${text}`);
      if (onLog) onLog(text);
    });

    hermes.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      process.stderr.write(`[Hermes Error] ${text}`);
      if (onLog) onLog(text);
    });

    hermes.on('close', (code) => {
      console.log(`[HermesService] Task ${sessionId} finished with code ${code}`);
      if (code === 0) {
        resolve({ success: true, output });
      } else {
        resolve({ success: false, error: errorOutput });
      }
    });

    hermes.on('error', (err) => {
      console.error(`[HermesService] Error: ${err.message}`);
      resolve({ success: false, error: err.message });
    });
  });
}
