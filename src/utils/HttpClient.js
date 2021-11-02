"use strict";

// We need this fancy way for importing node-fetch and make it work with webpack
const _importDynamic = new Function("modulePath", "return import(modulePath)");

async function fetch(...args) {
  const { default: fetch } = await _importDynamic("node-fetch");
  return fetch(...args);
}

const fs = require("fs");

class HttpClient {
  /**
   * @param {Options} options
   */
  constructor(options) {
    this.options = options;
  }

  async getJson(url) {
    const res = await fetch(url, this.getHttpOptions());

    if (res.ok) {
      return res.json();
    } else {
      throw new Error(await res.text());
    }
  }

  /**
   * Downloads the given file at url into savePath.
   *
   */
  async downloadFile(url, savePath) {
    const res = await fetch(url, this.getHttpOptions());
    return new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(savePath);
      res.body.pipe(fileStream);

      const handleError = async (err) => {
        const stat = await fs.promises.stat(savePath);
        if (stat.isFile) {
          await fs.promises.unlink(savePath);
        }
        reject(err);
      };

      res.body.on("error", handleError);

      fileStream.on("error", handleError);
      fileStream.on("finish", function () {
        resolve();
      });
    });
  }

  /**
   * @private
   * @return {object}
   */
  getHttpOptions() {
    const options = this.options.http || {};
    return {
      ...options,
      headers: {
        "User-Agent": "electron-simple-updater",
        ...options.headers,
      },
      redirect: "follow",
    };
  }
}

module.exports = HttpClient;
