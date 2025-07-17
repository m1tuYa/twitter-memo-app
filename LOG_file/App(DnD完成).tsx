// ドロップアンドドロップまで実装s

// src/App.tsx
import React, { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
const POST = "post";
import { posts, boards } from "./mockData";
import type { Post, Block } from "./types";

import { DraggablePost, DraggableBlock } from "./components/DraggablePostBlock";

// DropZoneコンポーネント: ブロック間/末尾へドロップ可能
import { useRef } from "react";
import { useDrop } from "react-dnd";
const BLOCK = "block";
type DropZoneProps = {
  targetIndex: number;
  postId: string;
  moveBlock: (
    fromPostId: string,
    fromIdx: number,
    toPostId: string,
    toIdx: number
  ) => void;
};
const DropZone: React.FC<DropZoneProps> = ({ targetIndex, postId, moveBlock }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: BLOCK,
    drop: (dragged: any, monitor) => {
      if (!ref.current) return;
      const dragIndex = dragged.index;
      const sourcePostId = dragged.postId;
      // ドロップ先が同じ場合はスキップ
      if (dragIndex === targetIndex && sourcePostId === postId) return;
      moveBlock(sourcePostId, dragIndex, postId, targetIndex);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });
  return (
    <div ref={drop(ref)} style={{ minHeight: "2px", width: "100%" }}>
      {isOver && canDrop && (
        <div style={{ height: '2px', backgroundColor: '#4A90E2', margin: '4px 0' }} />
      )}
    </div>
  );
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
};


