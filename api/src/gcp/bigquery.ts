// BigQuery Integration for Time-Series Metrics & Analytics
// Used for MRR, ARR, burn, runway, and other dashboards

import { BigQueryMetricRow, MetricTrend } from '../types';

export interface BigQueryConfig {
  projectId: string;
  dataset: string;
}

// BigQuery client wrapper (simulated for Cloudflare Workers)
// In Cloud Run, use @google-cloud/bigquery directly
export class BigQueryClient {
  private projectId: string;
  private dataset: string;
  private apiEndpoint: string;

  constructor(config: BigQueryConfig) {
    this.projectId = config.projectId;
    this.dataset = config.dataset;
    this.apiEndpoint = `https://bigquery.googleapis.com/bigquery/v2/projects/${config.projectId}`;
  }

  // Execute a query against BigQuery
  async query<T>(sql: string, params?: Record<string, unknown>): Promise<T[]> {
    // In production, this would use the BigQuery REST API with OAuth
    // For now, we simulate the response structure
    console.log('BigQuery query:', sql, params);
    return [];
  }

  // Insert metrics into BigQuery
  async insertMetrics(tableName: string, rows: BigQueryMetricRow[]): Promise<void> {
    // Uses streaming insert API
    console.log(`Inserting ${rows.length} rows into ${this.dataset}.${tableName}`);
  }

  // Get metric trends over time
  async getMetricTrends(
    metricKey: string,
    startDate: string,
    endDate: string,
    granularity: 'day' | 'week' | 'month' = 'day'
  ): Promise<MetricTrend> {
    const sql = `
      SELECT 
        DATE_TRUNC(timestamp, ${granularity.toUpperCase()}) as period,
        metric_key,
        AVG(value) as avg_value,
        MAX(value) as max_value,
        MIN(value) as min_value
      FROM \`${this.projectId}.${this.dataset}.metrics\`
      WHERE metric_key = @metricKey
        AND timestamp BETWEEN @startDate AND @endDate
      GROUP BY period, metric_key
      ORDER BY period
    `;

    const results = await this.query<{
      period: string;
      metric_key: string;
      avg_value: number;
    }>(sql, { metricKey, startDate, endDate });

    // Calculate trend
    const series = results.map((r) => ({
      date: r.period,
      value: r.avg_value,
    }));

    const current = series[series.length - 1]?.value || 0;
    const previous = series[series.length - 2]?.value || current;
    const change = current - previous;
    const changePercent = previous > 0 ? (change / previous) * 100 : 0;

    return {
      key: metricKey,
      current,
      previous,
      change,
      change_percent: changePercent,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      series,
    };
  }

  // Get financial summary from BigQuery
  async getFinancialSummary(startDate: string, endDate: string) {
    const sql = `
      WITH latest_metrics AS (
        SELECT 
          metric_key,
          value,
          ROW_NUMBER() OVER (PARTITION BY metric_key ORDER BY timestamp DESC) as rn
        FROM \`${this.projectId}.${this.dataset}.metrics\`
        WHERE category = 'finance'
          AND timestamp BETWEEN @startDate AND @endDate
      )
      SELECT metric_key, value
      FROM latest_metrics
      WHERE rn = 1
    `;

    return this.query<{ metric_key: string; value: number }>(sql, {
      startDate,
      endDate,
    });
  }

  // Get MRR/ARR breakdown by customer segment
  async getRevenueBreakdown(period: string) {
    const sql = `
      SELECT 
        customer_segment,
        SUM(mrr) as total_mrr,
        COUNT(DISTINCT customer_id) as customer_count,
        AVG(mrr) as avg_mrr
      FROM \`${this.projectId}.${this.dataset}.customer_metrics\`
      WHERE period = @period
      GROUP BY customer_segment
      ORDER BY total_mrr DESC
    `;

    return this.query(sql, { period });
  }

  // Get sales pipeline analytics
  async getSalesPipelineAnalytics() {
    const sql = `
      SELECT 
        stage,
        COUNT(*) as deal_count,
        SUM(amount) as total_value,
        AVG(amount) as avg_deal_size,
        AVG(probability) as avg_probability
      FROM \`${this.projectId}.${this.dataset}.opportunities\`
      WHERE stage NOT IN ('closed_won', 'closed_lost')
      GROUP BY stage
      ORDER BY 
        CASE stage
          WHEN 'prospecting' THEN 1
          WHEN 'qualification' THEN 2
          WHEN 'needs_analysis' THEN 3
          WHEN 'proposal' THEN 4
          WHEN 'negotiation' THEN 5
        END
    `;

    return this.query(sql);
  }

  // Get churn analysis
  async getChurnAnalysis(months: number = 12) {
    const sql = `
      SELECT 
        DATE_TRUNC(churn_date, MONTH) as month,
        COUNT(*) as churned_customers,
        SUM(mrr_lost) as mrr_lost,
        AVG(customer_tenure_days) as avg_tenure
      FROM \`${this.projectId}.${this.dataset}.churn_events\`
      WHERE churn_date >= DATE_SUB(CURRENT_DATE(), INTERVAL @months MONTH)
      GROUP BY month
      ORDER BY month
    `;

    return this.query(sql, { months });
  }
}

// Factory function
export function createBigQueryClient(projectId: string, dataset: string): BigQueryClient {
  return new BigQueryClient({ projectId, dataset });
}
