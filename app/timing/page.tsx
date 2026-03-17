import { doItAllLive } from "../lib/baseball";

export default async function Home(props: {
  searchParams: Promise<{
    gameID: number;
  }>;
}) {
  const searchParams = await props.searchParams;
  if (!searchParams.gameID) {
    throw new Error("you didn't specify a gameID");
  }
  const output = await doItAllLive(searchParams.gameID);
  // Away team 5, Home team 4
  // Top 5th, 1 out
  // At this pace, the game will end in XXhYYm (at hh:mm) if the bottom of the 9th is not played, and in XXhYYm (at hh:mm) if it is.
  return (JSON.stringify(output));
}