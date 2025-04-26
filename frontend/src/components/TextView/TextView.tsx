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

const TextView = ({chapters, setChapters, currentChapter, analyzeText, handleAddnewChapter, setCurrentChapter}: {chapters: Chapter[], setChapters: (chapters: Chapter[]) => void, currentChapter: number, analyzeText: (chapter: number) => void, handleAddnewChapter: () => void, setCurrentChapter: (chapter: number) => void}) => {
    const [isTextEditing, setIsTextEditing] = useState(false);
    const textContainerRef = useRef<HTMLDivElement>(null);
    const [comment, setComment] = useState('');
    const [activeTextSelection, setActiveTextSelection] = useState('');
    
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
                element.setAttribute('style', 'border-bottom: 1px dashed #666; cursor: pointer; background:rgb(75, 82, 75, .35)');

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
                    
                    if (text && commentText) {
                        setComment(commentText);
                        setActiveTextSelection(text);
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
    
    return (
        <div className="text-view container">
            <div className="heading mb-4 pb-4">
                <Label htmlFor="chapter-title">Chapter Title</Label>
                <Input
                    style={{fontSize: "32px"}}
                    id="chapter-title" className="heading__h2 text-4xl mt-2 font-bold mb-4" value={chapters[currentChapter].title || ""} 
                    placeholder="Chapter title" onChange={(e) => setChapters(prev => {
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
                    <CommentView currentChapter={currentChapter} analyzeText={analyzeText} chapters={chapters} setChapters={setChapters} comment={comment} />
            <div className="content">
                {isTextEditing ? <Textarea value={chapters[currentChapter].text} onChange={(e) => setChapters(prev => {
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

const CommentView = ({currentChapter, analyzeText, chapters, setChapters, comment}: {currentChapter: number, analyzeText: (chapter: number) => void, chapters: Chapter[], setChapters: (chapters: Chapter[]) => void, comment: string}) => {
    const [activeTextSelection, setActiveTextSelection] = useState('');
    const applySuggestion = (comment: string) => {
        const hash8byte = MD5(activeTextSelection).slice(0, 8);
        toast.success("New comment added");
        const newChapters = [...chapters];
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
        setChapters(newChapters);
        setActiveTextSelection('');
    };
    return (
        <div className="mt-4 p-3 rounded-md comment">
            <h3 className="text-sm font-medium mb-1">Feedback:</h3>
                {activeTextSelection && (
                    <div className="text-xs italic bg-zinc-600 p-2 mb-2 rounded">
                        "{activeTextSelection}"
                    </div>
                )}
                <p className="text-sm">{chapters[currentChapter].comments[comment] || "Click on marked text to view comments"}</p>
                <p className="text-sm italic">{chapters[currentChapter].comments[comment + '_suggestion'] || ""} <Button onClick={() => applySuggestion(comment)}>Zastosuj</Button></p>
        </div>
    )
}

export default TextView;