import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Users, QrCode, Camera, Clock, TrendingUp, CheckCircle, Zap, Lock } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <header className="sticky top-0 z-50 px-4 lg:px-6 h-16 flex items-center border-b backdrop-blur-sm bg-background/80">
        <Link className="flex items-center justify-center" href="/">
          <div className="p-2 rounded-lg bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <span className="ml-3 font-bold text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            SecureAttend
          </span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Login
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm" className="gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </nav>
      </header>
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-16 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="inline-block rounded-full px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                ✨ Modern Attendance Management System
              </div>
              <div className="space-y-4 max-w-4xl">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
                  Attendance Made Simple, Secure & Smart
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground text-lg md:text-xl">
                  Photo verification, QR code scanning, and real-time tracking for modern educational institutions.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login">
                  <Button size="lg" className="gap-2 text-lg px-8 py-6">
                    Start Free Trial <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                    Learn More
                  </Button>
                </Link>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8 max-w-2xl">
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-primary">99.9%</div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-primary">&lt;2s</div>
                  <div className="text-sm text-muted-foreground">Check-in Time</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-muted-foreground">Support</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-16 md:py-24 lg:py-32 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
                Powerful Features
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Everything you need to manage attendance efficiently and securely
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="group relative flex flex-col items-center space-y-4 p-6 rounded-2xl border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Photo Verification</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Capture and verify student photos automatically with every attendance entry.
                </p>
              </div>

              <div className="group relative flex flex-col items-center space-y-4 p-6 rounded-2xl border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
                  <QrCode className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Dynamic QR Codes</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Rotating QR codes ensure secure and tamper-proof attendance marking.
                </p>
              </div>

              <div className="group relative flex flex-col items-center space-y-4 p-6 rounded-2xl border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Role-Based Access</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Dedicated dashboards for admins, teachers, and students with specific permissions.
                </p>
              </div>

              <div className="group relative flex flex-col items-center space-y-4 p-6 rounded-2xl border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Real-Time Tracking</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Instant updates and live attendance monitoring across all devices.
                </p>
              </div>

              <div className="group relative flex flex-col items-center space-y-4 p-6 rounded-2xl border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Analytics & Reports</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Comprehensive reports and insights on attendance patterns and trends.
                </p>
              </div>

              <div className="group relative flex flex-col items-center space-y-4 p-6 rounded-2xl border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Dispute Management</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Students can raise disputes and teachers can review with full transparency.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="w-full py-16 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
                How It Works
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Three simple steps to modern attendance management
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold">Teacher Starts Session</h3>
                <p className="text-muted-foreground">
                  Teacher opens the session and displays a dynamic QR code on the screen
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold">Student Scans</h3>
                <p className="text-muted-foreground">
                  Students take a selfie and scan the QR code using their mobile device
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold">Instant Verification</h3>
                <p className="text-muted-foreground">
                  Attendance is marked instantly with photo proof and timestamp
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 md:py-24 lg:py-32 bg-primary/5 border-y">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="space-y-4 max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Ready to modernize your attendance system?
                </h2>
                <p className="text-muted-foreground text-lg">
                  Join hundreds of institutions already using SecureAttend
                </p>
              </div>
              <Link href="/login">
                <Button size="lg" className="gap-2 text-lg px-8 py-6">
                  Get Started Now <Zap className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-muted/30">
        <div className="container flex flex-col gap-6 py-8 md:py-12 px-4 md:px-6">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center">
                <ShieldCheck className="h-6 w-6 text-primary mr-2" />
                <span className="font-bold text-lg">SecureAttend</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Modern attendance management for educational institutions.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © 2026 SecureAttend. All rights reserved.
            </p>
            <div className="flex gap-4">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">Trusted by 500+ institutions</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
