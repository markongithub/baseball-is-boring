import moment from "moment-timezone";
import { doItAllLive } from "../lib/baseball";

function formatDuration(minutes: number): string {
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const mins = Math.abs(rounded % 60);
  const hPart = `${hours}h`;
  const mPart = `${mins.toString().padStart(2, "0")}m`;
  return `${hPart}${mPart}`;
}

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

  const inningHalf = output.isTopInning ? "Top" : "Bottom";
  const outsLabel = `${output.outsThisInning} out${output.outsThisInning === 1 ? "" : "s"}`;

  const noNinthDuration = formatDuration(output.timeLeftIfNoNinth);
  const ninthDuration = formatDuration(output.timeLeftIfNinth);

  const noNinthEnd = moment(output.endTimeIfNoNinth)
    .tz(output.timeZone)
    .format("HH:mm");
  const ninthEnd = moment(output.endTimeIfNinth)
    .tz(output.timeZone)
    .format("HH:mm");

  return (
    <main>
      <p>
        {output.visitorName} {output.visitorScore}, {output.homeName} {output.homeScore}
      </p>
      <p>
        {inningHalf} {output.currentInning}th, {outsLabel}
      </p>
      <p>
        At this pace, the game will end in {noNinthDuration} (at {noNinthEnd}) if the bottom of
        the 9th is not played, and in {ninthDuration} (at {ninthEnd}) if it is.
      </p>
    </main>
  );
}