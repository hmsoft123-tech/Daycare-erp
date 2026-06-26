import { InquiryForm } from "@/components/marketing/InquiryForm";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-heading text-4xl font-bold text-brand-900">About Kinder Pilot</h1>
      <p className="mt-4 max-w-3xl text-lg text-gray-600">
        Founded in 2007, Kinder Pilot has grown into Karachi&apos;s trusted multi-campus daycare and early learning network. 
        Our four campuses in North Nazimabad, Clifton, DHA, and Gulshan serve over 800 families with licensed educators, 
        therapy services, and a child-first philosophy.
      </p>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {[
          { title: "Our Mission", text: "To provide safe, nurturing, and developmentally rich environments where every child can thrive." },
          { title: "Our Values", text: "Safety, transparency, inclusion, and partnership with Pakistani families." },
          { title: "Our Team", text: "120+ qualified teachers, therapists, and support staff across all campuses." },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border bg-surface p-6">
            <h3 className="font-heading text-lg font-semibold text-brand-900">{item.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{item.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-16 max-w-lg">
        <h2 className="font-heading text-2xl font-bold text-brand-900">Get in Touch</h2>
        <div className="mt-6">
          <InquiryForm />
        </div>
      </div>
    </div>
  );
}
