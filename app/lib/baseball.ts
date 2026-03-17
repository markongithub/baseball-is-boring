import moment from 'moment';

interface LiveGame {
    liveData: {
        linescore: LineScore;
        plays: {
            currentPlay: {
                result: {
                    homeScore: number;
                    awayScore: number;
                }
            }
        };
    };
    gameData: {
        gameInfo: {
            firstPitch: string;
        };
        teams: {
            home: {
                name: string;
            }
            away: {
                name: string;
            }
        };
        venue: {
            timeZone: {
                id: string;
                tz: string;
            }
        }
    };
}
/*
        homeName: liveGame.gameData.teams.home.name,
        visitorName: liveGame.gameData.teams.away.name,
        homeScore: liveGame.liveData.plays.currentPlay.result.homeScore,

        */
interface LineScore {
    currentInning: number;
    isTopInning: boolean;
    outs: number;
}

type ParsedGame = {
    startTime: moment.Moment;
    timeZoneID: string;
    timeZoneName: string;
    currentInning: number;
    isTopInning: boolean;
    outsThisInning: number;
    visitorName: string;
    homeName: string;
    visitorScore: number;
    homeScore: number;
}

type Prediction = {
    currentInning: number;
    isTopInning: boolean;
    outsThisInning: number;
    visitorName: string;
    homeName: string;
    visitorScore: number;
    homeScore: number;
    timeSoFar: number;
    timeLeftIfNoNinth: number;
    endTimeIfNoNinth: moment.Moment;
    timeLeftIfNinth: number;
    endTimeIfNinth: moment.Moment;
    timeZoneID: string;
    timeZoneName: string;
}

// jq '.dates[].games[].teams.away.team.name'
interface Schedule {
    dates: ScheduleDate[];
}

interface ScheduleDate {
    games: ScheduleGame[];
}

interface ScheduleGame {
    gamePk: number;
    gameDate: string;
    teams: {
        away: {
            team: {
                name: string;
            }
        }
        home: {
            team: {
                name: string;
            }
        }
    };
    gameData: {
        gameInfo: {
            firstPitch: string;
        };
    };
    status: {
        detailedState: string;
    }
}

export async function getSchedule(sportID: number, date: string): Promise<Schedule> {
    const maybeSchedule = await getScheduleRaw(sportID, date);
    const schedule: Schedule = JSON.parse(maybeSchedule) as Schedule;
    return schedule
}

export function parseGame(maybeLiveGame: string): ParsedGame {
    const liveGame: LiveGame = JSON.parse(maybeLiveGame) as LiveGame;
    return {
        startTime: moment(liveGame.gameData.gameInfo.firstPitch),
        currentInning: liveGame.liveData.linescore.currentInning,
        isTopInning: liveGame.liveData.linescore.isTopInning,
        outsThisInning: liveGame.liveData.linescore.outs,
        homeName: liveGame.gameData.teams.home.name,
        visitorName: liveGame.gameData.teams.away.name,
        homeScore: liveGame.liveData.plays.currentPlay.result.homeScore,
        visitorScore: liveGame.liveData.plays.currentPlay.result.awayScore,
        timeZoneID: liveGame.gameData.venue.timeZone.id,
        timeZoneName: liveGame.gameData.venue.timeZone.tz,
    }
}

function totalOuts(parsedGame: ParsedGame) {
    let outs = 6 * (parsedGame.currentInning - 1);
    if (!parsedGame.isTopInning) {
        outs += 3;
    }
    outs += parsedGame.outsThisInning;
    return outs;
}

async function fetchJsonRaw(url: string): Promise<string> {
    try {
        const response = await fetch(url);

        // Check if the request was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return response.text();
    } catch (error) {
        // Re-throw with a more descriptive message
        if (error instanceof Error) {
            throw new Error(`Failed to fetch data from ${url}: ${error.message}`);
        } else {
            throw new Error(`Failed to fetch data from ${url}: Unknown error`);
        }
    }
}

async function getLiveGameRaw(gameID: number): Promise<string> {
    return fetchJsonRaw(`https://statsapi.mlb.com/api/v1.1/game/${gameID}/feed/live`);
}

async function getScheduleRaw(sportID: number, date: string): Promise<string> {
    return fetchJsonRaw(`https://statsapi.mlb.com/api/v1/schedule?sportId=${sportID}&startDate=${date}&endDate=${date}`);
}

function predictGameLengths(startTime: moment.Moment, curTime: moment.Moment, outs: number): [number, number, number] {
    const timeSoFar: number = curTime.diff(startTime);
    const estimatedGameLengthLong = (timeSoFar / outs) * 54;
    if (outs >= 51) {
        return [timeSoFar, 0, estimatedGameLengthLong];
    }
    const estimatedGameLengthShort = (timeSoFar / outs) * 51;
    return [timeSoFar, estimatedGameLengthShort, estimatedGameLengthLong];
}

export function doItAllPure(maybeLiveGame: string, curTime: moment.Moment): Prediction {
    const liveGame = parseGame(maybeLiveGame);
    console.log("curTime: " + curTime);
    const outs = totalOuts(liveGame);
    console.log("startTime ", liveGame.startTime, " curTime ", curTime, " outs ", outs);
    const [timeSoFar, short, long] = predictGameLengths(liveGame.startTime, curTime, outs);
    console.log("short mins ", short / 60 / 1000, "long mins ", long / 60 / 1000);
    const timeLeftIfNoNinth = short - timeSoFar;
    const timeLeftIfNinth = long - timeSoFar;
    return {
        currentInning: liveGame.currentInning,
        isTopInning: liveGame.isTopInning,
        outsThisInning: liveGame.outsThisInning,
        visitorName: liveGame.visitorName,
        homeName: liveGame.homeName,
        visitorScore: liveGame.visitorScore,
        homeScore: liveGame.homeScore,
        timeSoFar: curTime.diff(liveGame.startTime) / 60 / 1000,
        timeLeftIfNoNinth: timeLeftIfNoNinth / 60 / 1000,
        endTimeIfNoNinth: curTime.clone().add(timeLeftIfNoNinth),
        timeLeftIfNinth: timeLeftIfNinth / 60 / 1000,
        endTimeIfNinth: curTime.clone().add(timeLeftIfNinth),
        timeZoneID: liveGame.timeZoneID,
        timeZoneName: liveGame.timeZoneName,
    }
}

export async function doItAllLive(gameID: number): Promise<Prediction> {
    const maybeLiveGame = await getLiveGameRaw(gameID);
    const curTime = moment();
    return doItAllPure(maybeLiveGame, curTime);
}