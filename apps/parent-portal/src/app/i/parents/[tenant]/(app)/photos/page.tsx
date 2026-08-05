import { redirect } from "next/navigation";

/** Photos tab replaced by Activity */
export default function PhotosRedirectPage() {
  redirect("/activity");
}
