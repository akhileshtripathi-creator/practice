import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for handling file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini API client
const ai = new GoogleGenAI();

// Structured Schema for the analysis response
const resumeAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.INTEGER,
      description: 'Overall resume score out of 100 based on structure, content, and impact.'
    },
    skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'List of technical and soft skills identified in the resume.'
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Key strengths or standout points found in the resume.'
    },
    missingSkills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Important skills or keywords that are missing for a standard professional profile in this domain.'
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Actionable recommendations to improve formatting, impact, and content.'
    }
  },
  required: ['score', 'skills', 'strengths', 'missingSkills', 'suggestions']
};

// API Route for Resume Analysis
app.post('/api/analyze', upload.single('resume'), async (req, res) => {
  try {
    let resumeContent = '';

    if (req.file) {
      if (req.file.mimetype === 'text/plain' || req.file.mimetype === 'application/json') {
        resumeContent = req.file.buffer.toString('utf-8');
      } else {
        resumeContent = req.file.buffer.toString('utf-8');
      }
    } else if (req.body.resumeText) {
      resumeContent = req.body.resumeText;
    }

    if (!resumeContent.trim()) {
      return res.status(400).json({ error: 'Resume content is empty or could not be read.' });
    }

    const prompt = `
      You are an expert AI Technical Recruiter and Career Coach. 
      Analyze the following resume thoroughly and provide constructive feedback.

      Resume Content:
      """
      ${resumeContent}
      """
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: resumeAnalysisSchema,
        systemInstruction: 'You evaluate resumes objectively, providing constructive, specific, and actionable feedback to help candidates land better roles.',
      },
    });

    const resultJson = JSON.parse(response.text);
    res.json(resultJson);

  } catch (error) {
    console.error('Error analyzing resume:', error);
    res.status(500).json({ error: 'Failed to analyze resume. Please try again later.' });
  }
});

// Serve frontend static files from Vite's 'dist' folder
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch-all route to serve index.html for frontend routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});