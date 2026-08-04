import { PageHeader } from "@/components/layout/PageHeader";
import { ServicesCatalogueClient } from "@/components/services/ServicesCatalogueClient";
import { getServiceOfferings } from "@/lib/mock-service";

export default async function ServicesPage() {
  const offerings = await getServiceOfferings();

  return (
    <>
      <PageHeader
        title="Services & classes"
        subtitle="SDLC fee catalogue — core classes, Lite/Plus/Pro extra care, plus & recreational services"
      />
      <ServicesCatalogueClient offerings={offerings} />
    </>
  );
}
