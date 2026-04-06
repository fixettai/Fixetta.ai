import React from 'react';

export default function LandingPage() {
  return (
    <div className="bg-background text-on-surface antialiased">
      {/* TopAppBar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-[#e8eaf0] shadow-[6px_6px_12px_rgba(0,0,0,0.08),-6px_-6px_12px_rgba(255,255,255,0.6)]">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              alt="Fixetta Logo" 
              className="w-8 h-8 rounded-lg neomorph-raised object-contain bg-white p-1" 
              src="https://lh3.googleusercontent.com/aida/ADBb0ugdbSt0SWh2Mu2pFx6jwFeLLaXqycJKW0FLduUIHPefFRD8PTlq8z8pMC-5AbHlfTuMeMNtmSE6hJRYTOlr3rBF382tJSIFiIb1r_CU0vsOWb4CknGCLX87BVOzoqm1Vbzx7SfPlNBGK1eGU4HXufSEb3xzBgPGoqdtAoVBWyWaDG2jCO-pgPbzs_pQFMyrNCj5uTxPg06HTCAgXqQlUe_eSEzvtK96LDUFXomZIdjgY8-jHYnfe0-n4YXeh0GYTaOACb9C_Qo"
            />
            <span className="text-xl font-bold tracking-tight text-slate-900 font-headline">Fixetta</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a className="text-primary border-b-2 border-primary pb-1 font-semibold transition-all" href="#platform">Platform</a>
            <a className="text-slate-500 hover:text-primary transition-colors font-semibold" href="#solutions">Solutions</a>
            <a className="text-slate-500 hover:text-primary transition-colors font-semibold" href="#pricing">Pricing</a>
            <a className="text-slate-500 hover:text-primary transition-colors font-semibold" href="#contact">Contact</a>
          </div>
          <button className="neomorph-raised px-5 py-2.5 rounded-xl bg-background text-primary font-bold text-sm active:scale-95 duration-150 ease-in-out transition-all">
            Get a Demo
          </button>
        </div>
      </nav>

      <main className="pt-24 pb-12">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neomorph-inset mb-8">
            <span className="material-symbols-outlined text-primary text-sm">construction</span>
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Engineered for Contractors</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-extrabold text-on-surface tracking-tight leading-[1.1] mb-6">
            The Construction <br />
            <span className="text-slate-600">Growth Engine.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-on-surface-variant text-lg md:text-xl leading-relaxed mb-10">
            Find more profitable work, manage your job sites, and win bids faster with Fixetta's integrated AI tools. Built specifically for the modern construction firm.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button className="neomorph-raised w-full sm:w-auto px-8 py-4 rounded-2xl bg-background text-primary font-bold text-lg active:scale-95 transition-all flex items-center justify-center gap-2">
              Start Growing <span className="material-symbols-outlined">trending_up</span>
            </button>
            <button className="neomorph-inset w-full sm:w-auto px-8 py-4 rounded-2xl bg-background text-on-surface font-semibold text-lg active:scale-95 transition-all">
              See How It Works
            </button>
          </div>
          
          {/* Hero Visual */}
          <div className="mt-20 neomorph-raised rounded-[2.5rem] p-4 bg-background">
            <div className="relative rounded-[2rem] overflow-hidden aspect-video shadow-inner bg-slate-200">
              <img 
                alt="Fixetta Construction CRM Dashboard" 
                className="w-full h-full object-cover opacity-90" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBOndf4r8gN8Unki3suyFdfD_2sTCRKur1DZBCpCyKsBTLlkYJYAa3NdYBm8GVGkiIdIMu0SY_ga0dB7hfpgQA5C-J0KXDN-i9Pkw83Z8zEYfh2xUJMlb-U2S14Ky5GbJ5Hf3a9DfwPbY33TFSQHY5t2OI-U1KCe-V6p4q7RL45X_1CJxshsiwPaNMW2XTkwzB2bOapsh3Zd0MD8T0eupsYmvRHbULsEv7r9QQ-F6TywESWFE3OA8c9pJk9j_q6xyknUqomNp4V0A"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#e8eaf0]/40 via-transparent to-transparent"></div>
            </div>
          </div>
        </section>

        {/* Bento Grid Feature Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* AI Lead Scoring */}
            <div className="md:col-span-2 neomorph-raised rounded-[2rem] p-10 bg-background flex flex-col justify-between overflow-hidden relative group">
              <div className="relative z-10">
                <div className="w-12 h-12 neomorph-inset rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary">analytics</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">AI-Powered Lead Scoring</h3>
                <p className="text-on-surface-variant max-w-sm">Stop chasing dead-ends. Our AI analyzes project scope, location, and past margins to identify the most profitable bids for your crew.</p>
              </div>
              <div className="mt-8 flex justify-end">
                <div className="w-64 h-40 neomorph-inset rounded-2xl p-6 bg-white/30 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold">Project High-Value</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-md">94% MATCH</span>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-slate-800 w-3/4"></div></div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-slate-800 w-1/2"></div></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Instant Estimation */}
            <div className="neomorph-raised rounded-[2rem] p-10 bg-background flex flex-col items-center text-center">
              <div className="w-16 h-16 neomorph-inset rounded-2xl flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-primary text-3xl">square_foot</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Instant Material & Labor Estimates</h3>
              <p className="text-on-surface-variant mb-10">Upload site photos or sketches. Fixetta's AI generates itemized material lists and labor hour projections in seconds.</p>
              <div className="w-full neomorph-inset rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-outline uppercase tracking-widest">Quote Accuracy</span>
                  <span className="text-xs font-bold text-primary">97.5%</span>
                </div>
                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[97.5%]"></div>
                </div>
              </div>
            </div>

            {/* Job Site CRM */}
            <div className="neomorph-raised rounded-[2rem] p-10 bg-background">
              <div className="w-12 h-12 neomorph-inset rounded-xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary">tactic</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Project CRM</h3>
              <p className="text-on-surface-variant">Built for the job site, not the office. Track client comms, daily logs, and sub-contractor updates from your mobile device.</p>
            </div>

            {/* Professional Trust */}
            <div className="md:col-span-2 neomorph-raised rounded-[2rem] p-10 bg-background flex items-center gap-10">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4">Reliability as a Service</h3>
                <p className="text-on-surface-variant mb-6">We focus on the tools that help you build, not just the tech. Fixetta is designed to be the backbone of your business operations.</p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm font-medium">
                    <span className="material-symbols-outlined text-primary text-lg" style={{fontVariationSettings: "'FILL' 1"}}>verified</span> Professional-grade reporting
                  </li>
                  <li className="flex items-center gap-3 text-sm font-medium">
                    <span className="material-symbols-outlined text-primary text-lg" style={{fontVariationSettings: "'FILL' 1"}}>verified</span> Localized material pricing
                  </li>
                </ul>
              </div>
              <div className="hidden sm:block w-1/3 aspect-square neomorph-inset rounded-2xl p-4">
                <img 
                  alt="Project Blueprint" 
                  className="w-full h-full object-cover rounded-xl opacity-30 mix-blend-multiply" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhBIGJLGjDsCOtHRaO5e1zsC44DUsnQyd27vQgCAGbCR71vBC5dDhvx5V0ZRJNWdF8tdN8869ywcvOwR4-r_JFwMyPxmnuy0yrVTWBegJcdA0Mhzd2TX3CKYY1OigGkfRHNlfRShO6ev8-RbW45Ic1GC3UIe627X36f-bpXteu3bu6C_gqThfaSyzb0YrlXg9m7f9cnTVUI2tv7HE-Nh8HT1Y3SQKb3tGsV55Q2JTTvwe3uv5jGhN0B_lJkeEfdSp3wBAi6nLMWg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto px-6 py-20">
          <div className="neomorph-raised rounded-[3rem] p-12 md:p-20 bg-background text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-8">Ready to scale your <span className="text-slate-600">firm?</span></h2>
            <p className="text-on-surface-variant text-lg mb-12 max-w-lg mx-auto">
              Join hundreds of general contractors and specialists who use Fixetta to win more work.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button className="neomorph-raised px-10 py-5 rounded-2xl bg-background text-primary font-bold text-xl active:scale-90 transition-all">
                Book a Consultation
              </button>
              <button className="px-8 py-5 rounded-2xl font-semibold text-on-surface-variant hover:text-primary transition-colors">
                View Pricing
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-8 mt-20 flex flex-col md:flex-row justify-between items-center gap-6 bg-[#e8eaf0] border-t border-slate-200 rounded-t-[24px] shadow-[inset_4px_4px_8px_rgba(0,0,0,0.06),inset_-4px_-4px_8px_rgba(255,255,255,0.5)]">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <img 
                alt="Fixetta Logo small" 
                className="w-6 h-6 object-contain" 
                src="https://lh3.googleusercontent.com/aida/ADBb0ugdbSt0SWh2Mu2pFx6jwFeLLaXqycJKW0FLduUIHPefFRD8PTlq8z8pMC-5AbHlfTuMeMNtmSE6hJRYTOlr3rBF382tJSIFiIb1r_CU0vsOWb4CknGCLX87BVOzoqm1Vbzx7SfPlNBGK1eGU4HXufSEb3xzBgPGoqdtAoVBWyWaDG2jCO-pgPbzs_pQFMyrNCj5uTxPg06HTCAgXqQlUe_eSEzvtK96LDUFXomZIdjgY8-jHYnfe0-n4YXeh0GYTaOACb9C_Qo"
              />
              <span className="text-lg font-bold text-slate-900 font-headline">Fixetta</span>
            </div>
            <p className="text-slate-500 text-sm">© 2024 Fixetta Technologies Inc. Built for Construction.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <a className="text-slate-500 hover:text-slate-900 font-bold transition-transform hover:translate-y-[-2px]" href="#product">Product</a>
            <a className="text-slate-500 hover:text-slate-900 font-bold transition-transform hover:translate-y-[-2px]" href="#case-studies">Case Studies</a>
            <a className="text-slate-500 hover:text-slate-900 font-bold transition-transform hover:translate-y-[-2px]" href="#resources">Resources</a>
            <a className="text-slate-500 hover:text-slate-900 font-bold transition-transform hover:translate-y-[-2px]" href="#privacy">Privacy</a>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 neomorph-raised rounded-full flex items-center justify-center hover:translate-y-[-2px] transition-transform cursor-pointer">
              <span className="material-symbols-outlined text-sm">linked_camera</span>
            </div>
            <div className="w-10 h-10 neomorph-raised rounded-full flex items-center justify-center hover:translate-y-[-2px] transition-transform cursor-pointer">
              <span className="material-symbols-outlined text-sm">mail</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}