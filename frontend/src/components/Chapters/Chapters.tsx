import { Carousel, CarouselItem, CarouselContent, CarouselPrevious, CarouselNext    , type CarouselApi } from "@/components/ui/carousel"
import {useEffect, useState} from "react"
import { Chapter } from "@/types/Chapter";
import { Button } from "@/components/ui/button";

const Chapters = ({chapters, handleAddnewChapter, changeChapter, currentChapter}: {chapters: Chapter[], handleAddnewChapter: () => void, changeChapter: (order: number) => void, currentChapter: number}) => {
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
      <CarouselContent className="gap-4">
        {chapters.map(chapter => (
          <CarouselItem key={chapter.order} onClick={() => {
            changeChapter(chapter.order)
          }} className={"basis-1/6 px-4 py-4" + (currentChapter === chapter.order ? " bg-zinc-600" : " bg-zinc-700")}>
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold">{chapter.title}</h3>
            </div>
          </CarouselItem>
        ))}
        <CarouselItem className="basis-1/6 px-4 py-4 bg-zinc-700 items-center justify-center flex">
            <Button onClick={handleAddnewChapter}>Add new chapter</Button>
        </CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
    </div>
  )
}

export default Chapters;