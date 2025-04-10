import { doItAllLive } from "./lib/baseball";

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

  return (JSON.stringify(output));
}