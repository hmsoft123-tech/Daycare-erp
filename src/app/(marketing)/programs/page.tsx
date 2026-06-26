import { ProgramCard } from "@/components/marketing/ProgramCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const programs = [
  { title: "Daycare", ageRange: "6 months – 3 years", schedule: "Full / Half Day", capacity: "12 per room", description: "Individualised care plans, tummy time, sensory exploration, and structured nap schedules in a peanut-aware kitchen environment.", highlight: true },
  { title: "Preschool", ageRange: "3 – 5 years", schedule: "Full Day", capacity: "15 per class", description: "Montessori-inspired activities, Urdu/English bilingual exposure, art, music, and outdoor play twice daily." },
  { title: "Kindergarten", ageRange: "5 – 6 years", schedule: "Full Day", capacity: "18 per class", description: "School readiness curriculum covering phonics, early maths, science discovery, and social-emotional learning." },
  { title: "After School", ageRange: "6 – 10 years", schedule: "2:00 PM – 6:00 PM", capacity: "20 per group", description: "Homework supervision, karate, art club, and supervised free play for working parents." },
  { title: "Speech Therapy", ageRange: "2 – 10 years", schedule: "By appointment", capacity: "1:1 sessions", description: "Licensed speech therapists for articulation, language delay, and fluency support." },
  { title: "ABA & OT", ageRange: "2 – 8 years", schedule: "By appointment", capacity: "1:1 / small group", description: "Applied behaviour analysis and occupational therapy integrated with classroom routines." },
];

export default function ProgramsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-heading text-4xl font-bold text-brand-900">Programs & Services</h1>
      <p className="mt-4 max-w-2xl text-gray-600">
        From infant daycare to after-school care and integrated therapy — find the right fit for your child.
      </p>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {programs.map((p) => (
          <ProgramCard key={p.title} {...p} />
        ))}
      </div>
      <div className="mt-12 text-center">
        <Button asChild size="lg">
          <Link href="/contact">Schedule a Campus Tour</Link>
        </Button>
      </div>
    </div>
  );
}
