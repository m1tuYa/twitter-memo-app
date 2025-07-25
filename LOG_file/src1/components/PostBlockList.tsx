

import React from "react";
import { DraggableBlock } from "./DraggablePostBlock";
import { useRef } from "react";
import { useDrop } from "react-dnd";
import type { Post, Block } from "../types";

const BLOCK = "block";

// DropZone for blocks
type DropZoneProps = {
  targetIndex: number;
  postId: string;
  onDropBlock: (
    fromPostId: string,
    fromIdx: number,
    toPostId: string,
    toIdx: number
  ) => void;
};
const DropZone: React.FC<DropZoneProps> = ({ targetIndex, postId, onDropBlock }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: BLOCK,
    drop: (dragged: any, monitor) => {
      if (!ref.current) return;
      const dragIndex = dragged.index;
      const sourcePostId = dragged.postId;
      if (dragIndex === targetIndex && sourcePostId === postId) return;
      onDropBlock(sourcePostId, dragIndex, postId, targetIndex);
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

type PostBlockListProps = {
  post: Post;
  blocks: Block[];
  onDropBlock: (
    fromPostId: string,
    fromIdx: number,
    toPostId: string,
    toIdx: number
  ) => void;
  // The following props are needed for block editing and actions
  editingBlockId?: string | null;
  setEditingBlockId?: (id: string | null) => void;
  activeBlockMenuId?: string | null;
  setActiveBlockMenuId?: (id: string | null) => void;
  blockTypeMenuId?: string | null;
  setBlockTypeMenuId?: (id: string | null) => void;
  handleUpdateBlock?: (blockId: string, newContent: string) => void;
  handleDeleteBlock?: (blockId: string) => void;
  handleChangeBlockType?: (blockId: string, newType: "heading" | "text" | "list") => void;
  handleAddBlock?: (postId: string) => void;
  handleAddSubBlock?: (postId: string, parentBlockId: string) => void;
};

const PostBlockList: React.FC<PostBlockListProps> = ({
  post,
  blocks,
  onDropBlock,
  editingBlockId,
  setEditingBlockId,
  activeBlockMenuId,
  setActiveBlockMenuId,
  blockTypeMenuId,
  setBlockTypeMenuId,
  handleUpdateBlock,
  handleDeleteBlock,
  handleChangeBlockType,
  handleAddBlock,
  handleAddSubBlock,
}) => {
  // order順でソート
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);
  const topLevelBlocks = sortedBlocks.filter((block) => block.parentId === undefined || block.parentId === null);
  const getSubBlocks = (parentId: string) =>
    sortedBlocks.filter((b) => b.parentId === parentId);

  return (
    <>
      {topLevelBlocks.map((block, idx) => (
        <React.Fragment key={block.id}>
          <DraggableBlock
            idx={sortedBlocks.findIndex((b) => b.id === block.id)}
            postId={post.id}
            moveBlock={onDropBlock}
          >
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
                setActiveBlockMenuId?.(block.id);
                setBlockTypeMenuId?.(null);
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
                    setEditingBlockId?.(block.id);
                    setActiveBlockMenuId?.(null);
                  }} style={{ background: "transparent", border: "none", display: "flex", alignItems: "center" }}>
                    ✏️ 編集
                  </button>
                  <br />
                  <button onClick={() => {
                    setBlockTypeMenuId?.(block.id);
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
                      <button onClick={() => handleChangeBlockType?.(block.id, "heading")} style={{ background: "transparent", border: "none", display: "flex", alignItems: "center", marginBottom: "0.25rem" }}>🔠 見出し</button>
                      <button onClick={() => handleChangeBlockType?.(block.id, "text")} style={{ background: "transparent", border: "none", display: "flex", alignItems: "center", marginBottom: "0.25rem" }}>✏️ テキスト</button>
                      <button onClick={() => handleChangeBlockType?.(block.id, "list")} style={{ background: "transparent", border: "none", display: "flex", alignItems: "center" }}>📋 リスト</button>
                    </div>
                  )}
                  <br />
                  <button onClick={() => {
                    handleDeleteBlock?.(block.id);
                    setActiveBlockMenuId?.(null);
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
                    onBlur={(e) => handleUpdateBlock?.(block.id, e.currentTarget.textContent || "")}
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
                    onDoubleClick={() => setEditingBlockId?.(block.id)}
                  >
                    {block.content}
                  </h4>
                ) : (
                  <p
                    style={{ margin: 0 }}
                    onDoubleClick={() => setEditingBlockId?.(block.id)}
                  >
                    {block.content}
                  </p>
                )}
              </div>
            </div>
          </DraggableBlock>
          {/* headingの直後にサブブロック（インデント付き） */}
          {block.type === "heading" && (
            <>
              {getSubBlocks(block.id).map((subBlock) => (
                <DraggableBlock
                  key={subBlock.id}
                  idx={sortedBlocks.findIndex((b) => b.id === subBlock.id)}
                  postId={post.id}
                  moveBlock={onDropBlock}
                >
                  <div
                    className="block-container"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      margin: "0.4rem 0 0.4rem 2rem",
                      position: "relative",
                      zIndex: 0,
                      overflow: "visible",
                      backgroundColor: activeBlockMenuId === subBlock.id ? "#e6f0ff" : "transparent",
                      width: "100%"
                    }}
                  >
                    <button className="block-button" onClick={(e) => {
                      e.stopPropagation();
                      setActiveBlockMenuId?.(subBlock.id);
                      setBlockTypeMenuId?.(null);
                    }}>…</button>
                    {activeBlockMenuId === subBlock.id && (
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
                          setEditingBlockId?.(subBlock.id);
                          setActiveBlockMenuId?.(null);
                        }} style={{ background: "transparent", border: "none", display: "flex", alignItems: "center" }}>
                          ✏️ 編集
                        </button>
                        <br />
                        <button onClick={() => {
                          setBlockTypeMenuId?.(subBlock.id);
                        }} style={{ background: "transparent", border: "none", display: "flex", alignItems: "center" }}>
                          🔀 タイプ変更
                        </button>
                        {blockTypeMenuId === subBlock.id && (
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
                            <button onClick={() => handleChangeBlockType?.(subBlock.id, "heading")} style={{ background: "transparent", border: "none", display: "flex", alignItems: "center", marginBottom: "0.25rem" }}>🔠 見出し</button>
                            <button onClick={() => handleChangeBlockType?.(subBlock.id, "text")} style={{ background: "transparent", border: "none", display: "flex", alignItems: "center", marginBottom: "0.25rem" }}>✏️ テキスト</button>
                            <button onClick={() => handleChangeBlockType?.(subBlock.id, "list")} style={{ background: "transparent", border: "none", display: "flex", alignItems: "center" }}>📋 リスト</button>
                          </div>
                        )}
                        <br />
                        <button onClick={() => {
                          handleDeleteBlock?.(subBlock.id);
                          setActiveBlockMenuId?.(null);
                        }} style={{ background: "transparent", border: "none", display: "flex", alignItems: "center" }}>
                          🗑️ 削除
                        </button>
                      </div>
                    )}
                    <div>
                      {editingBlockId === subBlock.id ? (
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => handleUpdateBlock?.(subBlock.id, e.currentTarget.textContent || "")}
                          onInput={(e) => {
                            e.currentTarget.style.height = "auto";
                            e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
                          }}
                          style={{
                            fontSize: subBlock.type === "heading" ? "1.25rem" : "1rem",
                            fontWeight: subBlock.type === "heading" ? "bold" : "normal",
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
                          {subBlock.content}
                        </div>
                      ) : subBlock.type === "heading" ? (
                        <h4
                          style={{ margin: 0 }}
                          onDoubleClick={() => setEditingBlockId?.(subBlock.id)}
                        >
                          {subBlock.content}
                        </h4>
                      ) : (
                        <p
                          style={{ margin: 0 }}
                          onDoubleClick={() => setEditingBlockId?.(subBlock.id)}
                        >
                          {subBlock.content}
                        </p>
                      )}
                    </div>
                  </div>
                </DraggableBlock>
              ))}
              {/* サブブロック追加ボタン */}
              <div className="add-block-button" style={{ marginLeft: "2rem" }}>
                <button onClick={() => handleAddSubBlock?.(post.id, block.id)}>＋サブブロック追加</button>
              </div>
            </>
          )}
        </React.Fragment>
      ))}
      {/* ブロック末尾用DropZone */}
      <DropZone targetIndex={sortedBlocks.length} postId={post.id} onDropBlock={onDropBlock} />
      <div className="add-block-button" style={{ marginLeft: "2rem" }}>
        <button onClick={() => handleAddBlock?.(post.id)}>+ 新規Block</button>
      </div>
    </>
  );
};

export default PostBlockList;