import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  ShieldAlert,
  Search,
  Sparkles,
  Zap,
  Clock,
  BarChart3,
  Layers,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Compass,
  CheckCircle2,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { api } from '../api/client';
import { PredictionResponse, MarketOpportunitiesResponse } from '../types';

interface PredictionViewProps {
  initialSymbol?: string;
  onOpenOptionChain: (symbol: string) => void;
  onOpenFutures: (symbol: string) => void;
}

const QUICK_STOCKS = [
  'NIFTY',
  'BANKNIFTY',
  'RELIANCE',
  'TCS',
  'HDFCBANK',
  'INFY',
  'ICICIBANK',
  'SBIN',
  'TATAMOTORS',
  'MARUTI'
];

export const PredictionView: React.FC<PredictionViewProps> = ({
  initialSymbol = 'NIFTY',
  onOpenOptionChain,
  onOpenFutures
}) => {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [searchInput, setSearchInput] = useState('');
  const [forecast, setForecast] = useState<PredictionResponse | null>(null);
  const [opportunities, setOpportunities] = useState<MarketOpportunitiesResponse | null>(null);
  const [activeScanTab, setActiveScanTab] = useState<'bullish' | 'bearish'>('bullish');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Price flash tracker for 1-second live ticks
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  const fetchForecast = async (sym: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getForecast(sym);
      setForecast(data);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate prediction');
      setForecast(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchOpportunities = async () => {
    try {
      const opps = await api.getMarketOpportunities();
      setOpportunities(opps);
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    }
  };

  useEffect(() => {
    fetchForecast(symbol);
    fetchOpportunities();
  }, [symbol]);

  // Live 1-second tick updates for the analyzed stock
  useEffect(() => {
    if (!forecast?.instrument_token) return;
    const token = forecast.instrument_token;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.hostname}:8000/api/market-data/ws/stream`;

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        ws?.send(JSON.stringify({ action: 'subscribe', tokens: [token] }));
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'TICKS' && Array.isArray(msg.data)) {
            const tick = msg.data.find((t: any) => t.token === token);
            if (tick) {
              if (tick.direction > 0) setFlash('up');
              else if (tick.direction < 0) setFlash('down');

              setForecast((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  current_price: tick.ltp,
                  change: tick.change,
                  change_percent: tick.change_percent,
                  volume: tick.volume
                };
              });

              setTimeout(() => setFlash(null), 600);
            }
          }
        } catch (e) {
          // ignore parsing error
        }
      };
    } catch (err) {
      console.error('WebSocket error in PredictionView:', err);
    }

    return () => {
      if (ws) {
        try {
          ws.send(JSON.stringify({ action: 'unsubscribe', tokens: [token] }));
          ws.close();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [forecast?.instrument_token]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSymbol(searchInput.trim().toUpperCase());
      setSearchInput('');
    }
  };

  const isBullish = forecast?.direction?.includes('BULLISH');
  const isBearish = forecast?.direction?.includes('BEARISH');

  return (
    <div className="space-y-6">
      {/* Header & Symbol Selector */}
      <div className="bg-[#111827] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
                  <span>AI Quantitative Future Prediction</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                    Multi-Horizon Engine
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Real-time algorithmic forecasting using ATR volatility targets, multi-timeframe momentum & derivatives confluence
                </p>
              </div>
            </div>
          </div>

          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search symbol (e.g. RELIANCE, TCS)..."
                className="pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 w-64 shadow-inner"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-purple-600/30"
            >
              Analyze
            </button>
          </form>
        </div>

        {/* Quick Ticker Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pt-2 border-t border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
            Benchmarks:
          </span>
          {QUICK_STOCKS.map((stk) => (
            <button
              key={stk}
              onClick={() => setSymbol(stk)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 ${
                symbol === stk
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {stk}
            </button>
          ))}
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="p-12 text-center bg-[#111827] border border-slate-800 rounded-2xl">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-semibold text-slate-300">Calculating quantitative models & derivatives confluence...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-6 bg-rose-950/20 border border-rose-500/40 rounded-2xl flex items-start space-x-3 text-rose-300">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <div>
            <h3 className="text-sm font-bold text-rose-200">Prediction Engine Notice</h3>
            <p className="text-xs text-rose-300/90 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Main Forecast Display */}
      {forecast && !loading && (
        <div className="space-y-6">
          {/* Master Signal Card */}
          <div className={`p-6 rounded-2xl border shadow-2xl relative overflow-hidden ${
            isBullish
              ? 'bg-gradient-to-br from-[#0c2419] to-[#0e1726] border-emerald-500/40 shadow-emerald-950/30'
              : isBearish
              ? 'bg-gradient-to-br from-[#240e14] to-[#0e1726] border-rose-500/40 shadow-rose-950/30'
              : 'bg-[#111827] border-slate-800'
          }`}>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Left: Stock info & Live Price */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {forecast.exchange}
                  </span>
                  <h2 className="text-2xl font-black text-white tracking-tight">{forecast.symbol}</h2>
                  <span className="text-xs text-slate-400">{forecast.name}</span>
                </div>

                <div className="flex items-baseline space-x-3">
                  <span className={`text-3xl font-black font-mono tracking-tight transition-colors ${
                    flash === 'up'
                      ? 'text-emerald-400 bg-emerald-500/20 px-2 rounded'
                      : flash === 'down'
                      ? 'text-rose-400 bg-rose-500/20 px-2 rounded'
                      : 'text-white'
                  }`}>
                    ₹{forecast.current_price?.toFixed(2)}
                  </span>
                  <span className={`text-sm font-bold font-mono flex items-center ${
                    (forecast.change || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {(forecast.change || 0) >= 0 ? '+' : ''}{forecast.change?.toFixed(2)} ({(forecast.change_percent || 0) >= 0 ? '+' : ''}{forecast.change_percent?.toFixed(2)}%)
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Vol: {forecast.volume?.toLocaleString()}</span>
                </div>
              </div>

              {/* Center: Direction Badge & Confidence Meter */}
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-center min-w-[240px] space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Model Recommendation
                </span>
                <div className="flex items-center justify-center space-x-2">
                  {isBullish ? (
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  ) : isBearish ? (
                    <TrendingDown className="w-6 h-6 text-rose-400" />
                  ) : (
                    <Activity className="w-6 h-6 text-amber-400" />
                  )}
                  <span className={`text-xl font-black tracking-tight ${
                    isBullish ? 'text-emerald-400' : isBearish ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    {forecast.direction?.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono font-bold">
                    <span className="text-slate-400">Confidence Score:</span>
                    <span className={isBullish ? 'text-emerald-400' : isBearish ? 'text-rose-400' : 'text-amber-400'}>
                      {forecast.confidence_percent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isBullish ? 'bg-emerald-500' : isBearish ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${forecast.confidence_percent}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-semibold">
                  Action: <span className="text-white font-bold">{forecast.primary_bias}</span>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex flex-col space-y-2">
                {forecast.has_derivatives && (
                  <>
                    <button
                      onClick={() => onOpenOptionChain(forecast.symbol)}
                      className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600 hover:text-white text-blue-400 border border-blue-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                    >
                      <span>View Option Chain</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenFutures(forecast.symbol)}
                      className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600 hover:text-white text-indigo-400 border border-indigo-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                    >
                      <span>View Futures Dashboard</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Price Targets & Risk Management Grid */}
          {forecast.trade_levels && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#111827] p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Optimal Entry Zone
                </span>
                <div className="text-base font-bold font-mono text-white">
                  ₹{forecast.trade_levels.entry_zone}
                </div>
                <div className="text-[10px] text-slate-500">Tight institutional range</div>
              </div>

              <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/30 space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block flex items-center">
                  <Target className="w-3.5 h-3.5 mr-1" />
                  Target 1 (1.1x ATR)
                </span>
                <div className="text-xl font-black font-mono text-emerald-300">
                  ₹{forecast.trade_levels.target_1.toFixed(2)}
                </div>
                <div className="text-[10px] text-emerald-400/80 font-mono">
                  Expected Return: {forecast.trade_levels.expected_move_pct}
                </div>
              </div>

              <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/30 space-y-1">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block flex items-center">
                  <Target className="w-3.5 h-3.5 mr-1" />
                  Target 2 (Extended 2.2x ATR)
                </span>
                <div className="text-xl font-black font-mono text-cyan-300">
                  ₹{forecast.trade_levels.target_2.toFixed(2)}
                </div>
                <div className="text-[10px] text-cyan-400/80">Trend runner objective</div>
              </div>

              <div className="bg-rose-950/20 p-4 rounded-xl border border-rose-500/30 space-y-1">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block flex items-center">
                  <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                  Invalidation Stop Loss
                </span>
                <div className="text-xl font-black font-mono text-rose-300">
                  ₹{forecast.trade_levels.stop_loss.toFixed(2)}
                </div>
                <div className="text-[10px] text-rose-400/80 font-mono">
                  Risk / Reward: {forecast.risk_reward_ratio}
                </div>
              </div>
            </div>
          )}

          {/* Multi-Horizon Breakdown Matrix */}
          {forecast.horizons && (
            <div className="bg-[#111827] p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>Multi-Horizon Return Projections</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  ATR Volatility: ₹{forecast.trade_levels?.volatility_atr.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1-5 Minutes Scalp */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Ultra-Short (1-5 Min)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                      Scalp
                    </span>
                  </div>
                  <div className="text-lg font-black font-mono text-purple-300 flex items-center space-x-1">
                    <span>{forecast.horizons.ultra_short_5m.direction}</span>
                    <span className="text-xs text-slate-400">(±{forecast.horizons.ultra_short_5m.expected_delta_pts} pts)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {forecast.horizons.ultra_short_5m.key_driver}
                  </p>
                  <div className="text-[10px] font-mono text-slate-500">
                    Confidence: {forecast.horizons.ultra_short_5m.confidence}%
                  </div>
                </div>

                {/* Intraday EOD */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Intraday (Session EOD)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">
                      Primary
                    </span>
                  </div>
                  <div className="text-lg font-black font-mono text-blue-300">
                    {forecast.horizons.intraday_eod.expected_return_pct}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {forecast.horizons.intraday_eod.key_driver}
                  </p>
                  <div className="text-[10px] font-mono text-slate-500">
                    Confidence: {forecast.horizons.intraday_eod.confidence}%
                  </div>
                </div>

                {/* Swing 5-Day */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Multi-Day Swing (1-5 Days)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      Positional
                    </span>
                  </div>
                  <div className="text-lg font-black font-mono text-emerald-300">
                    {forecast.horizons.swing_5d.expected_return_pct}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {forecast.horizons.swing_5d.key_driver}
                  </p>
                  <div className="text-[10px] font-mono text-slate-500">
                    Confidence: {forecast.horizons.swing_5d.confidence}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Technical Indicator Matrix & Derivative Confluence */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Technical Matrix */}
            {forecast.technicals && (
              <div className="bg-[#111827] p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span>Technical Indicators Engine</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1">RSI (14-Period):</span>
                    <div className="text-base font-bold font-mono text-white">
                      {forecast.technicals.rsi_14}
                    </div>
                    <span className={`text-[10px] font-bold ${
                      forecast.technicals.rsi_condition === 'OVERSOLD'
                        ? 'text-emerald-400'
                        : forecast.technicals.rsi_condition === 'OVERBOUGHT'
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}>
                      {forecast.technicals.rsi_condition}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1">VWAP Benchmark:</span>
                    <div className="text-base font-bold font-mono text-white">
                      ₹{forecast.technicals.vwap.toFixed(2)}
                    </div>
                    <span className={`text-[10px] font-bold font-mono ${
                      forecast.technicals.vwap_deviation_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {forecast.technicals.vwap_deviation_pct >= 0 ? '+' : ''}{forecast.technicals.vwap_deviation_pct}% vs Spot
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1">Moving Averages (EMA):</span>
                    <div className="text-xs font-mono text-slate-300 space-y-0.5">
                      <div>20 EMA: ₹{forecast.technicals.ema_20.toFixed(2)}</div>
                      <div>50 EMA: ₹{forecast.technicals.ema_50.toFixed(2)}</div>
                      <div>200 EMA: ₹{forecast.technicals.ema_200.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1">Bollinger Bands & ADX:</span>
                    <div className="text-xs font-mono text-slate-300 space-y-0.5">
                      <div>Upper: ₹{forecast.technicals.bollinger_upper.toFixed(2)}</div>
                      <div>Lower: ₹{forecast.technicals.bollinger_lower.toFixed(2)}</div>
                      <div className="text-cyan-400 font-bold">ADX: {forecast.technicals.adx_14} ({forecast.technicals.adx_trend})</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Derivatives Confluence */}
            <div className="bg-[#111827] p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Derivatives Market Confluence</span>
              </h3>

              {forecast.derivatives_confluence?.available ? (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1">Option Put-Call Ratio (PCR):</span>
                    <div className="text-base font-bold font-mono text-white">
                      {forecast.derivatives_confluence.pcr_oi?.toFixed(2) || '—'}
                    </div>
                    <span className={`text-[10px] font-bold ${
                      (forecast.derivatives_confluence.pcr_oi || 1) >= 1.15
                        ? 'text-emerald-400'
                        : (forecast.derivatives_confluence.pcr_oi || 1) <= 0.8
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}>
                      {(forecast.derivatives_confluence.pcr_oi || 1) >= 1.15
                        ? 'Bullish Put Writing'
                        : (forecast.derivatives_confluence.pcr_oi || 1) <= 0.8
                        ? 'Bearish Call Writing'
                        : 'Balanced Sentiment'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1">Max Pain Gravitational Strike:</span>
                    <div className="text-base font-bold font-mono text-amber-400">
                      ₹{forecast.derivatives_confluence.max_pain_strike?.toFixed(2) || '—'}
                    </div>
                    <span className="text-[10px] text-slate-400">Expirational magnetic anchor</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 col-span-2">
                    <span className="text-[10px] text-slate-400 block mb-1">Futures Buildup Classification:</span>
                    <div className="text-sm font-bold text-white">
                      {forecast.derivatives_confluence.futures_buildup || 'Neutral Buildup'}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Basis Spread: {forecast.derivatives_confluence.basis_spread ? `₹${forecast.derivatives_confluence.basis_spread.toFixed(2)}` : '—'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center space-y-2">
                  <div className="text-xs text-slate-400">
                    This security trades exclusively in the Cash Equity segment.
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Derivatives (Futures & Options) contracts are not listed by NSE/BSE for this instrument. Predictive models evaluate pure volume momentum, order flow, and multi-factor regressions.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Quantitative Reasoning & Commentary */}
          {forecast.commentary && forecast.commentary.length > 0 && (
            <div className="bg-[#111827] p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Compass className="w-4 h-4 text-purple-400" />
                <span>Quantitative Reasoning & Model Synthesis</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {forecast.commentary.map((c, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Top High-Probability Market Opportunities Scanner */}
      {opportunities && (
        <div className="bg-[#111827] p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Top High-Probability Opportunities Today</span>
              </h3>
              <p className="text-xs text-slate-400">
                Live algorithmic scanner filtering top high-conviction directional setups across NIFTY 50 and F&O universe
              </p>
            </div>

            {/* Toggle Tabs */}
            <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
              <button
                onClick={() => setActiveScanTab('bullish')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  activeScanTab === 'bullish'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Bullish Longs ({opportunities.top_bullish.length})</span>
              </button>
              <button
                onClick={() => setActiveScanTab('bearish')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  activeScanTab === 'bearish'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Bearish Shorts ({opportunities.top_bearish.length})</span>
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(activeScanTab === 'bullish' ? opportunities.top_bullish : opportunities.top_bearish).map((opp) => (
              <div
                key={opp.symbol}
                onClick={() => setSymbol(opp.symbol)}
                className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 hover:border-purple-500/50 cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-white group-hover:text-purple-300 font-mono">
                    {opp.symbol}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    opp.direction?.includes('BULLISH')
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {opp.confidence_percent}% Confidence
                  </span>
                </div>

                <div className="flex items-baseline justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold">₹{opp.current_price?.toFixed(2)}</span>
                  <span className={opp.direction?.includes('BULLISH') ? 'text-emerald-400' : 'text-rose-400'}>
                    Target: ₹{opp.trade_levels?.target_1.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-2">
                  <span>R:R {opp.risk_reward_ratio}</span>
                  <span className="text-purple-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
                    Analyze <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
