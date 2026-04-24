import { redirect } from "next/navigation";

export default function GoalRoute() {
  redirect("/dashboard?tab=goal");
}
