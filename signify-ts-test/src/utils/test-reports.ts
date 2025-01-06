import AdmZip from "adm-zip";
import axios from "axios";
import fs from "fs";
import path from "path";

const bankReportsUrl =
  "https://raw.githubusercontent.com/aydarng/bank_reports/main";

export const TEST_BANK_DATA = `600-banks-test-data`;
export const TMP_REPORTS_PATH = path.join(process.cwd(),"test/data/tmp_reports");

export async function downloadFileFromUrl(url: string, destFilePath: string) {
  const filePath = destFilePath;

  const response = await axios.get(url, {
    responseType: "stream",
  });
  if (!fs.existsSync(TMP_REPORTS_PATH)) {
    fs.mkdirSync(TMP_REPORTS_PATH);
  }
  const writer = fs.createWriteStream(filePath);

  return new Promise<void>((resolve, reject) => {
    response.data.pipe(writer);

    writer.on("finish", () => {
      writer.close();
      resolve();
    });

    writer.on("error", (err: any) => {
      writer.destroy();
      reject(err);
    });
  });
}

export async function downloadReports(
  bankNum: number, dataDir: string
) {
  // You need to set the BANK_NAME environment variable. Ex.: export BANK_NAME=Bank_2.
  const bankName = process.env.BANK_NAME || "Bank_" + bankNum;
  const curBankReportsUrl = `${bankReportsUrl}/${bankName}.zip`;
  const destFilePath = `${TMP_REPORTS_PATH}/${bankName}.zip`;
  await downloadFileFromUrl(curBankReportsUrl, destFilePath);

  const includeFailReports = process.env.INCLUDE_FAIL_REPORTS || "false";
  const doFailReps = includeFailReports?.toLowerCase() === "true";
  const includeAllSignedReports =
    process.env.INCLUDE_ALL_SIGNED_REPORTS || "false";
  const doAllSigned = includeAllSignedReports?.toLowerCase() === "true";

  unpackZipFile(
    destFilePath,
    dataDir,
    bankName,
    doAllSigned,
    doFailReps
  );
}

export function unpackZipFile(
  zipFilePath: string,
  dataDir: string,
  bankName: string,
  includeAllSignedReports = false,
  includeFailReports = false
) {
  const zip = new AdmZip(zipFilePath);
  const destFolder = `${dataDir}/tmp_reports_unpacked`;
  zip.extractAllTo(destFolder, false); // if true overwrites existing files
  const signedReportsPath = `${dataDir}/signed_reports`
  const failReportsPath = `${dataDir}/fail_reports`
  const confPath = `${dataDir}/${TEST_BANK_DATA}`

  if (!includeAllSignedReports) {
    const specificPrefix = "external_manifest";
    console.log(`Only moving reports with specific prefix: ${specificPrefix}`);
    moveReports(
      path.join(destFolder, bankName, `/reports/signed_reports`),
      signedReportsPath,
      specificPrefix
    );
  } else {
    console.log(`Moving all signed reports`);
    moveReports(
      path.join(destFolder, bankName, `/reports/signed_reports`),
      signedReportsPath
    );
  }
  if (includeFailReports) {
    moveReports(
      path.join(destFolder, bankName, `/reports/fail_reports`),
      failReportsPath
    );
  }
  moveFiles(path.join(destFolder, bankName), path.join(confPath, bankName));
}

const moveReports = (
  srcDir: string,
  destDir: string,
  specificPrefix?: string
) => {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const items = fs.readdirSync(srcDir);
  for (const item of items) {
    if (specificPrefix) {
      const aidPath = path.join(srcDir, item);
      const aidReps = fs.readdirSync(aidPath);
      for (const rep of aidReps) {
        if (rep.startsWith(specificPrefix)) {
          const srcPath = path.join(aidPath, rep);
          const destPath = path.join(destDir, item, rep);
          fs.cpSync(srcPath, destPath, { recursive: true });
          console.log(`Moved specific report: ${srcPath} to ${destPath}`);
          break;
        }
      }
    } else {
      const srcPath = path.join(srcDir, item);
      const destPath = path.join(destDir, item);
      fs.cpSync(srcPath, destPath, { recursive: true });
      console.log(`Moved report folder: ${srcPath} to ${destPath}`);
    }
  }
};

const moveFiles = (srcDir: string, destDir: string) => {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    console.log(`Created folder: ${destDir}`);
  }
  const items = fs.readdirSync(srcDir);
  items.forEach((item: any) => {
    const srcPath = path.join(srcDir, item);
    const destPath = path.join(destDir, item);
    if (fs.lstatSync(srcPath).isFile()) {
      fs.cpSync(srcPath, destPath);
      console.log(`Moved file: ${srcPath} to ${destPath}`);
    }
  });
};
