# Convert epub-files to json files for the Foreign Reader

- install node.js
- run ```npm install``` in this folder
- put files in the epub-files folder
- run ```npm run go``` to create json-book without translation
- or run ```npm run translate``` to create json-book with translation
- or run ```npx tsx src/index.ts translateDocx translate translateDelayMs:100 translateFromLang:en translateToLang:ru```
   (in project folder)
- take json files from the epub-files folder

It also creates docx files for translation.

see also: [https://github.com/andrew2020wit/foreign-reader](https://github.com/andrew2020wit/foreign-reader)

MIT licence