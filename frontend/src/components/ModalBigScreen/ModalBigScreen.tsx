import { useContext } from "react";
import { ModalContext, ModalContextType } from "../../context/ModalContext";
import { Chapter } from "@/types/Chapter";
import "./ModalBigScreen.scss";

const modalDict = {
    "characters": ["Character Summary", 'character_summary'],
    "locations": ["Location Summary", 'location_summary'],
    "character_relationship_graph": ["Character Relationship Graph", 'character_relationship_graph'],
    "plot_points": ["Plot Points", 'plotpoint_summary'],
    "timeline_summary": ["Timeline Summary", 'timeline_summary']
}

const ModalBigScreen = ({
    chapters,
    currentChapter
}: {
    chapters: Chapter[];
    currentChapter: number;
}) => {
    const context = useContext(ModalContext) as ModalContextType | undefined;
    if (!context) throw new Error("ModalContext is undefined. Make sure ModalProvider is in the component tree.");
    const { modalVisible } = context;

    if (!modalVisible) return null;

    return (
        <div className={"modal-big-screen py-8 " + (modalVisible ? "open" : "")}>
            <div className="container">
                <h2 className="text-2xl font-bold mb-4">
                    {modalDict[modalVisible][0]}
                </h2>
                
                {chapters[currentChapter][modalDict[modalVisible][1]]}
            </div>
        </div>
    )
}

export default ModalBigScreen;