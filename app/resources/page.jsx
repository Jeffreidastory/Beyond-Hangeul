import { redirect } from "next/navigation";

export default function ResourcesRoute() {
  redirect("/dashboard?tab=resources");
}
