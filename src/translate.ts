import {translate} from "bing-translate-api";
import {IBook} from "./models/book.interface.ts";
import {IScriptParams} from "./script-params.interface.ts";
import {IBookJson} from "./models/book-json.interface.ts";

export async function translateJsonBook(jsonBook: IBook, scriptParams: IScriptParams) {
    const translation: IBookJson['book']['translation'] = {};

    const  jsonBookContentLength = jsonBook.content.length;

    for (const bookContentItem of jsonBook.content) {
        for (let i = 0; i < bookContentItem.text.length; i++) {
            await delay(scriptParams.translateDelayMs);

            const translatedText = await translateIt(bookContentItem.text[i]);

            const translationId = bookContentItem.id + '-' + i;

            translation[translationId] = (translation[translationId] || '') + translatedText;

            console.log(translationId + ' / ' + jsonBookContentLength);
        }
    }

    jsonBook.translation = translation;

    async function translateIt(text: string): Promise<string> {
        try {
            const translationResult = await translate(text, scriptParams.translateFromLang, scriptParams.translateToLang);

            return translationResult?.translation || '';
        } catch (error) {
            console.error(error);
            return '';
        }
    }

    function delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}


