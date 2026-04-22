import { redirect } from "next/navigation";

export default function PrintableWorksheetsRoute() {
  redirect("/dashboard?tab=worksheets&view=printable");
}
