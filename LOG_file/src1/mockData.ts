import type { Block, Post, Board } from "./types";

export const boards: Board[] = [
  { id: "b1", title: "日記", description: "毎日の記録" },
  { id: "b2", title: "研究ノート", description: "アイデアや進捗メモ" }
];

export const posts: Post[] = [
  {
    id: "p1",
    createdAt: "2025-07-16T08:00:00Z",
    boardId: "b1",
    blocks: [
      {
        id: "blk1",
        type: "heading",
        content: "朝の予定",
        order: 0,
        createdAt: "2025-07-16T08:00:00Z"
      },
      {
        id: "blk2",
        type: "text",
        content: "午前中はカフェで論文を読む。",
        order: 1,
        createdAt: "2025-07-16T08:01:00Z",
        parentId: "blk1"
      },
      {
        id: "blk3",
        type: "list",
        content: "- スライド作成\n- メール返信",
        order: 2,
        createdAt: "2025-07-16T08:02:00Z",
        parentId: "blk1"
      }
    ]
  },
  {
    id: "p2",
    createdAt: "2025-07-16T14:00:00Z",
    boardId: "b2",
    blocks: [
      {
        id: "blk4",
        type: "heading",
        content: "論文アイデア",
        order: 0,
        createdAt: "2025-07-16T14:00:00Z"
      },
      {
        id: "blk5",
        type: "text",
        content: "時系列データの可視化方法を整理する。隣の客はよくかき食う客だ．坊主が屏風に上手な絵を描いた．",
        order: 1,
        createdAt: "2025-07-16T14:02:00Z",
        parentId: "blk4"
      }
    ]
  },
  {
    id: "p3",
    createdAt: "2025-07-17T10:00:00Z",
    boardId: "b1",
    blocks: [
      {
        id: "blk6",
        type: "text",
        content: "今日は図書館で集中して作業する予定。",
        order: 0,
        createdAt: "2025-07-17T10:00:00Z"
      },
      {
        id: "blk7",
        type: "text",
        content: "午後はジムに行く。",
        order: 1,
        createdAt: "2025-07-17T10:01:00Z"
      },
      {
        id: "blk8",
        type: "text",
        content: "夜は友達とオンラインでゲームをする。",
        order: 2,
        createdAt: "2025-07-17T10:02:00Z"
      }
    ]
  }
];