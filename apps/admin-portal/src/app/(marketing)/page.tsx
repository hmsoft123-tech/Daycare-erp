import { HeroSection } from "@/components/marketing/HeroSection";
import { ProgramCard } from "@/components/marketing/ProgramCard";
import { TestimonialsCarousel } from "@/components/marketing/TestimonialsCarousel";
import { InquiryForm } from "@/components/marketing/InquiryForm";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center font-heading text-3xl font-bold text-brand-900">Our Programs</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-gray-600">
          Age-appropriate learning environments designed for Karachi families
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <ProgramCard title="Daycare" ageRange="6 months – 3 years" schedule="Full / Half Day" capacity="12 per room" description="Safe, nurturing care with sensory play and nap routines." highlight />
          <ProgramCard title="Preschool" ageRange="3 – 5 years" schedule="Full Day" capacity="15 per class" description="Play-based early learning with Urdu and English exposure." />
          <ProgramCard title="Kindergarten" ageRange="5 – 6 years" schedule="Full Day" capacity="18 per class" description="School readiness with literacy, numeracy, and social skills." />
          <ProgramCard title="After School" ageRange="6 – 10 years" schedule="Afternoon" capacity="20 per group" description="Homework support, activities, and supervised free play." />
        </div>
      </section>
      <section className="bg-brand-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-heading text-3xl font-bold text-brand-900">What Parents Say</h2>
          <div className="mt-10">
            <TestimonialsCarousel />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 className="font-heading text-3xl font-bold text-brand-900">Ready to Enrol?</h2>
            <p className="mt-4 text-gray-600">
              Submit an inquiry and our admissions team will reach out within 24 hours to schedule a campus tour.
            </p>
          </div>
          <InquiryForm />
        </div>
      </section>
    </>
  );
}
