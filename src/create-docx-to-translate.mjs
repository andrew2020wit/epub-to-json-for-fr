import * as docx from "docx";
import fs from "node:fs";

// create docx-file for google-translate

const bookIdOpenMarker = '[[[[';
const bookIdCloseMarker = ']]]]';
const lineIdOpenMarker = '[[[';
const lineIdCloseMarker = ']]]';
const lineIdOpenMarker2 = '(((';
const lineIdCloseMarker2 = ')))';

export function createDocx(jsonBook, epubFolder, fileNameWithoutExtension) {
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
            fs.writeFileSync(epubFolder + '/' + fileNameWithoutExtension + '.to-translate.docx', buffer);
        },
        err => console.error(err)
    );
}