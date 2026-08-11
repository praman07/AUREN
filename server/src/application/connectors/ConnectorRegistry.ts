import { IConnector } from '../../domain/connectors/IConnector';
import { ConnectorProvider } from '@prisma/client';

export class ConnectorRegistry {
  private static instance: ConnectorRegistry;
  private connectors = new Map<ConnectorProvider, IConnector>();

  private constructor() {}

  public static getInstance(): ConnectorRegistry {
    if (!ConnectorRegistry.instance) {
      ConnectorRegistry.instance = new ConnectorRegistry();
    }
    return ConnectorRegistry.instance;
  }

  public register(connector: IConnector): void {
    this.connectors.set(connector.getProvider(), connector);
  }

  public getConnector(provider: ConnectorProvider): IConnector {
    const connector = this.connectors.get(provider);
    if (!connector) {
      throw new Error(`No connector registered for provider: ${provider}`);
    }
    return connector;
  }

  public hasConnector(provider: ConnectorProvider): boolean {
    return this.connectors.has(provider);
  }
}
