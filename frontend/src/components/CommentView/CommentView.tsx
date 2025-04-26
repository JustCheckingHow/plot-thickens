import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type CommentViewProps = {
  commentId: string;
  commentText: string;
  suggestion?: string;
  selectedText: string;
  onApplySuggestion: (commentId: string) => void;
  onAddSubcomment: (commentId: string, subcomment: string) => void;
  subcomments?: { id: string; text: string }[];
};

const CommentView = ({ 
  commentId, 
  commentText, 
  suggestion, 
  selectedText, 
  onApplySuggestion, 
  onAddSubcomment,
  subcomments = [],
}: CommentViewProps) => {
  const [newSubcomment, setNewSubcomment] = useState("");
  const [isAddingSubcomment, setIsAddingSubcomment] = useState(false);

  const handleAddSubcomment = () => {
    if (newSubcomment.trim()) {
      onAddSubcomment(commentId, newSubcomment);
      setNewSubcomment("");
      setIsAddingSubcomment(false);
    }
  };

  return (
    <div className="mt-4 p-3 rounded-md border border-zinc-800 dark:border-zinc-700 bg-zinc-200">
      <h3 className="text-sm font-medium mb-1">Feedback:</h3>
      {selectedText && (
        <div className="text-xs italic bg-zinc-100 p-2 mb-2 rounded">
          "{selectedText}"
        </div>
      )}
      <p className="text-sm">{commentText}</p>
      
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
            <div key={subcomment.id} className="text-xs mt-1 bg-zinc-100 dark:bg-zinc-800/50 p-1.5 rounded">
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