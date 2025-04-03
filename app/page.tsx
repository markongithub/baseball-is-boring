import { doItAllLive } from "./lib/baseball";

export default async function Home(props: {
  searchParams: Promise<{
    date: string;
    venue: string;
    gameID: number;
  }>;
}) {
  const searchParams = await props.searchParams;
  if (!searchParams.date) {
    throw new Error("you didn't specify a date");
  }
  if (!searchParams.venue) {
    throw new Error("you didn't specify a venue");
  }
  if (!searchParams.gameID) {
    throw new Error("you didn't specify a gameID");
  }
  const output = await doItAllLive(searchParams.date, searchParams.venue, searchParams.gameID);

  return (JSON.stringify(output));
}