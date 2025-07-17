// ドロップアンドドロップまで実装s

// src/App.tsx
import React, { useState, useEffect, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
const POST = "post";
import { posts, boards } from "./mockData";
import type { Post, Block } from "./types";

import DraggablePost from "./components/DraggablePost";
import { DraggableBlock } from "./components/DraggableBlock";
import PostBlockList from "./components/PostBlockList";


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

  // 通常のトップレベルBlock追加
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
                parentId: undefined,
              },
            ],
          }
        : post
    );
    setPostList(newPostList);
    setTimeout(() => setEditingBlockId(newBlockId), 0);
  };

  // headingブロックの下にサブブロック追加
  const handleAddSubBlock = (postId: string, parentBlockId: string) => {
    const newBlockId = String(Date.now());
    setPostList((prev) =>
      prev.map((post) =>
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
                  parentId: parentBlockId,
                },
              ],
            }
          : post
      )
    );
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

  // Helper to recursively get all child blocks of a given parentId
  const getAllChildren = (parentId: string, blocks: Block[]) => {
    const directChildren = blocks.filter((b) => b.parentId === parentId);
    const allDescendants = directChildren.flatMap((child) => getAllChildren(child.id, blocks));
    return [...directChildren, ...allDescendants];
  };

  // ブロックの順序を移動（ポスト間も含む）
  // dragBlocks: ブロック配列（親ブロック+子ブロック）をまとめて移動する場合に利用
  const moveBlock = (
    fromPostId: string,
    fromIdx: number,
    toPostId: string,
    toIdx: number,
    dragBlocks?: any[]
  ) => {
    setPostList(prevPosts => {
      const postsCopy = prevPosts.map(post => ({ ...post, blocks: [...post.blocks] }));
      const fromPost = postsCopy.find((post) => post.id === fromPostId);
      const toPost = postsCopy.find((post) => post.id === toPostId);
      if (!fromPost || !toPost) return prevPosts;

      // If no dragBlocks provided, build it for the single block (including children)
      let blocksToMove: Block[] = [];
      if (dragBlocks && dragBlocks.length > 0) {
        blocksToMove = dragBlocks;
      } else {
        const movingBlock = fromPost.blocks[fromIdx];
        if (!movingBlock) return prevPosts;
        const children = getAllChildren(movingBlock.id, fromPost.blocks);
        blocksToMove = [movingBlock, ...children];
      }

      // --- Determine newParentId based on drop target ---
      // If dropping onto a block that is a sub-block, set parentId to that block's parentId.
      // If dropping onto a top-level block, set parentId undefined/null.
      // We use toIdx and toPost to determine the newParentId for the moved block(s).
      let newParentId: string | undefined | null = undefined;
      // Find the block at toIdx in toPost.blocks, if any
      const sortedBlocks = [...toPost.blocks].sort((a, b) => a.order - b.order);
      const targetBlock = sortedBlocks[toIdx] || null;
      // For moveBlock, we want to set parentId to the parentId of the block at toIdx,
      // unless dropping at the end (then parentId is undefined).
      // However, in most block DnD UIs, dropping before a block means you want to be at the same level as that block.
      if (targetBlock) {
        newParentId = targetBlock.parentId;
      } else {
        // Dropping at the end: top level
        newParentId = undefined;
      }

      // Update postId and parentId for all blocks to move
      // Only update parentId for the top-most block being moved (not its children)
      const updatedBlocks = blocksToMove.map((b, idx) => {
        let updatedBlock = { ...b, postId: toPostId };
        // Only update parentId for the root block being moved
        if (idx === 0) {
          // Update parentId if it has changed
          if (b.parentId !== newParentId) {
            updatedBlock.parentId = newParentId;
          }
        }
        return updatedBlock;
      });

      // Remove all blocksToMove from fromPost.blocks
      const blocksToMoveIds = blocksToMove.map((blk) => blk.id);
      fromPost.blocks = fromPost.blocks.filter((blk) => !blocksToMoveIds.includes(blk.id));
      // Insert updatedBlocks at toIdx in toPost.blocks
      toPost.blocks.splice(toIdx, 0, ...updatedBlocks);

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

      return postsCopy;
    });
  };

  // Resizable layout state
  const [sidebarWidth, setSidebarWidth] = useState(240); // px
  const [timelineWidth, setTimelineWidth] = useState(40); // percent (of remaining width after sidebar)
  const [dragging, setDragging] = useState<null | "sidebar" | "timeline">(null);
  const dragStartX = useRef<number>(0);
  const dragStartSidebarWidth = useRef<number>(sidebarWidth);
  const dragStartTimelineWidth = useRef<number>(timelineWidth);

  // Mouse event handlers for resizers
  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging === "sidebar") {
        const dx = e.clientX - dragStartX.current;
        let newSidebarWidth = dragStartSidebarWidth.current + dx;
        newSidebarWidth = Math.max(150, Math.min(500, newSidebarWidth));
        setSidebarWidth(newSidebarWidth);
      } else if (dragging === "timeline") {
        const total = window.innerWidth - sidebarWidth;
        const dx = e.clientX - dragStartX.current;
        let newTimelineWidthPx = (dragStartTimelineWidth.current / 100) * total + dx;
        let newTimelineWidth = (newTimelineWidthPx / total) * 100;
        newTimelineWidth = Math.max(15, Math.min(80, newTimelineWidth));
        setTimelineWidth(newTimelineWidth);
      }
    };
    const handleMouseUp = () => setDragging(null);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, sidebarWidth]);

  // Calculate widths
  const totalWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
  const sidebarStyle = {
    width: sidebarWidth,
    minWidth: 150,
    maxWidth: 500,
    borderRight: "1px solid #ccc",
    padding: "1rem",
    overflowY: "auto",
    backgroundColor: "#f7f7f7",
    boxSizing: "border-box" as const,
    height: "100%",
  };
  const timelinePx = ((window.innerWidth || 1200) - sidebarWidth) * (timelineWidth / 100);
  const timelineStyle = {
    width: `calc(${timelineWidth}% - 1px)`,
    minWidth: 200,
    borderRight: "1px solid #ccc",
    padding: "1rem",
    overflowY: "visible" as const,
    boxSizing: "border-box" as const,
    height: "100%",
    flexShrink: 0,
    flexGrow: 0,
  };
  const boardStyle = {
    width: `calc(${100 - timelineWidth}% - 1px)`,
    minWidth: 200,
    padding: "1rem",
    overflowY: "auto" as const,
    boxSizing: "border-box" as const,
    height: "100%",
    flexShrink: 1,
    flexGrow: 1,
  };

  // Resizer styles
  const resizerStyle: React.CSSProperties = {
    width: 6,
    cursor: "col-resize",
    background: "rgba(0,0,0,0.05)",
    zIndex: 100,
    position: "relative",
    height: "100%",
  };

  return (
    <DndProvider backend={HTML5Backend}>
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif", flexDirection: "row", width: "100vw" }}>
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
          .delete-button {
            height: 24px;
            padding: 2px 6px;
            line-height: normal;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
        `}
      </style>
      {/* Sidebar */}
      <div style={sidebarStyle}>
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

      {/* Sidebar-Timeline Resizer */}
      <div
        style={resizerStyle}
        onMouseDown={e => {
          setDragging("sidebar");
          dragStartX.current = e.clientX;
          dragStartSidebarWidth.current = sidebarWidth;
        }}
      />

      {/* Timeline */}
      <div style={timelineStyle}>
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
                  <button className="delete-button" onClick={() => handleDeletePost(post.id)}>🗑️ 削除</button>
                </div>
              )}
            </div>

            <PostBlockList
              post={post}
              blocks={post.blocks}
              onDropBlock={moveBlock}
              editingBlockId={editingBlockId}
              setEditingBlockId={setEditingBlockId}
              activeBlockMenuId={activeBlockMenuId}
              setActiveBlockMenuId={setActiveBlockMenuId}
              blockTypeMenuId={blockTypeMenuId}
              setBlockTypeMenuId={setBlockTypeMenuId}
              handleUpdateBlock={handleUpdateBlock}
              handleDeleteBlock={handleDeleteBlock}
              handleChangeBlockType={handleChangeBlockType}
              handleAddBlock={handleAddBlock}
              handleAddSubBlock={handleAddSubBlock}
            />
            <hr style={{ marginTop: "2rem" }} />
            </div>
          </DraggablePost>
        ))}
      </div>

      {/* Timeline-Board Resizer */}
      <div
        style={resizerStyle}
        onMouseDown={e => {
          setDragging("timeline");
          dragStartX.current = e.clientX;
          dragStartTimelineWidth.current = timelineWidth;
        }}
      />

      {/* Board View */}
      <div style={boardStyle}>
        <h2>📚 ボードビュー</h2>
        {boardsList
          .filter((board) => board.id === selectedBoardId)
          .map((board) => {
            // Get all posts for this board
            const boardPosts = postList.filter((p) => p.boardId === board.id);
            // Get all blocks for this board
            const boardBlocks = boardPosts.flatMap((p) =>
              p.blocks.map((block) => ({
                ...block,
                postId: p.id,
              }))
            );
            return (
              <div key={board.id}>
                <h3>{board.title}</h3>
                <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                  {boardBlocks.map((block) => (
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

                {/* --- Blocks Table View --- */}
                <h3>Blocks Table View</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
                  <thead>
                    <tr>
                      <th style={{ border: "1px solid #ccc", padding: "4px" }}>ID</th>
                      <th style={{ border: "1px solid #ccc", padding: "4px" }}>Type</th>
                      <th style={{ border: "1px solid #ccc", padding: "4px" }}>Content</th>
                      <th style={{ border: "1px solid #ccc", padding: "4px" }}>Post ID</th>
                      <th style={{ border: "1px solid #ccc", padding: "4px" }}>Parent ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boardBlocks.map((block) => (
                      <tr key={block.id}>
                        <td style={{ border: "1px solid #ccc", padding: "4px" }}>{block.id}</td>
                        <td style={{ border: "1px solid #ccc", padding: "4px" }}>{block.type}</td>
                        <td style={{ border: "1px solid #ccc", padding: "4px" }}>{block.content}</td>
                        <td style={{ border: "1px solid #ccc", padding: "4px" }}>{block.postId}</td>
                        <td style={{ border: "1px solid #ccc", padding: "4px" }}>{block.parentId ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* --- End Blocks Table View --- */}
              </div>
            );
          })}
      </div>
    </div>
    </DndProvider>
  );
};

export default App;