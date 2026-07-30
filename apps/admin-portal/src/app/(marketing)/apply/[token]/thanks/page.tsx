import { ApplyThanksClient } from "./ApplyThanksClient";

export const metadata = {
  title: "Application received | Kinder Pilot",
};

interface Props {
  searchParams: Promise<{ name?: string }>;
}

export default async function ApplyThanksPage({ searchParams }: Props) {
  const { name } = await searchParams;
  return <ApplyThanksClient name={name ?? "there"} />;
}
