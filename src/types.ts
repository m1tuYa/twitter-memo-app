// src/types.ts
export type BlockType = "text" | "heading1" | "heading2" | "list" | "checkbox";

export type Block = {
  id: string;
  type: BlockType;
  content: string;
  order: number;
  createdAt: string;
  childrenPostIds?: string[];
};

export type Post = {
  id: string;
  blocks: Block[];
  boardId?: string;
  parentBlockId?: string;
  createdAt: string;
};

export type Board = {
  id: string;
  title: string;
  description?: string;
};