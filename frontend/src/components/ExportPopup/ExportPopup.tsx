import axiosInstance from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Buffer } from "buffer";


const ExportPopup = ({content, comments}: {content: string, comments: Record<string, string>}) => {
    const [open, setOpen] = useState(false);
    const [author, setAuthor] = useState('');
    const [filename, setFilename] = useState('');

    const exportToDOCX = async () => {
        if(!author || !filename) {
            toast.error('Author and filename are required');
            return;
        }
        try {
            await axiosInstance.post('api/markdown-to-docx-with-comments', {
                markdown_content: content,
                filename: filename,
                author_name: author,
                comments: comments
            }).then((response) => {
                console.log(response);
                const file = Buffer.from(response.data, 'base64');
                const blob = new Blob([file], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${filename}.docx`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success('Exported to DOCX');
            }).catch((error) => {
                console.log(error);
                toast.error('Failed to export to DOCX');
            });
        } catch (error) {
            toast.error('Failed to export to DOCX');
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Export to Word</Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Export to Word</DialogTitle>
            <form className="grid items-start gap-4" onSubmit={(e) => {
                e.preventDefault();
                exportToDOCX();
            }}>
              <div className="grid gap-2 mt-4">
                <Label htmlFor="author">Author Name</Label>
                <Input id="author" defaultValue={author} onChange={(e) => setAuthor(e.target.value)} />
              </div>
              <div className="grid gap-2 mt-4">
                <Label htmlFor="filename">Filename</Label>
                <Input id="filename" defaultValue={filename} onChange={(e) => setFilename(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">Export to DOCX</Button>
            </form>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
}

export default ExportPopup;
