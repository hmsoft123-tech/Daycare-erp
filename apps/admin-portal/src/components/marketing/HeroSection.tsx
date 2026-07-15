"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Shield, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-2 md:items-center md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-4 text-sm font-medium uppercase tracking-wider text-brand-100">Karachi&apos;s Trusted Daycare</p>
          <h1 className="font-heading text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
            Where Every Child&apos;s Journey Begins
          </h1>
          <p className="mt-6 text-lg text-white/80">
            Kinder Pilot offers nurturing daycare, preschool, and therapy services across four Karachi campuses — 
            with licensed educators and a child-first approach.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild size="lg" variant="warm">
              <Link href="/contact">Book a Tour <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
              <Link href="/programs">View Programs</Link>
            </Button>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid gap-4"
        >
          {[
            { icon: Heart, title: "Nurturing Care", desc: "Warm, attentive staff for every age group" },
            { icon: Shield, title: "Safe Environment", desc: "CCTV, secure entry, allergy-aware kitchens" },
            { icon: Sparkles, title: "Early Learning", desc: "Play-based curriculum aligned with EYFS" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4 rounded-xl bg-white/10 p-5 backdrop-blur">
              <item.icon className="h-6 w-6 shrink-0 text-warm-400" />
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-white/70">{item.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
