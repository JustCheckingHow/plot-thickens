import Chapters from "@/components/Chapters/Chapters";
import { StylePopup } from "@/components/StylePopup/StylePopup";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import useWebSocket from "react-use-websocket";
import axiosInstance, { API_URL } from "@/api/axios";
import { toast } from "sonner";
import MermaidChart from "@/components/MermaindChart";
import { Chapter } from "@/types/Chapter";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import CharacterSummary from "@/components/DocumentView/CharacterSummary";
import {
    Menubar,
    MenubarTrigger,
    MenubarMenu,
  } from "@/components/ui/menubar";
import LocationSummary from "@/components/DocumentView/LocationSummary";
import { Label } from "@/components/ui/label";
import { Check, Edit, Loader2 } from "lucide-react";
import { MD5 } from "@/lib/utils";
import ExportPopup from "@/components/ExportPopup/ExportPopup";
import { useLocation } from "react-router-dom";

const DocumentView = () => {
    const { state } = useLocation();
    const { sendMessage, lastMessage } = useWebSocket(API_URL.replace(/^http/, "ws") + "/api/style-guard", {
        shouldReconnect: () => true
    });
    const { sendMessage: logicInspect, lastMessage: logicInspectLastMessage } = useWebSocket(API_URL.replace(/^http/, "ws") + "/api/logic-inspector", {
        shouldReconnect: () => true
    });
    const dummyBook = {
        "title": "Example title",
        "order": 0,
        "text": 'The hum of the Odyssey\'s life support was a constant, mournful drone in Captain Eva Rostova\'s ears. It was the sound of scarcity, the sound of a colony slowly, inevitably, dimming into oblivion. Below, on the surface of Cygnus X-1\'s third moon, Station Epsilon flickered like a dying ember. Power reserves were critical. The fusion core, once a vibrant heart, now sputtered, fed by dwindling deuterium mined from the moon\'s thin crust. Eva ran a calloused hand over the worn navigation console. Images of her daughter, Anya, played on a small, cracked screen beside it. Anya\'s face, thin but still bright-eyed, a stark reminder of what was at stake. "Find the light, Mama," Anya had whispered during their last comms burst, her voice frail. That light, they hoped, lay trillions of kilometers away, in the uncharted sector designated \'Xylos\'. Scans from ancient probes hinted at unusual energy signatures, isotopes unlike anything known in colonized space. Yo mama test xd. It was a long shot, a desperate gamble, but the only one they had left. Eva wasn\'t a natural explorer. She was an engineer, a pilot who preferred the predictable physics of orbital mechanics to the terrifying unknowns of deep space. But when the call went out for a volunteer to pilot the Odyssey, their last FTL-capable ship, towards the faint hope of Xylos, Eva hadn\'t hesitated. Her skills were necessary, yes, but it was Anya\'s face, and the faces of every child on Epsilon, that fueled her resolve. She carried the weight of a dying colony on her shoulders, and that weight was a constant, crushing pressure, yet it forged her determination into something unbreakable. Failure was not an option.',
        "character_summary": "",
        "location_summary": "",
        "character_relationship_graph": "",
        "timeline_summary": "",
        "plotpoint_summary": "",
        "comments": {}
    }
    const [comment, setComment] = useState('');
    const [activeTextSelection, setActiveTextSelection] = useState('');
    const [chapters, setChapters] = useState<Chapter[]>([
        dummyBook
    ]);
    const [currentChapter, setCurrentChapter] = useState(0);
    const [isTextEditing, setIsTextEditing] = useState(false);
    const [chapterAnalyzeLoading, setChapterAnalyzeLoading] = useState(false);

    const textContainerRef = useRef<HTMLDivElement>(null);
    const [currentView, setCurrentView] = useState<'character_summary' | 'location_summary' | 'character_relationship_graph' | 'timeline_summary' | 'comments' | 'plotpoint_summary'>('comments');

    useEffect(() => {
        if (state && state.chapters) {
            setChapters(state.chapters.map((text, index) : {text: string, title: string, order: number} => ({
                "text": text,
                "title": state.chapter_names[index],
                "order": index,
                "character_summary": "",
                "location_summary": "",
                "character_relationship_graph": "",
                "timeline_summary": "",
                "plotpoint_summary": "",
                "comments": {}
            })));
            setCurrentChapter(0);
        }
    }, [state])

    useEffect(() => {
        const styleText = localStorage.getItem('styleText') || '';
        updateStylePrompt(styleText);
    }, [])

    useEffect(() => {
        localStorage.setItem('chapters', JSON.stringify(chapters));
        localStorage.setItem('currentChapter', JSON.stringify(currentChapter));
    }, [chapters, currentChapter])

    useEffect(() => {
        if (!logicInspectLastMessage) return;
        const data = JSON.parse(logicInspectLastMessage.data);
        if (data && data.original_text) {
            const { original_text, comment } = data;
            const hash8byte = MD5(original_text).slice(0, 8);
            toast.success("New comment added");
            setChapters(prevChapters => {
                const newChapters = [...prevChapters];
                newChapters[currentChapter] = {
                    ...newChapters[currentChapter],
                    text: newChapters[currentChapter].text.replace(
                        original_text,
                        `<comment id=${hash8byte}>${original_text}</comment>`
                    ),
                    comments: {
                        ...newChapters[currentChapter].comments,
                        [hash8byte]: comment,
                        [hash8byte + '_suggestion']: data.suggestion
                    }
                };
                return newChapters;
            });
        }
    }, [logicInspectLastMessage])

    useEffect(() => {
        if (!lastMessage) return;
        const data = JSON.parse(lastMessage.data);
        if (data && data.original_text) {
            const { original_text, comment } = data;
            const hash8byte = MD5(original_text).slice(0, 8);
            toast.success("New comment added");
            setChapters(prevChapters => {
                const newChapters = [...prevChapters];
                newChapters[currentChapter] = {
                    ...newChapters[currentChapter],
                    text: newChapters[currentChapter].text.replace(
                        original_text,
                        `<comment id=${hash8byte}>${original_text}</comment>`
                    ),
                    comments: {
                        ...newChapters[currentChapter].comments,
                        [hash8byte]: comment
                    }
                };
                return newChapters;
            });
        }
        if (data && data.status === "style_prompt_updated") {
            toast.success("Style text updated");
        }
        if(data && data.error){
            toast.error(data.error);
        }
    }, [lastMessage]);

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
                    
                    if (text && commentText) {
                        console.log(chapters);
                        setCurrentView('comments');
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
    
    const updateStylePrompt = async (style: string) => {
        await sendMessage(JSON.stringify({
            "style_prompt": style
        }));
    }

    const analyzeText = async (chapterNumber: number) => {
        await sendMessage(JSON.stringify({
            "text": chapters[chapterNumber].text
        }));
    }

    const handleEditText = () => {
        if(isTextEditing){
            setIsTextEditing(false);
            analyzeText(currentChapter);
        } else {
            setIsTextEditing(true);
        }
    }

    const removeChapter = (order: number) => {
        setChapters(prev => prev.filter(chapter => chapter.order !== order));
        setCurrentChapter(prev => prev - 1);
    }

    const handleAddnewChapter = () => {
        setChapters(prev => [...prev, {
            raw_text: '',
            text: '',
            title: '',
            character_summary: '',
            order: prev.length,
            location_summary: '',
            character_relationship_graph: '',
            timeline_summary: '',
            plotpoint_summary: '',
            comments: {}
        }]);
        setCurrentChapter(chapters.length);
    }

    const analyzeChapter = async (chapterNumber: number) => {
        setChapterAnalyzeLoading(true);
        await axiosInstance.post('api/chapter-storyboard', {
            chapter_text: chapters[chapterNumber].text,
            chapter_number: chapters[chapterNumber].order
        }).then((response) => {
            console.log(response.data);
            setChapters(prev => {
                const newChapters = [...prev];
                newChapters[chapterNumber] = {
                    ...newChapters[chapterNumber],
                    character_summary: response.data.character_summaries,
                    location_summary: response.data.location_summaries,
                    character_relationship_graph: response.data.character_relationship_graph,
                    timeline_summary: response.data.timeline_summaries,
                    plotpoint_summary: response.data.plotpoint_summaries
                };
                return newChapters;
            });
            setChapterAnalyzeLoading(false);
            console.log(chapters);
            toast.success('Chapter analyzed');
        }).catch(() => {
            setChapterAnalyzeLoading(false);
            toast.error('Failed to analyze chapter');
        })
    }

    const resetBook = () => {
        setChapters([dummyBook]);
        setCurrentChapter(0);
        localStorage.setItem('chapters', JSON.stringify([]));
    }

    const summarizeBook = async () => {
        
    }
    
    const applySuggestion = async (comment: string) => {
        setChapters(prev => {
            const newChapters = [...prev];
            newChapters[currentChapter] = {
                ...newChapters[currentChapter],
                text: newChapters[currentChapter].text.replace(
                    activeTextSelection,
                    activeTextSelection.replace(chapters[currentChapter].comments[comment], chapters[currentChapter].comments[comment + '_suggestion'])
                ),
                comments: {
                    ...newChapters[currentChapter].comments,
                    [comment]: chapters[currentChapter].comments[comment + '_suggestion'],
                    [comment + '_suggestion']: ""
                }
            };
            return newChapters;
        });
        setCurrentView('comments');
        toast.success('Suggestion applied');
    }
    
    const logicInspectChapters = async () => {
        if(isTextEditing){
            toast.error('Please finish editing before summarizing');
            return;
        }

        let character_summaries = "";
        let location_summaries = "";

        for(let i = 0; i < chapters.length-1; i++){
            if(chapters[i].character_summary == "" || chapters[i].location_summary == ""){
                await analyzeChapter(i);
            }
            character_summaries += chapters[i].character_summary;
            location_summaries += chapters[i].location_summary;
        }

        await logicInspect(JSON.stringify({
            character_summaries: character_summaries,
            location_summaries: location_summaries,
            text: chapters[currentChapter].text
        }));
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold mb-4">Your book</h2>
                <div className="flex gap-2">
                    
                    <Button onClick={resetBook} variant="destructive">Clear book</Button>
                    <StylePopup updateStylePrompt={updateStylePrompt}/>
                    <Button onClick={summarizeBook}>Summarize</Button>
                    <ExportPopup content={chapters.map(chapter => "# " + chapter.title + "\n\n" + chapter.text).join('\n\n')} comments={chapters.map(chapter => chapter.comments).reduce((acc, curr) => ({...acc, ...curr}), {})} />
                </div>
            </div>
            
            <Chapters
                chapters={chapters}
                handleAddnewChapter={handleAddnewChapter}
                changeChapter={setCurrentChapter}
                currentChapter={currentChapter}
                removeChapter={removeChapter}/>
            <div className="flex gap-4 mt-4">
                <div className="bg-zinc-800 flex-1 px-4 py-4 overflow-y-auto max-h-[90vh] relative" ref={textContainerRef}>
                    <Label htmlFor="chapter-titl">Chapter Title</Label>
                    <Input
                     id="chapter-title"
                     className="mt-2"
                     value={chapters[currentChapter].title || ""}
                     placeholder="Chapter title"
                     onChange={(e) => setChapters(prev => {
                        const newChapters = [...prev];
                        newChapters[currentChapter] = {
                            ...newChapters[currentChapter],
                            title: e.target.value
                        };
                        return newChapters;
                    })} /><br/>
                    {(isTextEditing) ? <Textarea
                        value={chapters[currentChapter].text || ""}
                        onChange={(e) => setChapters(prev => {
                            const newChapters = [...prev];
                            newChapters[currentChapter] = {
                                ...newChapters[currentChapter],
                                text: e.target.value
                            };
                            return newChapters;
                        })}
                    /> : <div dangerouslySetInnerHTML={{ __html: chapters[currentChapter].text }}></div>}

                    <div className="flex gap-2 mt-2 justify-end">
                        <Button onClick={handleEditText} size="icon" variant="outline">{isTextEditing ? <Check className="h-4 w-4" /> : <Edit className="h-4 w-4" />}</Button>
                    </div>
                </div>
                <div className="bg-zinc-800 flex-1 px-4 py-4">
                    <div>
                        <Menubar>
                            <MenubarMenu>
                                    <MenubarTrigger onClick={() => setCurrentView('character_summary')}>Character Summary</MenubarTrigger>
                            </MenubarMenu>
                            <MenubarMenu>
                                    <MenubarTrigger onClick={() => setCurrentView('location_summary')}>Location Summary</MenubarTrigger>
                            </MenubarMenu>
                            <MenubarMenu>
                                    <MenubarTrigger onClick={() => setCurrentView('character_relationship_graph')}>Character Relationship Graph</MenubarTrigger>
                            </MenubarMenu>
                            <MenubarMenu>
                                    <MenubarTrigger onClick={() => setCurrentView('timeline_summary')}>Timeline Summary</MenubarTrigger>
                            </MenubarMenu>
                            <MenubarMenu>
                                    <MenubarTrigger onClick={() => setCurrentView('plotpoint_summary')}>Plot Points</MenubarTrigger>
                            </MenubarMenu>
                            <MenubarMenu>
                                    <MenubarTrigger onClick={() => setCurrentView('comments')}>Comments</MenubarTrigger>
                            </MenubarMenu>
                        </Menubar>
                    </div>

                    {currentView === "location_summary" && <LocationSummary location_summary={chapters[currentChapter].location_summary}/>}
                    {currentView === "character_summary" && chapters[currentChapter].character_summary && <CharacterSummary character_summary={chapters[currentChapter].character_summary}/>}
                    {currentView === "character_relationship_graph" && chapters[currentChapter].character_relationship_graph ? <MermaidChart chart={chapters[currentChapter].character_relationship_graph}/> : <div>Loading...</div>}
                    {currentView === "timeline_summary" && (
                        <div className="mt-4">
                            <h3 className="text-lg font-medium mb-2">Timeline Summary</h3>
                            {chapters[currentChapter].timeline_summary ? (
                                <p>{chapters[currentChapter].timeline_summary}</p>
                            ) : (
                                <p className="text-sm text-zinc-400">No timeline information available yet. Analyze the chapter first.</p>
                            )}
                        </div>
                    )}
                    {currentView === "plotpoint_summary" && (
                        <div className="mt-4">
                            <h3 className="text-lg font-medium mb-2">Plot Points</h3>
                            {chapters[currentChapter].plotpoint_summary ? (
                                <p>{chapters[currentChapter].plotpoint_summary}</p>
                            ) : (
                                <p className="text-sm text-zinc-400">No plot point information available yet. Analyze the chapter first.</p>
                            )}
                        </div>
                    )}
                    {currentView === "comments" && (
                        <div>
                            <div className="flex gap-2 justify-center">
                                <Button onClick={() => analyzeText(currentChapter)}>Style text Analyze</Button>
                                {currentChapter > 0 && <Button onClick={logicInspectChapters}>Logic inspect</Button>}
                            </div>
                            <div className="mt-4 p-3 bg-zinc-700 rounded-md">
                                <h3 className="text-sm font-medium mb-1">Feedback:</h3>
                                {activeTextSelection && (
                                    <div className="text-xs italic bg-zinc-600 p-2 mb-2 rounded">
                                        "{activeTextSelection}"
                                    </div>
                                )}
                                <p className="text-sm">{chapters[currentChapter].comments[comment] || "Click on marked text to view comments"}</p>
                                <p className="text-sm italic">{chapters[currentChapter].comments[comment + '_suggestion'] || ""} <Button onClick={() => applySuggestion(comment)}>Zastosuj</Button></p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center mt-[auto] gap-4 items-center pt-6">
                        <Button onClick={() => analyzeChapter(currentChapter)} disabled={chapterAnalyzeLoading}>
                            {chapterAnalyzeLoading && <Loader2 className="animate-spin" />}
                            Analyze Chapter
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DocumentView;
