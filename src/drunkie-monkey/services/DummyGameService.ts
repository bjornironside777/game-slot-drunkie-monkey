import Logger from '../../gamma-engine/core/utils/Logger';
import { container, singleton } from 'tsyringe';
import IGameService from '../../gamma-engine/slots/service/IGameService';
import Wallet from '../../gamma-engine/slots/model/Wallet';
import SlotMachine from '../../gamma-engine/slots/model/SlotMachine';
import { PatternType, SlotMachineDescription, SlotMachineType, WildcardType } from '../../gamma-engine/slots/model/SlotMachineDescription';
import { RoundResult } from '../../gamma-engine/slots/model/RoundResult';
import EventEmitter from 'eventemitter3';
import GameScenario from './test-scenarios/GameScenario';
import GameScenarioRandom from './test-scenarios/GameScenarioRandom';
import GameScenarioSingleLineSymbol from './test-scenarios/GameScenarioSingleLineSymbol';
import GameScenarioMultiline from './test-scenarios/GameScenarioMultiline';
import GameScenarioSuspenseScatterLoss from './test-scenarios/GameScenarioSuspenseScatterLoss';
import GameScenarioFreespinScatter from './test-scenarios/GameScenarioFreespinScatter';
import {arrayFill, randomArrayElement} from '../../gamma-engine/core/utils/Utils';
import GameScenarioNoWin from './test-scenarios/GameScenarioNoWin';
import GameScenarioSuspenseBonusLoss from './test-scenarios/GameScenarioSuspenseBonusLoss';


@singleton()
export default class DummyGameService extends EventEmitter implements IGameService {

    private currentGameScenarioName: string = 'random';
    private currentGameScenario: GameScenario;

    private lobbyUrl: string;
    private startingBalance: number;

    private balance: number = 0;

    constructor(lobbyUrl: string, startingBalance: number) {
        super();
        this.lobbyUrl = lobbyUrl;
        this.startingBalance = startingBalance;
    }
    saveSettings(): void {
        
    }

    // PUBLIC API
    public setGameScenario(scenarioName: string): void {
        this.currentGameScenarioName = scenarioName;
        Logger.info(`Scenario set: ${scenarioName}`);
    }

    public get featureBuyConfig(){
        return {
            RoundType: 10,
            Total: 15,
            Rate: 100
        };
    }

    public get settings(){
        return {
            quickSpin: false,
            batterySaver: false,
            ambientMusic: true,
            soundFx: true,
            introScreen: true,
        };
    }

