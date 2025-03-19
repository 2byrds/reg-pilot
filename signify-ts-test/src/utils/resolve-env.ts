import { TestEnvironment } from "@gleif-it/vlei-verifier-workflows";

export interface TestEnvironmentRegPilot extends TestEnvironment {
  apiBaseUrl: string;
  filerBaseUrl: string;
}
