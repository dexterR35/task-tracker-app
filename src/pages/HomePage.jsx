import React from "react";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import netbetLogo from "@/assets/netbet-logo.png";
import logo from "@/assets/logo.webp";
import { APP_CONFIG } from "@/constants";

import { useNavigate } from 'react-router-dom';

// Inside your component function:

const HomePage = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    // Note: ensure handleLinkClick is defined or passed as a prop
    if (typeof handleLinkClick !== 'undefined') handleLinkClick();
    
    navigate('/login');
  };

  const categories = [
    { name: "Manage Deparments", type: "Kaban_Boards", status: "Connected" },
    { name: "Monthly Analytics", type: "calculated_reports", status: "LIVE" },
    { name: "Performance Reports", type: "active_sessions", status: "STABLE" },
    { name: "Task Tracker", type: "operation_boards", status: "STABLE" },
    { name: "Food Orders", type: "fulfillment_stream", status: "ACTIVE" },
    { name: "Export Data", type: "pdf_generator", status: "READY" },
  ];

  const brandGreen = "#52c45d";
const app_config_name = "Xync"
  return (
    <div className={`min-h-screen w-full bg-[#050505] text-white font-sans selection:bg-[#52c45d] selection:text-black`}>
      {/* --- MODERN HEADER --- */}
      <nav className="w-full border-b border-white/5 px-6 py-3 flex justify-between items-center bg-[#0d0d0d]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#52c45d] rounded-sm flex items-center justify-center text-black font-black text-md !capitalize ">
              {APP_CONFIG.NAME.charAt(0)}y
            </div>
            <div className="flex flex-col">
              <span className="font-black tracking-tighter text-medium capitalize leading-6">{APP_CONFIG.NAME} HUB</span>
              <span className="text-[9px] font-mono text-[#52c45d] font-bold uppercase tracking-[0.15em]">Community Center</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center bg-[#151515] border border-white/10 px-3 py-1.5 rounded-md gap-3 w-72 transition-all focus-within:border-[#52c45d]/50">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-500"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest"> Task or Order ID...</span>
            <div className="ml-auto flex gap-1">
                <span className="text-[9px] bg-[#222] px-1.5 py-0.5 rounded text-slate-400 border border-white/5">CMD</span>
                <span className="text-[9px] bg-[#222] px-1.5 py-0.5 rounded text-slate-400 border border-white/5">F</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end border-r border-white/10 pr-6">
            <span className="text-[9px] font-mono text-slate-500 uppercase">Live Board Status: Stable</span>
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
              
              <span className="text-[10px] font-black uppercase tracking-wide text-slate-200">Unlock_session</span>
              
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-28 items-start">
          
          {/* --- LEFT COLUMN --- */}
          <div className="lg:col-span-7">
            <div className="mb-8 inline-flex items-center gap-3 px-4 py-2 bg-[#111] border border-white/5 rounded-sm">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#52c45d] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#52c45d]"></span>
              </div>
              <span className="text-[10px] font-mono text-slate-300 uppercase tracking-[0.3em] font-black">
                SFWC // Safe For Work Community
              </span>
            </div>
            <div className='flex items-center text-[8rem] font-black mb-6'>
              <span className="text-white">Xync</span>
              <p className="bg-[#52c45d] px-3 rounded-md ml-2 leading-tight"><span className='text-black'>HUB</span></p>
            </div>
            <p className="text-lg text-slate-400 max-w-[100%] mb-12 leading-relaxed font-medium initial tracking-[0.12em]">
            A central space for real-time operations, team insights, and daily order management, 
            powered by monthly analytics plus performance tracking.
            </p>

            <div className="flex flex-wrap gap-5">
            
              <button
              onClick={handleLoginClick}
     

                className="group relative h-16 px-12 bg-[#52c45d] text-black font-black uppercase tracking-[0.2em] text-sm overflow-hidden transition-all hover:text-black"
              >
                <span className="relative z-10 group-hover:text-white text-black">Unlock deparment</span>
                <div className="absolute inset-0 bg-[#52c45dbd] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
              
              <button className="h-16 px-10 border border-white/10 font-black uppercase tracking-[0.2em] text-sm hover:border-[#52c45d] hover:text-[#52c45d] transition-all text-slate-400">
                Monthly Reports
              </button>
            </div>
           
            <div className="flex flex-col gap-4 mt-16">
            <span className="text-slate-300 font-black uppercase tracking-[0.2em] text-[11px]">Community Information:</span>
            <div className="space-y-2 text-[10px]">
                <div className="flex justify-between border-b border-white/5 pb-1">
                    <span> Tasks by Department</span>
                    <span className="text-[#52c45d] font-bold uppercase">Synchronized</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                    <span>Analytics Tasks & Orders</span>
                    <span className="text-[#52c45d] font-bold">240/20</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                    <span>FOOD DISPATCH</span>
                    <span className="text-[#52c45d] font-bold">READY/CLOSED</span>
                </div>
                
            </div>
          </div>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="lg:col-span-5">
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
              <div className="text-[11px] font-mono text-slate-500 uppercase tracking-[0.5em]">Command_Center</div>
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
      <footer className="w-full bg-[#080808] border-t border-white/5 px-8 py-10 text-[10px] font-mono text-slate-500 ">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          
        
        <div className='flex justify-between flex-row invisible'>

<div className="flex flex-col gap-4">
<span className="text-slate-300 font-black uppercase tracking-[0.2em] text-[11px]">Monthly Summary</span>
<div className="flex flex-col gap-1">
    <span className="text-xl font-black text-white">1,184 <span className="text-xs text-slate-600">TASKS/mo</span></span>
    <span className="text-[#52c45d] text-sm font-bold tracking-widest">+ 12%  FROM LAST MONTH</span>
</div>
</div>
<div className="flex flex-col gap-4 ">
<span className="text-slate-300 font-black uppercase tracking-[0.2em] text-[11px] ">Daily Orders{" "}</span>
<div className="flex flex-col gap-1">
    <span className="text-xl font-black text-white">25 <span className="text-xs text-slate-600">ORDERS/day</span></span>
    <span className="text-[#cf3434] text-sm font-bold tracking-widest">- 5% FROM LAST MONTH</span>
</div>
</div>

</div>

          <div className="flex flex-col items-start md:items-end justify-end">
          
             <div className="flex gap-4">
               <span className="bg-[#111] px-3 py-1 border border-white/10 rounded-sm">JANUARY REPORT</span>
               <span className="bg-[#52c45d] text-black px-3 py-1 font-black italic rounded-sm">TOP PERFORMER</span>
             </div>
             <p className="mt-6 text-right leading-relaxed opacity-50 uppercase">
               Xync Internal Community <br />
               Ref: LIVE-ADMIN-SESSION <br />
               © {new Date().getFullYear()} {APP_CONFIG.NAME} HUB 
             </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;