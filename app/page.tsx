import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ShieldCheck, Users, QrCode, Camera, Clock, TrendingUp, CheckCircle, Zap, Lock, MoreHorizontal, LayoutDashboard, Fingerprint, BarChart3, Smartphone } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-zinc-100 selection:text-zinc-900 dark:selection:bg-zinc-800 dark:selection:text-zinc-100">
      {/* Navbar - Sticky & Clean */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link className="flex items-center gap-2 group" href="/">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-black transition-transform group-hover:scale-95">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              SecureAttend
            </span>
          </Link>
          <nav className="hidden md:flex gap-8 text-sm font-medium items-center text-zinc-600 dark:text-zinc-400">
            <Link href="#features" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">How it works</Link>
            <Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">Pricing</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
                Log in
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="font-medium bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm px-5">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {/* Hero Section - Swiss Style / Modern SaaS */}
        <section className="relative w-full py-24 md:py-32 lg:py-40 border-b overflow-hidden">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-zinc-950 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-10 text-center max-w-5xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm font-medium text-zinc-800 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                v2.0 Now Available
              </div>

              {/* Headline */}
              <h1 className="text-4xl xs:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Attendance, <br className="hidden md:block" />
                <span className="text-zinc-500 dark:text-zinc-400">Perfected.</span>
              </h1>

              {/* Subheadline */}
              <p className="max-w-[650px] text-zinc-500 md:text-xl lg:text-2xl leading-relaxed dark:text-zinc-400">
                SecureAttend eliminates proxy attendance with biometric verification and dynamic QR codes. Trusted by modern institutions.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-4">
                <Link href="/login">
                  <Button size="lg" className="h-14 px-8 text-base rounded-full bg-zinc-900 text-white hover:bg-zinc-800 hover:shadow-lg hover:-translate-y-0.5 transition-all w-full sm:w-auto dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">
                    Launch Platform
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full border-zinc-200 bg-transparent hover:bg-zinc-50 hover:text-zinc-900 w-full sm:w-auto dark:border-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 transition-all">
                    View Interactive Demo
                  </Button>
                </Link>
              </div>

               {/* Stats Row */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 text-center w-full max-w-3xl border-t border-zinc-100 dark:border-zinc-800 mt-12">
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">99.9%</span>
                  <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider mt-1">Uptime</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">&lt;1s</span>
                  <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider mt-1">Latency</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">10k+</span>
                  <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider mt-1">Students</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">SOC2</span>
                   <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider mt-1">Compliant</span>
                </div>
               </div>
            </div>
          </div>
        </section>

        {/* Features Section - Bento Grid Style */}
        <section id="features" className="w-full py-24 md:py-32 bg-zinc-50/50 dark:bg-zinc-900/20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
               <div className="max-w-2xl">
                    <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-zinc-900 dark:text-zinc-50 mb-4">
                        Everything you need <br />
                        <span className="text-zinc-400 dark:text-zinc-600">Nothing you don't.</span>
                    </h2>
                    <p className="text-lg text-zinc-500 dark:text-zinc-400">
                        Designed with focus. Every feature serves a purpose to streamline your educational workflow.
                    </p>
               </div>
               <Button variant="link" className="text-zinc-900 dark:text-zinc-50 font-semibold p-0 h-auto group">
                 See all features <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
               </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
                {/* Large Card */}
                <div className="md:col-span-2 group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950 transition-all hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                         <QrCode className="w-64 h-64" />
                    </div>
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="p-3 w-fit rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                            <QrCode className="h-6 w-6 text-zinc-900 dark:text-zinc-50" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Dynamic QR Authentication</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 max-w-md">Our proprietary rotating QR algorithm ensures that codes cannot be shared or reused, guaranteeing physical presence.</p>
                        </div>
                    </div>
                </div>

                {/* Tall Card */}
                <div className="md:row-span-2 group relative overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-900 p-8 text-white dark:border-zinc-800 dark:bg-zinc-950 transition-all hover:shadow-xl">
                    <div className="absolute top-0 right-0 p-8 opacity-20">
                         <Fingerprint className="w-64 h-64" />
                    </div>
                    <div className="relative z-10 h-full flex flex-col justify-between">
                         <div>
                            <div className="p-3 w-fit rounded-2xl bg-zinc-800 mb-8">
                                <Fingerprint className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Biometric & <br/> Photo Proof</h3>
                            <p className="text-zinc-400 leading-relaxed">
                                Beyond just a check-in. SecureAttend captures and verifies student identity via photo verification at the moment of scan.
                            </p>
                         </div>
                         <div className="mt-8 rounded-xl bg-zinc-800/50 p-4 backdrop-blur-sm border border-zinc-700/50">
                            <div className="flex items-center gap-3 mb-3">
                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                                <span className="font-medium text-sm">Real-time verification</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                                <span className="font-medium text-sm">Anti-spoofing AI</span>
                            </div>
                         </div>
                    </div>
                </div>

                {/* Medium Card */}
                <div className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950 transition-all hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50">
                     <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="p-3 w-fit rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                            <LayoutDashboard className="h-6 w-6 text-zinc-900 dark:text-zinc-50" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Role-Based Access</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Dedicated interfaces for Students, Teachers, and Admins.</p>
                        </div>
                    </div>
                </div>

                 {/* Medium Card */}
                 <div className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950 transition-all hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50">
                     <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="p-3 w-fit rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                            <Smartphone className="h-6 w-6 text-zinc-900 dark:text-zinc-50" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Mobile Optimized</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Responsive design that works flawlessly on any device.</p>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </section>

        {/* How It Works - Minimal Horizontal Steps */}
        <section id="how-it-works" className="w-full py-24 md:py-32 border-t bg-white dark:bg-zinc-950">
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-20">
                     <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-zinc-900 dark:text-zinc-50 mb-4">
                        Streamlined Workflow
                     </h2>
                </div>

                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
                     {/* Connecting Line (Desktop) */}
                     <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[2px] bg-zinc-100 dark:bg-zinc-800 -z-10"></div>

                     {/* Step 1 */}
                     <div className="flex flex-col items-center text-center group">
                        <div className="w-24 h-24 rounded-full bg-white border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                             <div className="w-20 h-20 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
                                 <Zap className="h-8 w-8 text-zinc-900 dark:text-zinc-50" />
                             </div>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Step 01</span>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">Sessions Start</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                            Teacher initiates a session securely. A unique, time-sensitive QR code is generated instantly on the classroom display.
                        </p>
                     </div>

                     {/* Step 2 */}
                     <div className="flex flex-col items-center text-center group">
                        <div className="w-24 h-24 rounded-full bg-white border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                             <div className="w-20 h-20 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
                                 <Camera className="h-8 w-8 text-zinc-900 dark:text-zinc-50" />
                             </div>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Step 02</span>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">Scan & Verify</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                            Students scan the code. Our system simultaneously captures a photo to verify identity against stored records.
                        </p>
                     </div>

                     {/* Step 3 */}
                     <div className="flex flex-col items-center text-center group">
                        <div className="w-24 h-24 rounded-full bg-white border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                             <div className="w-20 h-20 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
                                 <BarChart3 className="h-8 w-8 text-zinc-900 dark:text-zinc-50" />
                             </div>
                        </div>
                         <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Step 03</span>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">Sync & Report</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                            Data syncs instantly to the cloud. Admins get real-time analytics, and parents can be notified of absence.
                        </p>
                     </div>
                </div>
            </div>
        </section>

        {/* Minimal CTA */}
        <section className="w-full py-24 border-t bg-zinc-900 text-white dark:bg-zinc-950">
             <div className="container px-4 md:px-6">
                 <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                     <div className="space-y-4 max-w-xl">
                         <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ready to upgrade your institution?</h2>
                         <p className="text-zinc-400 text-lg">Join 500+ schools and universities using SecureAttend to modernize their operations.</p>
                     </div>
                     <Link href="/login">
                         <Button size="lg" className="h-16 px-8 rounded-full bg-white text-zinc-900 hover:bg-zinc-200 text-lg font-semibold shadow-lg shadow-zinc-900/20">
                            Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
                         </Button>
                     </Link>
                 </div>
             </div>
        </section>
      </main>

      {/* Clean Footer */}
      <footer className="border-t bg-white dark:bg-zinc-950 py-12">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
             <div className="col-span-2 md:col-span-1">
                 <Link className="flex items-center gap-2 mb-4" href="/">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-black">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">
                      SecureAttend
                    </span>
                 </Link>
                 <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-xs">
                     The most secure and efficient way to manage attendance for modern educational ecosystems.
                 </p>
             </div>
             <div>
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Product</h4>
                <ul className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
                    <li><Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-200">Features</Link></li>
                    <li><Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-200">Security</Link></li>
                    <li><Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-200">Enterprise</Link></li>
                </ul>
             </div>
             <div>
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Company</h4>
                <ul className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
                    <li><Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-200">About</Link></li>
                    <li><Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-200">Blog</Link></li>
                    <li><Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-200">Careers</Link></li>
                </ul>
             </div>
             <div>
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Legal</h4>
                <ul className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
                    <li><Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-200">Privacy</Link></li>
                    <li><Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-200">Terms</Link></li>
                </ul>
             </div>
          </div>
          <div className="border-t border-zinc-100 dark:border-zinc-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
             <p>© 2026 SecureAttend Inc. All rights reserved.</p>
             <div className="flex gap-6">
                 <Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-200">Twitter</Link>
                 <Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-200">LinkedIn</Link>
                 <Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-200">GitHub</Link>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
