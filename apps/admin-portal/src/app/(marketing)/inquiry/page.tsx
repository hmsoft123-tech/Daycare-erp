import { InquiryForm } from "@/components/marketing/InquiryForm";
import { ShareableInquiryLink } from "@/components/marketing/ShareableInquiryLink";

export const metadata = {
  title: "Get in Touch | Kinder Pilot",
  description: "Submit an admission, tour, employment, or general inquiry to Kinder Pilot.",
};

export default function InquiryPage() {
  return (
    <div className="bg-bg">
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">Kinder Pilot</p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-heading sm:text-4xl">Get in touch</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Whether you&apos;re exploring enrollment, booking a campus tour, joining our team, or have a general question —
            we&apos;re here to help. Schools share this page link on their website for &quot;Book a Tour&quot; and &quot;Inquire&quot; buttons.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
        <div className="mb-8">
          <ShareableInquiryLink />
        </div>
        <InquiryForm variant="standalone" schoolName="Kinder Pilot" />
      </section>
    </div>
  );
}
