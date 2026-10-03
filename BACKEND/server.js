import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// ================================
// Middleware
// ================================

app.use(cors());

app.use(express.json());

// ================================
// Multer - File Upload
// ================================

const upload = multer({
  storage: multer.memoryStorage()
});

// ================================
// Gemini API
// ================================

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is missing in .env');
} else {
  console.log('✅ Gemini API key loaded');
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// ================================
// Resume Analysis Schema
// ================================

const resumeAnalysisSchema = {
  type: Type.OBJECT,

  properties: {

    score: {
      type: Type.INTEGER,
      description:
        'Overall resume score out of 100 based on structure, content, skills, and impact.'
    },

    skills: {
      type: Type.ARRAY,

      items: {
        type: Type.STRING
      },

      description:
        'Technical and soft skills identified from the resume.'
    },

    strengths: {
      type: Type.ARRAY,

      items: {
        type: Type.STRING
      },

      description:
        'Important strengths and positive aspects of the resume.'
    },

    missingSkills: {
      type: Type.ARRAY,

      items: {
        type: Type.STRING
      },

      description:
        'Important skills or keywords that may be missing from the resume.'
    },

    suggestions: {
      type: Type.ARRAY,

      items: {
        type: Type.STRING
      },

      description:
        'Specific and actionable recommendations to improve the resume.'
    }

  },

  required: [
    'score',
    'skills',
    'strengths',
    'missingSkills',
    'suggestions'
  ]
};

// ================================
// Health Check
// ================================

app.get('/', (req, res) => {
  res.json({
    message: 'AI Resume Analyzer Backend is running 🚀'
  });
});

// ================================
// Resume Analysis API
// ================================

app.post(
  '/api/analyze',
  upload.single('resume'),
  async (req, res) => {

    try {

      let resumeContent = '';

      // ----------------------------
      // If file is uploaded
      // ----------------------------

      if (req.file) {

        resumeContent =
          req.file.buffer.toString('utf-8');

      }

      // ----------------------------
      // If resume text is pasted
      // ----------------------------

      else if (req.body.resumeText) {

        resumeContent =
          req.body.resumeText;

      }

      // ----------------------------
      // Empty Resume Check
      // ----------------------------

      if (!resumeContent.trim()) {

        return res.status(400).json({
          error:
            'Resume content is empty or could not be read.'
        });

      }

      // ============================
      // Gemini Prompt
      // ============================

      const prompt = `

You are an expert AI Technical Recruiter and Career Coach.

Analyze the following resume thoroughly.

Evaluate:

1. Overall resume quality
2. Technical skills
3. Soft skills
4. Strengths
5. Missing skills
6. Missing keywords
7. Professional impact
8. Resume structure
9. ATS friendliness
10. Suggestions for improvement

Give constructive, specific and actionable feedback.

Do not invent information that is not present in the resume.

Resume Content:

"""
${resumeContent}
"""

`;

      // ============================
      // Gemini API Call
      // ============================

      const response =
        await ai.models.generateContent({

          model: 'gemini-3.8-flash',

          contents: prompt,

          config: {

            responseMimeType:
              'application/json',

            responseSchema:
              resumeAnalysisSchema,

            systemInstruction:
              'You are an expert resume reviewer. Evaluate resumes objectively and provide specific, constructive and actionable feedback.'
          }

        });

      // ============================
      // Parse Gemini Response
      // ============================

      const resultJson =
        JSON.parse(response.text);

      // ============================
      // Send Response
      // ============================

      res.json(resultJson);

    }

    catch (error) {

      console.error(
        '❌ Error analyzing resume:',
        error
      );

      res.status(500).json({

        error:
          'Failed to analyze resume. Please try again later.'

      });

    }

  }
);

// ================================
// 404 API Handler
// ================================

app.use((req, res) => {

  res.status(404).json({

    error: 'API route not found',

    path: req.originalUrl

  });

});

// ================================
// Start Server
// ================================

app.listen(port, () => {

  console.log(
    `🚀 Server running on port ${port}`
  );

});
