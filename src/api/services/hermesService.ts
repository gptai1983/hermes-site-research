import { spawn } from 'child_process';

export interface HermesResult {
  success: boolean;
  output?: string;
  error?: string;
  provider?: string;
}

export async function executeResearchTask(sessionId: number, prompt: string): Promise<HermesResult> {
  console.log(`[HermesService] Starting task ${sessionId}`);

  return new Promise((resolve) => {
    const hermes = spawn('hermes', [
      'chat',
      prompt,
    ], {
      shell: true,
      timeout: 120000,
    });

    let output = '';
    let errorOutput = '';

    hermes.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(`[Hermes] ${data}`);
    });

    hermes.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(`[Hermes Error] ${data}`);
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

    setTimeout(() => {
      hermes.kill();
      resolve({ success: false, error: 'Timeout after 120 seconds' });
    }, 120000);
  });
}
