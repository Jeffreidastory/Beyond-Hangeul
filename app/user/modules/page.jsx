import { redirect } from "next/navigation";

export default function UserModulesRoute() {
  redirect("/dashboard?tab=modules");
}
