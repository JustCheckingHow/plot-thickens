import Chapters from "@/components/Chapters/Chapters";
import { StylePopup } from "@/components/StylePopup/StylePopup";
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import { API_URL } from "@/api/axios";
import { toast } from "sonner";
import crypto from "crypto";
// import React from "react"
import MermaidChart from "@/components/MermaindChart";


const DocumentView = () => {
    const [text] = useState('The hum of the Odyssey\'s life support was a constant, mournful drone in Captain Eva Rostova\'s ears. It was the sound of scarcity, the sound of a colony slowly, inevitably, dimming into oblivion. Below, on the surface of Cygnus X-1\'s third moon, Station Epsilon flickered like a dying ember. Power reserves were critical. The fusion core, once a vibrant heart, now sputtered, fed by dwindling deuterium mined from the moon\'s thin crust. Eva ran a calloused hand over the worn navigation console. Images of her daughter, Anya, played on a small, cracked screen beside it. Anya\'s face, thin but still bright-eyed, a stark reminder of what was at stake. "Find the light, Mama," Anya had whispered during their last comms burst, her voice frail. That light, they hoped, lay trillions of kilometers away, in the uncharted sector designated \'Xylos\'. Scans from ancient probes hinted at unusual energy signatures, isotopes unlike anything known in colonized space. It was a long shot, a desperate gamble, but the only one they had left. Eva wasn\'t a natural explorer. She was an engineer, a pilot who preferred the predictable physics of orbital mechanics to the terrifying unknowns of deep space. But when the call went out for a volunteer to pilot the Odyssey, their last FTL-capable ship, towards the faint hope of Xylos, Eva hadn\'t hesitated. Her skills were necessary, yes, but it was Anya\'s face, and the faces of every child on Epsilon, that fueled her resolve. She carried the weight of a dying colony on her shoulders, and that weight was a constant, crushing pressure, yet it forged her determination into something unbreakable. Failure was not an option.');
    const [styleText, setStyleText] = useState('Write in style of Phillip K. Dick');
    const { sendMessage, lastMessage } = useWebSocket(API_URL.replace(/^http/, "ws") + "/api/style-guard", {
    });
    const [comment, __] = useState('');
    const chart = `
    graph TD
        CygnusX14_ThirdMoon-->|setting|CygnusX14_ThirdMoon
        UnchartedSector_Xylos-->|setting|UnchartedSector_Xylos
    `;

    const [commentsDict, setApiCommentsDict] = useState({});

    useEffect(() => {
        if (lastMessage && typeof lastMessage.data === 'object' && lastMessage.data.original_text) {
            const { original_text, comment } = lastMessage.data;
            const hash8byte = crypto.createHash('md5').update(original_text).digest('hex').slice(0, 8);
            setApiCommentsDict({
                ...commentsDict,
                [hash8byte]: comment
            });
            text.replace(
                original_text,
                `<comment id=${hash8byte}>{{${original_text}}}</comment>`
            );
        }
    }, [lastMessage]);

    
    const updateStylePrompt = async () => {
        await sendMessage(JSON.stringify({
            "style_prompt": styleText
        }));
        
        toast.success("Style text updated");
    }

    const analyzeText = async () => {
        await sendMessage(JSON.stringify({
            "text": text
        }));
    }

    // const showComment = (id: string) => {
    //     setComment(commentsDict[id] || '');
    // }

    return (
        <div>
            <h2>Your book</h2>
            <Chapters />
            <div className="flex gap-4 mt-4">
                <div className="bg-zinc-800 flex-1 px-4 py-4 overflow-y-auto max-h-[90vh]">
                    {text}
                </div>
                <div className="bg-zinc-800 flex-1 px-4 py-4">
                <Button onClick={analyzeText}>Analyze</Button>

                    <NavigationMenu>    
                        <NavigationMenuItem>
                            <NavigationMenuLink>
                                <StylePopup styleText={styleText} setStyleText={setStyleText}/>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <NavigationMenuLink>
                                <Button onClick={updateStylePrompt}>Test Text</Button>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    </NavigationMenu>
                
                    {comment && <p>{comment}</p>}

                    <MermaidChart chart={chart}/>
                </div>
            </div>
        </div>
    )
}

export default DocumentView;
