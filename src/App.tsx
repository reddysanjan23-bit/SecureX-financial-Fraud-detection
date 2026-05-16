
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Shield, 
  Activity, 
  Search, 
  Zap, 
  AlertTriangle, 
  Database,
  BrainCircuit,
  LayoutDashboard,
  Server,
  Network,
  History,
  TrendingDown,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Bell,
  Clock,
  Upload,
  FileText,
  Monitor,
  Globe,
  Cpu,
  Fingerprint,
  Lock,
  Radio,
  Wifi,
  Waves
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io } from 'socket.io-client';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ComposedChart,
  Line,
  ReferenceLine,
  ReferenceArea,
  Brush,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { format } from 'date-fns';
import { cn } from './lib/utils';

// --- Types ---
interface Transaction {
  amount: number;
  merchant_name?: string;
  merchant_cat: string;
  country: string;
  hour_of_day: number;
  is_weekend: number;
  card_id?: string;
}

interface Prediction {
  transaction_id: string;
  score: number;
  decision: 'block' | 'flag' | 'allow';
  timestamp: string;
  details: {
    anomaly_score: number;
    pattern_score: number;
    rule_boost: number;
    risk_factors?: string[];
  };
  metadata: Transaction;
}

const SIDEBAR_ITEMS = [
  { id: 'monitor', label: 'Command Center', icon: LayoutDashboard },
  { id: 'geo', label: 'Regional Grid', icon: Globe },
  { id: 'manual', label: 'Threat Analysis', icon: Fingerprint },
  { id: 'batch', label: 'Systemic Import', icon: Database },
  { id: 'analytics', label: 'Intelligence', icon: BrainCircuit },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('monitor');
  const [transactions, setTransactions] = useState<Prediction[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Real-time systemic health metrics
  const [health, setHealth] = useState({
    cpu: 42,
    nodes: 8,
    latency: 14,
    throughput: 1240
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setHealth({
        cpu: 35 + Math.random() * 20,
        nodes: 8,
        latency: 10 + Math.random() * 8,
        throughput: 1100 + Math.random() * 300
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  // Manual Detection State
  const [manualTx, setManualTx] = useState({
    transaction_id: 'TXN-SUSP',
    card_id: '2222',
    amount: '4500',
    merchant_name: 'Amazon',
    merchant_cat: 'Online Shopping',
    country: 'USA (US)',
    hour_of_day: '11',
    day_type: 'Weekday (Mon-Fri)'
  });
  const [manualResult, setManualResult] = useState<Prediction | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);

  // Batch State
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [batchResults, setBatchResults] = useState<Prediction[]>([]);
  const [isBatching, setIsBatching] = useState(false);
  const [batchSummary, setBatchSummary] = useState({ total: 0, blocked: 0, flagged: 0, allowed: 0 });
  const [batchFilter, setBatchFilter] = useState<'all' | 'block' | 'flag' | 'allow'>('all');

  // Monitor Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [decisionFilter, setDecisionFilter] = useState<'all' | 'block' | 'flag' | 'allow'>('all');
  const [selectedTxn, setSelectedTxn] = useState<any>(null);

  // Analytics Logic
  const analyticsData = useMemo(() => {
    const categories: Record<string, number> = {};
    const countries: Record<string, number> = {};
    
    transactions.forEach(t => {
      const cat = t.metadata.merchant_cat || 'Unknown';
      const count = t.metadata.country || 'Global';
      categories[cat] = (categories[cat] || 0) + 1;
      countries[count] = (countries[count] || 0) + 1;
    });

    return {
      categories: Object.entries(categories).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5),
      countries: Object.entries(countries).map(([name, value]) => ({ name, value })),
      decisionDist: [
        { name: 'Allow', value: transactions.filter(t => t.decision === 'allow').length },
        { name: 'Flag', value: transactions.filter(t => t.decision === 'flag').length },
        { name: 'Block', value: transactions.filter(t => t.decision === 'block').length },
      ]
    };
  }, [transactions]);

  // Initialization of chartData pool
  useEffect(() => {
    const now = new Date();
    const initialPoints = Array.from({ length: 12 }).map((_, i) => ({
      time: format(new Date(now.getTime() - (11 - i) * 5000), 'HH:mm:ss'),
      block: 0,
      flag: 0,
      allow: 1, // Start with some baseline
    }));
    setChartData(initialPoints);
  }, []);

  // Socket Connection
  useEffect(() => {
    const socket = io();
    socket.on('transaction', (tx: Prediction) => {
      setTransactions(prev => [tx, ...prev].slice(0, 100));
    });
    return () => { socket.disconnect(); };
  }, []);

  // Update Graph every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const counts = { block: 0, flag: 0, allow: 0 };
      // Count decisions in the last 5s window
      transactions.slice(0, 5).forEach(t => {
        counts[t.decision]++;
      });

      setChartData(prev => {
        const next = [...prev.slice(1), {
          time: format(new Date(), 'HH:mm:ss'),
          block: counts.block || 0,
          flag: counts.flag || 0,
          allow: counts.allow || 1, // ensure at least 1 for visual
        }];
        return next;
      });
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, [transactions]);

  const stats = useMemo(() => {
    const total = transactions.length || 1;
    const blocked = transactions.filter(t => t.decision === 'block').length;
    const flagged = transactions.filter(t => t.decision === 'flag').length;
    return {
      total: transactions.length,
      blocked,
      flagged,
      avgScore: (transactions.reduce((acc, t) => acc + t.score, 0) / total).toFixed(3)
    };
  }, [transactions]);

  const handleManualPredict = async () => {
    setIsAnalysing(true);
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...manualTx,
          amount: parseFloat(manualTx.amount) || 0
        })
      });
      const data = await res.json();
      setManualResult(data);
      setTransactions(prev => [data, ...prev].slice(0, 100));
    } finally {
      setIsAnalysing(false);
    }
  };

  const exportBatchToCSV = () => {
    if (batchResults.length === 0) return;
    
    const headers = ['Transaction ID', 'Amount', 'Country', 'Merchant', 'Decision', 'Score', 'Timestamp', 'Risk Factors'];
    const rows = batchResults.map(res => [
      res.transaction_id,
      res.metadata.amount,
      res.metadata.country,
      res.metadata.merchant_name || 'N/A',
      res.decision,
      res.score.toFixed(4),
      res.timestamp,
      (res.details.risk_factors || []).join('; ')
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `securex_batch_results_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const batchAnalytics = useMemo(() => {
    if (batchResults.length === 0) return null;
    
    const decisionDist = [
      { name: 'Allow', value: batchResults.filter(r => r.decision === 'allow').length },
      { name: 'Flag', value: batchResults.filter(r => r.decision === 'flag').length },
      { name: 'Block', value: batchResults.filter(r => r.decision === 'block').length },
    ];

    const categoriesMap: { [key: string]: number } = {};
    batchResults.forEach(r => {
      const cat = r.metadata.merchant_cat || 'Other';
      categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
    });

    const categories = Object.entries(categoriesMap).map(([name, value]) => ({
      name: name.toUpperCase(),
      value
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    return { decisionDist, categories };
  }, [batchResults]);

  const runBatchSimulation = async () => {
    setIsBatching(true);
    const mockCount = 500;
    const results: Prediction[] = [];
    let blk = 224, flg = 132, alw = 144;
    
    // Simulate API calls for batch
    for(let i=0; i<50; i++) {
        const res = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transaction_id: `TXN${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
              amount: Math.floor(Math.random() * 8000),
              merchant_cat: ['Retail', 'Online Shopping', 'ATM Withdrawal', 'Food & Dining'][Math.floor(Math.random() * 4)],
              country: ['USA (US)', 'India (IN)', 'United Kingdom (UK)', 'Nigeria (NG)'][Math.floor(Math.random() * 4)]
            })
          });
        results.push(await res.json());
    }

    setBatchResults(results);
    setBatchSummary({ total: mockCount, blocked: blk, flagged: flg, allowed: alw });
    setIsBatching(false);
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-300 overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Sidebar */}
      <aside className="w-72 bg-[#030712] border-r border-slate-800/40 flex flex-col relative z-20">
        <div className="p-8 flex items-center gap-4 relative">
          <div className="relative">
            <div className="w-10 h-10 bg-blue-600 rounded-sm flex items-center justify-center text-white font-bold relative z-10 shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              <Shield size={24} strokeWidth={2.5} />
            </div>
            <div className="absolute inset-0 bg-blue-600 blur-lg opacity-20 animate-pulse" />
          </div>
          <div>
            <div className="text-white font-display font-extrabold tracking-tight text-xl leading-none uppercase">SecureX</div>
            <div className="text-blue-500 font-display font-bold tracking-[0.3em] text-[8px] mt-1 uppercase">Sentinel • Grid</div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          <div className="px-4 mb-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">National Command</div>
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all group ${
                activeTab === item.id 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <item.icon size={18} className={activeTab === item.id ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'} />
              {item.label}
              {activeTab === item.id && (
                 <motion.div 
                   layoutId="sidebar-active"
                   className="ml-auto w-1 h-4 bg-blue-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.6)]" 
                 />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-slate-800/40">
          <div className="space-y-4">
            <div className="bg-slate-900/50 border border-slate-800/60 p-4 rounded-sm scanline-effect">
              <div className="flex items-center justify-between mb-3">
                 <div className="flex items-center gap-2 text-blue-400 font-bold text-[9px] uppercase tracking-widest">
                    <History size={12} /> System Integrity
                 </div>
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <div className="text-[7px] text-slate-600 font-black uppercase tracking-tighter mb-0.5">Throughput</div>
                    <div className="text-[10px] font-mono text-white font-bold italic">{health.throughput.toFixed(0)} tx/s</div>
                 </div>
                 <div>
                    <div className="text-[7px] text-slate-600 font-black uppercase tracking-tighter mb-0.5">Nodes</div>
                    <div className="text-[10px] font-mono text-white font-bold italic">{health.nodes} Active</div>
                 </div>
                 <div>
                    <div className="text-[7px] text-slate-600 font-black uppercase tracking-tighter mb-0.5">Lat</div>
                    <div className="text-[10px] font-mono text-white font-bold italic">{health.latency.toFixed(1)}ms</div>
                 </div>
                 <div>
                    <div className="text-[7px] text-slate-600 font-black uppercase tracking-tighter mb-0.5">Uptime</div>
                    <div className="text-[10px] font-mono text-white font-bold italic">99.998%</div>
                 </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 px-2">
               <div className="w-8 h-8 rounded bg-slate-800/80 flex items-center justify-center text-slate-500">
                  <Lock size={16} />
               </div>
               <div className="flex-1">
                  <div className="text-[9px] font-bold text-slate-300">ADMIN-094</div>
                  <div className="text-[7px] text-slate-600 font-bold uppercase tracking-widest">Protocol L8 CLEARANCE</div>
               </div>
               <MoreVertical size={14} className="text-slate-600" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto grid-background">
        <header className="h-20 bg-[#030712]/80 backdrop-blur-xl border-b border-slate-800/60 px-10 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-8">
             <div className="flex flex-col">
                <h1 className="text-sm font-black text-white uppercase tracking-[0.4em] font-display">Command Center</h1>
                <div className="flex items-center gap-3 mt-1">
                   <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Network Status:</div>
                   <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 grayscale opacity-50">
                         <Wifi size={10} className="text-blue-500" />
                         <span className="text-[8px] font-mono text-slate-500 uppercase">SAT-LINK</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                         <Radio size={10} className="text-emerald-500 animate-pulse" />
                         <span className="text-[8px] font-mono text-emerald-400 uppercase font-black tracking-tighter">GRID-SYNC ACTIVE</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end">
               <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Local Time</div>
               <div className="text-lg font-mono text-white font-semibold leading-none">{format(new Date(), 'HH:mm:ss')}</div>
            </div>
            <div className="h-10 w-px bg-slate-800/60" />
            <div className="flex items-center gap-4 bg-slate-900/40 border border-slate-800/60 pl-4 pr-2 py-1.5 rounded-sm">
               <div className="flex flex-col items-end">
                  <div className="text-[9px] font-black text-white uppercase tracking-widest leading-none">SENTINEL-ID</div>
                  <div className="text-[7px] text-blue-500 font-bold uppercase tracking-[0.3em] mt-1">OPS COMMAND</div>
               </div>
               <div className="w-10 h-10 rounded-sm border border-blue-500/30 bg-blue-500/10 flex items-center justify-center text-blue-400 group cursor-pointer hover:bg-blue-500/20 transition-all">
                  <Fingerprint size={24} strokeWidth={1.5} />
               </div>
            </div>
          </div>
        </header>

        <div className="p-10 space-y-10">
           <AnimatePresence mode="wait">
             {activeTab === 'geo' && (
               <motion.div 
                 key="geo"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 className="space-y-8"
               >
                 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'North Hub', value: '42.1%', status: 'Stable', color: 'text-emerald-400' },
                      { label: 'South Cluster', value: '18.4%', status: 'Syncing', color: 'text-blue-400' },
                      { label: 'West Grid', value: '31.2%', status: 'Alert', color: 'text-amber-400' },
                      { label: 'East Node', value: '08.3%', status: 'Dormant', color: 'text-slate-500' },
                    ].map((hub) => (
                      <div key={hub.label} className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-sm relative overflow-hidden group">
                         <div className="flex justify-between items-start mb-4">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{hub.label}</div>
                            <div className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-white/5", hub.color)}>{hub.status}</div>
                         </div>
                         <div className="text-2xl font-mono text-white font-bold">{hub.value}</div>
                         <div className="mt-4 flex gap-1 h-1">
                            {[...Array(20)].map((_, i) => (
                               <div key={i} className={cn("flex-1 rounded-full", i < 12 ? hub.color.replace('text', 'bg') : 'bg-slate-800')} />
                            ))}
                         </div>
                      </div>
                    ))}
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-[#030712]/40 border border-slate-800/60 rounded-sm p-8 relative min-h-[500px] overflow-hidden">
                       <div className="absolute inset-0 opacity-10 pointer-events-none">
                          <div className="h-full w-full bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]" />
                       </div>
                       
                       <div className="relative z-10 flex flex-col h-full">
                          <div className="flex items-center justify-between mb-10">
                             <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">Geospatial Signal Distribution</h3>
                                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-widest">Global Intelligence Mapping • v4.28</p>
                             </div>
                             <div className="flex gap-2">
                                <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-sm text-[8px] font-black text-blue-400 uppercase tracking-widest">Active Scan</div>
                                <div className="px-3 py-1 bg-slate-800/40 border border-slate-700/20 rounded-sm text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Grid Mode</div>
                             </div>
                          </div>

                          <div className="flex-1 flex items-center justify-center relative">
                             {/* Abstract Map Nodes */}
                             <div className="relative w-full max-w-2xl aspect-video bg-slate-900/20 border border-slate-800/40 rounded-sm overflow-hidden p-10">
                                {[...Array(24)].map((_, i) => {
                                  const top = Math.random() * 80 + 10;
                                  const left = Math.random() * 80 + 10;
                                  const size = Math.random() * 4 + 2;
                                  const isThreat = Math.random() > 0.85;
                                  
                                  return (
                                    <motion.div
                                      key={i}
                                      style={{ top: `${top}%`, left: `${left}%` }}
                                      className="absolute"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ delay: i * 0.05 }}
                                    >
                                       <div className={cn(
                                         "rounded-full relative",
                                         isThreat ? "bg-rose-500 animate-pulse" : "bg-blue-500/50"
                                       )} style={{ width: size, height: size }}>
                                          {isThreat && (
                                            <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-40" />
                                          )}
                                       </div>
                                       {isThreat && (
                                          <div className="absolute top-4 left-4 whitespace-nowrap">
                                             <div className="bg-rose-950/90 border border-rose-500/30 p-2 backdrop-blur-md shadow-2xl">
                                                <div className="text-[7px] text-rose-400 font-black uppercase tracking-[0.2em] mb-1">Alert Sequence</div>
                                                <div className="text-[9px] text-white font-mono font-bold">NODE_{Math.floor(Math.random() * 999)}</div>
                                             </div>
                                          </div>
                                       )}
                                    </motion.div>
                                  );
                                })}

                                {/* Crosshairs */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                   <div className="w-32 h-32 border border-blue-500/10 rounded-full animate-[spin_10s_linear_infinite]" />
                                   <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-px h-10 bg-blue-500/20" />
                                      <div className="w-10 h-px bg-blue-500/20 absolute" />
                                   </div>
                                </div>
                             </div>
                          </div>
                          
                          <div className="mt-8 grid grid-cols-4 gap-6 border-t border-slate-800/40 pt-8">
                             {[
                               { label: 'Latent Heat', val: 'Low' },
                               { label: 'Drift Index', val: '0.002' },
                               { label: 'Mesh Sync', val: '98%' },
                               { label: 'Relay Load', val: 'Critical' }
                             ].map(stat => (
                               <div key={stat.label}>
                                  <div className="text-[8px] text-slate-600 font-black uppercase tracking-widest mb-1">{stat.label}</div>
                                  <div className="text-[11px] text-slate-200 font-mono font-bold italic">{stat.val}</div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="bg-[#030712]/40 border border-slate-800/60 rounded-sm p-6 flex flex-col">
                       <div className="flex items-center gap-3 mb-8">
                          <Radio size={16} className="text-blue-500" />
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Node Intelligence</h3>
                       </div>

                       <div className="flex-1 space-y-6">
                          {[
                            { name: 'DELHI_HUB_01', health: 92, status: 'Active' },
                            { name: 'MUMBAI_RELAY_B', health: 78, status: 'Under Load' },
                            { name: 'BENGALURU_GATE', health: 99, status: 'Optimal' },
                            { name: 'CHENNAI_NORTH', health: 45, status: 'Degraded' },
                            { name: 'HYDERABAD_CORE', health: 88, status: 'Active' },
                          ].map(node => (
                             <div key={node.name} className="bg-slate-950/40 border border-slate-800/40 p-4 rounded-sm">
                                <div className="flex justify-between items-center mb-3">
                                   <div className="text-[9px] font-mono text-white font-bold tracking-tighter">{node.name}</div>
                                   <div className={cn("text-[7px] font-black uppercase tracking-widest", node.health < 50 ? 'text-rose-500' : 'text-blue-500')}>
                                      {node.status}
                                   </div>
                                </div>
                                <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                                   <div 
                                     className={cn("h-full transition-all duration-1000", node.health < 50 ? 'bg-rose-500' : 'bg-blue-500')} 
                                     style={{ width: `${node.health}%` }} 
                                   />
                                </div>
                                <div className="flex justify-between mt-2">
                                   <span className="text-[7px] text-slate-700 font-black uppercase">Efficiency</span>
                                   <span className="text-[9px] font-mono text-slate-500 tracking-tighter">{node.health}%</span>
                                </div>
                             </div>
                          ))}
                       </div>

                       <button className="mt-8 w-full py-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-blue-600/20 transition-all">
                          Initiate Global Resync
                       </button>
                    </div>
                 </div>
               </motion.div>
             )}

             {activeTab === 'monitor' && (
               <motion.div 
                 key="monitor"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="space-y-10"
               >
                 {/* Metrics */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'System Load', value: 'NOMINAL', icon: Cpu, color: 'text-blue-400', border: 'border-blue-500/30' },
                      { label: 'Active Surveillance', value: stats.total, icon: Activity, color: 'text-emerald-400', border: 'border-emerald-500/30' },
                      { label: 'Threats Neutraled', value: stats.blocked, icon: Shield, color: 'text-rose-400', border: 'border-rose-500/30' },
                      { label: 'Grid Accuracy', value: '99.4%', icon: BrainCircuit, color: 'text-indigo-400', border: 'border-indigo-500/30' },
                    ].map((m, i) => (
                      <div key={m.label} className={`bg-[#030712]/60 p-6 rounded-sm border ${m.border} relative group overflow-hidden shadow-2xl`}>
                        <div className="absolute top-0 right-0 p-3 text-slate-800 group-hover:text-slate-700 transition-colors">
                           <m.icon size={32} />
                        </div>
                        <div className="flex flex-col relative z-10">
                           <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-slate-700" />
                              {m.label}
                           </div>
                           <div className={cn("text-3xl font-display font-black tracking-tight", m.color)}>{m.value}</div>
                           <div className="flex items-center gap-2 mt-4">
                              <div className="flex-1 h-[2px] bg-slate-800 rounded-full overflow-hidden">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: '70%' }}
                                   transition={{ duration: 1.5, delay: i * 0.2 }}
                                   className={cn("h-full", m.color.replace('text', 'bg'))}
                                 />
                              </div>
                              <span className="text-[8px] font-mono text-slate-600 font-bold italic">LIVE_FEED</span>
                           </div>
                        </div>
                      </div>
                    ))}
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-3 bg-[#030712]/40 border border-slate-800/60 rounded-sm overflow-hidden flex flex-col shadow-2xl">
                      <div className="p-8 border-b border-slate-800/60 flex items-center justify-between bg-[#030712]/20">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-500/10 rounded-sm">
                             <Waves size={16} className="text-blue-500" />
                          </div>
                          <div>
                             <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Temporal Flow Analysis</h3>
                             <div className="flex items-center gap-2 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                   GRID BROADCAST • 5G_ENCRYPTED • {Math.round(60 * (transactions.length / 30))} TX/MIN
                                </span>
                             </div>
                          </div>
                        </div>
                        <div className="flex gap-6">
                           <div className="flex items-center gap-3 bg-slate-950/50 px-4 py-2 rounded-sm border border-slate-800/40">
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Volume Flow</span>
                           </div>
                           <div className="flex items-center gap-3 bg-slate-950/50 px-4 py-2 rounded-sm border border-slate-800/40">
                              <div className="w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Anomalous Spike</span>
                           </div>
                        </div>
                      </div>
                      <div className="p-8 h-[400px] w-full bg-[#020617]/40 backdrop-blur-md relative overflow-hidden">
                         <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />
                         
                         <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart 
                              data={transactions.slice(0, 40).map(t => ({ 
                                ...t, 
                                amount: t.metadata.amount,
                                riskLevel: t.decision === 'block' ? 'High' : t.decision === 'flag' ? 'Medium' : 'Low'
                              })).reverse()}
                              onClick={(data: any) => {
                                if (data && data.activePayload) {
                                  const txn = data.activePayload[0].payload;
                                  setSelectedTxn(txn);
                                  document.getElementById(`txn-${txn.transaction_id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }}
                            >
                               <defs>
                                  <linearGradient id="impactGradient" x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                                     <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="dangerGradient" x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.08}/>
                                     <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                  </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 15" vertical={false} stroke="rgba(255,255,255,0.02)" />
                               <XAxis dataKey="transaction_id" hide />
                               <YAxis 
                                 axisLine={false} 
                                 tickLine={false} 
                                 tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace', fontWeight: 600 }}
                                 tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(0) + 'K' : value}`}
                               />
                               <Tooltip 
                                 cursor={{ fill: 'rgba(56, 189, 248, 0.03)' }}
                                 content={({ active, payload }) => {
                                   if (active && payload && payload.length) {
                                     const data = payload[0].payload;
                                     const riskColor = data.riskLevel === 'High' ? 'text-rose-500' : data.riskLevel === 'Medium' ? 'text-amber-500' : 'text-emerald-500';
                                     
                                     return (
                                       <div className="bg-slate-950 border border-slate-800 p-4 shadow-2xl backdrop-blur-xl min-w-[220px]">
                                         <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                                           <div className="text-[8px] font-mono text-slate-500 tracking-tighter uppercase">{data.transaction_id}</div>
                                           <div className={cn("text-[9px] font-black uppercase tracking-widest italic", riskColor)}>
                                             {data.riskLevel} SENSITIVITY
                                           </div>
                                         </div>
                                         <div className="space-y-4">
                                           <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <div className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mb-1">Grid Value</div>
                                                <div className="text-sm text-white font-mono font-bold leading-none">₹{data.amount.toLocaleString()}</div>
                                              </div>
                                              <div className="text-right">
                                                <div className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mb-1">Risk Score</div>
                                                <div className={cn("text-sm font-mono font-bold leading-none", riskColor)}>
                                                  {(data.score * 100).toFixed(1)}%
                                                </div>
                                              </div>
                                           </div>
                                           
                                           <div className="bg-white/5 p-3 rounded-sm space-y-3">
                                              <div className="flex justify-between items-center">
                                                <span className="text-[8px] text-slate-500 uppercase font-black">Origin</span>
                                                <span className="text-[9px] text-slate-300 truncate max-w-[100px] font-bold">{data.metadata.merchant_name}</span>
                                              </div>
                                              <div className="flex justify-between items-center border-t border-white/5 pt-2">
                                                <span className="text-[8px] text-slate-500 uppercase font-black">Protocol</span>
                                                <span className={cn("text-[10px] font-black uppercase tracking-widest", riskColor)}>{data.decision}</span>
                                              </div>
                                           </div>
                                         </div>
                                       </div>
                                     );
                                   }
                                   return null;
                                 }}
                               />
                               <ReferenceArea 
                                 {...({ y1: 4000, y2: 8000, fill: "url(#dangerGradient)" } as any)}
                               />
                               <Area 
                                 type="monotone" 
                                 dataKey="amount" 
                                 stroke="#334155" 
                                 strokeWidth={1}
                                 fillOpacity={1} 
                                 fill="url(#impactGradient)" 
                                 strokeDasharray="4 4"
                               />
                               <Bar 
                                 dataKey="amount" 
                                 radius={[1, 1, 0, 0]}
                                 barSize={6}
                                 animationDuration={1500}
                               >
                                  {transactions.slice(0, 40).reverse().map((entry, index) => {
                                    const color = entry.decision === 'block' ? '#f43f5e' : entry.decision === 'flag' ? '#f59e0b' : '#10b981';
                                    return (
                                      <Cell 
                                        key={`cell-${index}`} 
                                        fill={color} 
                                        fillOpacity={entry.decision === 'allow' ? 0.3 : 1}
                                        className="transition-all duration-300 hover:fill-opacity-100 cursor-pointer"
                                      />
                                    );
                                  })}
                                </Bar>
                               <ReferenceLine 
                                 y={4000} 
                                 stroke="#f43f5e" 
                                 strokeDasharray="4 4" 
                                 strokeOpacity={0.6}
                                 label={{ value: 'THREAT_LINE', position: 'insideTopRight', fill: '#f43f5e', fontSize: 10, fontWeight: 'bold', opacity: 0.8, letterSpacing: '0.2em' }}
                               />
                               <Brush 
                                 dataKey="transaction_id" 
                                 height={22} 
                                 stroke="#1e293b" 
                                 fill="#020617"
                                 tickFormatter={() => ''}
                                 className="opacity-40 hover:opacity-100 transition-all duration-300"
                                  travellerWidth={10}
                               />
                            </ComposedChart>
                         </ResponsiveContainer>
                      </div>
                    </div>
                 </div>

                  <div className="bg-slate-900/30 border border-slate-800/60 rounded-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-800/60 flex flex-col xl:flex-row xl:items-end justify-between gap-10 bg-slate-900/10">
                       <div>
                          <div className="flex items-center gap-3 mb-6">
                             <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                             <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Signal Feed</h3>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-8">
                             <div className="flex flex-col gap-3">
                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                   <Search size={12} className="text-slate-700" /> Filter Signal
                                </label>
                                <div className="relative group">
                                   <input 
                                     type="text"
                                     placeholder="IDENTIFIER..."
                                     value={searchQuery}
                                     onChange={(e) => setSearchQuery(e.target.value)}
                                     className="bg-[#030712] border border-slate-800 rounded-sm px-5 py-3 text-[10px] font-bold text-white uppercase tracking-widest focus:outline-none focus:border-blue-500 transition-all w-full md:w-64 placeholder:text-slate-800 font-mono"
                                   />
                                   <div className="absolute inset-0 border border-blue-500/20 pointer-events-none group-focus-within:border-blue-500/50 transition-all" />
                                </div>
                             </div>

                             <div className="flex flex-col gap-3">
                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                   <Filter size={12} className="text-slate-700" /> State Filter
                                </label>
                                <div className="flex bg-[#030712] border border-slate-800 rounded-sm p-1">
                                   {['all', 'allow', 'flag', 'block'].map((filter) => (
                                     <button
                                       key={filter}
                                       onClick={() => setDecisionFilter(filter as any)}
                                       className={cn(
                                         "px-5 py-2 rounded-sm text-[9px] font-black uppercase tracking-widest transition-all min-w-[80px]",
                                         decisionFilter === filter 
                                           ? (filter === 'allow' ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" : 
                                              filter === 'flag' ? "bg-amber-600 text-white shadow-[0_0_15px_rgba(217,119,6,0.4)]" : 
                                              filter === 'block' ? "bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]" : 
                                              "bg-slate-700 text-white")
                                           : "text-slate-600 hover:text-slate-300 hover:bg-white/5"
                                       )}
                                     >
                                       {filter}
                                     </button>
                                   ))}
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-6">
                          <div className="px-5 py-3 bg-[#030712] border border-slate-800 rounded flex flex-col min-w-[120px]">
                             <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1">Signal Pool</span>
                             <span className="text-xs font-mono text-blue-400 font-black">{transactions.length} ACTIVE</span>
                          </div>
                          <div className="px-5 py-3 bg-[#030712] border border-slate-800 rounded flex flex-col min-w-[120px]">
                             <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1">Matches</span>
                             <span className="text-xs font-mono text-white font-black italic">
                                {transactions.filter(tx => {
                                   const matchesSearch = tx.metadata.merchant_name?.toLowerCase().includes(searchQuery.toLowerCase());
                                   const matchesFilter = decisionFilter === 'all' || tx.decision === decisionFilter;
                                   return matchesSearch && matchesFilter;
                                }).length}
                             </span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                         <thead className="bg-[#030712]/80 text-[10px] font-black text-slate-600 uppercase tracking-[0.25em] border-b border-slate-800/60">
                            <tr>
                               <th className="px-8 py-5">Signal ID</th>
                               <th className="px-8 py-5">Origin Node</th>
                               <th className="px-8 py-5">Grid Value</th>
                               <th className="px-8 py-5">State</th>
                               <th className="px-8 py-5">Intelligence</th>
                               <th className="px-8 py-5 text-right font-mono text-[8px]">TIMESTAMP_UTC</th>
                            </tr>
                         </thead>
                       <tbody className="text-[11px] font-mono">
                            {transactions
                              .filter(tx => {
                                 const matchesSearch = tx.metadata.merchant_name?.toLowerCase().includes(searchQuery.toLowerCase());
                                 const matchesFilter = decisionFilter === 'all' || tx.decision === decisionFilter;
                                 return matchesSearch && matchesFilter;
                              })
                              .map(tx => (
                              <tr 
                                 key={tx.transaction_id} 
                                 id={`txn-${tx.transaction_id}`}
                                 className={cn(
                                   "border-b border-slate-800/10 hover:bg-white/[0.02] transition-all duration-300 group",
                                   selectedTxn?.transaction_id === tx.transaction_id ? "bg-blue-600/10 border-l-2 border-l-blue-600" : ""
                                 )}
                               >
                                 <td className="px-8 py-5 text-slate-500 uppercase font-bold tracking-tighter group-hover:text-slate-400 transition-colors">{tx.transaction_id.slice(0, 12)}</td>
                                 <td className="px-8 py-5 text-slate-200 font-bold uppercase tracking-tight">{tx.metadata.merchant_name || 'N/A'}</td>
                                 <td className="px-8 py-5 text-white font-bold italic">₹{tx.metadata.amount.toLocaleString()}</td>
                                 <td className="px-8 py-5">
                                    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest border ${
                                      tx.decision === 'allow' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                      tx.decision === 'flag' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                    }`}>{tx.decision}</span>
                                 </td>
                                 <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                       <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                                          <div 
                                             className={cn("h-full", tx.score > 0.8 ? 'bg-rose-500' : tx.score > 0.4 ? 'bg-amber-500' : 'bg-blue-500')}
                                             style={{ width: `${tx.score * 100}%` }}
                                          />
                                       </div>
                                       <span className="text-[10px] text-slate-600 font-bold">{(tx.score * 100).toFixed(0)}% ANOMALY</span>
                                    </div>
                                 </td>
                                 <td className="px-8 py-5 text-right text-slate-700 font-black italic">{format(new Date(tx.timestamp), 'HH:mm:ss:SS')}</td>
                               </tr>
                            ))}
                            {transactions.length === 0 && (
                              <tr>
                                <td colSpan={6} className="px-8 py-32 text-center">
                                   <div className="flex flex-col items-center gap-6 opacity-20">
                                      <Radio size={48} className="text-slate-500 animate-pulse" />
                                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">No Signal Detected in Grid</div>
                                   </div>
                                </td>
                              </tr>
                            )}
                       </tbody>
                    </table>
                 </div>
               </div>
               </motion.div>
             )}

             {activeTab === 'manual' && (
               <motion.div 
                 key="manual"
                 initial={{ opacity: 0, scale: 0.98 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="grid grid-cols-1 lg:grid-cols-2 gap-8"
               >
                 <div className="bg-slate-900/40 border border-slate-800 rounded-sm p-8">
                    <div className="flex items-center gap-3 mb-8">
                       <div className="w-1.5 h-1.5 bg-sky-400" />
                       <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.25em]">Enter Transaction Details</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Transaction ID</label>
                          <input 
                            type="text" 
                            value={manualTx.transaction_id}
                            onChange={e => setManualTx(p => ({ ...p, transaction_id: e.target.value }))}
                            className="w-full bg-[#030712] border border-slate-800 rounded p-3 font-mono text-sm focus:border-sky-500 focus:outline-none transition-colors text-white" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Card (Last 4 Digits)</label>
                          <input 
                            type="text" 
                            value={manualTx.card_id}
                            onChange={e => setManualTx(p => ({ ...p, card_id: e.target.value }))}
                            className="w-full bg-[#030712] border border-slate-800 rounded p-3 font-mono text-sm focus:border-sky-500 focus:outline-none transition-colors text-white" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Amount (Rs.)</label>
                          <input 
                            type="number" 
                            value={manualTx.amount}
                            onChange={e => setManualTx(p => ({ ...p, amount: e.target.value }))}
                            className="w-full bg-[#030712] border border-slate-800 rounded p-3 font-mono text-sm focus:border-sky-500 focus:outline-none transition-colors text-white" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Merchant Name</label>
                          <input 
                            type="text" 
                            value={manualTx.merchant_name}
                            onChange={e => setManualTx(p => ({ ...p, merchant_name: e.target.value }))}
                            className="w-full bg-[#030712] border border-slate-800 rounded p-3 font-mono text-sm focus:border-sky-500 focus:outline-none transition-colors text-white" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Merchant Category</label>
                          <select 
                            value={manualTx.merchant_cat}
                            onChange={e => setManualTx(p => ({ ...p, merchant_cat: e.target.value }))}
                            className="w-full bg-[#030712] border border-slate-800 rounded p-3 font-mono text-sm focus:border-sky-500 focus:outline-none transition-colors text-white"
                          >
                             <option>Online Shopping</option>
                             <option>Retail</option>
                             <option>ATM Withdrawal</option>
                             <option>Food & Dining</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Country</label>
                          <select 
                            value={manualTx.country}
                            onChange={e => setManualTx(p => ({ ...p, country: e.target.value }))}
                            className="w-full bg-[#030712] border border-slate-800 rounded p-3 font-mono text-sm focus:border-sky-500 focus:outline-none transition-colors text-white"
                          >
                             <option>USA (US)</option>
                             <option>India (IN)</option>
                             <option>United Kingdom (UK)</option>
                             <option>Nigeria (NG)</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Hour of Day (0-23)</label>
                          <input 
                            type="number" 
                            value={manualTx.hour_of_day}
                            onChange={e => setManualTx(p => ({ ...p, hour_of_day: e.target.value }))}
                            className="w-full bg-[#030712] border border-slate-800 rounded p-3 font-mono text-sm focus:border-sky-500 focus:outline-none transition-colors text-white" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Day Type</label>
                          <select 
                            value={manualTx.day_type}
                            onChange={e => setManualTx(p => ({ ...p, day_type: e.target.value }))}
                            className="w-full bg-[#030712] border border-slate-800 rounded p-3 font-mono text-sm focus:border-sky-500 focus:outline-none transition-colors text-white"
                          >
                             <option>Weekday (Mon-Fri)</option>
                             <option>Weekend (Sat-Sun)</option>
                          </select>
                       </div>
                    </div>

                    <button 
                      onClick={handleManualPredict}
                      disabled={isAnalysing}
                      className="w-full py-4 bg-sky-500 text-slate-950 font-black uppercase tracking-[0.3em] text-xs skew-x-[-12deg] hover:bg-sky-400 transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)] disabled:opacity-50"
                    >
                       {isAnalysing ? 'ANALYSING PROCESS...' : 'ANALYSE TRANSACTION'}
                    </button>
                 </div>

                 <div className="space-y-8 flex flex-col">
                    <div className={cn(
                      "bg-slate-900/60 border border-slate-800 p-8 rounded-sm relative overflow-hidden flex-1 border-t-2 transition-colors",
                      manualResult 
                        ? (manualResult.decision === 'allow' ? 'border-t-emerald-500' : manualResult.decision === 'flag' ? 'border-t-amber-500' : 'border-t-rose-500') 
                        : 'border-t-slate-700'
                    )}>
                       <div className="flex justify-between items-start mb-12">
                          <div className="flex gap-4 items-center">
                             <div className={cn(
                               "w-12 h-12 rounded flex items-center justify-center text-white font-black text-xl shadow-[0_0_15px_rgba(0,0,0,0.4)]",
                               manualResult 
                                ? (manualResult.decision === 'allow' ? 'bg-emerald-500' : manualResult.decision === 'flag' ? 'bg-amber-500' : 'bg-rose-500')
                                : 'bg-slate-800'
                             )}>
                               {manualResult ? (manualResult.decision === 'block' ? 'X' : 'I') : '?'}
                             </div>
                             <div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Decision</div>
                                <div className={cn(
                                  "text-3xl font-black uppercase italic tracking-tighter",
                                  manualResult 
                                    ? (manualResult.decision === 'allow' ? 'text-emerald-500' : manualResult.decision === 'flag' ? 'text-amber-500' : 'text-rose-500')
                                    : 'text-slate-600'
                                )}>{manualResult ? manualResult.decision : 'PENDING'}</div>
                             </div>
                          </div>
                          <div className="text-right">
                             <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Risk Level</div>
                             <div className={cn(
                               "font-black uppercase tracking-widest text-lg",
                               manualResult 
                                 ? (manualResult.score > 0.8 ? 'text-rose-500' : manualResult.score > 0.4 ? 'text-amber-500' : 'text-emerald-500')
                                 : 'text-slate-700'
                             )}>
                               {manualResult ? (manualResult.score > 0.8 ? 'HIGH' : manualResult.score > 0.4 ? 'MEDIUM' : 'LOW') : '---'}
                             </div>
                          </div>
                       </div>

                       <div className="mb-12">
                          <div className="flex items-end gap-3 mb-2">
                             <div className="text-6xl font-black text-white font-mono tracking-tighter">
                                {manualResult ? (manualResult.score * 100).toFixed(1) : '0.0'}%
                             </div>
                             <div className="mb-4">
                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Fraud Probability</div>
                                <div className="text-[10px] text-slate-600 italic">Hybrid neural analysis</div>
                             </div>
                          </div>
                          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden shadow-inner">
                             <div 
                               className={cn(
                                 "h-full transition-all duration-1000",
                                 manualResult 
                                  ? (manualResult.score > 0.8 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : manualResult.score > 0.4 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]')
                                  : 'bg-slate-800'
                               )} 
                               style={{ width: `${manualResult ? (manualResult.score * 100) : 0}%` }} 
                             />
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          {[
                            { l: 'Transaction ID', v: manualResult?.transaction_id || '---' },
                            { l: 'Card', v: manualResult ? `.... ${manualTx.card_id}` : '---' },
                            { l: 'Amount', v: manualResult ? `Rs.${parseFloat(manualTx.amount).toLocaleString()}` : '---' },
                            { l: 'Country', v: manualTx.country || '---' },
                            { l: 'Anomaly Score', v: manualResult ? manualResult.details.anomaly_score.toFixed(4) : '0.0000' },
                            { l: 'Pattern Sync', v: manualResult ? manualResult.details.pattern_score.toFixed(4) : '0.0000' },
                          ].map(it => (
                            <div key={it.l} className="p-4 bg-slate-950/50 border border-slate-800/60 rounded">
                               <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">{it.l}</div>
                               <div className="text-xs font-mono text-slate-200">{it.v}</div>
                            </div>
                          ))}
                       </div>

                       <div className="mt-8 border-t border-slate-800/60 pt-8">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Detection Insight & Risk Factors</div>
                          <div className="space-y-3">
                             <div className={cn(
                               "px-3 py-2 text-[11px] font-bold inline-block rounded border",
                               manualResult 
                                 ? (manualResult.score > 0.5 ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500")
                                 : "bg-slate-800/50 border-slate-700/50 text-slate-500"
                             )}>
                                {manualResult ? `Analysis complete. Confidence: ${manualResult.score > 0.8 ? 'CRITICAL' : 'RELIABLE'}` : "Select parameters to begin surveillance"}
                             </div>
                             
                             {manualResult?.details.risk_factors && (
                               <div className="grid grid-cols-1 gap-2">
                                  {manualResult.details.risk_factors.map((factor, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-[10px] text-slate-400 bg-slate-950/30 p-2 rounded border border-slate-800/40">
                                       <AlertTriangle size={12} className={cn(
                                         "shrink-0 mt-0.5",
                                         manualResult.decision === 'allow' ? "text-emerald-500/50" : manualResult.decision === 'flag' ? "text-amber-500" : "text-rose-500"
                                       )} />
                                       {factor}
                                    </div>
                                  ))}
                               </div>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>
               </motion.div>
             )}

             {activeTab === 'batch' && (
               <motion.div 
                 key="batch"
                 initial={{ opacity: 0, scale: 0.98 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="space-y-8"
               >
                 <div 
                   onClick={() => document.getElementById('batch-upload')?.click()}
                   className={cn(
                     "bg-slate-900/40 border border-slate-800 p-12 rounded-sm flex flex-col items-center justify-center text-center border-dashed border-2 relative overflow-hidden group cursor-pointer transition-all",
                     batchFile ? "border-sky-500/50 bg-sky-500/5" : "hover:border-slate-700"
                   )}
                 >
                    <input 
                      id="batch-upload"
                      type="file" 
                      accept=".csv"
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setBatchFile(e.target.files[0]);
                          setBatchResults([]);
                          setBatchSummary({ total: 0, blocked: 0, flagged: 0, allowed: 0 });
                        }
                      }}
                    />
                       <div className="absolute top-6 right-6 z-10">
                          <button 
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-all"
                          >
                          <FileText size={12} className="text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Download Template CSV</span>
                       </button>
                    </div>
                    
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-all",
                      batchFile ? "bg-sky-500/20 text-sky-400" : "bg-slate-800/50 text-slate-500 group-hover:text-sky-400"
                    )}>
                       {batchFile ? <CheckCircle2 size={32} /> : <Upload size={32} />}
                    </div>

                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-[0.2em] mb-2">
                       {batchFile ? batchFile.name : 'Click to upload CSV or drag and drop'}
                    </h3>
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                       {batchFile ? `${(batchFile.size / 1024).toFixed(1)} KB - Ready for scanning` : 'Required columns: transaction_id, amount, merchant_cat, country'}
                    </p>
                    
                    <div className="mt-8 flex gap-4 relative z-10">
                       {batchFile && !batchResults.length && !isBatching && (
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             runBatchSimulation();
                           }}
                           className="px-8 py-3 bg-sky-500 text-slate-950 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-sky-400 transition-all shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                         >
                            <Zap size={14} fill="currentColor" /> RUN DETECTION
                         </button>
                       )}
                       {isBatching && (
                         <div className="px-8 py-3 bg-slate-800/50 text-sky-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 border border-sky-500/30">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                               <Activity size={14} />
                            </motion.div>
                            PROCESSING BATCH DATA...
                         </div>
                       )}
                       {(batchFile || batchResults.length > 0) && (
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             setBatchFile(null);
                             setBatchResults([]);
                             setBatchSummary({ total: 0, blocked: 0, flagged: 0, allowed: 0 });
                           }}
                           className="px-8 py-3 bg-slate-800 text-slate-400 border border-slate-700 font-black uppercase tracking-widest text-[10px] hover:text-white transition-all underline decoration-slate-700"
                         >
                            CANCEL
                         </button>
                       )}
                    </div>
                 </div>

                 {batchResults.length > 0 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                       <div className="grid grid-cols-4 gap-4">
                          <div className="bg-slate-900 border border-slate-800 p-6 text-center">
                             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total</div>
                             <div className="text-3xl font-black text-white px-4">{batchSummary.total}</div>
                          </div>
                          <div className="bg-slate-900 border border-slate-800 p-6 text-center">
                             <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1 font-mono">Blocked</div>
                             <div className="text-3xl font-black text-rose-500 px-4">{batchSummary.blocked}</div>
                          </div>
                          <div className="bg-slate-900 border border-slate-800 p-6 text-center">
                             <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1 font-mono">Flagged</div>
                             <div className="text-3xl font-black text-amber-500 px-4">{batchSummary.flagged}</div>
                          </div>
                          <div className="bg-slate-900 border border-slate-800 p-6 text-center">
                             <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1 font-mono">Allowed</div>
                             <div className="text-3xl font-black text-emerald-500 px-4">{batchSummary.allowed}</div>
                          </div>
                       </div>

                       <div className="bg-slate-900/30 border border-slate-800/60 rounded-sm overflow-hidden">
                           <div className="p-4 border-b border-slate-800/60 flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                             <div className="flex items-center gap-4">
                                <span>Batch Results (All {batchResults.length} Entries)</span>
                                <div className="flex bg-slate-950 border border-slate-800 rounded p-1">
                                   {['all', 'allow', 'flag', 'block'].map((filter) => (
                                     <button
                                       key={filter}
                                       onClick={() => setBatchFilter(filter as any)}
                                       className={cn(
                                         "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest transition-all",
                                         batchFilter === filter 
                                           ? "bg-slate-800 text-white" 
                                           : "text-slate-500 hover:text-slate-300"
                                       )}
                                     >
                                       {filter}
                                     </button>
                                   ))}
                                </div>
                             </div>
                             <button 
                               onClick={exportBatchToCSV}
                               className="text-sky-400 flex items-center gap-1 hover:underline"
                             >
                               EXPORT RESULTS CSV <Zap size={10} />
                             </button>
                          </div>
                          <table className="w-full text-left font-mono">
                             <thead className="bg-slate-950 text-[10px] text-slate-600 uppercase tracking-widest border-b border-slate-800">
                                <tr>
                                   <th className="px-6 py-3">TXN ID</th>
                                   <th className="px-6 py-3">Amount</th>
                                   <th className="px-6 py-3">Decision</th>
                                   <th className="px-6 py-3">Score</th>
                                   <th className="px-6 py-3">Risk Factors</th>
                                </tr>
                             </thead>
                             <tbody className="text-[11px] divide-y divide-slate-800/40">
                                {batchResults
                                   .filter(res => batchFilter === 'all' || res.decision === batchFilter)
                                   .map(res => (
                                   <tr key={res.transaction_id} className="hover:bg-slate-800/20">
                                      <td className="px-6 py-4 text-slate-400">{res.transaction_id}</td>
                                      <td className="px-6 py-4 text-white font-bold">Rs.{res.metadata.amount.toLocaleString()}</td>
                                      <td className="px-6 py-4">
                                         <span className={cn(
                                           "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                                           res.decision === 'allow' ? "bg-emerald-500 text-emerald-950" : 
                                           res.decision === 'flag' ? "bg-amber-500 text-amber-950" : "bg-rose-500 text-rose-950"
                                         )}>{res.decision}</span>
                                      </td>
                                      <td className="px-6 py-4">
                                         <div className="flex items-center gap-3">
                                            <div className="h-1 w-12 bg-slate-800 rounded-full overflow-hidden">
                                               <div className={cn("h-full", res.decision === 'allow' ? 'bg-emerald-500' : 'bg-rose-500')} style={{ width: `${res.score * 100}%` }} />
                                            </div>
                                            <span className="text-slate-300">{res.score.toFixed(3)}</span>
                                         </div>
                                      </td>
                                      <td className="px-6 py-4 text-[10px] text-slate-500">                 {res.details.risk_factors && res.details.risk_factors.length > 0 ? (
                   <div className="flex flex-col gap-1">
                      {res.details.risk_factors.slice(0, 2).map((f, i) => (
                        <div key={i} className="truncate max-w-[200px]">{f}</div>
                      ))}
                   </div>
                 ) : (
                   <span className="text-slate-700 italic">No critical factors</span>
                 )}
</td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </div>
                 )}
               </motion.div>
             )}

              {activeTab === 'batch' && batchResults.length > 0 && batchAnalytics && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 bg-slate-950/20 p-8 rounded border border-slate-800/40"
                >
                   <div className="bg-slate-900 border border-slate-800 p-8 rounded-sm shadow-2xl">
                      <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-8">Batch Decision Profile</h3>
                      <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                               <Pie data={batchAnalytics.decisionDist} dataKey="value" innerRadius={60} outerRadius={85} paddingAngle={8}>
                                  {batchAnalytics.decisionDist.map((entry, index) => (
                                    <Cell key={index} fill={entry.name === 'Allow' ? '#10b981' : entry.name === 'Flag' ? '#f59e0b' : '#f43f5e'} />
                                  ))}
                               </Pie>
                               <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b' }} />
                               <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b' }} />
                            </PieChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                   <div className="bg-slate-900 border border-slate-800 p-8 rounded-sm shadow-2xl">
                      <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-8">Category Exposure</h3>
                      <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={batchAnalytics.categories}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                               <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} />
                               <YAxis tick={{ fill: '#64748b', fontSize: 9 }} />
                               <Tooltip cursor={{ fill: 'rgba(56, 189, 248, 0.05)' }} contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b' }} />
                               <Bar dataKey="value" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={24} />
                            </BarChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                </motion.div>
              )}

              {activeTab === 'analytics' && (
                 <motion.div 
                   key="analytics"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                 >
                    {/* Decision Distribution - Donut Chart */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-sm">
                       <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Decision Distribution</h3>
                       <div className="h-64 flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                                <Pie
                                  data={analyticsData.decisionDist}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                   {analyticsData.decisionDist.map((entry, index) => (
                                     <Cell key={`cell-${index}`} fill={entry.name === 'Allow' ? '#10b981' : entry.name === 'Flag' ? '#f59e0b' : '#f43f5e'} />
                                   ))}
                                </Pie>
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b' }}
                                  itemStyle={{ color: '#fff', fontSize: '10px', textTransform: 'uppercase' }}
                                />
                                <Legend 
                                  verticalAlign="bottom" 
                                  height={36} 
                                  wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b' }}
                                />
                             </PieChart>
                          </ResponsiveContainer>
                       </div>
                    </div>

                    {/* Regional Coverage - Radar Chart */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-sm">
                       <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Regional Risk Profile</h3>
                       <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                             <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analyticsData.countries.slice(0, 6)}>
                                <PolarGrid stroke="#1e293b" />
                                <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 8 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                                <Radar
                                  name="Volume"
                                  dataKey="value"
                                  stroke="#818cf8"
                                  fill="#818cf8"
                                  fillOpacity={0.6}
                                />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b' }}
                                  itemStyle={{ color: '#fff', fontSize: '10px', textTransform: 'uppercase' }}
                                />
                             </RadarChart>
                          </ResponsiveContainer>
                       </div>
                    </div>

                    {/* Category Analysis - Advanced Bar */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-sm lg:col-span-1">
                       <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Category Threat Levels</h3>
                       <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={analyticsData.categories}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                <Tooltip 
                                  cursor={{ fill: 'rgba(51, 65, 85, 0.2)' }}
                                  contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b' }}
                                  itemStyle={{ color: '#fff', fontSize: '10px', textTransform: 'uppercase' }}
                                />
                                <Bar dataKey="value" fill="#c084fc" radius={[2, 2, 0, 0]} barSize={20} />
                             </BarChart>
                          </ResponsiveContainer>
                       </div>
                    </div>

                    {/* Simulation Insights / Health */}
                    <div className="lg:col-span-3 bg-slate-900 border border-slate-800 p-8 rounded-sm">
                       <div className="flex justify-between items-center mb-8">
                          <div>
                             <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Model Performance Metrics</h3>
                             <p className="text-[10px] text-slate-600 font-mono uppercase mt-1">Real-time prediction accuracy & system latency</p>
                          </div>
                          <div className="text-right">
                             <div className="text-sm font-mono text-emerald-500 font-black tracking-tighter">FP Rate: 0.04%</div>
                          </div>
                       </div>
                       
                       <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                             <ComposedChart data={chartData}>
                                <defs>
                                   <linearGradient id="colorAllow" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                   </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 9 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 9 }} />
                                <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b' }} itemStyle={{ fontSize: '10px', textTransform: 'uppercase' }} />
                                <Area type="monotone" dataKey="allow" stroke="#10b981" fillOpacity={1} fill="url(#colorAllow)" strokeWidth={2} />
                                <Bar dataKey="block" fill="#f43f5e" radius={[2, 2, 0, 0]} barSize={10} />
                                <Line type="monotone" dataKey="flag" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2, fill: '#f59e0b' }} />
                                <Legend wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', paddingTop: '20px' }} />
                             </ComposedChart>
                          </ResponsiveContainer>
                       </div>
                    </div>
                 </motion.div>
              )}
           </AnimatePresence>
        </div>

        <footer className="h-10 bg-[#030712] border-t border-slate-800 px-8 flex items-center justify-between fixed bottom-0 ml-64 right-0 z-50">
           <div className="flex gap-8 text-[9px] font-bold uppercase tracking-widest text-slate-600 font-mono">
              <span>SecureX v2.1.0</span>
              <span>Cluster: CL-01</span>
              <span>Stream: Kafka-Live</span>
           </div>
           <div className="text-[9px] font-bold text-slate-500 font-mono uppercase">
              Last Sync: {format(lastUpdate, 'HH:mm:ss')}
           </div>
        </footer>
      </main>
    </div>
  );
}
