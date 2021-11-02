"use strict";

const axios = require("axios").default;
const fs = require("fs");

class HttpClient {
  /**
   * @param {Options} options
   */
  constructor(options) {
    this.options = options;
  }

  async getJson(url) {
    const res = await axios(url, this.getHttpOptions());
    return res.data;
  }

  /**
   * Downloads the given file at url into savePath.
   *
   */
  async downloadFile(url, savePath) {
    const res = await axios({
      ...this.getHttpOptions(),
      method: "get",
      url,
      responseType: "stream",
    });
    return new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(savePath);
      res.data.pipe(fileStream);

      const handleError = async (err) => {
        const stat = await fs.promises.stat(savePath);
        if (stat.isFile) {
          await fs.promises.unlink(savePath);
        }
        reject(err);
      };

      res.data.on("error", handleError);

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
