// server.js

require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const cors = require('cors');
const { ClarifaiStub, grpc } = require('clarifai-nodejs-grpc');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'https://www.chillgirl.com',
    'https://chillgirl.com',
    'http://www.chillgirl.com',
    'http://chillgirl.com'
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
}));

app.use(express.json({ limit: '50mb' })); // To parse JSON bodies
app.use(express.urlencoded({ limit: '50mb', extended: true })); // To parse URL-encoded bodies

// Initialize Clarifai stub with your PAT
const stub = ClarifaiStub.grpc();

// Use your PAT from the .env file
const metadata = new grpc.Metadata();
metadata.set('authorization', `Key ${process.env.CLARIFAI_PAT}`);

// Your Clarifai User ID, App ID, and Workflow ID
const USER_ID = 'uyz5o6vvjv5o';
const APP_ID = 'Image-Analysis-App';
const WORKFLOW_ID = 'analysis';

// Endpoint to handle image analysis
app.post('/analyze-image', (req, res) => {
  const { base64Image, description, chillType } = req.body;

  if (!base64Image) {
    res.status(400).json({ error: 'No image data provided.' });
    return;
  }

  if (!description) {
    res.status(400).json({ error: 'No description provided.' });
    return;
  }

  if (!chillType) {
    res.status(400).json({ error: 'No chill type provided.' });
    return;
  }

  // Customize the prompt based on the chill type and description
  const prompt = `${description}. Analyze this image to determine the ${chillType === 'guy' ? 'Chill Guy' : 'Chill Girl'} percentage and traits.`;

  stub.PostWorkflowResults(
    {
      user_app_id: {
        user_id: USER_ID,
        app_id: APP_ID,
      },
      workflow_id: WORKFLOW_ID,
      inputs: [
        {
          data: {
            image: { base64: base64Image },
            text: { raw: prompt },
          },
        },
      ],
    },
    metadata,
    (err, response) => {
      if (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Image analysis failed.', details: err.message });
        return;
      }

      if (response.status.code !== 10000) {
        console.error(
          'Failed status:',
          response.status.description,
          '\n',
          response.status.details
        );
        res.status(500).json({
          error: 'Image analysis failed.',
          details: response.status.description + ' - ' + response.status.details,
        });
        return;
      }

      // Extract the text output from the workflow response
      const outputs = response.results[0].outputs;
      let outputText = '';
      for (const output of outputs) {
        if (output.data && output.data.text) {
          outputText = output.data.text.raw;
          break;
        }
      }

      if (outputText) {
        // Process the outputText to extract percentage and traits
        const percentage = calculatePercentage(outputText);
        const traits = extractTraits(outputText);

        res.json({
          chillType: chillType === 'guy' ? 'Chill Guy' : 'Chill Girl',
          percentage,
          traits,
        });
      } else {
        res.json({ result: 'No text output found.' });
      }
    }
  );
});

// Functions to process the AI's response
function calculatePercentage(outputText) {
  // Placeholder logic: Extract percentage from the output text
  const matches = outputText.match(/(\d+)%/);
  if (matches && matches[1]) {
    return parseInt(matches[1], 10);
  }
  // If no percentage found, return a random value
  return Math.floor(Math.random() * 101);
}

function extractTraits(outputText) {
  // Placeholder logic: Extract traits from the output text
  // This can be customized based on the AI's response format
  // For now, we'll return the entire outputText
  return outputText;
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
