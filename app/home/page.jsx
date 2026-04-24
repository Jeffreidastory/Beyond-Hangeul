import { redirect } from "next/navigation";

export default function HomeRoute() {
  redirect("/dashboard?tab=home");
}
