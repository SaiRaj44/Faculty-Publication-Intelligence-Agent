import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950 -z-20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-400/20 via-transparent to-transparent -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accent-500/20 via-transparent to-transparent -z-10" />
      
      {/* Animated glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/30 rounded-full blur-3xl animate-pulse-glow -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/30 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />

      <main className="container mx-auto px-6 py-20 flex flex-col items-center text-center z-10">
        <div className="glass-card p-12 max-w-4xl w-full animate-slide-up relative">
          
          <div className="absolute -top-6 -left-6 w-24 h-24 bg-gradient-brand rounded-full blur-2xl opacity-50 animate-float" />
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-brand rounded-full blur-2xl opacity-50 animate-float" style={{ animationDelay: '1.5s' }} />

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            <span className="text-slate-900 dark:text-white">Faculty</span>
            <br />
            <span className="text-gradient">Publication Intelligence</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            The next-generation platform for academic institutions to track, enrich, and analyze research publications using AI.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              href="/login" 
              className="group relative px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-semibold text-lg transition-all hover:scale-105 hover:shadow-glow overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
              <span className="relative">Access Dashboard</span>
            </Link>
            
            <Link 
              href="/api/auth/signin" 
              className="px-8 py-4 bg-white/10 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-full font-semibold text-lg transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 backdrop-blur-md"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
