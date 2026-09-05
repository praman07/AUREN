import { IVisionProvider, VisionInput, VisionResponse } from '../../interfaces/IVisionProvider';
import { fetch as undiciFetch, Agent } from 'undici';
import * as fs from 'fs';

const customDispatcher = new Agent({
  headersTimeout: 180000, // 3 minutes timeout for heavy vision inference
  bodyTimeout: 180000,
  connectTimeout: 30000
});

const customFetch = (input: any, init?: any) => {
  return undiciFetch(input, {
    ...init,
    dispatcher: customDispatcher
  });
};

export class LlamaCppVisionProvider implements IVisionProvider {
  private baseUrl: string;
  private modelName: string;
  private projectorName: string;

  constructor(baseUrl?: string, modelName?: string, projectorName?: string) {
    this.baseUrl = baseUrl || process.env.LLAMACPP_VISION_BASE_URL || process.env.LLAMACPP_BASE_URL || 'http://127.0.0.1:8082';
    this.modelName = modelName || process.env.LLAMACPP_VISION_MODEL || 'qwen2.5-vl-7b-instruct-q4_k_m.gguf';
    this.projectorName = projectorName || process.env.LLAMACPP_VISION_MMPROJ || 'mmproj-Qwen2.5-VL-7B-Instruct-f16.gguf';
  }

  public async analyzeImage(input: VisionInput): Promise<VisionResponse> {
    let base64Image = '';

    if (input.imageBase64) {
      base64Image = input.imageBase64.includes(',')
        ? input.imageBase64.split(',')[1]
        : input.imageBase64;
    } else if (input.imageBuffer) {
      base64Image = input.imageBuffer.toString('base64');
    } else if (input.imagePath) {
      const buffer = await fs.promises.readFile(input.imagePath);
      base64Image = buffer.toString('base64');
    } else {
      throw new Error('LlamaCppVisionProvider requires imageBuffer, imageBase64, or imagePath');
    }

    const dataUrl = `data:image/png;base64,${base64Image}`;
    const promptText = input.prompt || 'Describe this image in full detail and transcribe any visible text.';

    const cleanBaseUrl = this.baseUrl.replace(/\/$/, '');
    const endpoint = cleanBaseUrl.endsWith('/v1')
      ? `${cleanBaseUrl}/chat/completions`
      : `${cleanBaseUrl}/v1/chat/completions`;

    try {
      const response = await customFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: promptText },
                {
                  type: 'image_url',
                  image_url: {
                    url: dataUrl
                  }
                }
              ]
            }
          ],
          temperature: input.options?.temperature ?? 0.2,
          max_tokens: input.options?.maxTokens ?? 2048
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`llama-server vision request failed (${response.status}): ${errorText}`);
      }

      const body = await response.json() as any;
      const text = body.choices?.[0]?.message?.content || '';

      return {
        text,
        modelUsed: this.modelName,
        metadata: {
          projectorUsed: this.projectorName,
          usage: body.usage
        }
      };
    } catch (error: any) {
      throw new Error(`LlamaCppVisionProvider error at ${endpoint}: ${error.message}`);
    }
  }

  public async describeDocumentPage(imageBuffer: Buffer, pageNumber: number = 1): Promise<string> {
    const response = await this.analyzeImage({
      imageBuffer,
      prompt: `Analyze page ${pageNumber} of this document. Provide an accurate transcription of all text, headings, tables, formulas, and visual diagrams contained in this page. Format tables clearly as Markdown tables.`
    });
    return response.text;
  }
}
