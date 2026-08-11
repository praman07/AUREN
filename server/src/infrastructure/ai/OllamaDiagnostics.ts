import os from 'os';

export interface OllamaModelInfo {
  name: string;
  sizeBytes: number;
  parameterSize?: string;
  quantization?: string;
  family?: string;
}

export interface SystemCapabilities {
  totalRamGB: number;
  freeRamGB: number;
  platform: string;
  arch: string;
}

export interface OllamaHealthStatus {
  isInstalled: boolean;
  isRunning: boolean;
  isReachable: boolean;
  endpoint: string;
  installedModels: OllamaModelInfo[];
  systemCapabilities: SystemCapabilities;
  recommendedModel?: string;
  setupInstructions?: string;
}

export class OllamaDiagnostics {
  private endpoint: string;

  constructor(endpoint: string = process.env.OLLAMA_API_URL || 'http://localhost:11434') {
    this.endpoint = endpoint;
  }

  public async getHealthStatus(): Promise<OllamaHealthStatus> {
    const sysCaps = this.getSystemCapabilities();
    const status: OllamaHealthStatus = {
      isInstalled: false, // We infer installation from reachability in this basic check
      isRunning: false,
      isReachable: false,
      endpoint: this.endpoint,
      installedModels: [],
      systemCapabilities: sysCaps,
    };

    try {
      const response = await fetch(`${this.endpoint}/api/tags`);
      if (response.ok) {
        status.isReachable = true;
        status.isRunning = true;
        status.isInstalled = true;
        const data = await response.json() as any;
        
        status.installedModels = data.models.map((m: any) => ({
          name: m.name,
          sizeBytes: m.size,
          parameterSize: m.details?.parameter_size,
          quantization: m.details?.quantization_level,
          family: m.details?.family,
        }));

        status.recommendedModel = this.recommendModel(status.installedModels, sysCaps);
      }
    } catch (error) {
      status.setupInstructions = this.getSetupInstructions(sysCaps.platform);
    }

    return status;
  }

  private getSystemCapabilities(): SystemCapabilities {
    return {
      totalRamGB: Math.round(os.totalmem() / (1024 * 1024 * 1024)),
      freeRamGB: Math.round(os.freemem() / (1024 * 1024 * 1024)),
      platform: os.platform(),
      arch: os.arch(),
    };
  }

  private recommendModel(models: OllamaModelInfo[], caps: SystemCapabilities): string | undefined {
    if (models.length === 0) return undefined;

    // Filter for lightweight models under ~9B parameters, prioritizing qwen2.5 and gemma
    const lightweight = models.filter(m => {
      if (!m.parameterSize) return true; // Include if unknown
      const p = parseFloat(m.parameterSize); // e.g. "7B" -> 7
      return p <= 9;
    });

    if (lightweight.length === 0) return models[0].name;

    // Prefer specific families or names if they exist (Qwen2.5, Gemma)
    const preferred = lightweight.find(m => m.name.toLowerCase().includes('qwen') || m.name.toLowerCase().includes('gemma'));
    if (preferred) return preferred.name;

    // Sort by smallest size
    lightweight.sort((a, b) => a.sizeBytes - b.sizeBytes);
    return lightweight[0].name;
  }

  private getSetupInstructions(platform: string): string {
    if (platform === 'win32') {
      return 'Download and install Ollama for Windows from https://ollama.com/download/windows. Then run `ollama run qwen2.5:3b` to pull a lightweight model.';
    } else if (platform === 'darwin') {
      return 'Download and install Ollama for macOS from https://ollama.com/download/mac. Then run `ollama run qwen2.5:3b`.';
    } else {
      return 'Install Ollama via curl: `curl -fsSL https://ollama.com/install.sh | sh`. Then run `ollama run qwen2.5:3b`.';
    }
  }
}
