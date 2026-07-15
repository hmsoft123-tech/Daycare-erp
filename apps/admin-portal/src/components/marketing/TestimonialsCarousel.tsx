"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const testimonials = [
  {
    id: 1,
    name: "Fatima Khan",
    role: "Parent, North Nazimabad",
    quote: "Hamdan has flourished at Kinder Pilot. The staff genuinely care about each child and keep us informed daily.",
  },
  {
    id: 2,
    name: "Omar Siddiqui",
    role: "Parent, Clifton Campus",
    quote: "The therapy services integrated with daycare have made a remarkable difference for Zainab. Highly recommended.",
  },
  {
    id: 3,
    name: "Sara Ahmed",
    role: "Parent, DHA Campus",
    quote: "Safe, clean, and professional. The enrollment process was smooth and the teachers are wonderful.",
  },
  {
    id: 4,
    name: "Maryam Ali",
    role: "Parent, Gulshan Campus",
    quote: "We toured three daycares in Karachi and Kinder Pilot stood out for their curriculum and facilities.",
  },
];

export function TestimonialsCarousel() {
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((i) => (i === 0 ? testimonials.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === testimonials.length - 1 ? 0 : i + 1));

  const current = testimonials[index];

  return (
    <div className="relative mx-auto max-w-2xl text-center">
      <Quote className="mx-auto h-10 w-10 text-brand-200" />
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="mt-6"
        >
          <p className="text-lg italic text-gray-700">&ldquo;{current.quote}&rdquo;</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-brand-100 text-brand-900">{getInitials(current.name)}</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="font-medium">{current.name}</p>
              <p className="text-sm text-gray-500">{current.role}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="mt-8 flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={prev} aria-label="Previous">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${i === index ? "bg-brand-500" : "bg-gray-300"}`}
              onClick={() => setIndex(i)}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
        <Button variant="outline" size="icon" onClick={next} aria-label="Next">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