const App = () => {
  const [selectedBoardId, setSelectedBoardId] = useState(boards[0]?.id);
  const [postList, setPostList] = useState<Post[]>(posts);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [boardsList, setBoardsList] = useState(boards);
  const [activeBlockMenuId, setActiveBlockMenuId] = useState<string | null>(null);
  const [activeBoardMenuPostId, setActiveBoardMenuPostId] = useState<string | null>(null);
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [blockTypeMenuId, setBlockTypeMenuId] = useState<string | null>(null);

  useEffect(() => {
    const close = () => setActiveBlockMenuId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      document.querySelectorAll("[id^='board-menu-']").forEach((menu) => {
        if (!(menu as HTMLElement).contains(e.target as Node)) {
          (menu as HTMLElement).style.display = "none";
        }
      });
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    const closeBoardMenu = () => setActiveBoardMenuPostId(null);
    window.addEventListener("click", closeBoardMenu);
    return () => window.removeEventListener("click", closeBoardMenu);
  }, []);

  const handleAddPost = () => {
    const newBlockId = String(Date.now() + 1);
    const newPost: Post = {
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
      blocks: [{
        id: newBlockId,
        type: "text",
        content: "",
        order: 0,
        parentId: null,
      }],
      boardId: null,
    };
    setPostList([newPost, ...postList]);
    setEditingBlockId(newBlockId);
  };

  const handleAddBlock = (postId: string) => {
    const newBlockId = String(Date.now());
    const newPostList = postList.map((post) =>
      post.id === postId
        ? {
            ...post,
            blocks: [
              ...post.blocks,
              {
                id: newBlockId,
                type: "text",
                content: "",
                order: post.blocks.length,
                parentId: null,
              },
            ],
          }
        : post
    );
    setPostList(newPostList);
    setTimeout(() => setEditingBlockId(newBlockId), 0);
  };

  const handleUpdateBlock = (blockId: string, newContent: string) => {
    setPostList((prev) =>
      prev.map((post) => ({
        ...post,
        blocks: post.blocks.map((block) =>
          block.id === blockId ? { ...block, content: newContent } : block
        ),
      }))
    );
  };

  const handleDeleteBlock = (blockId: string) => {
    setPostList((prev) =>
      prev.map((post) => ({
        ...post,
        blocks: post.blocks.filter((block) => block.id !== blockId),
      }))
    );
  };

  const handleChangeBlockType = (blockId: string, newType: "heading" | "text" | "list") => {
    setPostList((prev) =>
      prev.map((post) => ({
        ...post,
        blocks: post.blocks.map((block) =>
          block.id === blockId ? { ...block, type: newType } : block
        ),
      }))
    );
    setBlockTypeMenuId(null);
    setActiveBlockMenuId(null);
  };

  // ポスト削除関数
  const handleDeletePost = (postId: string) => {
    setPostList((prev) => prev.filter((post) => post.id !== postId));
  };

  // ポストの順序を移動
  const movePost = (from: number, to: number) => {
    setPostList((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  };

  // ブロックの順序を移動（ポスト間も含む）
  const moveBlock = (
    fromPostId: string,
    fromIdx: number,
    toPostId: string,
    toIdx: number
  ) => {
    const fromPost = postList.find((post) => post.id === fromPostId);
    const toPost = postList.find((post) => post.id === toPostId);
    if (!fromPost || !toPost) return;

    // 移動するブロックを取得
    const movingBlock = fromPost.blocks[fromIdx];
    // 元ポストから削除
    fromPost.blocks.splice(fromIdx, 1);
    // 先ポストの指定位置に挿入
    toPost.blocks.splice(toIdx, 0, movingBlock);

    // すべてのブロックの order を index で再設定
    toPost.blocks.forEach((block, i) => {
      block.order = i;
    });
    // fromPostとtoPostが異なる場合、fromPost側も再設定
    if (fromPost !== toPost) {
      fromPost.blocks.forEach((block, i) => {
        block.order = i;
      });
    }

    setPostList([...postList]);
  };

  return (
    <DndProvider backend={HTML5Backend}>
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      <style>
        {`
          .block-button {
            background: none;
            border: none;
            padding: 0.2rem;
            margin: 0.2rem;
            font-size: 0.75rem;
            line-height: 1;
            height: 0.9em;
            vertical-align: bottom;
            position: relative;
            top: 0.2em;
            cursor: pointer;
            visibility: hidden;
          }

          .block-container:hover .block-button {
            visibility: visible;
          }

          .add-block-button {
            opacity: 0;
            transition: opacity 0.2s;
          }

          .post-container:hover .add-block-button {
            opacity: 1;
          }

          .post-menu-content {
            position: absolute;
            top: 1.2rem;
            right: 0;
            background: white;
            border: 1px solid #ccc;
            padding: 0.5rem;
            z-index: 1000;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }

          .post-menu-content button {
            background: transparent;
            border: none;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.5rem;
            font-size: 0.9rem;
          }
        `}
      </style>
      {/* Sidebar */}
      <div style={{ width: "240px", minWidth: "150px", borderRight: "1px solid #ccc", padding: "1rem", overflowY: "auto", backgroundColor: "#f7f7f7" }}>
        <div style={{ marginBottom: "1rem" }}>
          <button style={{ width: "100%" }} onClick={() => {
            const newBoard = {
              id: String(Date.now()),
              title: "New Board",
            };
            setBoardsList([...boardsList, newBoard]);
            setSelectedBoardId(newBoard.id);
          }}>
            ＋新規ボード
          </button>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <button style={{ width: "100%" }} onClick={handleAddPost}>＋新規ポスト</button>
        </div>
        <h3>📁 Boards</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {boardsList.map((board) => (
            <li key={board.id}>
              {editingBoardId === board.id ? (
                <input
                  type="text"
                  value={board.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setBoardsList((prev) =>
                      prev.map((b) => (b.id === board.id ? { ...b, title: newTitle } : b))
                    );
                  }}
                  onBlur={() => setEditingBoardId(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditingBoardId(null);
                  }}
                  autoFocus
                  style={{ width: "100%", outline: "none", border: "none", background: "transparent" }}
                />
              ) : (
                <button
                  onClick={() => setSelectedBoardId(board.id)}
                  onDoubleClick={() => setEditingBoardId(board.id)}
                  style={{
                    background: board.id === selectedBoardId ? "#eef" : "transparent",
                    border: "none",
                    padding: "0.25rem 0.5rem",
                    textAlign: "left",
                    width: "100%",
                    cursor: "pointer"
                  }}
                >
                  {board.title}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Timeline */}
      <div style={{ width: "calc(50vw - 240px)", borderRight: "1px solid #ccc", padding: "1rem", overflowY: "visible" }}>
        <h2>🕒 タイムライン</h2>
        <div style={{ marginBottom: "1rem" }}>
          <button onClick={handleAddPost}>＋新規ポスト</button>
        </div>
        <hr style={{ marginTop: "1rem", marginBottom: "1rem" }} />
        {postList.map((post, idx) => (
          <DraggablePost key={post.id} idx={idx} movePost={movePost}>
            <div
              className="post-container"
              style={{ marginBottom: "2rem", position: "relative", zIndex: 0, overflow: "visible" }}
            >
            <div style={{ color: "#555", fontSize: "0.9rem", marginLeft: "0rem", marginBottom: "0.25rem" }}>
              {formatDate(post.createdAt)} &nbsp;|&nbsp;
              <span>📁&nbsp;</span>
              <div style={{ display: "inline-block", position: "relative" }}>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveBoardMenuPostId(post.id === activeBoardMenuPostId ? null : post.id);
                  }}
                  style={{ cursor: "pointer", textDecoration: "underline" }}
                >
                  {boardsList.find((b) => b.id === post.boardId)?.title || "未分類"}
                </span>
                {activeBoardMenuPostId === post.id && (
                  <div
                    style={{
                      position: "absolute",
                      top: "0",
                      left: "100%",
                      transform: "translateX(0.5rem)",
                      background: "#fff",
                      border: "1px solid #ccc",
                      padding: "0.5rem",
                      zIndex: 1000,
                      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                      width: "auto",
                      whiteSpace: "nowrap",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {boardsList.map((board) => (
                      <div
                        key={board.id}
                        onClick={() => {
                          setPostList((prev) =>
                            prev.map((p) =>
                              p.id === post.id ? { ...p, boardId: board.id } : p
                            )
                          );
                          setActiveBoardMenuPostId(null);
                        }}
                        style={{ cursor: "pointer", padding: "0.25rem 0" }}
                      >
                        {board.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* ポストメニュー: 「…」 */}
            <div style={{ position: "absolute", top: "0.2rem", right: "0.5rem", zIndex: 10 }}>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  padding: "0 0.3rem"
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveBlockMenuId(null);
                  setBlockTypeMenuId(null);
                  setActiveBoardMenuPostId(null);
                  // 独自に管理する場合はstateを用意しても良い
                  // 今回はpost.idをactiveBoardMenuPostIdに使わないように
                  // post.idをactivePostMenuIdとしても良い
                  // ここではactiveBlockMenuIdでなく、activeBoardMenuPostIdを使う
                  setActiveBoardMenuPostId(post.id === activeBoardMenuPostId ? null : post.id + "-postmenu");
                }}
              >
                ⋯
              </button>
              {activeBoardMenuPostId === post.id + "-postmenu" && (
                <div className="post-menu-content" onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleDeletePost(post.id)}>🗑️ 削除</button>
                </div>
              )}
            </div>

            {(() => {
              // order順のみでソート
              const sortedBlocks = [...post.blocks].sort((a, b) => a.order - b.order);
              return (
                <>
                  {sortedBlocks.map((block, idx) => (
                    <DraggableBlock
                      key={block.id}
                      idx={idx}
                      postId={post.id}
                      moveBlock={moveBlock}
                    >
                      {/* ブロックの表示内容 */}
                      <div
                        className="block-container"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          margin: "0.4rem 0",
                          position: "relative",
                          zIndex: 0,
                          overflow: "visible",
                          backgroundColor: activeBlockMenuId === block.id ? "#e6f0ff" : "transparent",
                          width: "100%"
                        }}
                      >
                        <button className="block-button" onClick={(e) => {
                          e.stopPropagation();
                          setActiveBlockMenuId(block.id);
                          setBlockTypeMenuId(null);
                        }}>…</button>
                        {activeBlockMenuId === block.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: "absolute",
                              right: "calc(100% - 0.4rem)",
                              top: "0",
                              background: "#fff",
                              border: "1px solid #ccc",
                              padding: "0.5rem",
                              zIndex: 1000,
                              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <button onClick={() => {
                              setEditingBlockId(block.id);
                              setActiveBlockMenuId(null);
                            }} style={{ background: "transparent", border: "none", display: "flex", alignItems: "center" }}>
                              ✏️ 編集
                            </button>
                            <br />
                            <button onClick={() => {
                              setBlockTypeMenuId(block.id);
                            }} style={{ background: "transparent", border: "none", display: "flex", alignItems: "center" }}>
                              🔀 タイプ変更
                            </button>
                            {blockTypeMenuId === block.id && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "2em",
                                  left: "100%",
                                  background: "#fff",
                                  border: "1px solid #ccc",
                                  padding: "0.5rem",
                                  zIndex: 1001,
                                  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <button onClick={() => handleChangeBlockType(block.id, "heading")} style={{ background: "transparent", border: "none", display: "flex", alignItems: "center", marginBottom: "0.25rem" }}>🔠 見出し</button>
                                <button onClick={() => handleChangeBlockType(block.id, "text")} style={{ background: "transparent", border: "none", display: "flex", alignItems: "center", marginBottom: "0.25rem" }}>✏️ テキスト</button>
                                <button onClick={() => handleChangeBlockType(block.id, "list")} style={{ background: "transparent", border: "none", display: "flex", alignItems: "center" }}>📋 リスト</button>
                              </div>
                            )}
                            <br />
                            <button onClick={() => {
                              handleDeleteBlock(block.id);
                              setActiveBlockMenuId(null);
                            }} style={{ background: "transparent", border: "none", display: "flex", alignItems: "center" }}>
                              🗑️ 削除
                            </button>
                          </div>
                        )}
                        <div>
                          {editingBlockId === block.id ? (
                            <div
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => handleUpdateBlock(block.id, e.currentTarget.textContent || "")}
                              onInput={(e) => {
                                e.currentTarget.style.height = "auto";
                                e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
                              }}
                              style={{
                                fontSize: block.type === "heading" ? "1.25rem" : "1rem",
                                fontWeight: block.type === "heading" ? "bold" : "normal",
                                lineHeight: "1.5",
                                outline: "none",
                                minHeight: "1.5em",
                                width: "calc(50vw - 300px)",
                                boxSizing: "border-box",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                resize: "none",
                              }}
                            >
                              {block.content}
                            </div>
                          ) : block.type === "heading" ? (
                            <h4
                              style={{ margin: 0 }}
                              onDoubleClick={() => setEditingBlockId(block.id)}
                            >
                              {block.content}
                            </h4>
                          ) : (
                            <p
                              style={{ margin: 0 }}
                              onDoubleClick={() => setEditingBlockId(block.id)}
                            >
                              {block.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </DraggableBlock>
                  ))}
                  {/* ブロック末尾用DropZone */}
                  <DropZone targetIndex={sortedBlocks.length} postId={post.id} moveBlock={moveBlock} />
                </>
              );
            })()}
            <div className="add-block-button" style={{ marginLeft: "2rem" }}>
              <button onClick={() => handleAddBlock(post.id)}>+ 新規Block</button>
            </div>
            <hr style={{ marginTop: "2rem" }} />
            </div>
          </DraggablePost>
        ))}
      </div>

      {/* Board View */}
      <div style={{ width: "50%", padding: "1rem", overflowY: "auto" }}>
        <h2>📚 ボードビュー</h2>
        {boardsList
          .filter((board) => board.id === selectedBoardId)
          .map((board) => (
            <div key={board.id}>
              <h3>{board.title}</h3>
              <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                {postList
                  .filter((p) => p.boardId === board.id)
                  .flatMap((p) => p.blocks)
                  .map((block) => (
                    <li key={block.id} style={{ marginBottom: "0.3rem" }}>
                      {block.type === "heading" && <h4 style={{ margin: 0 }}>{block.content}</h4>}
                      {block.type === "text" && <p style={{ margin: 0 }}>{block.content}</p>}
                      {block.type === "list" && (
                        <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                          {block.content.split("\n").map((item, idx) => (
                            <li key={idx} style={{ margin: 0 }}>{item.replace(/^[-*]\s*/, "")}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
      </div>
    </div>
    </DndProvider>
  );
};

export default App;