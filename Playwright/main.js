import { chromium } from "playwright";
import * as getNewsData from "./getAllNewsData.js";

import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";

const dataSource = {
  dataID: "",
  page: "",
  data: "",
  outputFilename: "",
  outputFolder: "./output",
  browser: "",
  databasePath: "F:\\Ford_Analysis\\ford-news-source.db",
  selector: {
    title: "",
    keyword: "",
    description: "",
    summary: "",
    content: "",
  },
};

const fileInfo = {
  folder: "G:\\html\\",
  filename: "",
};

const checkFileExist = (fileInfo) => {
  const filePath = path.join(fileInfo.folder, fileInfo.filename);
  return fs.existsSync(filePath);
};

// 工作腳本資料取得
const getData = async () => {
  // SQL 資料連結
  const db = new sqlite3.Database(dataSource.databasePath);

  try {
    // SQL 讀取必要工作資料
    const query = `
      SELECT DATA.DATA_ID, DATA.REAL_URL, DATA_SOURCE.SOURCE_ID, DATA_SOURCE.SOURCE_URL2, DATA_SOURCE.SOURCE_HTML_KEYWORDS, DATA_SOURCE.SOURCE_HTML_DESCRIPTION, DATA_SOURCE.SOURCE_HTML_SUMMARY, DATA_SOURCE.SOURCE_HTML_CONTENT
      FROM DATA
      INNER JOIN DATA_SOURCE ON DATA.SOURCE_ID = DATA_SOURCE.SOURCE_ID
      WHERE DATA.REAL_URL IS NOT NULL AND DATA_SOURCE.SOURCE_URL2 IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM DATA_NEWS
        WHERE DATA_NEWS.DATA_ID = DATA.DATA_ID
    )
    `;
    const rows = await new Promise((resolve, reject) => {
      db.all(query, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    // 回傳工作資料
    return rows;
  } catch (err) {
    console.error("Error querying database:", err);
    return [];
  } finally {
    // 關閉連接
    db.close();
  }
};

// 依任務執行Function
function doFn(fnName, data) {
  console.log(`Start process [${fnName}]`);
  return getNewsData[fnName](data);
}

// 組織資料處理
const dataProcess = async (row, browser) => {
  try {
    // 確認檔案是否存在，若存在則使用實體檔案
    fileInfo.filename = row.DATA_ID + ".html";

    // 基本資料設定
    dataSource.dataID = row.DATA_ID;
    dataSource.page = row.REAL_URL;
    console.log(dataSource.page);
    dataSource.outputFilename = row.DATA_ID + ".txt";
    dataSource.browser = browser;

    // DOM 選擇器
    dataSource.selector = {
      title: "title",
      keyword: row.SOURCE_HTML_KEYWORDS,
      description: row.SOURCE_HTML_DESCRIPTION,
      summary: row.SOURCE_HTML_SUMMARY,
      content: row.SOURCE_HTML_CONTENT,
    };

    await doFn("fn_" + row.SOURCE_URL2, dataSource);
  } catch (err) {
    console.error("Error:", err);
  }
};

// 主程式
const main = async () => {
  try {
    // 讀出工作腳本
    const data = await getData();

    // 啟動瀏覽器 (該方法較可無視不同網頁的防爬蟲機制)
    const browser = await chromium.launch({ headless: false });

    // 讀取指令行執行
    for (const row of data) {
      await dataProcess(row, browser);
    }

    // 抓取完畢
    await browser.close();
  } catch (err) {
    console.error("Error:", err);
  }
};

// 啟動主程式
main();
