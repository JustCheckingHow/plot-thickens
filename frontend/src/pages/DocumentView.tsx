import { useEffect, useState, useRef } from "react";
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
    const { sendMessage: grammarInspect, lastMessage: grammarInspectLastMessage } = useWebSocket(API_URL.replace(/^http/, "ws") + "/api/grammar-inspector", {
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

    const pendingSubcommentsRef = useRef<Record<string, Set<string>>>({});


    useEffect(() => {
        if (state && state.chapters) {
            // @ts-ignore
            setChapters(state.chapters.map((text, index): Chapter => ({
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
        if (!grammarInspectLastMessage) return;
        const data = JSON.parse(grammarInspectLastMessage.data);
        if (data && data.original_text) {
            const { original_text, comment, suggestion } = data;
            const hash8byte = MD5(original_text).slice(0, 8);
            toast.success(comment);
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
                        [hash8byte + '_suggestion']: suggestion
                    }
                };
                return newChapters;
            });
        }
    }, [grammarInspectLastMessage])
    

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
        if (data && data.error) {
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

    const analyzeGrammar = async (chapterNumber: number) => {
        console.log("Analyzing grammar");
        await grammarInspect(JSON.stringify({
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


    const refineChapter = async (chapterNumber: number) => {

        const response = await axiosInstance.post('api/incremental-storyboard', {
            chapter_text: chapters[chapterNumber].text,
            chapter_number: chapters[chapterNumber].order,
            previous_storyboards: chapters.slice(0, chapterNumber).map(chapter => ({
                chapter_number: chapter.order,
                character_summary: chapter.character_summary,
                location_summary: chapter.location_summary,
                character_relationship_graph: chapter.character_relationship_graph,
                timeline_summary: chapter.timeline_summary,
                plotpoint_summary: chapter.plotpoint_summary
            }))
        }).then((response) => {
            const newChapterResponse: Chapter = {
                character_summary: response.data.character_summary,
                location_summary: response.data.location_summary,
                character_relationship_graph: response.data.character_relationship_graph,
                timeline_summary: response.data.timeline_summary,
                plotpoint_summary: response.data.plotpoint_summary,
                text: chapters[chapterNumber].text,
                title: chapters[chapterNumber].title,
                order: chapters[chapterNumber].order,
                comments: chapters[chapterNumber].comments
            }

            setChapters(prev => {
                const newChapters = [...prev];
                newChapters[chapterNumber] = {
                    ...newChapters[chapterNumber],
                    ...newChapterResponse
                };
                return newChapters;
            });
            toast.success(`Chapter "${newChapterResponse.title}" analyzed`);
            return newChapterResponse;
        }).catch(() => {
            toast.error('Failed to refine chapter');
            return chapters[chapterNumber];
        })
        return response;
    }

    // const applySuggestion = async (comment: string) => {
    //     setChapters(prev => {
    //         const newChapters = [...prev];
    //         newChapters[currentChapter] = {
    //             ...newChapters[currentChapter],
    //             text: newChapters[currentChapter].text.replace(
    //                 activeTextSelection,
    //                 activeTextSelection.replace(chapters[currentChapter].comments[comment], chapters[currentChapter].comments[comment + '_suggestion'])
    //             ),
    //             comments: {
    //                 ...newChapters[currentChapter].comments,
    //                 [comment]: chapters[currentChapter].comments[comment + '_suggestion'],
    //                 [comment + '_suggestion']: ""
    //             }
    //         };
    //         return newChapters;
    //     });
    //     toast.success('Suggestion applied');
    // }
    
    const logicInspectChapters = async (chapterNumber: number) => {
        let character_summary = "";
        let location_summary = "";

        for(let i = 0; i < chapterNumber; i++){
            let response: Chapter = chapters[i];
            if(chapters[i].character_summary == "" || chapters[i].location_summary == ""){
                response = await refineChapter(i);
            }
            console.log("Adding character summary", response);
            character_summary += response.character_summary;
            location_summary += response.location_summary;
        }

        if (chapters[chapterNumber].character_summary == "" || chapters[chapterNumber].location_summary == ""){
            await refineChapter(chapterNumber);
        }

        await logicInspect(JSON.stringify({
            character_summary: character_summary,
            location_summary: location_summary,
            text: chapters[chapterNumber].text
        }));
    }

    return (
        <div className="w-full flex " style={{paddingLeft: "240px"}}>
            <Nav
                chapters={chapters}
                changeChapter={(chapterIndex) => setCurrentChapter(chapterIndex)}
                currentChapter={currentChapter}
                updateStylePrompt={updateStylePrompt}
                // resetBook={resetBook}
                logicInspectChapters={logicInspectChapters}
                analyzeGrammar={analyzeGrammar}
                analyzeText={analyzeText}
            />
            <div className="content container">
                <TextView
                    chapters={chapters}
                    setChapters={setChapters}
                    currentChapter={currentChapter}
                    setCurrentChapter={setCurrentChapter}
                    handleAddnewChapter={handleAddnewChapter}
                    analyzeText={analyzeText}
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
