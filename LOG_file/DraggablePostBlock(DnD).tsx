import React, { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";

export const POST = "post";
export const BLOCK = "block";

type DraggablePostProps = {
  idx: number;
  movePost: (from: number, to: number) => void;
  children: React.ReactNode;
};

export const DraggablePost: React.FC<DraggablePostProps> = ({ idx, movePost, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: POST,
    item: { type: POST, index: idx, id: idx },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  const [, drop] = useDrop({
    accept: POST,
    hover(dragged: any, monitor) {
      if (!ref.current) return;
      const dragIndex = dragged.index;
      const hoverIndex = idx;
      if (dragIndex === hoverIndex) return;
      movePost(dragIndex, hoverIndex);
      dragged.index = hoverIndex;
    },
  });
  return (
    <div ref={drag(drop(ref))} style={{ opacity: isDragging ? 0.5 : 1 }}>
      {children}
    </div>
  );
};

type DraggableBlockProps = {
  idx: number;
  postId: string;
  moveBlock: (
    fromPostId: string,
    fromIdx: number,
    toPostId: string,
    toIdx: number
  ) => void;
  children: React.ReactNode;
};

export const DraggableBlock: React.FC<DraggableBlockProps & { children: React.ReactNode }> = ({
  idx,
  postId,
  moveBlock,
  children,
  ...rest
}) => {
  const ref = useRef<HTMLDivElement>(null);
  // useDrag: provide block info (id, index, postId)
  const [{ isDragging }, drag] = useDrag({
    type: BLOCK,
    item: { type: BLOCK, index: idx, postId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  // useDrop: get isOver and canDrop, handle drop only (not hover)
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: BLOCK,
    drop: (dragged: any, monitor) => {
      // Only handle if dropping onto a different position
      if (!ref.current) return;
      const dragIndex = dragged.index;
      const hoverIndex = idx;
      const sourcePostId = dragged.postId;
      const targetPostId = postId;
      // Don't move if same position
      if (dragIndex === hoverIndex && sourcePostId === targetPostId) return;
      moveBlock(sourcePostId, dragIndex, targetPostId, hoverIndex);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });
  return (
    <React.Fragment>
      {isOver && canDrop && (
        <div
          style={{
            height: '2px',
            backgroundColor: '#4A90E2',
            margin: '4px 0 4px 0',
            borderRadius: '1px',
            width: '100%',
            transition: 'background-color 0.15s'
          }}
        />
      )}
      <div
        ref={drag(drop(ref))}
        style={{ opacity: isDragging ? 0.5 : 1 }}
        {...rest}
      >
        {children}
      </div>
    </React.Fragment>
  );
};