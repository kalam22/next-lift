export default function Home() {
  return (
    <div className="min-h-screen mesh-gradient dark:mesh-gradient-dark p-6 sm:p-12 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-1000">
      <div className="max-w-6xl w-full space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em] animate-bounce">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            System Online
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-[#020617] dark:text-white tracking-tighter leading-none">
            INTELLIGENT <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60">INFRASTRUCTURE</span>
          </h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm md:text-base font-bold uppercase tracking-[0.4em] max-w-2xl mx-auto opacity-70">
            Next-Generation Enterprise Resource Management
          </p>
        </div>

        {/* Bento Grid Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full md:h-[500px]">
          {/* Main Card: Lifts */}
          <a
            href="/lifts"
            className="md:col-span-8 premium-card group relative overflow-hidden flex flex-col justify-end p-10 hover:scale-[1.01] active:scale-[0.99] transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent group-hover:scale-110 transition-transform duration-700"></div>
            <div className="relative z-10 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/50 group-hover:rotate-12 transition-transform duration-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <div>
                <h2 className="text-3xl font-black text-[#020617] dark:text-white uppercase tracking-tighter">Access Systems</h2>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Manage Lift Permissions & Identity</p>
              </div>
            </div>
            <div className="absolute top-10 right-10 text-primary/20 group-hover:text-primary transition-colors">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </div>
          </a>

          {/* Secondary Cards Column */}
          <div className="md:col-span-4 flex flex-col gap-6">
            {/* Laptops */}
            <a
              href="/laptops"
              className="flex-1 premium-card group relative overflow-hidden flex flex-col justify-center p-8 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
              <div className="relative z-10 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/40">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-xl font-black text-[#020617] dark:text-white uppercase tracking-tight">Computing</h3>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Asset Inventory Control</p>
              </div>
            </a>
          </div>
        </div>

        {/* Footer Stats Toggle/Hint */}
        <div className="flex justify-center opacity-40 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              24/7 Security Monitoring
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              Real-time Asset Sync
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              AI-Powered Performance
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

