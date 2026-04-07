import { Response } from 'express';
import fs from 'fs';
import { AuthRequest } from '../../types';
import { AppError } from '../../errors/app-error';
import { sendSuccess } from '../../utils/response';

const mockResults = [
  {
    cropName: 'Cotton',
    diseaseName: 'Cotton Leaf Curl Disease',
    confidence: 91,
    severity: 'Moderate',
    affectedArea: 35,
    weatherNote: 'High humidity and warm temperatures favor whitefly populations that spread this virus.',
    treatments: {
      organic: 'Apply neem oil spray (5ml/L) every 7 days. Use yellow sticky traps to monitor and reduce whitefly populations. Introduce natural predators like Encarsia formosa.',
      chemical: 'Spray imidacloprid 17.8% SL @ 0.5ml/L or thiamethoxam 25% WG @ 0.5g/L at 15-day intervals. Rotate between different chemical groups to prevent resistance.',
      preventive: 'Use Bt cotton varieties resistant to CLCuD. Maintain field hygiene by removing infected plants. Avoid late sowing. Use reflective mulches to repel whiteflies.',
    },
    nearbyAdvisory: 'Cotton Leaf Curl Disease has been reported in 3 nearby mandis. Early intervention recommended.',
  },
  {
    cropName: 'Tomato',
    diseaseName: 'Tomato Early Blight',
    confidence: 87,
    severity: 'Mild',
    affectedArea: 15,
    weatherNote: 'Warm days (24-29C) with cool nights and morning dew create ideal conditions for Alternaria solani.',
    treatments: {
      organic: 'Apply Trichoderma viride (5g/L) as foliar spray. Use compost tea to boost plant immunity. Mulch around plants to prevent soil splash.',
      chemical: 'Spray mancozeb 75% WP @ 2.5g/L or chlorothalonil 75% WP @ 2g/L. For severe cases, use azoxystrobin 23% SC @ 1ml/L. Apply at 10-14 day intervals.',
      preventive: 'Ensure proper spacing (60x45cm) for air circulation. Remove lower leaves touching soil. Practice 3-year crop rotation. Use disease-free transplants. Stake plants to keep foliage off ground.',
    },
    nearbyAdvisory: 'Early Blight conditions are favorable in the region. Monitor crops closely, especially after recent rains.',
  },
];

export async function analyze(req: AuthRequest, res: Response) {
  if (!req.file) {
    throw new AppError('No image file uploaded. Send as multipart/form-data with field name "image".', 400);
  }

  // In production, send image to ML model for analysis.
  // For now, return mock result based on random selection.
  const result = mockResults[Math.floor(Math.random() * mockResults.length)];

  // Clean up uploaded file after processing
  fs.unlink(req.file.path, () => {});

  sendSuccess(res, {
    analysisId: `scan-${Date.now()}`,
    imageFile: req.file.originalname,
    timestamp: new Date().toISOString(),
    result: {
      ...result,
      confidence: result.confidence / 100,
    },
  });
}
