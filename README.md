# Convert epub-files to json files for Foreign Reader

- install node.js
- run ```npm install``` in this folder
- put files in the epub-files folder
- run ```npm run go```
- take json files from the epub-files folder

It also creates docx files for translation.

You can change (index.mjs):

```js
const skipAllEmptyParagraphs = false;
const skipFirstEmptyParagraph = true;
const skipSecondEmptyParagraph = false;
const skipThirdEmptyParagraph = false;
```

see also: [https://github.com/andrew2020wit/foreign-reader](https://github.com/andrew2020wit/foreign-reader)

MIT licence