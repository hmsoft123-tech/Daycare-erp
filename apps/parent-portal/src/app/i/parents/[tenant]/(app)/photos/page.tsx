import { redirect } from "next/navigation";

/** Photos live in Gallery (SDLC); Activity keeps the full care timeline */
export default function PhotosRedirectPage() {
  redirect("/gallery");
}
