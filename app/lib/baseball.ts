import moment from 'moment';

interface LiveGame {
    liveData: {
        linescore: LineScore;
    };
    gameData: {
        gameInfo: {
            firstPitch: string;
        };
    };
}

interface LineScore {
    currentInning: number;
    isTopInning: boolean;
    outs: number;
}

type ParsedGame = {
    startTime: moment.Moment;
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

export function parseGame(maybeLiveGame: string): ParsedGame {
    const liveGame: LiveGame = JSON.parse(maybeLiveGame) as LiveGame;
    return {
        outs: totalOuts(liveGame.liveData.linescore),
        startTime: moment(liveGame.gameData.gameInfo.firstPitch),
    }
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
    const outs = liveGame.outs;
    console.log("startTime ", liveGame.startTime, " curTime ", curTime, " outs ", outs);
    const [timeSoFar, short, long] = predictGameLengths(liveGame.startTime, curTime, outs);
    console.log("short mins ", short / 60 / 1000, "long mins ", long / 60 / 1000);
    const timeLeftIfNoNinth = short - timeSoFar;
    const timeLeftIfNinth = long - timeSoFar;
    return {
        outs: outs,
        timeSoFar: curTime.diff(liveGame.startTime) / 60 / 1000,
        timeLeftIfNoNinth: timeLeftIfNoNinth / 60 / 1000,
        endTimeIfNoNinth: curTime.clone().add(timeLeftIfNoNinth),
        timeLeftIfNinth: timeLeftIfNinth / 60 / 1000,
        endTimeIfNinth: curTime.clone().add(timeLeftIfNinth),
    }
}

export async function doItAllLive(gameID: number): Promise<Prediction> {
    const maybeLiveGame = await getLiveGameRaw(gameID);
    const curTime = moment();
    return doItAllPure(maybeLiveGame, curTime);
}