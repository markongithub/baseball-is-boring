import moment from 'moment-timezone';

type BoxScore = {
    info: [BoxScoreFact];
}

type BoxScoreFact = {
    label: string;
    value: string;
}

type LineScore = {
    currentInning: number;
    isTopInning: boolean;
    outs: number;
}

type Prediction = {
    outs: number;
    timeSoFar: number;
    timeLeftIfNoNinth: number;
    endTimeIfNoNinth: moment.Moment;
    timeLeftIfNinth: number;
    endTimeIfNinth: moment.Moment;
}

function startTimeStr(boxScore: BoxScore) {
    for (const fact of boxScore["info"]) {
        if (fact["label"] == "First pitch") {
            return fact["value"];
        }
    }
    throw new Error("whatevz");
};

/*
function venue(boxScore: BoxScore) {
    for (const fact of boxScore["info"]) {
        if (fact["label"] == "Venue") {
            return fact["value"];
        }
    }
    throw new Error("whatevz");
};
*/

function timeZoneFromVenue(venue: string): string {
    switch (venue) {
        case "Surprise Stadium":
            return "US/Arizona";
        case "NBT Bank Stadium":
            return "US/Eastern";
        case "Target Field":
            return "US/Central";
        default:
            throw new Error("the time zone from venue function is terrible");
    }
}

export function startTimeUTC(dateStr: string, timeStr: string, timeZone: string): moment.Moment {
    const localDateTime = `${dateStr} ${timeStr}`;

    return moment.tz(localDateTime, "YYYY-MM-DD h:mm A", timeZone).utc();
}

function totalOuts(lineScore: LineScore) {
    let outs = 6 * (lineScore.currentInning - 1);
    if (!lineScore.isTopInning) {
        outs += 3;
    }
    outs += lineScore.outs;
    return outs;
}

export function totalOutsFromJSON(maybeLineScore: string): number {
    const lineScore: LineScore = JSON.parse(maybeLineScore) as LineScore;
    return totalOuts(lineScore);
}

export function startTimeFromJSON(date: string, timeZone: string, maybeBoxScore: string) {
    const boxScore: BoxScore = JSON.parse(maybeBoxScore) as BoxScore;
    return startTimeUTC(date, startTimeStr(boxScore), timeZone);
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

async function getLineScoreRaw(gameID: number): Promise<string> {
    return fetchJsonRaw(`https://statsapi.mlb.com/api/v1/game/${gameID}/linescore`);
}

async function getBoxScoreRaw(gameID: number): Promise<string> {
    return fetchJsonRaw(`http://statsapi.mlb.com/api/v1/game/${gameID}/boxscore`);
}

function predictGameLengths(startTime: moment.Moment, curTime: moment.Moment, outs: number): [number, number, number] {
    const timeSoFar: number = curTime.diff(startTime);
    const estimatedGameLengthLong = (timeSoFar / outs) * 54;
    if (outs >= 51) {
        return [0, estimatedGameLengthLong];
    }
    const estimatedGameLengthShort = (timeSoFar / outs) * 51;
    return [timeSoFar, estimatedGameLengthShort, estimatedGameLengthLong];
}

export function doItAllPure(date: string, timeZone: string, maybeBoxScore: string, maybeLineScore: string, curTime: moment.Moment): Prediction {
    const startTime = startTimeFromJSON(date, timeZone, maybeBoxScore);
    console.log("curTime: " + curTime);
    const outs = totalOutsFromJSON(maybeLineScore);
    console.log("startTime ", startTime, " curTime ", curTime, " outs ", outs);
    const [timeSoFar, short, long] = predictGameLengths(startTime, curTime, outs);
    console.log("short mins ", short / 60 / 1000, "long mins ", long / 60 / 1000);
    const timeLeftIfNoNinth = short - timeSoFar;
    const timeLeftIfNinth = long - timeSoFar;
    return {
        outs: outs,
        timeSoFar: curTime.diff(startTime) / 60 / 1000,
        timeLeftIfNoNinth: timeLeftIfNoNinth / 60 / 1000,
        endTimeIfNoNinth: curTime.clone().add(timeLeftIfNoNinth),
        timeLeftIfNinth: timeLeftIfNinth / 60 / 1000,
        endTimeIfNinth: curTime.clone().add(timeLeftIfNinth),
    }
}

export async function doItAllLive(date: string, venue: string, gameID: number): Promise<Prediction> {
    const maybeLineScore = await getLineScoreRaw(gameID);
    const maybeBoxScore = await getBoxScoreRaw(gameID);
    const timeZone = timeZoneFromVenue(venue);
    const curTime = moment();
    return doItAllPure(date, timeZone, maybeBoxScore, maybeLineScore, curTime);
}