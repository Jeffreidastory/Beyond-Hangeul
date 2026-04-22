import { redirect } from "next/navigation";

export default function OnlineWorksheetsRoute() {
  redirect("/dashboard?tab=worksheets&view=online");
}
