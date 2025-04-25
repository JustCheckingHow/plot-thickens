import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const Nav = () => {
    return (
        <nav className="flex justify-between px-4 items-center bg-zinc-800 text-white" style={{height: "64px"}}>
            <div>
                <ProjectSelect />
            </div>
           
            <div className="flex align-center gap-4">
            <div>
                    <p>Joe Doe</p>
                    <span></span>
                </div>
                <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                    <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                
            </div> 
            
        </nav>
    )
}

const ProjectSelect = () => {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState("");

    const projects = [
        {
            id: 1,
            label: "Project 1",
            value: "project-1"
        },
        {
            id: 2,
            label: "Project 2",
            value: "project-2"
        },
        {
            id: 3,
            label: "Project 3",
            value: "project-3"
        }
    ]

    return (
        <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? projects.find((project) => project.value === value)?.label
            : "Select project..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search project..." className="h-9" />
          <CommandList>
            <CommandEmpty>No project found.</CommandEmpty>
            <CommandGroup>
              {projects.map((project) => (
                <CommandItem
                  key={project.value}
                  value={project.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  {project.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === project.value ? "opacity-100" : "opacity-0"
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