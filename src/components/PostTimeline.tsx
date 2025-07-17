

import React from "react";
import { PostType, BlockType } from "../types/types";
import DraggablePost from "./DraggablePost";
import DropZone from "./DropZone";

type PostTimelineProps = {
  posts: PostType[];
  blocks: BlockType[];
  onReorderPost: (draggedId: string, targetId: string) => void;
  onReorderBlock: (draggedId: string, targetId: string, newParentId?: string) => void;
  onDropToEmptyPost: (postId: string, blockId: string) => void;
  onAddSubBlock: (parentId: string) => void;
  onUpdateBlock: (blockId: string, content: string) => void;
  onDeletePost: (postId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  width?: string;
};

const PostTimeline: React.FC<PostTimelineProps> = ({
  posts,
  blocks,
  onReorderPost,
  onReorderBlock,
  onDropToEmptyPost,
  onAddSubBlock,
  onUpdateBlock,
  onDeletePost,
  onDeleteBlock,
  width,
}) => {
  return (
    <div className="timeline" style={width ? { width } : undefined}>
      {posts.map((post, index) => {
        const postBlocks = blocks.filter((block) => block.postId === post.id);

        return (
          <React.Fragment key={post.id}>
            <DropZone
              type="post"
              onDrop={(draggedId) => onReorderPost(draggedId, post.id)}
            />
            <DraggablePost
              post={post}
              blocks={postBlocks}
              onReorderBlock={onReorderBlock}
              onDropToEmptyPost={onDropToEmptyPost}
              onAddSubBlock={onAddSubBlock}
              onUpdateBlock={onUpdateBlock}
              onDeletePost={onDeletePost}
              onDeleteBlock={onDeleteBlock}
            />
            {index === posts.length - 1 && (
              <DropZone
                type="post"
                onDrop={(draggedId) => onReorderPost(draggedId, "")}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default PostTimeline;