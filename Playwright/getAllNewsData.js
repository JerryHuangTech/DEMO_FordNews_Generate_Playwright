// Snippet Start:Header
import he from "he";
import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import moment from 'moment';
// 判斷輸入是否為 URL
const isURL = (input) => {
    const pattern = /^https?:\/\//i;
    return pattern.test(input);
};
// 判斷 HTML 是否有效
const isHTMLValid = (html) => {
    const regex = /<([a-z][a-z0-9]*)\b[^>]*>(.*?)<\/\1>/i;
    return regex.test(html);
};
// 確保抓取目標存在
const checkElementExist = async (page, selector) => {
    try {
        await page.waitForSelector(selector, {
            state: "attached"
        });
        return true;
    } catch (error) {
        return false;
    }
};
// 清除 HTML 標籤
const cleanHTMLTags = (text) => {
    return he
        .decode(text)
        .replaceAll(/<\/?[^>]+(>|$)/g, "")
        .replaceAll(/\n+/g, "\n")
        .trim();
};
// 寫入文件
const save2Txt = (data) => {
    // 構建數據字符串
    const text_data = `DATA ID:\n${data.dataID}\n\nTitle:\n${data.title}\n\nKeywords:\n${data.keywords}\n\nDescription:\n${data.description}\n\nSummary:\n${data.summary}\n\nContent:\n${data.content}`;
    // 寫入數據到文件
    const outputPath = path.join(data.outputFolder, data.outputFilename);
    fs.writeFileSync(outputPath, text_data, "utf-8");
    console.log(`Data has been written to the file ${outputPath}`);
};
// 寫入資料庫
const writeToDatabase = (data, databasePath) => {
    // 提取需要的資料
    const {
        dataID,
        title,
        keywords,
        description,
        summary,
        content
    } = data;
    // 連接到資料庫
    const db = new sqlite3.Database(databasePath);
    // 取得當前時間
    const currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
    try {
        // 檢查是否已存在該 dataID 的資料
        const query = `SELECT * FROM DATA_NEWS WHERE DATA_ID = ?`;
        db.get(query, [dataID], (err, row) => {
            if (err) {
                console.error("Error querying database:", err);
                return;
            }
            if (row) {
                // 如果已存在該 dataID 的資料，執行 UPDATE 語句
                const updateQuery = `
UPDATE DATA_NEWS
SET NEWS_TITLE = ?,
NEWS_KEYWORDS = ?,
NEWS_DESCRIPTION = ?,
NEWS_SUMMARY = ?,
NEWS_CONTENT = ?,
DATE = ?
WHERE DATA_ID = ?`;
                db.run(
                    updateQuery,
                    [title, keywords, description, summary, content, currentDate, dataID],
                    (err) => {
                        if (err) {
                            console.error("Error updating database:", err);
                        } else {
                            console.log("Data updated successfully");
                        }
                    }
                );
            } else {
                // 如果不存在該 dataID 的資料，執行 INSERT 語句
                const insertQuery = `
INSERT INTO DATA_NEWS (DATA_ID, NEWS_TITLE, NEWS_KEYWORDS, NEWS_DESCRIPTION, NEWS_SUMMARY, NEWS_CONTENT, DATE)
VALUES (?, ?, ?, ?, ?, ?, ?)`;
                db.run(
                    insertQuery,
                    [dataID, title, keywords, description, summary, content, currentDate],
                    (err) => {
                        if (err) {
                            console.error("Error inserting into database:", err);
                        } else {
                            console.log("Data inserted successfully");
                        }
                    }
                );
            }
        });
    } catch (err) {
        console.error("Error:", err);
    } finally {
        // 關閉資料庫連接
        db.close();
    }
};
// Snippet End:Header
// Snippet Start:Body
export const fn_WwwTaipeitimesCom = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwMobile01Com = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取关键字
        const keywords = (await checkElementExist(page, data.selector.keywords)) ? await page.$$eval(data.selector.keywords, elements => elements.map(element => element.textContent.trim().replace(/^#/, '')).join(', ')) : '';

        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_NewsPchomeComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_MoneyUdnCom = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = (await checkElementExist(page, data.selector.summary)) ?
            await page.$eval(
                data.selector.summary,
                (element) => element.textContent
            ) :
            "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwMsnCom = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = "";
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_CnWsjCom = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = (await checkElementExist(page, data.selector.summary)) ?
            await page.$eval(
                data.selector.summary,
                (element) => element.textContent
            ) :
            "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwAutonetComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取内容
        const content = await page.$eval('#newsContent', newsContent => {
            // 在 #newsContent 元素下查找所有文本内容
            const textContent = Array.from(newsContent.querySelectorAll('tr > td > table')).map(table => table.textContent.trim()).join('\n');

            // 返回清理后的内容
            return textContent;
        });
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_DigimobeeComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwSupermoto8Com = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_TalkLtnComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_CarfuroshaCom = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_AutosUdnCom = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwMotoruncleNet = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_Www7carTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取关键字
        const keywords = (await checkElementExist(page, data.selector.keywords)) ? await page.$$eval(data.selector.keywords, elements => elements.map(element => element.textContent.trim().replace(/^#/, '')).join(', ')) : '';

        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = (await checkElementExist(page, data.selector.summary)) ?
            await page.$eval(
                data.selector.summary,
                (element) => element.textContent
            ) :
            "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwSetnCom = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_SpeedEttodayNet = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwPlaycarOrg = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, elements.map((element) => element.textContent).join(', ')
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwYoutubeCom = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = "";
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_TodayLineMe = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_GarageSicarComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_Car2dudeCom = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_NewsCnyesCom = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwTopgeartwCom = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_TwNewsYahooCom = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwCvnComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwKingautosNet = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取内容
        const content = await page.$eval('div.article_content', element => {
            const paragraphs = Array.from(element.querySelectorAll('p'));
            let contentText = '';
            let exclude = false;

            for (const p of paragraphs) {
                if (p.innerHTML.includes('<strong>編輯精選</strong>')) {
                    exclude = true;
                    break;
                }

                if (!exclude) {
                    const paragraphText = p.textContent.trim();
                    contentText += paragraphText + '\n';
                }
            }

            return contentText;
        });
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_CarfunTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwMsnCom2 = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = "";
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwCartureComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = (await checkElementExist(page, data.selector.summary)) ?
            await page.$eval(
                data.selector.summary,
                (element) => element.textContent
            ) :
            "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwCarnewsCom = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_TwNextappleCom = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_MotormagComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = (await checkElementExist(page, data.selector.summary)) ?
            await page.$eval(
                data.selector.summary,
                (element) => element.textContent
            ) :
            "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwNownewsCom = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取Content
        const content = await page.$eval('article[itemprop="articleBody"]', element => element.textContent.trim().replace(/\n+/g, '\n'));

        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_AutoLtnComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwLiancarCom = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwFacebookCom = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = "";
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwDigitimesComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwCarvideoComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_NYamCom = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取关键字
        const keywords = (await checkElementExist(page, data.selector.keywords)) ? await page.$$eval(data.selector.keywords, elements => elements.map(element => element.textContent.trim().replace(/^#/, '')).join(', ')) : '';

        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwTaiwannewsComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取内容
        const content = await page.$eval('article.container-fluid.article', article => {
            // 获取文章正文元素
            const body = article.querySelector('div[itemprop="articleBody"]');

            // 获取所有段落元素
            const paragraphs = Array.from(body.querySelectorAll('p'));

            // 清理段落内的多余换行
            const cleanedParagraphs = paragraphs.map(p => p.textContent.trim().replace(/\n+/g, '\n'));

            // 拼接段落文本
            return cleanedParagraphs.join('\n');
        });
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwMirrormediaMg = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = (await checkElementExist(page, data.selector.summary)) ?
            await page.$eval(
                data.selector.summary,
                (element) => element.textContent
            ) :
            "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_C8891ComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = (await checkElementExist(page, data.selector.summary)) ?
            await page.$eval(
                data.selector.summary,
                (element) => element.textContent
            ) :
            "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwCnaComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取关键字
        const keywords = (await checkElementExist(page, data.selector.keywords)) ? await page.$$eval(data.selector.keywords, elements => elements.map(element => element.textContent.trim().replace(/^#/, '')).join(', ')) : '';

        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwTopcarTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = (await checkElementExist(page, data.selector.summary)) ?
            await page.$eval(
                data.selector.summary,
                (element) => element.textContent
            ) :
            "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwBuycartvCom = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwFindcarComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwMoto7Net = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_IncarTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取關鍵字
        const keywords = (await checkElementExist(page, data.selector.keywords)) ?
            await page.$$eval(data.selector.keywords, (elements) =>
                elements.map((element) => element.getAttribute('content')).join(',')
            ) :
            '';
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_UdnCom = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwCarexpertComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwCarstuffComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = (await checkElementExist(page, data.selector.summary)) ?
            await page.$eval(
                data.selector.summary,
                (element) => element.textContent
            ) :
            "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_AutosChinatimesCom = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwChinatimesCom = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = (await checkElementExist(page, data.selector.summary)) ?
            await page.$eval(
                data.selector.summary,
                (element) => element.textContent
            ) :
            "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwTcarTv = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwEttodayNet = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_CteeComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取内容
        const content = await page.$eval('article > div.entry-content.clearfix.single-post-content', element => {
            const paragraphs = Array.from(element.querySelectorAll('p'));
            const contentText = paragraphs.map(p => p.textContent.trim()).join('\n');

            return contentText;
        });
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_AutosYahooComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwGochoiceComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_2gamesomeComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = (await checkElementExist(page, data.selector.summary)) ?
            await page.$eval(
                data.selector.summary,
                (element) => element.textContent
            ) :
            "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_NewsUcarComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwTwmotorComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwCarimageComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_WwwAutoonlineComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = (await checkElementExist(page, data.selector.keyword)) ?
            await page.$eval(data.selector.keyword, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = (await checkElementExist(page, data.selector.summary)) ?
            await page.$eval(
                data.selector.summary,
                (element) => element.textContent
            ) :
            "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_ForumJorsindoCom = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Body
export const fn_CarsTvbsComTw = async (data) => {
    const context = await data.browser.newContext();
    const page = await context.newPage();
    try {
        // 確認 Playwrite 執行方法
        if (isURL(data.page)) {
            // 如果輸入為 URL，使用 Playwright 前往網頁並獲取 HTML 內容
            await page.goto(data.page);
        } else if (fs.existsSync(data.page)) {
            const html = fs.readFileSync(data.page, "utf-8");
            await page.setContent(html);
        } else {
            console.error(`input error: ${data.page}`);
            await page.close();
            return;
        }
        // 確認傳入的 HTML 是否正常
        if (!isHTMLValid(await page.content())) {
            console.error("Invalid HTML input");
            await page.close();
            return;
        }
        // 抓取標題
        const title = (await checkElementExist(page, data.selector.title)) ?
            await page.$eval(data.selector.title, (element) => element.textContent) :
            "";
        // Snippet Start:Dynamic keywords
        // 抓取描述
        const keywords = "";
        // Snippet End:Dynamic keywords
        // Snippet Start:Dynamic description
        // 抓取描述
        const description = (await checkElementExist(
                page,
                data.selector.description
            )) ?
            await page.$eval(data.selector.description, (element) =>
                element.getAttribute("content")
            ) :
            "";
        // Snippet End:Dynamic description
        // Snippet Start:Dynamic summary
        // 抓取摘要
        const summary = "";
        // Snippet End:Dynamic summary
        // Snippet Start:Dynamic content
        // 抓取內容
        const content = await page.$$eval(data.selector.content, (elements) =>
            elements.map((element) => element.innerHTML).join("\n")
        );
        // Snippet End:Dynamic content


        // 清理和格式化數據
        const cleanTitle = title.trim();
        const cleanKeywords = keywords.trim();
        const cleanDescription = cleanHTMLTags(description);
        const cleanSummary = cleanHTMLTags(summary);
        const cleanContent = cleanHTMLTags(content);
        // 組合寫入文件文字
        const process_data = {
            dataID: data.dataID,
            title: cleanTitle,
            keywords: cleanKeywords,
            description: cleanDescription,
            summary: cleanSummary,
            content: cleanContent,
            outputFolder: data.outputFolder,
            outputFilename: data.outputFilename,
        };
        save2Txt(process_data);
        writeToDatabase(process_data, data.databasePath);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (page) {
            await page.close();
        }
        if (context) {
            await context.close();
        }
    }
};
// Snippet End:Body
// Snippet Start:Footer
// Snippet End:Footer