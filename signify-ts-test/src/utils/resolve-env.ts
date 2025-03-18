import { TestEnvironment } from "vlei-verifier-workflows";

export interface TestEnvironmentRegPilot extends TestEnvironment {
  apiBaseUrl: string;
  filerBaseUrl: string;
}
