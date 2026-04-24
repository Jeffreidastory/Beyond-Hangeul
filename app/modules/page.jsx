import { redirect } from "next/navigation";

export default function ModulesRoute() {
  redirect("/dashboard?tab=modules");
}
