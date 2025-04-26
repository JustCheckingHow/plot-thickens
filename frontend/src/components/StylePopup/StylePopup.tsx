import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export function StylePopup({updateStylePrompt}: {updateStylePrompt: (style: string) => void}) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState('');

  React.useEffect(() => {
    setText(localStorage.getItem('styleText') || '');
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStylePrompt(text);
    localStorage.setItem('styleText', text);
    setOpen(false);
  };

  return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Edit Text Style</Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Text Style</DialogTitle>
            <form className={cn("grid items-start gap-4")} onSubmit={handleSubmit}>
              <div className="grid gap-2 mt-4">
                <Label htmlFor="styleText">Text Style</Label>
                <Textarea id="styleText" defaultValue={text} onChange={(e) => setText(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">Save changes</Button>
            </form>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
  )
}
