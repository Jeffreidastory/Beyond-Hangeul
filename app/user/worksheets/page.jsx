import { redirect } from "next/navigation";

export default function UserWorksheetsRoute() {
  redirect("/dashboard?tab=worksheets");
}
