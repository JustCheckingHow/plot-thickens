import { Carousel, CarouselItem, CarouselContent, CarouselPrevious, CarouselNext    , type CarouselApi } from "@/components/ui/carousel"
import {useEffect, useState} from "react"



const Chapters = () => {
    const [api, setApi] = useState<CarouselApi>()
  const [chaptersList,_] = useState([
    {
        id: 1,
        title: "Chapter 1",
        description: "Chapter 1 description"
    },
    {
        id: 2,
        title: "Chapter 2",
        description: "Chapter 2 description"
    },
    {
        id: 3,
        title: "Chapter 3",
        description: "Chapter 3 description"
    }
  ])
 
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
        {chaptersList.map(chapter => (
          <CarouselItem key={chapter.id} className="basis-1/6 bg-zinc-800 px-4 py-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold">{chapter.title}</h3>
              <p className="text-muted-foreground">{chapter.description}</p>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
    </div>
  )
}

export default Chapters;