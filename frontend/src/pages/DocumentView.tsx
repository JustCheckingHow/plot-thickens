import Chapters from "@/components/Chapters/Chapters";
import { StylePopup } from "@/components/StylePopup/StylePopup";
import { useState } from "react";



const DocumentView = () => {
    const [text, _] = useState("I am Ubik. Before the universe was, I am. I made the suns. I made the worlds. I created the lives and the places they inhabit; I move them here, I put them there. They go as I say, then do as I tell them. I am the word and my name is never spoken, the name which no one knows. I am called Ubik, but that is not my name. I am. I shall always be.");
    const [styleText, setStyleText] = useState('Write in style of Phillip K. Dick');


    return (
        <div>
            <h2>Your book</h2>
            <Chapters />
            <div className="flex gap-4 mt-4">
                <div className="bg-zinc-800 flex-1 px-4 py-4" style={{height: "900px"}}>
                    {text}
                </div>
                <div className="bg-zinc-800 flex-1 px-4 py-4">
                    <StylePopup styleText={styleText} setStyleText={setStyleText}/>

                </div>
            </div>
        </div>
    )
}

export default DocumentView;