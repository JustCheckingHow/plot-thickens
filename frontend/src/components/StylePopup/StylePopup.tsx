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
import axiosInstance, { API_URL } from "@/api/axios";

export function StylePopup({updateStylePrompt}: {updateStylePrompt: (style: string) => void}) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState('');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processingProgress, setProcessingProgress] = React.useState(0);

  React.useEffect(() => {
    setText(localStorage.getItem('styleText') || '');
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStylePrompt(text);
    localStorage.setItem('styleText', text);
    setOpen(false);
  };

  const handleFileSelect = (file: File) => {
    if (file.name.endsWith('.docx')) {
      setSelectedFile(file);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    try {
      // Create form data to send file
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Upload file to API - ensure content type is not set (let browser set it)
      const response = await axiosInstance.post(API_URL + '/api/doc-to-style', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.status !== 200) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = response.data;
      
      // Start processing queue
      setIsUploading(false);
      
      console.log(data);
      if (data.style_prompt) {
        setText(data.style_prompt);
        localStorage.setItem('styleText', data.style_prompt);
        updateStylePrompt(data.style_prompt);
      }

    } catch (error) {
      console.error("Upload failed:", error);
      setIsUploading(false);
      
      // Show error to user
      alert(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
                <Textarea id="styleText" defaultValue={text} onChange={(e) => setText(e.target.value)} value={text} />
                  <div className="text-center my-2">
                    <div className="flex items-center gap-2 w-full">
                      <div className="h-px flex-1 bg-muted"></div>
                      <p className="text-sm text-muted-foreground">OR</p>
                      <div className="h-px flex-1 bg-muted"></div>
                    </div>
                  </div>
                <div className="grid gap-2 mt-4">
                  <Label htmlFor="bookUpload">Upload Book (DOCX)</Label>
                  
                  {!selectedFile && !isProcessing && (
                    <div 
                      className="border-2 border-dashed border-input rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          const file = e.dataTransfer.files[0];
                          handleFileSelect(file);
                        }
                      }}
                      onClick={() => {
                        const fileInput = document.getElementById('bookUpload') as HTMLInputElement;
                        if (fileInput) {
                          fileInput.click();
                        }
                      }}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm text-muted-foreground">
                          Drag & drop your DOCX file here, or{" "}
                          <span className="text-primary font-medium">browse</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Only .docx files are supported
                        </p>
                      </div>
                      <input
                        id="bookUpload"
                        type="file"
                        accept=".docx"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];
                            handleFileSelect(file);
                          }
                        }}
                      />
                    </div>
                  )}

                  {selectedFile && !isProcessing && (
                    <div className="mt-4 p-3 border rounded-md bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm font-medium truncate max-w-[180px]">
                            {selectedFile.name}
                          </span>
                        </div>
                        <Button 
                          type="button" 
                          variant="secondary" 
                          size="sm"
                          onClick={() => setSelectedFile(null)}
                        >
                          Remove
                        </Button>
                      </div>
                      <Button 
                        type="button" 
                        className="w-full mt-3" 
                        onClick={handleUploadFile}
                        disabled={isUploading}
                      >
                        {isUploading ? "Uploading..." : "Upload File"}
                      </Button>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="mt-4 p-4 border rounded-md bg-muted/20">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-5 w-5 text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                          <span className="font-medium">Processing document...</span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full transition-all duration-300 ease-in-out" 
                            style={{ width: `${processingProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Analyzing writing style and formatting
                        </p>
                      </div>
                    </div>
                  )}
                </div>
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
