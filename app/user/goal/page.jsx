import { redirect } from "next/navigation";

export default function UserGoalRoute() {
  redirect("/dashboard?tab=goal");
}
