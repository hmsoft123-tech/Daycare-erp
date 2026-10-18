import { redirect } from "next/navigation";

/** Old demo sign-in URL — the real (API-backed) login lives at /login. */
export default function PortalLoginPage() {
  redirect("/login");
}
