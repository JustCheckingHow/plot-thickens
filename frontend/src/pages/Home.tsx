import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React, { useState } from 'react';
import axiosInstance from '@/api/axios';
import { Link, useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      setLoading(true);
      const response = await axiosInstance.post('/api/doc-to-markdown', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if(response.data && response.data.chapters){
        navigate('/document', {state: {chapters: response.data.chapters, chapter_names: response.data.chapter_names || []}});
      }
      return response.data;
    } catch (error) {
      throw new Error('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full">
      <Card className="w-full max-w-md p-8 flex flex-col items-center gap-6 shadow-lg border-zinc-700 bg-card/80">
        <Label className="text-xl text-center mb-2">Drag and drop your book to use it in our app</Label>
        <div className="w-full cursor-pointer border-dashed border-2 border-muted-foreground bg-background/40 hover:bg-background/70">
          <Input
            type="file"
            className="w-full px-4 py-8 transition-all text-center text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const file = e.target.files?.[0] || null;
              if (file) {
                handleFileUpload(file);
              }
            }}
            id="file-upload"
          />
        </div>
        <p className="text-muted-foreground">Or start a new project</p>
        <Link to={"/document"} className="w-full">
          <Button className="w-full" variant="secondary" disabled={loading}>Start new project</Button>
        </Link>
      </Card>
    </div>
  );
};

export default Home;