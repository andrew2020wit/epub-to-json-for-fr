import EPub from 'epub';
import {convert} from "html-to-text";
import fs from 'node:fs';
import {textSplitSeparators} from "./const/text-split-separators.const.mjs";
import {createDocx} from "./create-docx-to-translate.mjs";
import {translateJsonBook} from "./translate.mjs";

const createDocxToTranslate = true;

const translate = true;
const translateFromLang = 'en';
const translateToLang = 'ru';

const skipAllEmptyParagraphs = false;
const skipFirstEmptyParagraph = true;
const skipSecondEmptyParagraph = false;
const skipThirdEmptyParagraph = false;

const epubFolder = './epub-files';

const convertHtmlToTextOption = {
    wordwrap: false,
    preserveNewlines: false
};

await convertEpubFilesToJsonFile(epubFolder);

async function convertEpubFilesToJsonFile(epubFolder) {
    const dirContent = fs.readdirSync(epubFolder);
    const fileNames = dirContent
        .filter(name => name.slice(-5) === '.epub');

    for (const fileName of fileNames) {
        await convertEpubFileToJsonFile(fileName);
    }
}

async function convertEpubFileToJsonFile(fileName) {
    const epub = new EPub(epubFolder + '/' + fileName);
    const fileNameWithoutExtension = fileName.slice(0, -5);

    await new Promise((resolve, reject) => {
        epub.on('end', () => resolve());
        epub.on('error', (err) => {
            console.error(err);
            reject(err);
        });
        epub.parse();
    });

    const extendedName = epub.metadata.creator + ' - ' + epub.metadata.title;

    const jsonBook = {
        id: Date.now(),
        title: extendedName,
        description: convertHtmlToText(epub.metadata.description),
    };

    const bookContent = [];
    const bookHeaders = [];


    for (const chapter of epub.flow) {
        const chapterHtml = await new Promise((resolve, reject) => {
            epub.getChapter(chapter.id, (err, chapterText) => {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve(chapterText);
                }
            });
        });

        makeContentItem(chapter, chapterHtml, bookContent, bookHeaders)
    }

    jsonBook.content = bookContent;
    jsonBook.headers = bookHeaders;

    if (translate) {
       await translateJsonBook(jsonBook, translateFromLang, translateToLang, epubFolder);
    }

    fs.writeFileSync(epubFolder + '/' + fileNameWithoutExtension + '.json', JSON.stringify({
        jsonContentDescription: "ForeignReaderBook",
        book: jsonBook
    }, null, 2));

    if (createDocxToTranslate) {
        createDocx(jsonBook, epubFolder, fileNameWithoutExtension);
    }
}

function convertHtmlToText(html) {
    return convert(html, convertHtmlToTextOption);
}

function makeContentItem(chapter, chapterHtml, bookContent, bookHeaders) {
    const chapterText = convertHtmlToText(chapterHtml);

    const lastContentIndex = bookContent.length - 1;

    const notFilteredTextArr = chapterText
        .split('\n')
        .map((x) => x.trim());

    const textArr = notFilteredTextArr
        .filter((item, index) => {
            if (!!item) {
                return true;
            }

            if (skipAllEmptyParagraphs) {
                return false;
            }

            if (skipThirdEmptyParagraph
                && !notFilteredTextArr[index - 1]
                && !notFilteredTextArr[index - 2]
                && !!notFilteredTextArr[index - 3]
            ) {
                return false;
            }

            if (skipSecondEmptyParagraph
                && !notFilteredTextArr[index - 1]
                && !!notFilteredTextArr[index - 2]
            ) {
                return false;
            }

            if (skipFirstEmptyParagraph
                && !!notFilteredTextArr[index - 1]
            ) {
                return false;
            }

            return true;
        })

    const paragraphContent = textArr.map((item, index) => {
        let text = item;

        textSplitSeparators.forEach(separator => {
            text = text.replaceAll(separator, separator + '\n');
        });

        const phrases = text.split('\n').map(x => x.trim()).filter(x => !!x);

        return {
            id: lastContentIndex + 1 + index,
            text: phrases
        }
    })

    const headerIndex = lastContentIndex + 1;
    const headerTitle = '[' + (chapter.level || 0) + '] ' + (chapter.order) + ': ' + chapter.title;

    bookContent.push(...paragraphContent);

    if (chapter.order) {
        bookHeaders.push({
            id: headerIndex,
            text: headerTitle
        });
    }
}
