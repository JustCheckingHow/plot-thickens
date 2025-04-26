import { Carousel, CarouselItem, CarouselContent, CarouselPrevious, CarouselNext    , type CarouselApi } from "@/components/ui/carousel"
import {useEffect, useState} from "react"
import { Chapter } from "@/types/Chapter";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";

const Chapters = ({chapters, handleAddnewChapter, changeChapter, currentChapter, removeChapter}: {chapters: Chapter[], handleAddnewChapter: () => void, changeChapter: (order: number) => void, currentChapter: number, removeChapter: (order: number) => void}) => {
    const [api, setApi] = useState<CarouselApi>()
 
  useEffect(() => {
    if (!api) {
      return
    }
 
    // setCount(api.scrollSnapList().length)
    // setCurrent(api.selectedScrollSnap() + 1)
 
    // api.on("select", () => {
    //   setCurrent(api.selectedScrollSnap() + 1)
    // })
  }, [api])
 
  return (
    <div className="relative">
    <Carousel setApi={setApi}>
      <CarouselContent className="gap-4 ml-0">
        {chapters.map(chapter => (
          <CarouselItem key={chapter.order} onClick={() => {
            changeChapter(chapter.order)
          }} className={"relative basis-1/6 px-4 py-4" + (currentChapter === chapter.order ? " bg-zinc-600" : " bg-zinc-800")}>
            <Button variant="destructive" size="icon" onClick={() => removeChapter(chapter.order)} className="absolute top-[-4px] right-[-4px]">
              <Trash className="h-4 w-4" />
            </Button>
            <div className="flex flex-col gap-2">
              <h3 className="text-md text-center font-semibold">{chapter.title}</h3>
            </div>
          </CarouselItem>
        ))}
        <CarouselItem className="basis-1/6 px-4 py-4 bg-zinc-700 items-center justify-center flex">
            <Button variant="outline" onClick={handleAddnewChapter}>Add new chapter</Button>
        </CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
    </div>
  )
}

export default Chapters;