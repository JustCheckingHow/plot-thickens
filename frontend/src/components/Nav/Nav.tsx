import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, Loader2, LucideGitGraph, Pointer, TimerIcon, Users, Trash2, LocateIcon } from "lucide-react"
import { useState, useEffect, useContext } from "react"
import { cn } from "@/lib/utils"
import "./Nav.scss"
import { Link } from "react-router-dom";
import { Chapter } from "@/types/Chapter";
import { StylePopup } from "../StylePopup/StylePopup";
import logo from "@/assets/image/logo.svg"
import ExportPopup from "../ExportPopup/ExportPopup";
import { ModalContext, ModalContextType } from "../../context/ModalContext";
// import logo from "@/public/logo.svg";
import { ModalBigScreen } from "../ModalBigScreen/ModalBigScreen";

/**
 * The navigation menu component.
 * 
 * This component displays the navigation menu that is visible on the left side of the screen.
 * It contains a list of chapters, and buttons to analyze a chapter, inspect the logic of the chapters,
 * update the style prompt, reset the book, and export the content.
 * 
 * @param {Chapter[]} chapters - The list of chapters to display in the navigation menu.
 * @param {() => void} handleAddnewChapter - The function to call when the user clicks the "Add new chapter" button.
 * @param {(chapter: number) => void} changeChapter - The function to call when the user clicks on a chapter in the list.
 * @param {number} currentChapter - The current chapter that is being displayed.
 * @param {(chapter: number) => void} removeChapter - The function to call when the user clicks the "Remove chapter" button.
 * @param {(styleText: string) => void} updateStylePrompt - The function to call when the user updates the style prompt.
 * @param {() => void} resetBook - The function to call when the user clicks the "Reset book" button.
 * @param {(chapter: number) => void} analyzeChapter - The function to call when the user clicks the "Analyze chapter" button.
 * @param {boolean} chapterAnalyzeLoading - Whether the chapter analyze button is loading.
 * @param {(loading: boolean) => void} setChapterAnalyzeLoading - The function to call to set the loading state of the chapter analyze button.
 * @param {() => void} logicInspectChapters - The function to call when the user clicks the "Logic inspect chapters" button.
 */
const Nav = ({
    chapters,
    changeChapter,
    currentChapter,
    removeChapter,
    updateStylePrompt,
    resetBook,
    analyzeChapter,
    chapterAnalyzeLoading,
    setChapterAnalyzeLoading,
    logicInspectChapters
}: {
    chapters: Chapter[];
    handleAddnewChapter: () => void;
    changeChapter: (chapter: number) => void;
    currentChapter: number;
    removeChapter: (chapter: number) => void;
    updateStylePrompt: (styleText: string) => void;
    resetBook: () => void;
    analyzeChapter: (chapter: number) => void;
    chapterAnalyzeLoading: boolean;
    setChapterAnalyzeLoading: (loading: boolean) => void;
    logicInspectChapters: () => void;
}) => {

    const context = useContext(ModalContext) as ModalContextType | undefined;
    if (!context) throw new Error("ModalContext is undefined. Make sure ModalProvider is in the component tree.");
    const { setModalVisible, modalVisible } = context;

    const handleVisibleModal = (modal: ModalVisibleType) => {
        if(modalVisible === modal) {
            setModalVisible(null);
        } else {
            setModalVisible(modal);
        }
    }

    return (
        <nav className="flex flex-col px-4 py-4 fixed left-0 top-0 nav h-[100dvh]">
          <Link to="/"><div className="nav__logo">
                <img src={logo} alt="Logo" />
                <div>
                    <h1>scriber.ink</h1>
                    <span>Storyboarding</span>
                </div>
            </div></Link>
            <div className="mt-4 w-full">
                <ProjectSelect chapters={chapters} changeChapter={changeChapter} />
            </div>
            <ul className="nav__ul">
              <li onClick={() => handleVisibleModal("characters")} className={modalVisible === "characters" ? "active" : ""}>
              <div className="nav__ul__icon">
                <Users className="h-5 w-5" />
              </div>
              <span>Character Summary</span>
              </li>
              <li onClick={() => handleVisibleModal("locations")} className={modalVisible === "locations" ? "active" : ""}>
              <div className="nav__ul__icon">
                <LocateIcon className="h-5 w-5" />
              </div>
              <span>Location Summary</span>
              </li>
              <li onClick={() => handleVisibleModal("character_relationship_graph")} className={modalVisible === "character_relationship_graph" ? "active" : ""}>
              <div className="nav__ul__icon">
                <LucideGitGraph className="h-5 w-5" />
              </div>
              <span>Character Relationship Graph</span>
              </li>
              <li onClick={() => handleVisibleModal("plot_points")} className={modalVisible === "plot_points" ? "active" : ""}>
              <div className="nav__ul__icon">
                <Pointer className="h-5 w-5" />
              </div>
              <span>Plot Points</span>
              </li>
              <li onClick={() => handleVisibleModal("timeline_summary")} className={modalVisible === "timeline_summary" ? "active" : ""}>
              <div className="nav__ul__icon">
                <TimerIcon className="h-5 w-5" />
              </div>
              <span>Timeline Summary</span>
              </li>
            </ul>
            <div style={{marginTop: "auto"}}>
              <div className="flex gap-2 mb-2">
                <Button onClick={() => analyzeChapter(currentChapter)} disabled={chapterAnalyzeLoading}>
                    {chapterAnalyzeLoading && <Loader2 className="animate-spin" />}
                    Analyze Chapter
                </Button>
              </div>
              <div className="flex gap-2 mb-2">
                <Button onClick={logicInspectChapters} disabled={chapterAnalyzeLoading}>
                    {chapterAnalyzeLoading && <Loader2 className="animate-spin" />}
                    Logic Inspect
                </Button>
              </div>
              <StylePopup updateStylePrompt={updateStylePrompt}/>
              <div className="flex gap-2 mt-2">
                <Button onClick={resetBook} variant="destructive" size={"icon"}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <ExportPopup content={chapters.map(chapter => "# " + chapter.title + "\n\n" + chapter.text).join('\n\n')} comments={chapters.map(chapter => chapter.comments).reduce((acc, curr) => ({...acc, ...curr}), {})} />
              </div>
            </div>        
        </nav>
    )
}

const ProjectSelect = ({chapters, changeChapter}: {chapters: Chapter[]; changeChapter: (chapter: number) => void}) => {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState("");
    const [chaptersLocal, setChaptersLocal] = useState([]);

    useEffect(() => {
      setChaptersLocal(chapters.map((chapter) => ({
        id: chapter.order,
        label: chapter.title || "",
        value: chapter.title || ""
      })));
    }, [chapters])

    return (
        <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between w-full"
        >
          {value
            ? chaptersLocal.find((chapter) => chapter.value === value)?.label
            : "Select chapter..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search chapter.." className="h-9" />
          <CommandList>
            <CommandEmpty>No chapter found.</CommandEmpty>
            <CommandGroup>
              {chaptersLocal.map((chapter) => (
                <CommandItem
                  key={chapter.value}
                  value={chapter.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue)
                    setOpen(false)
                    changeChapter(Number(currentValue))
                  }}
                >
                  {chapter.title}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === chapter.title ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
    )
}

export default Nav;