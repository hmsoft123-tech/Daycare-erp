import { InquiryForm } from "@/components/marketing/InquiryForm";
import { branches } from "@/data/branches";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-heading text-4xl font-bold text-brand-900">Contact Us</h1>
      <p className="mt-4 text-gray-600">Reach out to any of our Karachi campuses or submit an inquiry below.</p>
      <div className="mt-12 grid gap-12 lg:grid-cols-2">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-5 w-5 text-brand-500" />
              <span>+92 21 3667 8900</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-5 w-5 text-brand-500" />
              <span>info@kinderpilot.pk</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-5 w-5 text-brand-500" />
              <span>Mon – Sat, 7:00 AM – 6:00 PM</span>
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold">Our Campuses</h2>
            {branches.map((b) => (
              <div key={b.id} className="flex gap-3 rounded-lg border p-4">
                <MapPin className="h-5 w-5 shrink-0 text-brand-500" />
                <div>
                  <p className="font-medium">{b.name}</p>
                  <p className="text-sm text-gray-500">{b.address}, {b.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <InquiryForm />
      </div>
    </div>
  );
}
