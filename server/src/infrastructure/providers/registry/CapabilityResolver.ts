export class CapabilityResolver {
  public static validateEnvironment(providerName: string, requiredVars: string[]): void {
    for (const envVar of requiredVars) {
      if (!process.env[envVar]) {
        throw new Error(`Configuration Error: Provider '${providerName}' requires environment variable '${envVar}'`);
      }
    }
  }
}
