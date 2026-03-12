import { getSchedule } from "../lib/baseball";
import Link from 'next/link'

export default async function Home(props: {
    searchParams: Promise<{
        sportID: number;
        date: string;
    }>;
}) {
    const searchParams = await props.searchParams;
    if (!searchParams.sportID) {
        throw new Error("you didn't specify a sportID");
    }
    if (!searchParams.date) {
        throw new Error("you didn't specify a date");
    }
    const schedule = await getSchedule(searchParams.sportID, searchParams.date);
    const flattenedGames = schedule.dates.map((date) => date.games).reduce((accumulator, value) => accumulator.concat(value), []);
    return (
        <div>
            <ul>
                {/* Use the map function to iterate over the array of objects */}
                {flattenedGames.map((game) => (
                    <li key={game.gamePk}>
                        {(game.status.detailedState == "In Progress") ? (
                            <Link href={`/timing?gameID=${game.gamePk}`}>{game.gameDate}: {game.teams.away.team.name} at {game.teams.home.team.name} ({game.status.detailedState})</Link>
                        ) : (
                            <p>{game.gameDate}: {game.teams.away.team.name} at {game.teams.home.team.name} ({game.status.detailedState})</p>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
    // return (JSON.stringify(schedule));
}