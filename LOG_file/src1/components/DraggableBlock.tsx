

import React, { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import type { Block } from "../types";

type DraggableBlockProps = {
  block: Block & { postId?: string }; // Accepts postId optionally
  index: number;
  onDropBlock: (
    fromPostId: string,
    fromIdx: number,
    toPostId: string,
    toIdx: number,
    dragBlocks?: Block[]
  ) => void;
  moveBlock: (
    fromPostId: string,
    fromIdx: number,
    toPostId: string,
    toIdx: number,
    dragBlocks?: Block[]
  ) => void;
  isChild: boolean;
  parentBlockId?: string;
  postId: string;
  children?: React.ReactNode;
  // Optional: pass other props as needed (e.g. for editing, menu, etc.)
};

const ITEM_TYPE = "block";

export const DraggableBlock: React.FC<DraggableBlockProps> = ({
  block,
  index,
  onDropBlock,
  moveBlock,
  isChild,
  parentBlockId,
  postId,
  children,
  ...rest
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: {
      type: ITEM_TYPE,
      block,
      index,
      postId,
      parentBlockId,
      isChild,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ITEM_TYPE,
    hover(item: any, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      const dragPostId = item.postId;
      const hoverPostId = postId;
      if (dragIndex === hoverIndex && dragPostId === hoverPostId) return;
      // Optionally: moveBlock for UI preview (not persisted)
      // moveBlock(dragPostId, dragIndex, hoverPostId, hoverIndex);
    },
    drop(item: any, monitor) {
      const dragIndex = item.index;
      const hoverIndex = index;
      const dragPostId = item.postId;
      const hoverPostId = postId;
      if (dragIndex === hoverIndex && dragPostId === hoverPostId) return;
      onDropBlock(dragPostId, dragIndex, hoverPostId, hoverIndex);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{
        opacity: isDragging ? 0.4 : 1,
        border: isOver && canDrop ? "2px solid #007bff" : "1px solid #ccc",
        background: isOver && canDrop ? "#eaf4ff" : "white",
        margin: isChild ? "2px 0 2px 2rem" : "8px 0",
        padding: "8px",
        borderRadius: "4px",
        cursor: "move",
        transition: "border 0.15s, background 0.15s",
      }}
      data-block-id={block.id}
      {...rest}
    >
      {children}
    </div>
  );
};