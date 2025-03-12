import minimist from "minimist";
import path, { parse } from "path";
import {
  TestEnvironment,
  TestPaths,
} from "../src/utils/resolve-env";
import {
  ARG_KERIA_HOST,
  ARG_KERIA_DOMAIN,
  ARG_WITNESS_HOST,
  WorkflowRunner,
  getConfig,
  listPackagedWorkflows,
  loadPackagedWorkflow,
  loadWorkflow,
  startDockerServices,
} from "vlei-verifier-workflows";

import { SIMPLE_TYPE } from "../src/utils/test-data";

import { downloadConfigWorkflowReports } from "../src/utils/bank-reports";
import {
  ApiTestStepRunner,
  GenerateReportStepRunner,
  SignReportStepRunner,
  VleiVerificationTestStepRunner,
} from "./utils/workflow-step-runners";
import assert from "assert";
import { TestKeria } from "vlei-verifier-workflows/dist/utils/test-keria";

// List all available workflows
const availableWorkflows = listPackagedWorkflows();
console.log('Available workflows:', availableWorkflows);

let testPaths: TestPaths;
let env: TestEnvironment;
let configJson: any;

console.log(`run-workflow-bank process.argv array: ${process.argv}`);

// Test context constants - use these for test names, configJson['context'], and keria instance IDs
const TEST_CONTEXTS = {
  // API_TEST: "reg-api-bank-test-workflow",
  EBA_TEST: "eba-bank-test-workflow",
  // ISSUANCE_TEST: "issuance-bank-test-workflow",
};

// Access named arguments
const ARG_MAX_REPORT_SIZE = "max-report-size";
const ARG_BANK_NUM = "bank-num";
const ARG_REFRESH = "refresh";
const ARG_CLEAN = "clean";
const ARG_KERIA_START_PORT = "keria-start-port";

// Parse command-line arguments using minimist
const args = minimist(process.argv.slice(process.argv.indexOf("--") + 1), {
  alias: {
    [ARG_MAX_REPORT_SIZE]: "m",
    [ARG_BANK_NUM]: "b",
    [ARG_REFRESH]: "r",
    [ARG_CLEAN]: "c",
    [ARG_KERIA_START_PORT]: "ksp",
  },
  default: {
    [ARG_MAX_REPORT_SIZE]: 0, // Default to 1 MB
    [ARG_BANK_NUM]: 1,
    [ARG_REFRESH]: false,
    [ARG_CLEAN]: true,
    [ARG_KERIA_START_PORT]: 20000, //TODO once prepareClient in vlei-verifiers-workflow is updated, this could be 20000
    [ARG_WITNESS_HOST]: 'localhost',
    [ARG_KERIA_HOST]: 'localhost',
    [ARG_KERIA_DOMAIN]: 'localhost',
  },
  "--": true,
  unknown: (arg) => {
    console.info(`Unknown run-workflow-bank argument, Skipping: ${arg}`);
    // throw new Error(`Unknown argument: ${arg}`);
    return false;
  },
});

console.log("Parsed arguments:", {
  [ARG_MAX_REPORT_SIZE]: args[ARG_MAX_REPORT_SIZE],
  [ARG_BANK_NUM]: args[ARG_BANK_NUM],
  [ARG_REFRESH]: args[ARG_REFRESH],
  [ARG_CLEAN]: args[ARG_CLEAN],
});

const maxReportMbArg = parseInt(args[ARG_MAX_REPORT_SIZE], 10);
const maxReportMb = !isNaN(maxReportMbArg) ? maxReportMbArg : 1; // 1 MB
const bankNum = parseInt(args[ARG_BANK_NUM], 10) || 0;
const bankImage = `ronakseth96/keria:TestBank_${bankNum}`;
const bankName = "Bank_" + bankNum;
const bankContainer = `${bankName}_keria`.toLowerCase();
const offset = 10 * (bankNum - 1);
const refresh = args[ARG_REFRESH] ? args[ARG_REFRESH] === "false" : true;
const clean = args[ARG_CLEAN] === "false";
testPaths = TestPaths.getInstance(bankName);
const BASE_PORT = parseInt(args[ARG_KERIA_START_PORT], 10) || 20000;

const keriaInstanceNames: string[] = [];

// set test data for workflow
testPaths.testUserName = bankName;
testPaths.testUserNum = bankNum;
testPaths.maxReportMb = maxReportMb;
testPaths.refreshTestData = refresh;

console.log(
  "bankNum:",
  bankNum,
  "bankImage:",
  bankImage,
  "bankContainer:",
  bankContainer,
  "bankName:",
  bankName,
  "offset:",
  offset,
  "maxReportMb:",
  maxReportMb,
  "refresh:",
  refresh,
  "clean:",
  clean,
);

