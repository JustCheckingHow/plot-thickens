import { Chapter } from "@/types/Chapter";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import "./TextView.scss";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Edit } from "lucide-react";
import { MD5 } from "@/lib/utils";
import { toast } from "sonner";
import CommentView from "@/components/CommentView/CommentView";
import axiosInstance from "@/api/axios";

const TextView = ({chapters, setChapters, currentChapter, analyzeText, handleAddnewChapter, setCurrentChapter}: {chapters: Chapter[], setChapters: (chapters: Chapter[]) => void, currentChapter: number, analyzeText: (chapter: number) => void, handleAddnewChapter: () => void, setCurrentChapter: (chapter: number) => void}) => {
    const [isTextEditing, setIsTextEditing] = useState(false);
    const textContainerRef = useRef<HTMLDivElement>(null);
    const [comment, setComment] = useState('');
    const [activeTextSelection, setActiveTextSelection] = useState('');
    const pendingSubcommentsRef = useRef<Record<string, Set<string>>>({});
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [isCommentVisible, setIsCommentVisible] = useState(false);

    const handleEditText = () => {
        if(isTextEditing){
            setIsTextEditing(false);
            analyzeText(currentChapter);
        } else {
            setIsTextEditing(true);
        }
    }

    useEffect(() => {
        // Add event listeners after the component mounts or text changes
        if (!textContainerRef.current) return;

        const container = textContainerRef.current;
        
        // Process all comment elements in the container
        const addEventListeners = () => {
            const commentElements = container.querySelectorAll('comment');
            
            commentElements.forEach(element => {
                element.setAttribute('style', 'border-bottom: 1px dashed #666; cursor: pointer;');

                console.log(element);
                
                element.addEventListener('mouseover', (e) => {
                    const target = e.currentTarget as HTMLElement;
                    const commentText = target.getAttribute('comment');
                    const text = target.textContent || '';
                    
                    if (commentText) {
                        setComment(commentText);
                        setActiveTextSelection(text);
                    }
                });
                
                element.addEventListener('mouseout', () => {
                    // Keep the comment visible, don't clear it
                    // setComment('');
                });
                
                element.addEventListener('click', (e) => {
                    const target = e.currentTarget as HTMLElement;
                    const commentText = target.id;
                    const text = target.textContent || '';
                    const rect = target.getBoundingClientRect();
                    
                    if (text && commentText) {
                        setComment(commentText);
                        setActiveTextSelection(text);
                        
                        // Position on right margin, aligned with the comment vertically
                        const rightMarginPosition = {
                            x: window.innerWidth - 340, // 300px width + 40px margin
                            y: rect.top + window.scrollY
                        };
                        
                        setTooltipPosition(rightMarginPosition);
                        setIsCommentVisible(true);
                    }
                });
            });
        };
        
        // Add event listeners initially
        addEventListeners();
        
        // Use MutationObserver to detect changes in the DOM
        const observer = new MutationObserver(addEventListeners);
        observer.observe(container, { childList: true, subtree: true });
        
        return () => {
            observer.disconnect();
        };
    }, [chapters[currentChapter].comments]);
    
    const applySuggestion = (commentId: string) => {
        const hash8byte = MD5(activeTextSelection).slice(0, 8);
        toast.success("Suggestion applied");
        setChapters((prevChapters: Chapter[]) => {
            const newChapters = [...prevChapters];
            newChapters[currentChapter] = {
                ...newChapters[currentChapter],
                text: newChapters[currentChapter].text.replace(
                    activeTextSelection,
                    `<comment id=${hash8byte}>${activeTextSelection}</comment>`
                ),
                comments: {
                    ...newChapters[currentChapter].comments,
                    [hash8byte]: comment,
                    [hash8byte + '_suggestion']: comment
                }
            };
            return newChapters;
        });
        setActiveTextSelection('');
    };
    
    const addSubcomment = (commentId: string, subcommentText: string) => {
        // --- Check and set pending ref ---
        if (!pendingSubcommentsRef.current[commentId]) {
            pendingSubcommentsRef.current[commentId] = new Set();
        }
        if (pendingSubcommentsRef.current[commentId].has(subcommentText)) {
            console.log("Subcomment addition already in progress:", commentId, subcommentText);
            return; // Already processing this exact subcomment
        }
        // Mark as pending
        pendingSubcommentsRef.current[commentId].add(subcommentText);
        // --- End ref check ---

        // Get current comments from the latest state (needed for API call)
        const currentComments = chapters[currentChapter].comments;
        const existingSubcomments = currentComments[commentId + '_subcomments'] || '';

        // Check if the subcomment *already exists in the state* (handles cases where it was added previously)
        const subcommentExistsInState = existingSubcomments
            .split('|||')
            .some(entry => {
                const [, text] = entry.split(':');
                return text === subcommentText;
            });

        if (subcommentExistsInState) {
            console.warn("Attempted to add duplicate subcomment (already in state).");
            // Clean up the pending flag as we are aborting
            pendingSubcommentsRef.current[commentId]?.delete(subcommentText);
            return;
        }

        try {
            // Create a unique ID for the subcomment
            const subcommentId = `${commentId}_sub_${Date.now()}`;

            // --- Add user's subcomment to state immediately ---
            const updatedSubcommentsWithUser = existingSubcomments
                ? `${existingSubcomments}|||${subcommentId}:${subcommentText}`
                : `${subcommentId}:${subcommentText}`;

            setChapters(prev => {
                const newChapters = [...prev];
                // Ensure chapter exists (safety check)
                if (!newChapters[currentChapter]) return prev;
                 newChapters[currentChapter] = {
                    ...newChapters[currentChapter],
                    comments: {
                        ...newChapters[currentChapter].comments,
                        [commentId + '_subcomments']: updatedSubcommentsWithUser
                    }
                };
                return newChapters;
            });
            // --- End immediate user subcomment update ---

            // Prepare data for API call (include the user's new comment)
            const commentsAndSubcommentsForAPI = [
                currentComments[commentId], // Original comment text
                ...parseSubcomments(updatedSubcommentsWithUser) // Use the string *with* the user's new comment
                    .map(subcomment => subcomment.text)
            ];

            // Now make the API call
            axiosInstance.post('api/comment-discussion', {
                chapter_number: currentChapter,
                chapter_text: chapters[currentChapter].text, // Send the current text
                comments: commentsAndSubcommentsForAPI,
                current_storyboard: chapters[currentChapter] // Consider if this needs to be fresher state
            }).then((response) => {
                // If AI provides a reply, update the state again to add it
                if (response.data.reply) {
                    setChapters(prev => {
                        const newChapters = [...prev];
                         // Ensure chapter exists (safety check)
                        if (!newChapters[currentChapter]) return prev;

                        // Get the latest subcomments string from the potentially updated state
                        const currentSubcommentsInState = newChapters[currentChapter].comments[commentId + '_subcomments'] || '';
                        const aiSubcommentId = `${commentId}_ai_${Date.now()}`;
                        const finalSubcommentsWithAI = `${currentSubcommentsInState}|||${aiSubcommentId}:${response.data.reply}`;

                        // Check if the AI's reply is not identical to the previous comment
                        const subcomments = parseSubcomments(currentSubcommentsInState);
                        const lastSubcomment = subcomments[subcomments.length - 1];
                        
                        // If the last comment is identical to the AI reply, don't add it
                        if (lastSubcomment && lastSubcomment.text === response.data.reply) {
                            // Skip adding duplicate AI reply
                            return newChapters;
                        }

                        newChapters[currentChapter].comments = {
                            ...newChapters[currentChapter].comments,
                            [commentId + '_subcomments']: finalSubcommentsWithAI
                        };

                        return newChapters;
                    });
                }
            }).catch(error => {
                console.error("Error fetching AI reply:", error);
                toast.error("Failed to get AI reply for the comment.");
                // Consider reverting the user's comment add here if the API call fails critically
                // For now, we leave the user's comment added.
            }).finally(() => {
                 // --- Clean up pending ref after API call attempt (success or fail) ---
                 pendingSubcommentsRef.current[commentId]?.delete(subcommentText);
                 if (pendingSubcommentsRef.current[commentId]?.size === 0) {
                     delete pendingSubcommentsRef.current[commentId];
                 }
                 // --- End ref cleanup ---
            });
        } catch (error) {
             // Catch synchronous errors during the setup/state update
             console.error("Error during subcomment addition setup:", error);
             toast.error("Failed to add subcomment.");
              // --- Clean up pending ref in case of synchronous error ---
             pendingSubcommentsRef.current[commentId]?.delete(subcommentText);
             if (pendingSubcommentsRef.current[commentId]?.size === 0) {
                 delete pendingSubcommentsRef.current[commentId];
             }
            // --- End ref cleanup ---
        }
    };

    const parseSubcomments = (subcommentsString?: string) => {
        if (!subcommentsString) return [];

        return subcommentsString.split('|||').map(subcomment => {
            const [id, text] = subcomment.split(':');
            // Basic check for valid format
            if (id === undefined || text === undefined) {
                console.warn("Malformed subcomment entry:", subcomment);
                return null; // Or handle differently
            }
            return { id, text };
        }).filter(Boolean) as { id: string; text: string }[]; // Filter out nulls and assert type
    };
    
    return (
        <div className="text-view container">
            <div className="heading mb-4 pb-4">
                <Label htmlFor="chapter-title">Chapter Title</Label>
                <Input
                    style={{fontSize: "32px"}}
                    id="chapter-title" className="heading__h2 text-4xl mt-2 font-bold mb-4" value={chapters[currentChapter].title || ""} placeholder="Chapter title" onChange={(e) => setChapters((prev: Chapter[]) => {
                    const newChapters = [...prev];
                    newChapters[currentChapter] = {
                        ...newChapters[currentChapter],
                        title: e.target.value
                    };
                    return newChapters;
                })} />
            </div>
            <hr />
            <div className="flex gap-2 mt-2 justify-end">
                <Button onClick={handleEditText} size="icon">{isTextEditing ? <Check className="h-4 w-4" /> : <Edit className="h-4 w-4" />}</Button>
            </div>
            <CommentView 
                commentId={comment}
                commentText={chapters[currentChapter].comments[comment] || "Click on marked text to view comments"}
                suggestion={chapters[currentChapter].comments[comment + '_suggestion'] || ""}
                selectedText={activeTextSelection}
                onApplySuggestion={applySuggestion}
                onAddSubcomment={addSubcomment}
                subcomments={parseSubcomments(chapters[currentChapter].comments[comment + '_subcomments'])}
                position={tooltipPosition}
                isVisible={isCommentVisible && !!comment}
                onClose={() => setIsCommentVisible(false)}
            />
            <div className="content">
                {isTextEditing ? <Textarea value={chapters[currentChapter].text} onChange={(e) => setChapters((prev: Chapter[]) => {
                    const newChapters = [...prev];
                    newChapters[currentChapter] = {
                        ...newChapters[currentChapter],
                        text: e.target.value
                    };
                    return newChapters;
                })} /> : <div dangerouslySetInnerHTML={{ __html: chapters[currentChapter].text }} ref={textContainerRef}></div>}
            </div>
            <div className="flex gap-2 mt-6 justify-between">
                <div>
                    {currentChapter > 0 && <Button onClick={() => setCurrentChapter(currentChapter - 1)}>Previous Chapter</Button>}
                </div>
                <div>
                    {currentChapter < chapters.length - 1 && <Button onClick={() => setCurrentChapter(currentChapter + 1)}>Next Chapter</Button>}
                    {currentChapter == chapters.length - 1 && <Button onClick={() => handleAddnewChapter()}>Add Chapter</Button>}
                </div>
            </div>
        </div>
    )
}

export default TextView;