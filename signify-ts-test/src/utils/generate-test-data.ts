const testDataDir = "test_data";
const fs = require("fs");
const path = require("path");

export async function buildTestData(
  testData: EcrTestData,
  testName: string,
): Promise<string> {
  let testDataDirPrefixed = path.join(
    __dirname,
    "../../test",
    "data",
    testDataDir,
    testName,
  );
  if (!fs.existsSync(testDataDirPrefixed)) {
    fs.mkdirSync(testDataDirPrefixed);
  }
  const testDataJson = JSON.stringify(testData);
  const fileName = `${testData.lei}_${testData.aid}_${testData.engagementContextRole}.json`;
  await fs.writeFile(
    `${testDataDirPrefixed}/${fileName}`,
    testDataJson,
    "utf8",
    (err: Error) => {
      if (err) throw err;
    },
  );
  return testDataDirPrefixed;
}

export interface EcrTestData {
  aid: string;
  credential: any;
  lei: string;
  engagementContextRole: string;
}
