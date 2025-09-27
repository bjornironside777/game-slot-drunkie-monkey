export type LoginResponse = {
    Player: {
        Balance: number,
        Rate: number,
        Currency: string,
        CoinRate: number
    },
    Current: {
        TotalWin: number,
        AccWin: number,
        Type:number;
        MultiplierMap?: { [key: string]: number },
        Result: {
            R: string,
            clusterDetails?: {
                symbol: number | string,
                positions: string[],
                payout: number,
                multiplier?: number | string,
                multiplierPositions?: string[],
            }[],
            scatter?: {
                symbol: number,
                payout: number,
                positions: string[]
            }
        },
        Round: {
            RoundType: number,
            Bet: number,
            BetValue: number,
            Line: number,
            LineBet: number,
            Payout: number
        },
        FreeSpin?: {
            Current: number,
            Total: number
        },
        Bonus?: {
            id: string,
            lineBet: number,
            expiredAt: string,
            spinLeft: number,
            spinCount: number,
            totalWin: number,
            completed?: boolean
        }
    },
    Next?: {
        Type: number,
        FreeSpin?: {
            Next: number,
            Total: number,
            MoreAwarded: number
        },
        Bonus?: {
            id: string,
            lineBet: number,
            expiredAt: string,
            spinLeft: number,
            spinCount: number,
            totalWin: number,
            completed?: boolean
        }
    },
    GameInfo: {
        Line: number,
        BetValue: number[],
        LineBet: number[],
        BuyFeature: {
            RoundType: number,
            Rate: number,
            Total: number
        }
    },
    Details: {
        betId: string,
        gameId: number,
        userId: string
    }
};

export type TransactResponse = {
    Player: {
        Balance: number
    },
    Current: {
        TotalWin: number,
        AccWin: number,
        Type:number;
        MultiplierMap?: { [key: string]: number },
        Result: {
            R: string,
            clusterDetails?: {
                symbol: number | string,
                positions: string[],
                payout: number,
                multiplier?: number | string,
                multiplierPositions?: string[],
            }[],
            scatter?: {
                symbol: number,
                payout: number,
                positions: string[]
            }
        },
        Round: {
            RoundType: number,
            Bet: number,
            BetValue: number,
            Line: number,
            LineBet: number,
            Payout: number
        },
        FreeSpin?: {
            Current: number,
            Total: number
        },
        Bonus?: {
            id: string,
            lineBet: number,
            expiredAt: string,
            spinLeft: number,
            spinCount: number,
            totalWin: number,
            completed?: boolean
        }
    },
    Next: {
        Type: number,
        FreeSpin?: {
            Next: number,
            Total: number,
            MoreAwarded: number
        },
        Bonus?: {
            id: string,
            lineBet: number,
            expiredAt: string,
            spinLeft: number,
            spinCount: number,
            totalWin: number,
            completed?: boolean
        }
    },
    Details: {
        betId: string,
        gameId: number,
        userId: string
    }
};

export enum LineDirection {
    LTR = 1,
    RTL = 2
}
