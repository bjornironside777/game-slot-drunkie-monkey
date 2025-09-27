export type LineWin = {
    ruleId: number,
    lineIndex?: number,
    pattern: number[][],
    winMultiplier: number,
    winValue: number
}

export type ScatterWin = {
    winValue: number,
    symbolId: number,
    pattern: number[][],
}

export type FreespinWin = {
    symbolId: number,
    pattern: number[][],
    freespins: {
        id: number,
        count: number,
    },
}


export type Details={
    betId:string,
    gameId:number,
    userId:string
}

export type clusterData = {
    symbolCount: number,
    pattern: number[][],
    payout: number,
    multiplier?: number,
    multipliersPosition?: number[][]
}

export type SpinResult = {
    result: number[][],
    multipliers: number[][],
    winValue: number,
    currentTotalWinValue: number,
    win?: {
        lines?: LineWin[],
        winningPattern?: Map<number, clusterData[]>,
        freespins?: FreespinWin,
        multiWinShown: boolean,
        scatterWinShown?: boolean,
        freespinWinShown?: boolean,
    }
    freespins?:{
        freespinId: number,
        totalCount: number,
        moreAwarded: number,
        remainingCount: number,
        roundStarted: boolean,
        roundComplete: boolean,
    }
    bonus?:{
        bonusGameid: string,
        expiredInMS: number,
        totalCount: number,
        remainingCount: number,
        roundComplete: boolean,
        winAmount: number,
        lineBet: number
    };
    nextBonus?:{
        bonusGameid: string,
        expiredInMS: number,
        totalCount: number,
        remainingCount: number,
        roundComplete: boolean,
        winAmount: number,
        lineBet: number
    };
}

export type RoundResult = {
    id: number,
    roundType: number,
    type:number,
    lineBetValue: number,
    betLines: number,
    totalBet: number,
    totalWinValue: number,
    spinIndex: number,
    nextType?: number,
    spins: SpinResult[],
    complete: boolean,
    details: Details
}
