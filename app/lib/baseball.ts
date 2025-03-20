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

function startTimeStr(boxScore: BoxScore) {
    for (const fact of boxScore["info"]) {
        if (fact["label"] == "First pitch") {
            return fact["value"];
        }
    }
};

export function startTimeUTC(dateStr: string, timeStr: string, timeZone: string) {
    const localDateTime = `${dateStr} ${timeStr}`;

    return moment.tz(localDateTime, "YYYY-MM-DD h:mm A", timeZone).utc();
}

function totalOuts(lineScore: LineScore) {
    var outs = 6 * (lineScore.currentInning - 1);
    if (!lineScore.isTopInning) {
        outs += 3;
    }
    outs += lineScore.outs;
    return outs;
}

export function totalOutsFromJSON(maybeLineScore: string) {
    const lineScore: LineScore = JSON.parse(maybeLineScore) as LineScore;
    return totalOuts(lineScore);
}