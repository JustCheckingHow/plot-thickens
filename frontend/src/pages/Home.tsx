import { Button } from '@/components/ui/button';
import React from 'react';
import axiosInstance from '@/api/axios';
import { Link, redirect } from 'react-router-dom';

const Home: React.FC = () => {

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axiosInstance.post('/api/docx-to-style', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if(response.data && response.data.style_prompt){
        localStorage.setItem('styleText', response.data.style_prompt);
        redirect('/document');
      }
      return response.data;
    } catch (error) {
      throw new Error('Failed to upload file');
    }
  };

  return (
    <div className="page flex flex-col items-center m-auto">
      <input type="file" onChange={(e) => {
        const file = e.target.files?.[0] || null;
        if (file) {
          handleFileUpload(file);
        }
      }} />
      <p>Lub</p>
      <Link to={"/document"}>
        <Button>Rozpocznij nowy projekt</Button>
      </Link>
    </div> 
  );
};

export default Home;