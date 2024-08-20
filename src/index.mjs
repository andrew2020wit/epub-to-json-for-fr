import EPub from 'epub';
import {convert} from "html-to-text";
import fs from 'node:fs';
import {textSplitSeparators} from "./const/text-split-separators.const.mjs";

const epubFolder = './epub-files';

const convertHtmlToTextOption = {
    wordwrap: false,
    preserveNewlines: true
};

await convertEpubFilesToJsonFile(epubFolder);

async function convertEpubFilesToJsonFile(epubFolder){
    const dirContent = fs.readdirSync(epubFolder);
    const paths = dirContent
        .filter(name => name.includes('.epub'))
        .map(name => epubFolder + '/' + name);

    for (const path of paths) {
        await convertEpubFileToJsonFile(path);
    }
}

async function convertEpubFileToJsonFile(pathToFile) {
    const epub = new EPub(pathToFile);

    await new Promise((resolve, reject) => {
        epub.on('end', () => resolve());
        epub.on('error', (err) => reject(err));
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

    fs.writeFileSync(epubFolder + '/' + extendedName + '.json', JSON.stringify({jsonContentDescription: "ForeignReaderBook", book: jsonBook}, null, 2));
}

function convertHtmlToText(html) {
    return convert(html, convertHtmlToTextOption);
}

function makeContentItem(chapter, chapterHtml, bookContent, bookHeaders) {
    const chapterText = convertHtmlToText(chapterHtml);

    const lastContentIndex = bookContent.length - 1;

    const textArrNotFiltered = chapterText
        .split('\n')
        .map((x) => x.trim());

    const textArr = textArrNotFiltered;
        // .filter((item, index) => !!item || !!textArrNotFiltered[index - 1]);

    const paragraphContent = textArr.map((item, index) => {
        let text = item;

        textSplitSeparators.forEach(separator => {
            text = text.replaceAll(separator, separator + '\n');
        });

        const phrases = text.split('\n').map(x => x.trim()).filter(x => !!x);

        return {
            id:  lastContentIndex + 1 + index,
            text: phrases
        }
    })

    const headerIndex = lastContentIndex + 1;
    const headerTitle = '[' + (chapter.level || 0) + '] ' + (chapter.order) + ': ' +  chapter.title;

    bookContent.push(...paragraphContent);

    if (chapter.order) {
        bookHeaders.push({
            id: headerIndex,
            text: headerTitle
        });
    }
}
