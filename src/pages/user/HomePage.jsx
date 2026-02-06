import React from 'react';
import { APP_CONFIG } from "@/constants";

const HomePage = () => {
  const categories = [
    { name: "Monthly Analytics", type: "calculated_reports", status: "LIVE" },
    { name: "Food Orders", type: "fulfillment_stream", status: "ACTIVE" },
    { name: "Task Tracker", type: "operation_boards", status: "STABLE" },
    { name: "Call Support", type: "active_sessions", status: "STABLE" },
    { name: "Export Reports", type: "pdf_generator", status: "READY" },
  ];

  // Hex conversion of oklch(72.3% 0.219 149.579)
  const brandGreen = "#52c45d";

  return (
    <div className={`min-h-screen w-full bg-[#050505] text-white font-sans selection:bg-[#52c45d] selection:text-black`}>
      
      {/* --- MODERN HEADER --- */}
      <nav className="w-full border-b border-white/5 px-6 py-3 flex justify-between items-center bg-[#0d0d0d]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#52c45d] rounded-sm flex items-center justify-center text-black font-black text-lg shadow-[0_0_20px_rgba(82,196,93,0.2)]">
              {APP_CONFIG.NAME.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="font-black tracking-tighter text-md uppercase leading-none">{APP_CONFIG.NAME} HUB</span>
              <span className="text-[8px] font-mono text-[#52c45d] font-bold uppercase tracking-[0.2em]">Ops Control Center</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center bg-[#151515] border border-white/10 px-3 py-1.5 rounded-md gap-3 w-72 transition-all focus-within:border-[#52c45d]/50">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-500"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Search Task or Order ID...</span>
            <div className="ml-auto flex gap-1">
                <span className="text-[8px] bg-[#222] px-1.5 py-0.5 rounded text-slate-400 border border-white/5">CMD</span>
                <span className="text-[8px] bg-[#222] px-1.5 py-0.5 rounded text-slate-400 border border-white/5">F</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end border-r border-white/10 pr-6">
            <span className="text-[9px] font-mono text-slate-500 uppercase">Live Ops Pulse: Stable</span>
            <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-[#52c45d] animate-pulse" />
                <span className="text-[9px] font-mono text-[#52c45d] uppercase font-bold tracking-tighter">Tasks Synchronized</span>
            </div>
          </div>
          
          <div className="flex items-center gap-5 text-slate-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hover:text-[#52c45d] cursor-pointer"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9m4.33 13a2 2 0 0 0 3.34 0"/></svg>
            <div className="flex items-center gap-2 bg-[#1a1a1a] p-1 pr-4 rounded-full border border-white/5 hover:bg-[#222] transition-colors cursor-pointer">
              <div className="w-6 h-6 bg-[#52c45d] rounded-full flex items-center justify-center text-black font-bold text-[10px]">
                JD
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">Manager_Session</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-start">
          
          {/* --- LEFT COLUMN --- */}
          <div className="lg:col-span-7">
            <div className="mb-8 inline-flex items-center gap-3 px-4 py-2 bg-[#111] border border-white/5 rounded-sm">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#52c45d] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#52c45d]"></span>
              </div>
              <span className="text-[10px] font-mono text-slate-300 uppercase tracking-[0.3em] font-black">
                SFW // Safe For Work Enviroment
              </span>
            </div>
            <div className='flex items-center text-[9.25rem] font-black mb-8'>
              <span className="text-white">Xync</span>
              <p className="bg-[#52c45d] px-4 rounded-md  ml-2"><span className='text-black'>HUB</span></p>
            </div>
            <p className="text-xl text-slate-400 max-w-md mb-12 leading-relaxed font-medium">
              Unified command for <span className="text-white">logistics, orders, and support</span>. 
              Manage your tasks and track team performance in real-time.
            </p>

            <div className="flex flex-wrap gap-5">
              <button
                className="group relative h-16 px-12 bg-white text-black font-black uppercase tracking-[0.2em] text-sm overflow-hidden transition-all hover:text-black"
              >
                <span className="relative z-10 group-hover:text-black">View Task Board</span>
                <div className="absolute inset-0 bg-[#52c45d] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
              
              <button className="h-16 px-10 border border-white/10 font-black uppercase tracking-[0.2em] text-sm hover:border-[#52c45d] hover:text-[#52c45d] transition-all text-slate-400">
                Monthly Reports
              </button>
            </div>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="lg:col-span-5">
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
              <div className="text-[11px] font-mono text-slate-500 uppercase tracking-[0.5em]">Command_Modules</div>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-[#52c45d] opacity-50" />
                <div className="w-1 h-1 bg-[#52c45d] opacity-30" />
                <div className="w-1 h-1 bg-[#52c45d] opacity-10" />
              </div>
            </div>
            
            <div className="grid gap-4">
              {categories.map((cat, index) => (
                <div 
                  key={index} 
                  className="group relative flex items-center justify-between p-5 bg-[#0d0d0d] border border-white/5 hover:border-[#52c45d]/40 transition-all duration-500 cursor-pointer"
                >
                  <div className="flex items-center gap-5 relative z-10">
                    <span className="text-[#52c45d] font-mono text-[10px] font-bold opacity-40 group-hover:opacity-100 transition-opacity">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    <div>
                      <span className="font-black text-xl uppercase tracking-tighter group-hover:text-[#52c45d] transition-colors block">
                        {cat.name}
                      </span>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">SRC: {cat.type}</span>
                        <div className="w-1 h-1 rounded-full bg-slate-800" />
                        <span className="text-[8px] text-[#52c45d] font-mono font-bold opacity-60">{cat.status}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative z-10">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/10 group-hover:text-[#52c45d] group-hover:translate-x-1 transition-all">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* --- ENHANCED FOOTER --- */}
      <footer className="w-full bg-[#080808] border-t border-white/5 px-8 py-10 text-[10px] font-mono text-slate-500 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          
          <div className="flex flex-col gap-4">
            <span className="text-slate-300 font-black uppercase tracking-[0.2em] text-[11px]">Department Status</span>
            <div className="space-y-2">
                <div className="flex justify-between border-b border-white/5 pb-1">
                    <span>JIRA SYNC STATUS</span>
                    <span className="text-[#52c45d] font-bold">OPERATIONAL</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                    <span>CALL CENTER QUEUE</span>
                    <span className="text-[#52c45d] font-bold">4 MIN WAIT</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                    <span>FOOD DISPATCH</span>
                    <span className="text-[#52c45d] font-bold">READY</span>
                </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-slate-300 font-black uppercase tracking-[0.2em] text-[11px]">Monthly Throughput</span>
            <div className="flex flex-col gap-1">
                <span className="text-2xl font-black text-white">1,284 <span className="text-xs text-slate-600">TASKS/mo</span></span>
                <span className="text-[#52c45d] font-bold tracking-widest">+12% INCREASE FROM LAST MONTH</span>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end justify-between">
             <div className="flex gap-4">
               <span className="bg-[#111] px-3 py-1 border border-white/10 rounded-sm">JANUARY REPORT</span>
               <span className="bg-[#52c45d] text-black px-3 py-1 font-black italic rounded-sm">TOP PERFORMER</span>
             </div>
             <p className="mt-6 text-right leading-relaxed opacity-50 uppercase">
               Xync Internal Management <br />
               Ref: HQ-ADMIN-LOGISTICS <br />
               © {new Date().getFullYear()} {APP_CONFIG.NAME} HUB 
             </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;