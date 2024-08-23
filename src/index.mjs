import EPub from 'epub';
import {convert} from "html-to-text";
import fs from 'node:fs';
import {textSplitSeparators} from "./const/text-split-separators.const.mjs";
import * as docx from "docx";

const skipFirstEmptyParagraph = true;

const epubFolder = './epub-files';

const bookIdOpenMarker = '[[[[';
const bookIdCloseMarker = ']]]]';
const lineIdOpenMarker = '[[[';
const lineIdCloseMarker = ']]]';
const lineIdOpenMarker2 = '(((';
const lineIdCloseMarker2 = ')))';

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

    fs.writeFileSync(epubFolder + '/' + fileName + '.json', JSON.stringify({
        jsonContentDescription: "ForeignReaderBook",
        book: jsonBook
    }, null, 2));

    // docx for translation

    const docxChildren = [];

    docxChildren.push(
        new docx.Paragraph({
            children: [
                new docx.TextRun(bookIdOpenMarker + jsonBook.id + bookIdCloseMarker),
            ],
        }),
    );

    jsonBook.content.forEach((contentItem, contentItemIndex) => {
        contentItem.text.forEach((textLine, textLineIndex) => {
            const id = lineIdOpenMarker + contentItemIndex + lineIdCloseMarker + lineIdOpenMarker2 + textLineIndex + lineIdCloseMarker2;

            docxChildren.push(
                new docx.Paragraph({
                    children: [
                        new docx.TextRun(id),
                    ],
                }),
            );

            docxChildren.push(
                new docx.Paragraph({
                    children: [
                        new docx.TextRun(textLine),
                    ],
                }),
            );
        });
    });

    const docxDocument = new docx.Document({
        sections: [
            {
                properties: {},
                children: docxChildren,
            },
        ],
    });

    docx.Packer.toBuffer(docxDocument).then(
        (buffer) => {
            fs.writeFileSync(epubFolder + '/' + fileName + '.to-translate.docx', buffer);
        },
        err => console.error(err)
    );
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

    const textArr = skipFirstEmptyParagraph ? notFilteredTextArr
        .filter((item, index) => !!item || !notFilteredTextArr[index - 1]) : notFilteredTextArr;

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
