import Chapters from "@/components/Chapters/Chapters";
import { StylePopup } from "@/components/StylePopup/StylePopup";
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import { API_URL } from "@/api/axios";
import { toast } from "sonner"


const DocumentView = () => {
    const [text] = useState("I am Ubik. Before the universe was, I am. I made the suns. I made the worlds. I created the lives and the places they inhabit; I move them here, I put them there. They go as I say, then do as I tell them. I am the word and my name is never spoken, the name which no one knows. I am called Ubik, but that is not my name. I am. I shall always be.");
    const [styleText, setStyleText] = useState('Write in style of Phillip K. Dick');
    const { sendMessage, lastMessage, readyState } = useWebSocket(API_URL.replace(/^http/, "ws") + "/api/style-guard", {
    });

    useEffect(() => {
        const func = async () => {
            await sendMessage(JSON.stringify({
                "style_prompt": styleText
            }));
            console.log(lastMessage);
            toast.success("Style text updated");
            // setResponse(lastMessage);
        }

        console.log("Style text");
        console.log(styleText);

        func();
        
    }, [styleText, sendMessage])

    const analyzeText = async () => {
        await sendMessage(JSON.stringify({
            "text": text
        }));
        console.log(lastMessage);
        // setResponse(response.data);
    }



    return (
        <div>
            <h2>Your book</h2>
            <Chapters />
            <div className="flex gap-4 mt-4">
                <div className="bg-zinc-800 flex-1 px-4 py-4" style={{height: "900px"}}>
                    {text}

                    <hr/>
                    {lastMessage ? lastMessage.data : ""}
                </div>
                <div className="bg-zinc-800 flex-1 px-4 py-4">
                    <NavigationMenu>    
                        <NavigationMenuItem>
                            <NavigationMenuLink>
                                <StylePopup styleText={styleText} setStyleText={setStyleText}/>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <NavigationMenuLink>
                                <Button onClick={analyzeText}>Analyze</Button>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <NavigationMenuLink>
                                <Button onClick={() => {
                                    sendMessage(JSON.stringify({
                                        "text": text
                                    }));
                                }}>Test Text</Button>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    </NavigationMenu>
                </div>
            </div>
        </div>
    )
}

export default DocumentView;