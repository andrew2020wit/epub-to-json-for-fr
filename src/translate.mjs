import {translate} from "bing-translate-api";
import fs from "node:fs";

const delayMs = 200;

export async function translateJsonBook(jsonBook, translateFromLang, translateToLang, epubFolder) {

    const translation = {};

    const  jsonBookContentLength = jsonBook.content.length;

    console.log('translate item delayMs: ', delayMs);

    for (const bookContentItem of jsonBook.content) {
        for (let i = 0; i < bookContentItem.text.length; i++) {
            await delay(delayMs);

            const translatedText = await translateIt(bookContentItem.text[i]);

            const translationId = bookContentItem.id + '-' + i;

            translation[translationId] = (translation[translationId] || '') + translatedText;

            console.log(translationId + ' / ' + jsonBookContentLength);
        }
    }

    jsonBook.translation = translation;

    async function translateIt(text) {
        try {
            const translationResult = await translate(text, translateFromLang, translateToLang);
            return translationResult.translation;
        } catch (e) {
            takeError(e);
        }
    }

    function takeError(error) {
        console.error(error);

        fs.appendFileSync(epubFolder + '/' + 'errors' + '.log', JSON.stringify({error}, null, 2));
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}


