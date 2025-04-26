import { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import axiosInstance, { API_URL } from "@/api/axios";
import { toast } from "sonner";
import { Chapter } from "@/types/Chapter";
import { MD5 } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import Nav from "@/components/Nav/Nav";
import TextView from "@/components/TextView/TextView";
import ModalBigScreen from "@/components/ModalBigScreen/ModalBigScreen";

const DocumentView = () => {
    const { state } = useLocation();
    const { sendMessage, lastMessage } = useWebSocket(API_URL.replace(/^http/, "ws") + "/api/style-guard", {
        shouldReconnect: () => true
    });
    const { sendMessage: logicInspect, lastMessage: logicInspectLastMessage } = useWebSocket(API_URL.replace(/^http/, "ws") + "/api/logic-inspector", {
        shouldReconnect: () => true
    });
    const dummyBook = {
        "title": "",
        "order": 0,
        "text": '',
        "character_summary": "",
        "location_summary": "",
        "character_relationship_graph": "",
        "timeline_summary": "",
        "plotpoint_summary": "",
        "comments": {}
    }
    const [chapters, setChapters] = useState<Chapter[]>([
        dummyBook
    ]);
    const [currentChapter, setCurrentChapter] = useState(0);
    const [chapterAnalyzeLoading, setChapterAnalyzeLoading] = useState(false);

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
                    plotpoint_summary: response.data.plotpoints_summaries
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

    const logicInspectChapters = async () => {
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
        toast.success('Suggestion applied');
    }

    return (
        <div className="flex w-[100vw]" style={{paddingLeft: "200px"}}>
            <Nav
                chapters={chapters}
                handleAddnewChapter={handleAddnewChapter}
                changeChapter={setCurrentChapter}
                currentChapter={currentChapter}
                removeChapter={removeChapter}
                updateStylePrompt={updateStylePrompt}
                resetBook={resetBook}
                analyzeChapter={analyzeChapter}
                chapterAnalyzeLoading={chapterAnalyzeLoading}
                setChapterAnalyzeLoading={setChapterAnalyzeLoading}
                logicInspectChapters={logicInspectChapters}
            />      
            <div className="container mx-auto py-4">
                <TextView
                    analyzeText={analyzeText}
                    chapters={chapters}
                    setChapters={setChapters}
                    currentChapter={currentChapter}
                    handleAddnewChapter={handleAddnewChapter}
                    setCurrentChapter={setCurrentChapter}
                />
            </div>
            <ModalBigScreen
                chapters={chapters}
                currentChapter={currentChapter}
            />
        </div>
    )
}

export default DocumentView;