beforeAll(async () => {
  try {
    testPaths = TestPaths.getInstance();

    const dockerStarted = await startDockerServices(
      testPaths.dockerComposeFile
    );
    if (dockerStarted) {
      // Initialize all Keria instances upfront
      await Promise.all(
        Object.values(TEST_CONTEXTS).map(async (contextId, index) => {
          const keriaInstanceName = `${contextId}-${bankName}`;
          try {
            console.log(
              `Initializing Keria instance for context: ${keriaInstanceName}`
            );

            const keriaInstance = await TestKeria.getInstance(
              keriaInstanceName,
              testPaths,
              args[ARG_KERIA_DOMAIN],
              args[ARG_KERIA_HOST],
              args[ARG_WITNESS_HOST],
              BASE_PORT,
              bankNum,
              `ronakseth96/keria:TestBank_${bankNum}`,
              'linux/arm64',
            );
            keriaInstanceNames.push(keriaInstanceName);
            console.log(
              `Successfully initialized Keria instance for context: ${keriaInstanceName}`
            );
          } catch (error) {
            console.error(
              `Failed to initialize Keria instance for context ${keriaInstanceName}:`,
              error
            );
            throw error;
          }
        })
      );
    }
  } catch (error) {
    console.error('Error in beforeAll:', error);
    throw error;
  }
}, 60000);

afterAll(async () => {
  console.log('Running run-workflow test cleanup...');
  await TestKeria.cleanupInstances(keriaInstanceNames);
  // if (TestKeria.instances.size <= 0) {
  //   await stopDockerCompose(testPaths.dockerComposeFile);
  // }
}, 60000);

test("reg-api-bank-test-workflow", async function run() {
  console.log(`Running api-verifier-bank-test-workflow for bank: ${bankName}`);
  const keriaInstance = await TestKeria.getInstance("reg-api-bank-test-workflow")
  env = TestEnvironment.getInstance("docker", keriaInstance);

  await downloadConfigWorkflowReports(bankName, true, false, false, refresh);
  // await generateBankConfig(bankNum);
  configJson = await getConfig(testPaths.testUserConfigFile);
  configJson['context'] = `api-verifier-bank-test-workflow`

  const workflowPath = path.join(
    testPaths.workflowsDir,
    "bank-api-verifier-test-workflow.yaml",
  );
  const workflow = loadWorkflow(workflowPath);

  if (workflow && configJson) {
    const wr = new WorkflowRunner(workflow, configJson, configJson['context']);
    wr.registerRunner("generate_report", new GenerateReportStepRunner());
    wr.registerRunner("api_test", new ApiTestStepRunner());
    wr.registerRunner("sign_report", new SignReportStepRunner());
    const workflowRunResult = await wr.runWorkflow();
    assert.equal(workflowRunResult, true);
  }
}, 3600000);

test("eba-verifier-prep-only", async function run() {
  console.warn(
    "eba-verifier-prep-only is not a real test but allows for the preparation of the EBA verifier test",
  );
  await downloadConfigWorkflowReports(bankName, false, false, false, refresh);
  // await generateBankConfig(bankNum);
  configJson = await getConfig(testPaths.testUserConfigFile);
});

test("eba-bank-test-workflow", async function run() {
  console.log(`Running eba-verifier-bank-test-workflow for bank: ${bankName}`);
  const keriaInstance = await TestKeria.getInstance(`${TEST_CONTEXTS.EBA_TEST}-${bankName}`)
  env = TestEnvironment.getInstance("eba_bank_test", keriaInstance);

  await downloadConfigWorkflowReports(bankName, false, false, false, refresh);
  // await generateBankConfig(bankNum);
  configJson = await getConfig(testPaths.testUserConfigFile);
  configJson['context'] = TEST_CONTEXTS.EBA_TEST

  const workflowPath = path.join(
    testPaths.workflowsDir,
    "eba-verifier-test-workflow.yaml",
  );
  const workflow = loadWorkflow(workflowPath);

  if (workflow && configJson) {
    const wr = new WorkflowRunner(workflow, configJson, configJson['context']);
    wr.registerRunner("generate_report", new GenerateReportStepRunner());
    wr.registerRunner("api_test", new ApiTestStepRunner());
    wr.registerRunner("sign_report", new SignReportStepRunner());
    const workflowRunResult = await wr.runWorkflow();
    assert.equal(workflowRunResult, true);
  }
}, 3600000);

test("vlei-issuance-reports-bank-test-workflow", async function run() {
  console.log(
    `Running vlei-issuance-reports-bank-test-workflow for bank: ${bankName}`,
  );
  process.env.REPORT_TYPES = SIMPLE_TYPE;

  env = TestEnvironment.getInstance("docker", await TestKeria.getInstance("issuance-bank-test-workflow"));
  await downloadConfigWorkflowReports(bankName, true, false, false, refresh);

  // await generateBankConfig(bankNum);
  configJson = await getConfig(testPaths.testUserConfigFile);
  configJson['context'] = `vlei-issuance-reports-bank-test-workflow`

  console.log(
    `Running vlei issuance and reports generation test for bank: ${bankName}`,
  );
  const bankDirPath = testPaths.testUserDir;

// Load a specific workflow
const workflow = loadPackagedWorkflow('singlesig-single-user-light');

await TestKeria.getInstance(configJson['context'],
  testPaths,
  "localhost",
  "localhost",
  "localhost",
  20000,
  4,
);

  if (workflow && configJson) {
    const wr = new WorkflowRunner(workflow, configJson, configJson.context)
    wr.registerRunner("generate_report", new GenerateReportStepRunner());
    wr.registerRunner("api_test", new ApiTestStepRunner());
    wr.registerRunner(
      "vlei_verification_test",
      new VleiVerificationTestStepRunner(),
    );
    const workflowRunResult = await wr.runWorkflow();
    assert.equal(workflowRunResult, true);
  }
}, 3600000);
