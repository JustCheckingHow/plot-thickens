import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

type CommentViewProps = {
  commentId: string;
  commentText: string;
  suggestion?: string;
  selectedText: string;
  onApplySuggestion: (commentId: string) => void;
  onAddSubcomment: (commentId: string, subcomment: string) => void;
  subcomments?: { id: string; text: string }[];
  position?: { x: number; y: number };
  onClose?: () => void;
  isVisible?: boolean;
};

const CommentView = ({ 
  commentId, 
  commentText, 
  suggestion, 
  selectedText, 
  onApplySuggestion, 
  onAddSubcomment,
  subcomments = [],
  position = { x: 0, y: 0 },
  onClose,
  isVisible = false
}: CommentViewProps) => {
  const [newSubcomment, setNewSubcomment] = useState("");
  const [isAddingSubcomment, setIsAddingSubcomment] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tooltipRef.current && isVisible) {
      // Adjust position to make sure tooltip stays within viewport
      const rect = tooltipRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      // Adjust horizontal position if needed
      let adjustedX = position.x;
      if (position.x + rect.width > viewport.width - 20) {
        adjustedX = viewport.width - rect.width - 20;
      }
      
      // Adjust vertical position if needed
      let adjustedY = position.y;
      if (position.y + rect.height > viewport.height - 20) {
        adjustedY = viewport.height - rect.height - 20;
      }
      
      tooltipRef.current.style.left = `${adjustedX}px`;
      tooltipRef.current.style.top = `${adjustedY}px`;
    }
  }, [position, isVisible, commentId]);

  const handleAddSubcomment = () => {
    if (newSubcomment.trim()) {
      onAddSubcomment(commentId, newSubcomment);
      setNewSubcomment("");
      setIsAddingSubcomment(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      ref={tooltipRef}
      className="fixed z-50 shadow-lg w-80 rounded-md border border-zinc-300 bg-white dark:border-zinc-700"
      style={{ 
        top: 'auto',
        bottom: 20, 
        right: 20, 
        maxHeight: '50vh',
        overflowY: 'auto',
      }}
    >
      <div className="flex justify-between p-3 items-start mb-2 sticky top-0 bg-white z-10">
        <h3 className="text-sm font-medium">Feedback:</h3>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6" 
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {selectedText && (
        <div className="text-xs italic bg-zinc-100 bg-zinc-200 p-2 mb-2 rounded">
          "{selectedText}"
        </div>
      )}
      
      <p className="text-sm p-3">{commentText}</p>
      
      {suggestion && (
        <div className="mt-2">
          <p className="text-sm italic">{suggestion}</p>
          <Button 
            size="sm" 
            className="mt-1" 
            onClick={() => onApplySuggestion(commentId)}
          >
            Apply Suggestion
          </Button>
        </div>
      )}

      {subcomments.length > 0 && (
        <div className="mt-3 pl-3 border-l border-zinc-200 dark:border-zinc-700">
          <h4 className="text-xs font-medium mb-1">Discussion:</h4>
          {subcomments.map((subcomment) => (
            <div key={subcomment.id} className="text-xs mt-1 bg-zinc-100 bg-zinc-200 p-1.5 rounded">
              {subcomment.text}
            </div>
          ))}
        </div>
      )}

      {isAddingSubcomment ? (
        <div className="mt-2">
          <Textarea
            value={newSubcomment}
            onChange={(e) => setNewSubcomment(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-[60px] text-sm"
          />
          <div className="flex gap-2 mt-1">
            <Button size="sm" onClick={handleAddSubcomment}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => setIsAddingSubcomment(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button 
          size="sm" 
          variant="ghost" 
          className="mt-2 text-xs"
          onClick={() => setIsAddingSubcomment(true)}
        >
          Add comment
        </Button>
      )}
    </div>
  );
};

export default CommentView; 