import { redirect } from "next/navigation";

export default function KeyboardPracticeRoute({ searchParams }) {
  const worksheetId = searchParams?.worksheet;

  if (worksheetId) {
    redirect(`/keyboard-practice?worksheet=${worksheetId}`);
  }

  redirect("/keyboard-practice");
}
