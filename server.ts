import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Kafka } from 'kafkajs';
import type { Consumer } from 'kafkajs';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  // --- Kafka Setup ---
  const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'fraud-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  });

  const consumer: Consumer = kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID || 'fraud-group' });

  let kafkaAvailable = false;
  try {
    if (process.env.KAFKA_BROKER) {
      await consumer.connect();
      await consumer.subscribe({ topic: process.env.KAFKA_TOPIC || 'transactions', fromBeginning: false });
      kafkaAvailable = true;
      console.log('Connected to Kafka');
    }
  } catch (e) {
    console.error('Kafka connection failed, falling back to Simulation Mode');
  }

interface PredictionDetails {
  anomaly_score: number;
  pattern_score: number;
  rule_boost: number;
  risk_factors?: string[];
}

function getRiskFactors(score: number, decision: string, metadata: any): string[] {
  const factors: string[] = [];
  if (decision === 'block') {
    if (score > 0.9) factors.push(`CRITICAL: Anomaly score ${score.toFixed(2)} exceeds security thresholds`);
    if (metadata.amount > 3000) factors.push(`High Value Alert: ₹${metadata.amount.toLocaleString()} is outside normal user behavior`);
    if (['NG', 'CN', 'KP'].includes(metadata.country)) factors.push(`Geographic Risk: Transaction originating from high-watchlist region (${metadata.country})`);
    factors.push('Neural Analysis: Multiple high-entropy feature clusters detected');
  } else if (decision === 'flag') {
    if (score > 0.7) factors.push('Pattern Shift: Deviation from historical spending signature');
    if (metadata.hour_of_day < 5 || metadata.hour_of_day > 23) factors.push(`Time Anomaly: Transaction at ${metadata.hour_of_day}:00 violates standard active window`);
    factors.push('Integrity Check: Slight drift in machine-learned behavior model');
  } else {
    factors.push(`${metadata.merchant_cat.toUpperCase()} category validated against profile history`);
    factors.push('Secure Auth: Zero-trust validation successful');
  }
  return factors;
}

  // Handle Kafka Messages
  if (kafkaAvailable) {
    await consumer.run({
      eachMessage: async ({ message }) => {
        const raw = message.value?.toString();
        if (raw) {
          try {
            const data = JSON.parse(raw);
            // Process fraud detection logic here (Mocked for now)
            const score = Math.random();
            const decision = score > 0.7 ? 'block' : score > 0.3 ? 'flag' : 'allow';
            
            const prediction = {
              transaction_id: data.transaction_id || `TX-${Math.random().toString(36).substr(2, 9)}`,
              score,
              decision,
              timestamp: new Date().toISOString(),
              details: {
                anomaly_score: score * 0.8,
                pattern_score: score * 0.9,
                rule_boost: score > 0.5 ? 0.4 : 0.1,
                risk_factors: getRiskFactors(score, decision, data)
              },
              metadata: data
            };

            io.emit('transaction', prediction);
          } catch (err) {
            console.error('Error parsing Kafka message');
          }
        }
      },
    });
  }

  // --- API Routes ---
  app.get('/api/health', (req, res) => res.json({ status: 'ok', kafka: kafkaAvailable }));

  app.post('/api/predict', (req, res) => {
    const data = req.body;
    const score = Math.random();
    const decision = score > 0.85 ? 'block' : score > 0.6 ? 'flag' : 'allow';
    
    res.json({
      transaction_id: data.transaction_id || `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      score,
      decision,
      timestamp: new Date().toISOString(),
      details: {
        anomaly_score: score * 0.9,
        pattern_score: score * 0.7,
        rule_boost: score > 0.5 ? 0.3 : 0.05,
        risk_factors: getRiskFactors(score, decision, data)
      },
      metadata: data
    });
  });

  const metrics = {
    total_predictions: 128452,
    fraud_detected: 1422,
    avg_latency_ms: 12.4,
    system_load: 0.34
  };

  app.get('/api/metrics', (req, res) => {
    res.json({
      ...metrics,
      total_predictions: metrics.total_predictions + Math.floor(Math.random() * 10),
      system_load: 0.3 + Math.random() * 0.1
    });
  });

  // Simulation mode for Demo
    const interval = setInterval(() => {
    if (!kafkaAvailable) {
      const score = Math.random();
      const decision = score > 0.85 ? 'block' : score > 0.6 ? 'flag' : 'allow';
      const metadata = {
        card_id: `**** ${Math.floor(1000 + Math.random() * 9000)}`,
        amount: parseFloat((10 + Math.random() * 5000).toFixed(2)),
        merchant_name: ['Zomato', 'HDFC ATM', 'Swiggy', 'Amazon', 'Shell Fuel', 'BookMyShow'][Math.floor(Math.random() * 6)],
        merchant_cat: ['online', 'atm', 'grocery', 'travel', 'food'][Math.floor(Math.random() * 5)],
        country: ['IN', 'US', 'UK', 'NG', 'SG', 'AE', 'CN'][Math.floor(Math.random() * 7)],
        hour_of_day: new Date().getHours(),
        is_weekend: [0, 1][Math.floor(Math.random() * 2)]
      };
      const tx = {
        transaction_id: `CF${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        score,
        decision,
        timestamp: new Date().toISOString(),
        details: {
          anomaly_score: score * 0.9,
          pattern_score: score * 0.7,
          rule_boost: score > 0.5 ? 0.3 : 0.05,
          risk_factors: getRiskFactors(score, decision, metadata)
        },
        metadata
      };
      io.emit('transaction', tx);
    }
  }, 1500); // Faster stream for visual effect

  // --- Vite Integration ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
