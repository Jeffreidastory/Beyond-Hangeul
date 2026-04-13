import { redirect } from "next/navigation";

export default function UserDashboardRoute() {
  redirect("/dashboard?tab=home");
}
