import { redirect } from "next/navigation";

export default function PrintableRoute() {
  redirect("/dashboard?tab=worksheets&view=printable");
}
