import { redirect } from "next/navigation";

export default function PaymentRoute({ searchParams }) {
  const moduleId = searchParams?.module;

  if (moduleId) {
    redirect(`/dashboard?tab=payment&module=${moduleId}`);
  }

  redirect("/dashboard?tab=payment");
}
