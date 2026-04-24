import { redirect } from "next/navigation";

export default function PathRoute() {
  redirect("/dashboard?tab=path");
}
