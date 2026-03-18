import { redirect } from "next/navigation";

export default function Home() {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Honolulu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  redirect(`/schedule?sportID=1&date=${today}`);
}
