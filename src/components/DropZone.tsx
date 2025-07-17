

import React, { useRef } from "react";
import { useDrop } from "react-dnd";

const BLOCK = "block";

type DropZoneProps = {
  /** Called when a draggable item is dropped. */
  onDrop: (dragged: any, monitor: any) => void;
  /** Whether the drop zone is currently active (for styling). */
  isActive: boolean;
  /** Additional CSS classes for the drop zone. */
  className?: string;
};

/**
 * DropZone component for DnD block and post placement indicators.
 * Shows a blue line when active.
 */
const DropZone: React.FC<DropZoneProps> = ({ onDrop, isActive, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  // This component assumes useDrop is set up in the parent for block DnD.
  // But for flexibility, we allow it to set up its own DnD context for blocks.
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: BLOCK,
    drop: onDrop,
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  // Show blue line if active or currently hovered/can drop.
  const showLine = isActive || (isOver && canDrop);

  return (
    <div
      ref={drop(ref)}
      className={className}
      style={{ minHeight: "2px", width: "100%" }}
    >
      {showLine && (
        <div
          style={{
            height: "2px",
            backgroundColor: "#4A90E2",
            margin: "4px 0",
          }}
        />
      )}
    </div>
  );
};

export default DropZone;