export interface NoteFolder {
  id: string;
  name: string;
}

export interface Note {
  id: string;
  folderId: string;
  title: string;
  /** Markdown body. */
  content: string;
  createdAt: number;
  updatedAt: number;
}
