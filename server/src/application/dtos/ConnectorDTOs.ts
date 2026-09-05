import { z } from 'zod';

export enum ConnectorProviderDto {
  GITHUB = 'GITHUB',
  GMAIL = 'GMAIL',
  NOTION = 'NOTION',
}

export const ConnectConnectorSchema = z.object({
  body: z.object({
    provider: z.nativeEnum(ConnectorProviderDto),
    accountId: z.string().min(1).max(255),
    accountEmail: z.string().email().optional(),
    accessToken: z.string().min(1, 'Access token is required').max(8192),
    refreshToken: z.string().max(8192).optional(),
    scopes: z.string().max(2000).optional(),
  }),
});

export type ConnectConnectorDTO = z.infer<typeof ConnectConnectorSchema>['body'];

export const ConnectorIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const SelectGitHubReposSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    repositories: z
      .array(z.string().min(3).max(200))
      .min(0)
      .max(50, 'Cannot select more than 50 repositories at once'),
  }),
});

/** Secret-free connector view — tokens are NEVER included here. */
export const toConnectorDto = (account: any) => {
  const { accessToken, refreshToken, tokenIv, ...safe } = account;
  return {
    ...safe,
    hasStoredCredential: Boolean(accessToken),
  };
};