
import fs from 'fs';
import path from 'path';

interface Transaction {
  transaction_id: string;
  card_id: string;
  amount: number;
  merchant_cat: string;
  country: string;
  hour_of_day: number;
  is_weekend: number;
  true_label?: number;
}

interface ModelMetrics {
  total_predictions: number;
  latency_ms: number;
  fraud_count: number;
}

export class FraudDetectionModel {
  private meanAmount: number = 0;
  private stdAmount: number = 1;
  private history: Transaction[] = [];

  constructor() {
    this.loadHistory();
  }

  private loadHistory() {
    const dataPath = path.join(process.cwd(), 'src/data/seed.json');
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf-8');
      this.history = JSON.parse(raw);
      this.calculateStats();
    }
  }

  private calculateStats() {
    const amounts = this.history.map(t => t.amount);
    const n = amounts.length;
    if (n === 0) return;

    this.meanAmount = amounts.reduce((a, b) => a + b, 0) / n;
    this.stdAmount = Math.sqrt(amounts.reduce((a, b) => a + Math.pow(b - this.meanAmount, 2), 0) / n) || 1;
  }

  public predict(t: Omit<Transaction, 'true_label'>) {
    const startTime = Date.now();

    // 1. Rule-based Boosts
    let ruleScore = 0;
    if (t.hour_of_day >= 0 && t.hour_of_day <= 4) ruleScore += 0.2; // Night boost
    if (t.amount > 10000) ruleScore += 0.4; // High amount boost
    if (['CN', 'NG', 'AE'].includes(t.country)) ruleScore += 0.2; // High-risk country boost

    // 2. Anomaly Detection (Isolation Forest Simulation)
    // We use Z-score as a proxy for "outlier-ness"
    const zScore = Math.abs((t.amount - this.meanAmount) / this.stdAmount);
    const ifScore = Math.min(zScore / 5, 1); // Cap at 1

    // 3. Supervised Model (XGBoost Simulation)
    // Feature weights derived from common fraud patterns
    let xgbScore = 0;
    if (t.merchant_cat === 'atm' || t.merchant_cat === 'online') xgbScore += 0.3;
    if (t.is_weekend === 1) xgbScore += 0.1;
    if (t.amount > 5000) xgbScore += 0.3;
    xgbScore = Math.min(xgbScore, 1);

    // 4. Hybrid Logic (0.7 * IF + 0.3 * XGB) + Rule Boost
    let totalScore = (0.7 * ifScore) + (0.3 * xgbScore) + ruleScore;
    totalScore = Math.min(totalScore, 1);

    // Decision Logic
    let decision: 'block' | 'flag' | 'allow' = 'allow';
    if (totalScore >= 0.6) decision = 'block';
    else if (totalScore >= 0.3) decision = 'flag';

    const result = {
      transaction_id: t.transaction_id,
      score: totalScore,
      decision,
      details: {
        anomaly_score: ifScore,
        pattern_score: xgbScore,
        rule_boost: ruleScore
      },
      latency_ms: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };

    // Audit Logging
    this.logAudit(result);

    return result;
  }

  private logAudit(result: any) {
    const logPath = path.join(process.cwd(), 'audit.log');
    const logEntry = JSON.stringify(result) + '\n';
    try {
      fs.appendFileSync(logPath, logEntry);
    } catch (err) {
      console.error('Audit log failure:', err);
    }
  }
}
