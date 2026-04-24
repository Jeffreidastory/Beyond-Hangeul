import { redirect } from "next/navigation";

export default function KeyboardPracticeRoute({ searchParams }) {
  const worksheetId = searchParams?.worksheet;

  if (worksheetId) {
    redirect(`/dashboard?tab=worksheets&view=online&worksheet=${worksheetId}`);
  }

  redirect("/dashboard?tab=worksheets&view=online");
}
