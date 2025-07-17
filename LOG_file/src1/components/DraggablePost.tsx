

import React, { ReactNode, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";

const POST = "post";

type DraggablePostProps = {
  idx: number;
  movePost: (from: number, to: number) => void;
  children: ReactNode;
};

const DraggablePost: React.FC<DraggablePostProps> = ({ idx, movePost, children }) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: POST,
    item: { idx },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: POST,
    hover: (item: { idx: number }, monitor) => {
      if (!ref.current) return;
      const dragIndex = item.idx;
      const hoverIndex = idx;
      if (dragIndex === hoverIndex) return;
      movePost(dragIndex, hoverIndex);
      item.idx = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{
        opacity: isDragging ? 0.5 : 1,
        transition: "opacity 0.2s",
        cursor: "move",
      }}
    >
      {children}
    </div>
  );
};

export default DraggablePost;