export type AppConfig = {
  onboardingComplete: boolean;
  vaultRoot: string;
  ollamaHost: string;
  defaultModel: string;
  requireActionApproval: boolean;
};

export type OllamaStatus = {
  online: boolean;
  models: string[];
};

export type VaultPathStatus = {
  exists: boolean;
  path: string;
};
