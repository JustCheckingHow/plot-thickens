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
import { ModalContext } from "@/context/ModalContext";

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
    const [chapterAnalyzeLoading, setChapterAnalyzeLoading] = useState(false);

    const textContainerRef = useRef<HTMLDivElement>(null);
    const pendingSubcommentsRef = useRef<Record<string, Set<string>>>({});

    const { modalVisible, setModalVisible } = ModalContext;

    useEffect(() => {
        if (state && state.chapters) {
            setChapters(state.chapters.map((text, index): { text: string, title: string, order: number } => ({
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
            const { original_text, comment } = data;
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
                        [hash8byte + '_suggestion']: data.suggestion
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
                    character_summary: response.data.character_summary,
                    location_summary: response.data.location_summary,
                    character_relationship_graph: response.data.character_relationship_graph,
                    timeline_summary: response.data.timeline_summary,
                    plotpoint_summary: response.data.plotpoint_summary
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

    const refineChapter = async (chapterNumber: number) => {
        setChapterAnalyzeLoading(true);

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
            setChapterAnalyzeLoading(false);
            toast.success(`Chapter "${newChapterResponse.title}" analyzed`);
            return newChapterResponse;
        }).catch(() => {
            setChapterAnalyzeLoading(false);
            toast.error('Failed to refine chapter');
            return chapters[chapterNumber];
        })
        return response;
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
        <div className="w-full flex " style={{paddingLeft: "240px"}}>
            <Nav
                chapters={chapters}
                handleAddnewChapter={handleAddnewChapter}
                currentChapter={currentChapter}
                setCurrentChapter={setCurrentChapter}
                removeChapter={removeChapter}
                updateStylePrompt={updateStylePrompt}
                logicInspectChapters={logicInspectChapters}
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
