import { SignifyClient } from "signify-ts";
import FormData from "form-data";
import path from "path";

export class ApiAdapter {
  apiBaseUrl: string;
  filerBaseUrl: string = "";
  constructor(apiBaseUrl: string, filerBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
    if (!filerBaseUrl || filerBaseUrl === "") {
      console.log(
        `Filer base URL not provided. Using API base URL: ${apiBaseUrl}`,
      );
      this.filerBaseUrl = apiBaseUrl;
    } else {
      console.log(`Filer base URL provided ${filerBaseUrl}`);
      this.filerBaseUrl = filerBaseUrl;
    }
  }

  public async dropReportStatusByAid(
    aidName: string,
    aidPrefix: string,
    client: SignifyClient,
  ): Promise<Response> {
    const heads = new Headers();
    const dreq = { headers: heads, method: "POST", body: null };
    const durl = `${this.apiBaseUrl}/status/${aidPrefix}/drop`;
    let sdreq = await client.createSignedRequest(aidName, durl, dreq);
    const sresp = await fetch(durl, sdreq);
    return sresp;
  }

  public async getReportStatusByAid(
    aidName: string,
    aidPrefix: string,
    client: SignifyClient,
  ): Promise<Response> {
    const heads = new Headers();
    const sreq = { headers: heads, method: "GET", body: null };
    const surl = `${this.apiBaseUrl}/status/${aidPrefix}`;
    let shreq = await client.createSignedRequest(aidName, surl, sreq);
    const sresp = await fetch(surl, shreq);
    return sresp;
  }

  public async getReportsStatusAdmin(
    aidName: string,
    aidPrefix: string,
    client: SignifyClient,
  ): Promise<Response> {
    const heads = new Headers();
    const sreq = { headers: heads, method: "GET", body: null };
    const surl = `${this.apiBaseUrl}/admin/upload_statuses/${aidPrefix}`;
    let shreq = await client.createSignedRequest(aidName, surl, sreq);
    const sresp = await fetch(surl, shreq);
    return sresp;
  }

  public async getReportStatusByDig(
    aidName: string,
    aidPrefix: string,
    dig: string,
    client: SignifyClient,
  ): Promise<Response> {
    const heads = new Headers();
    const sreq = { headers: heads, method: "GET", body: null };
    const surl = `${this.apiBaseUrl}/upload/${aidPrefix}/${dig}`;
    let shreq = await client.createSignedRequest(aidName, surl, sreq);
    const sresp = await fetch(surl, shreq);
    return sresp;
  }

  public async getLeiReportStatusesByAid(
    aidName: string,
    aidPrefix: string,
    client: SignifyClient,
  ): Promise<Response> {
    const heads = new Headers();
    const sreq = { headers: heads, method: "GET", body: null };
    const surl = `${this.apiBaseUrl}/report/status/lei/${aidPrefix}`;
    let shreq = await client.createSignedRequest(aidName, surl, sreq);
    const sresp = await fetch(surl, shreq);
    return sresp;
  }

  public async uploadReport(
    aidName: string,
    aidPrefix: string,
    fileName: string,
    zipBuffer: Buffer,
    zipDigest: string,
    client: SignifyClient,
  ): Promise<Response> {
    let formData = new FormData();
    let ctype = "application/zip";
    formData.append("upload", zipBuffer, {
      filename: `${fileName}`,
      contentType: `${ctype}`,
    });
    let formBuffer = formData.getBuffer();
    let req: RequestInit = {
      method: "POST",
      body: formBuffer,
      headers: {
        ...formData.getHeaders(),
        "Content-Length": formBuffer.length.toString(),
      },
    };
    const url = `${this.apiBaseUrl}/upload/${aidPrefix}/${zipDigest}`;

    let sreq = await client.createSignedRequest(aidName, url, req);
    const resp = await fetch(url, sreq);
    return resp;
  }

  public hasGLEIFWithMultisig(data: any): boolean {
    return data.users.some(
      (user: any) =>
        (user.type === "GLEIF" || user.type === "GLEIF_EXTERNAL") &&
        user.identifiers.some((id: any) => data.identifiers[id]?.identifiers),
    );
  }

  public async ebaUploadReport(
    aidName: string,
    fileName: string,
    zipBuffer: Buffer,
    client: SignifyClient,
    token: string,
  ): Promise<Response> {
    let formData = new FormData();
    let ctype = "application/zip";
    console.log(
      `Uploading EBA report ${fileName} for user ${aidName} of size: ${zipBuffer.length}`,
    );
    formData.append("file", zipBuffer, {
      filename: `${fileName}`,
      contentType: `${ctype}`,
    });
    let formBuffer = formData.getBuffer();
    let req: RequestInit = {
      method: "POST",
      body: formBuffer,

      headers: {
        ...formData.getHeaders(),
        "errp-load-test": "74b63b0fd729",
        Authorization: `Bearer ${token}`,
        uiversion: "1.3.10-484-FINAL-master",
        "sec-ch-ua-platform": "macOS",
        "sec-ch-ua":
          '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "x-file-id": `${fileName}-1734640154691`,
        "x-start-byte": "0",
        size: `${zipBuffer.length}`,
        "sec-ch-ua-mobile": "?0",
        Expires: "Sat, 01 Jan 2000 00:00:00 GMT",
        Accept: "application/json, text/plain, */*",
        // "Content-Type":"multipart/form-data; boundary=----WebKitFormBoundaryVzABPbBM8BjT0uAU",
        // signature-input:signify=("@method" "@path" "signify-resource" "signify-timestamp");created=1734638631;keyid="BFrHXYqOUZbwTZ1REvFllhJYzczzyKEZpVX0w6C5c28T";alg="ed25519"
        // 'Directory':'237932ALYUME7DQDC2D7.CON',
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        name: `${path.basename(fileName)}`,
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
        // 'host':'errp.test.eba.europa.eu'
      },
    };
    // const url = `https://errp.test.eba.europa.eu/api/upload`;
    const url = `${this.filerBaseUrl}/upload`;

    // const reqJsonString = JSON.stringify(req);
    // const last500Chars = reqJsonString.slice(-500);
    // console.log(`EBA upload URL: ${url} and last 500 chars of req: ${last500Chars}`);

    let sreq = await client.createSignedRequest(aidName, url, req);
    // const sreqBod = await sreq.text();
    const startUpload = new Date().getTime();
    const resp = await fetch(url, sreq);
    const endUpload = new Date().getTime();
    console.log(
      `EBA upload response for ${fileName} in ${
        endUpload - startUpload
      } ms: ${resp.status}`,
    );
    return resp;
  }
}
