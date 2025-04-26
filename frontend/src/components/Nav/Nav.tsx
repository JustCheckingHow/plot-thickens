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

const Nav = ({
    chapters,
    changeChapter,
    currentChapter,
    updateStylePrompt,
    resetBook,
    analyzeGrammar,
    logicInspectChapters,
    analyzeText,
}: {
    chapters: Chapter[];
    changeChapter: (chapter: number) => void;
    currentChapter: number;
    updateStylePrompt: (styleText: string) => void;
    resetBook: () => void;
    analyzeGrammar: (chapter: number) => void;
    logicInspectChapters: (chapter: number) => Promise<void>;
    analyzeText: (chapter: number) => void;
}) => {
    type ModalVisibleType = "characters" | "locations" | "character_relationship_graph" | "plot_points" | "timeline_summary" | null;
    const context = useContext(ModalContext) as ModalContextType | undefined;
    if (!context) throw new Error("ModalContext is undefined. Make sure ModalProvider is in the component tree.");
    const { setModalVisible, modalVisible } = context;
    const [loading, setLoading] = useState<"logic" | "grammy" | "style" | null>(null);

    console.log(currentChapter);

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
                <Button onClick={() => {
                  setLoading("style");
                  analyzeText(currentChapter);
                  setLoading(null);
                }} disabled={loading === "style"}>
                    {loading === "style" && <Loader2 className="animate-spin" />}
                    Analyze Style
                </Button>
              </div>
              <div className="flex gap-2 mb-2">
                <Button onClick={() => {
                  setLoading("logic");
                  logicInspectChapters(currentChapter);
                  setLoading(null);
                }} disabled={loading === "logic"}>
                    {loading === "logic" && <Loader2 className="animate-spin" />}
                    Logic Inspect
                </Button>
              </div>
              <div className="flex gap-2 mb-2">
                <Button onClick={() => {
                  setLoading("grammy");
                  analyzeGrammar(currentChapter);
                  setLoading(null);
                }} disabled={loading === "grammy"}>
                    {loading === "grammy" && <Loader2 className="animate-spin" />}
                    Analyze Grammar
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
    type ChapterOption = { id: number; label: string; value: string };
const [chaptersLocal, setChaptersLocal] = useState<ChapterOption[]>([]);
    console.log(chaptersLocal)
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
                    const selectedChapter = chaptersLocal.find(ch => ch.value === currentValue)
                    if (selectedChapter) {
                      changeChapter(selectedChapter.id)
                    }
                  }}
                >
                  {chapter.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === chapter.label ? "opacity-100" : "opacity-0"
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