    public async initialize(): Promise<[Wallet, SlotMachine]> {
        const allSymbolIds: number[] = [105, 104, 103, 102, 101, 204, 203, 202, 201, 302,303];
        const denomination: number = 100;

        const wallet: Wallet = new Wallet(denomination, {
            isoCode: 'EUR',
            precision: 2
        },
            [0.01,0.03,0.05,0.1,0.2,0.5]
            );

        const description: SlotMachineDescription = {
            rtp: 'unknown',
            coinRate:100,
            type: SlotMachineType.LINES,
            betLimits: [1, 2, 5, 10, 25, 50, 100, 250, 500],
            betMaxQuantity:10,
            lines: [
                [1, 1, 1, 1, 1],
                [0, 0, 0, 0, 0],
                [2, 2, 2, 2, 2],
                [0, 1, 2, 1, 0],
                [2, 1, 0, 1, 2],
                [0, 1, 0, 1, 0],
                [2, 1, 2, 1, 2],
                [1, 0, 1, 0, 1],
                [1, 2, 1, 2, 1],
                [1, 1, 0, 1, 1],
                [1, 1, 2, 1, 1],
                [0, 1, 1, 1, 0],
                [2, 1, 1, 1, 2],
                [2, 2, 1, 0, 0],
                [0, 0, 1, 2, 2],
                [1, 0, 0, 0, 1],
                [1, 2, 2, 2, 1],
                [2, 1, 0, 0, 0],
                [0, 1, 2, 2, 2],
                [2, 2, 2, 1, 0]
            ],
            totalWinMultipliers: [
                1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
                11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
                21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
                31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
                41, 42, 43, 44, 45, 46, 47, 48, 49, 50
            ],
            bigWinMultiplierLevels: [10],
            symbols: allSymbolIds,
            wildcards: [{
                symbolId: 301,
                type: WildcardType.REGULAR,
                symbolsReplaced: [105, 104, 103, 102, 101, 204, 203, 202, 201],
                multiplier: 1
            }],
            reels: {
                regular: {
                    cascading: true,
                    reels: [
                        {
                            numRows: 5,
                            availableSymbols: allSymbolIds,
                        },
                        {
                            numRows: 5,
                            availableSymbols: allSymbolIds,
                        },
                        {
                            numRows: 5,
                            availableSymbols: allSymbolIds,
                        },
                        {
                            numRows: 5,
                            availableSymbols: allSymbolIds,
                        },
                        {
                            numRows: 5,
                            availableSymbols: allSymbolIds,
                        },
                        {
                            numRows: 5,
                            availableSymbols: allSymbolIds,
                        }
                    ]
                },
                freeSpins: [
                    {
                        id: 0,
                        cascading:true,
                        reels: [
                            {
                                numRows: 5,
                                availableSymbols: allSymbolIds,
                            },
                            {
                                numRows: 5,
                                availableSymbols: allSymbolIds,
                            },
                            {
                                numRows: 5,
                                availableSymbols: allSymbolIds,
                            },
                            {
                                numRows: 5,
                                availableSymbols: allSymbolIds,
                            },
                            {
                                numRows: 5,
                                availableSymbols: allSymbolIds,
                            },
                            {
                                numRows: 5,
                                availableSymbols: allSymbolIds,
                            }
                        ]
                    },
                ]
            },
            rules: [
                {
                    id: 0,
                    pattern: {
                        symbolId: 105,
                        symbolCount:[12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 4
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 105,
                        symbolCount: [10,11],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 1.5
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 105,
                        symbolCount: [8,9],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 0.5
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 104,
                        symbolCount: [12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 8
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 104,
                        symbolCount:  [10,11],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 8
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 104,
                        symbolCount: [8,9],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 30
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 103,
                        symbolCount: [12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 2
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 103,
                        symbolCount:  [10,11],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 8
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 103,
                        symbolCount: [8,9],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 30
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 102,
                        symbolCount: [12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 2
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 102,
                        symbolCount:  [10,11],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 8
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 102,
                        symbolCount: [8,9],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 30
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 101,
                        symbolCount: [12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 2
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 101,
                        symbolCount:  [10,11],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 8
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 101,
                        symbolCount: [8,9],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 30
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 204,
                        symbolCount: [12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 25
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 204,
                        symbolCount:  [10,11],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 75
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 204,
                        symbolCount: [8,9],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 300
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 203,
                        symbolCount:[12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 30
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 203,
                        symbolCount:  [10,11],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 80
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 203,
                        symbolCount:[8,9],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 400
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 202,
                        symbolCount: [12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 50
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 202,
                        symbolCount:  [10,11],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 150
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 202,
                        symbolCount: [8,9],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 600
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 201,
                        symbolCount: [12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 100
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 201,
                        symbolCount: [10,11],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 50
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 201,
                        symbolCount: [8,9],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 20
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 301,
                        symbolCount: [12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 150
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 301,
                        symbolCount:  [10,11],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 300
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 301,
                        symbolCount:[8,9],
                        type: PatternType.LEFTMOST
                    },
                    reward: {
                        line: {
                            multiplier: 1200
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 302,
                        symbolCount: [12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],
                        type: PatternType.SCATTER
                    },
                    reward: {
                        freeSpins: {
                            id: 0,
                            amount: 10
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 302,
                        symbolCount:  [10,11],
                        type: PatternType.SCATTER
                    },
                    reward: {
                        freeSpins: {
                            id: 0,
                            amount: 15
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 302,
                        symbolCount: [8,9],
                        type: PatternType.SCATTER
                    },
                    reward: {
                        freeSpins: {
                            id: 0,
                            amount: 20
                        }
                    }
                },
            ]
        };

        wallet.balance = this.startingBalance;
        const slotMachine: SlotMachine = new SlotMachine(description, {
            gameSpeedLevels: 2
        });

        slotMachine.roundResult = slotMachine.getDummyRoundResult(null);
        return [wallet, slotMachine];
    }

    public async spin(betValue: number, numLines: number): Promise<RoundResult> {
        this.currentGameScenarioName = 'multiline'
        return new Promise<RoundResult>((resolve) => {
            const sm: SlotMachine = container.resolve(SlotMachine);
                //if (this.currentGameScenarioName == 'random') {
                    this.currentGameScenario = new GameScenarioRandom(sm);
                // } else if (/^symbol\|\d+\|\d$/.test(this.currentGameScenarioName)) {
                //     const symbolId: number = parseInt(this.currentGameScenarioName.split('|')[1]);
                //     const symbolCount: number = parseInt(this.currentGameScenarioName.split('|')[2]);
                //     this.currentGameScenario = new GameScenarioSingleLineSymbol(sm, symbolId, symbolCount, 0);
                // } else if (/^line\|\d+$/.test(this.currentGameScenarioName)) {
                //     const lineIndex: number = parseInt(this.currentGameScenarioName.split('|')[1]) - 1;
                //     this.currentGameScenario = new GameScenarioSingleLineSymbol(sm, randomArrayElement([105, 104, 103, 102, 101, 204, 203, 202, 201]), 5, lineIndex);
                // } else if (/^freespins\|\d$/.test(this.currentGameScenarioName)) {
                //     const scatterSymbolCount: number = parseInt(this.currentGameScenarioName.split('|')[1]);
                //     this.currentGameScenario = new GameScenarioFreespinScatter(sm, scatterSymbolCount);
                // } else if (this.currentGameScenarioName == 'multiline') {
                //     this.currentGameScenario = new GameScenarioMultiline(sm);
                // } else if (this.currentGameScenarioName == 'multiline-big') {
                //     this.currentGameScenario = new GameScenarioMultiline(sm, true);
                // } else if (this.currentGameScenarioName == 'suspense-scatter') {
                //     this.currentGameScenario = new GameScenarioSuspenseScatterLoss(sm);
                // } else {
                //     Logger.warning(`Scenario ${this.currentGameScenarioName} not implemented!`);
                //     // this.emit(GameServiceEvent.ERROR);
                //     throw new Error('Something went wrong!');
                // }


            const result: RoundResult = this.currentGameScenario.nextResult();

            if (this.currentGameScenario.isRoundComplete()) {
                this.currentGameScenario = null;
            }

            resolve(result);
        });
    }

    public lobby(): void {
        Logger.debug('GameService.lobby');
        if (typeof this.lobbyUrl != 'undefined' && this.lobbyUrl)
            window.open(this.lobbyUrl, '_self');
        else
            history.back();
    }


    public async buyFeature(): Promise<RoundResult> {
        throw new Error('Something went wrong!');
    }
}
