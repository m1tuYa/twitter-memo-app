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
        type: "heading1",
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
      },
      {
        id: "blk9",
        type: "text",
        content: "末尾にあるテストブロック",
        order: 99,
        createdAt: "2025-07-16T08:10:00Z"
      },
      {
        id: "blk10",
        type: "list",
        content: "- テスト項目A\n- テスト項目B",
        order: 4,
        createdAt: "2025-07-16T08:11:00Z"
      },
      {
        id: "blk11",
        type: "text",
        content: "存在しないparentIdを持つブロック",
        order: 5,
        createdAt: "2025-07-16T08:12:00Z",
        parentId: "nonexistent"
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
        type: "heading1",
        content: "論文アイデア",
        order: 0,
        createdAt: "2025-07-16T14:00:00Z"
      },
      {
        id: "blk5",
        type: "text",
        content: "時系列データの可視化方法を整理する。",
        order: 1,
        createdAt: "2025-07-16T14:02:00Z",
        parentId: "blk4"
      },
      {
        id: "blk12",
        type: "heading2",
        content: "参考文献メモ",
        order: 2,
        createdAt: "2025-07-16T14:03:00Z"
      },
      {
        id: "blk13",
        type: "text",
        content: "文献A, 文献B",
        order: 3,
        createdAt: "2025-07-16T14:04:00Z",
        parentId: "blk12"
      },
      {
        id: "blk14",
        type: "text",
        content: "createdAtがないブロック",
        order: 4
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
        order: 0,
        createdAt: "2025-07-17T10:01:00Z"
      },
      {
        id: "blk15",
        type: "heading1",
        content: "夜の予定",
        order: 2,
        createdAt: "2025-07-17T10:02:00Z"
      },
      {
        id: "blk16",
        type: "text",
        content: "ゲーム、映画鑑賞",
        order: 3,
        createdAt: "2025-07-17T10:03:00Z",
        parentId: "blk15"
      }
    ]
  }
];