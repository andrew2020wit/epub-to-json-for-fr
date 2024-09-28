export interface IBook {
  id: string;
  title: string;
  description: string;
  content: IBookParagraph[];
  translation?: Record<string, string>;
  markedItems?: IBookParagraph['id'][];
  headers?: IBookHeader[];
}

export interface IBookParagraph {
  id: number;
  text: string[];
}

export type IBookHeader = {
  id: IBookParagraph['id'];
  isMarked?: boolean;
  text: string;
};

export interface IDBBookContent {
  id: IBook['id'];
  content: IBook['content'];
}

export interface IDBBookTranslation {
  id: IBook['id'];
  translation: IBook['translation'];
}

export interface IDBBookTitle {
  id: IBook['id'];
  title: IBook['title'];
  description: IBook['description'];
  lastOpenedTime: number;
  currentContentItemId: number;
}

export interface IDBBookMarks {
  id: IBook['id'];
  markedItems: IBook['markedItems'];
}

export interface IDBBookHeaders {
  id: IBook['id'];
  headers: IBook['headers'];
}

export interface IDBTermsList {
  id: 1,
  terms: string[];
}
