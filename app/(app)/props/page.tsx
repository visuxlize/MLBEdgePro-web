import { redirect } from "next/navigation";
export default function PropsPage() {
  redirect("/analysis?tab=props");
}
