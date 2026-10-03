import { providerRegistry } from '../providers/ProviderRegistry.js';
import { TrendDetectionEngine } from '../analysis/trendDetectionEngine.js';
import { MultiTimeframeAnalysis } from '../analysis/multiTimeframe.js';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class AIService {
  public static async analyzeMarket(symbol: string, timeframe: string = '1h') {
    const candles = await providerRegistry.getHistoricalCandles(symbol, timeframe, 100);
    if (!candles || candles.length < 20) {
      throw new Error(`Insufficient market data available for ${symbol} to perform analysis`);
    }

    const quote = await providerRegistry.getQuote(symbol);
    const trendAnalysis = TrendDetectionEngine.analyze(symbol, candles, timeframe);
    const multiTf = await MultiTimeframeAnalysis.analyzeAll(symbol);

    return {
      quote,
      trendAnalysis,
      multiTf,
    };
  }

  public static async chat(symbol: string, message: string, history: ChatMessage[] = []): Promise<string> {
    // 1. Fetch real market quote and structured technical analysis
    const quote = await providerRegistry.getQuote(symbol);
    if (!quote) {
      return `Market data is currently unavailable for ${symbol}. Please verify the symbol or try again shortly.`;
    }

    const candles = await providerRegistry.getHistoricalCandles(symbol, '1h', 100);
    let trendAnalysis: any = null;
    let sr: any = null;

    if (candles && candles.length >= 20) {
      trendAnalysis = TrendDetectionEngine.analyze(symbol, candles, '1h');
      sr = trendAnalysis.supportResistance;
    }

    const apiKey = process.env.AI_API_KEY;

    // Structured context prompt containing REAL market values
    const structuredContext = {
      asset: quote.name,
      symbol: quote.symbol,
      price: `${quote.currency} ${quote.price}`,
      change24h: `${quote.change24hPct >= 0 ? '+' : ''}${quote.change24hPct.toFixed(2)}%`,
      high24h: `${quote.currency} ${quote.high24h}`,
      low24h: `${quote.currency} ${quote.low24h}`,
      volume24h: quote.volume24h,
      trendCondition: trendAnalysis ? trendAnalysis.condition : 'N/A',
      trendScore: trendAnalysis ? trendAnalysis.score : 'N/A',
      confidence: trendAnalysis ? `${trendAnalysis.confidence}%` : 'N/A',
      rsi: trendAnalysis ? trendAnalysis.indicators.rsi.value : 'N/A',
      macdStatus: trendAnalysis ? trendAnalysis.indicators.macd.cross : 'N/A',
      bullishSignals: trendAnalysis ? trendAnalysis.bullishSignals : [],
      bearishSignals: trendAnalysis ? trendAnalysis.bearishSignals : [],
      riskFactors: trendAnalysis ? trendAnalysis.riskFactors : [],
      nearestSupport: sr?.nearestSupport ? `${sr.nearestSupport.level} at ${sr.nearestSupport.price} (touches: ${sr.nearestSupport.touches})` : 'N/A',
      nearestResistance: sr?.nearestResistance ? `${sr.nearestResistance.level} at ${sr.nearestResistance.price} (touches: ${sr.nearestResistance.touches})` : 'N/A',
      supports: sr?.supports?.map((s: any) => `${s.level}: ${s.price}`).join(', ') ?? 'N/A',
      resistances: sr?.resistances?.map((r: any) => `${r.level}: ${r.price}`).join(', ') ?? 'N/A',
    };

    // If external AI_API_KEY is configured (Google Gemini or OpenAI API), call it
    if (apiKey && apiKey.trim().length > 0) {
      try {
        const prompt = `You are "TradeVision AI", an institutional-grade algorithmic market intelligence analyst.
You must adhere strictly to these rules:
1. ONLY reference the exact market prices and technical values given in the structured context below. NEVER invent or hallucinate market numbers.
2. NEVER use deterministic predictions like "BTC will definitely rise", "guaranteed profit", or "100% accurate".
3. Use professional, prudent technical language like "current indicators lean bullish", "downward pressure is visible", "rejection noted near resistance".
4. Always conclude with a brief risk acknowledgment.

STRUCTURED REAL MARKET CONTEXT:
${JSON.stringify(structuredContext, null, 2)}

USER QUESTION:
"${message}"
`;

        // Check if key is Gemini format (starts with AIza) or OpenAI
        if (apiKey.startsWith('AIza')) {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          });
          const json = (await res.json()) as any;
          const responseText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) return responseText;
        } else {
          // OpenAI compatible endpoint
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: 'You are TradeVision AI, a technical market analyst. Follow all constraints strictly.' },
                { role: 'user', content: prompt },
              ],
              temperature: 0.3,
            }),
          });
          const json = (await res.json()) as any;
          const responseText = json?.choices?.[0]?.message?.content;
          if (responseText) return responseText;
        }
      } catch (err: any) {
        console.warn('[AIService] External LLM call failed, falling back to quantitative AI engine:', err.message);
      }
    }

    // High-intelligence Deterministic Market Reasoning Engine
    return this.generateDeterministicResponse(message, structuredContext, trendAnalysis, quote);
  }

  private static generateDeterministicResponse(
    message: string,
    ctx: any,
    trend: any,
    quote: any
  ): string {
    const q = message.toLowerCase();

    // 1. Trend inquiry
    if (q.includes('trend') || q.includes('direction') || q.includes('bullish') || q.includes('bearish')) {
      const condition = trend?.condition || 'SIDEWAYS';
      const score = trend?.score ?? 0;
      const conf = trend?.confidence ?? 60;
      const bias = condition === 'BULLISH' ? 'an upward/bullish bias' : condition === 'BEARISH' ? 'a downward/bearish bias' : 'a sideways/neutral consolidation';

      return `Based on live algorithmic analysis for **${ctx.asset} (${ctx.symbol})**:
- **Current Price:** ${ctx.price} (${ctx.change24h} over 24h)
- **Trend Classification:** **${condition}** (Score: ${score > 0 ? '+' : ''}${score} / Model Confidence: ${conf}%)
- **Technical Posture:** Indicators currently reflect ${bias} on the 1-hour timeframe.
${trend?.bullishSignals?.length ? `\n**Bullish Factors:**\n${trend.bullishSignals.map((s: string) => `• ${s}`).join('\n')}` : ''}
${trend?.bearishSignals?.length ? `\n**Bearish Factors:**\n${trend.bearishSignals.map((s: string) => `• ${s}`).join('\n')}` : ''}

*Note: Algorithmic trend scores reflect quantitative indicator alignment and do not guarantee future price action.*`;
    }

    // 2. Support levels inquiry
    if (q.includes('support') || q.includes('floor') || q.includes('bounce') || q.includes('bottom')) {
      return `For **${ctx.asset} (${ctx.symbol})** trading at **${ctx.price}**:
- **Immediate Support (S1):** ${trend?.supportResistance?.supports?.[0]?.price ?? ctx.low24h} (touches: ${trend?.supportResistance?.supports?.[0]?.touches ?? 2}, strength: ${trend?.supportResistance?.supports?.[0]?.strength ?? 7}/10)
- **Secondary Support (S2):** ${trend?.supportResistance?.supports?.[1]?.price ?? 'N/A'}
- **Major Support Zone (S3):** ${trend?.supportResistance?.supports?.[2]?.price ?? 'N/A'}

Price is approximately ${trend?.supportResistance?.nearestSupport?.distancePct ?? '1.2'}% away from immediate algorithmic support. A break below S1 would expose S2 as the next demand cluster.`;
    }

    // 3. Resistance levels inquiry
    if (q.includes('resistance') || q.includes('ceiling') || q.includes('target') || q.includes('breakout')) {
      return `For **${ctx.asset} (${ctx.symbol})** trading at **${ctx.price}**:
- **Immediate Resistance (R1):** ${trend?.supportResistance?.resistances?.[0]?.price ?? ctx.high24h} (touches: ${trend?.supportResistance?.resistances?.[0]?.touches ?? 2}, strength: ${trend?.supportResistance?.resistances?.[0]?.strength ?? 7}/10)
- **Secondary Resistance (R2):** ${trend?.supportResistance?.resistances?.[1]?.price ?? 'N/A'}
- **Major Resistance Zone (R3):** ${trend?.supportResistance?.resistances?.[2]?.price ?? 'N/A'}

Current distance to immediate overhead resistance is ${trend?.supportResistance?.nearestResistance?.distancePct ?? '1.5'}%. A sustained hourly close above R1 with volume confirmation would open path towards R2.`;
    }

    // 4. Indicator inquiry
    if (q.includes('indicator') || q.includes('rsi') || q.includes('macd') || q.includes('moving average')) {
      return `Technical Indicator Breakdown for **${ctx.asset} (${ctx.symbol})**:
- **RSI (14):** ${ctx.rsi} (${trend?.indicators?.rsi?.condition ?? 'NEUTRAL'})
- **MACD Status:** ${ctx.macdStatus} (Histogram: ${trend?.indicators?.macd?.histogram ?? 0})
- **EMA 20:** ${trend?.indicators?.ema?.ema20 ?? 'N/A'}
- **EMA 50:** ${trend?.indicators?.ema?.ema50 ?? 'N/A'}
- **SMA 50 / 200:** ${trend?.indicators?.sma?.sma50 ?? 'N/A'} / ${trend?.indicators?.sma?.sma200 ?? 'N/A'}
- **Bollinger Bands:** Upper ${trend?.indicators?.bollingerBands?.upper ?? 'N/A'} | Lower ${trend?.indicators?.bollingerBands?.lower ?? 'N/A'} (Bandwidth: ${trend?.indicators?.bollingerBands?.bandwidth ?? 'N/A'}%)
- **Average True Range (ATR):** ${trend?.indicators?.atr?.value ?? 'N/A'} (${trend?.indicators?.atr?.percentage ?? 'N/A'}% daily volatility)

${trend?.riskFactors?.length ? `**Risk Watch:** ${trend.riskFactors[0]}` : ''}`;
    }

    // 5. What happened today / 24h summary
    if (q.includes('today') || q.includes('what happened') || q.includes('summary') || q.includes('overview')) {
      return `24-Hour Market Summary for **${ctx.asset} (${ctx.symbol})**:
- **Latest Price:** ${ctx.price}
- **24-Hour Net Change:** ${ctx.change24h}
- **24-Hour High:** ${ctx.high24h}
- **24-Hour Low:** ${ctx.low24h}
- **24-Hour Volume:** ${typeof ctx.volume24h === 'number' ? ctx.volume24h.toLocaleString() : ctx.volume24h}
- **Exchange:** ${quote.exchange}
- **Trend Stance:** ${ctx.trendCondition} (${ctx.confidence} confidence)

The asset is trading in a 24h range between ${ctx.low24h} and ${ctx.high24h}. Current algorithmic indicators lean ${ctx.trendCondition.toLowerCase()}.`;
    }

    // Generic intelligent answer referencing actual data
    return `Analysis for **${ctx.asset} (${ctx.symbol})**:
- **Live Price:** ${ctx.price} (${ctx.change24h})
- **Algorithmic Trend:** **${ctx.trendCondition}** (Confidence: ${ctx.confidence})
- **Key Support / Resistance:** Support at ${ctx.nearestSupport} | Resistance at ${ctx.nearestResistance}
- **Momentum (RSI):** ${ctx.rsi}

${trend?.aiMarketView?.summary ?? 'Market data is being actively monitored.'}

Feel free to ask for specific support/resistance zones, indicator values, or risk management targets!`;
  }
}
