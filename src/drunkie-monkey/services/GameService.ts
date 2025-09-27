import axios, { AxiosInstance, AxiosResponse } from 'axios';
import EventEmitter from 'eventemitter3';
import jwtDecode from 'jwt-decode';
import { container, singleton } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import Logger from '../../gamma-engine/core/utils/Logger';
import { clusterData, RoundResult, SpinResult } from '../../gamma-engine/slots/model/RoundResult';
import SlotMachine from '../../gamma-engine/slots/model/SlotMachine';
import {
    PatternType,
    SlotMachineDescription,
    SlotMachineType
} from '../../gamma-engine/slots/model/SlotMachineDescription';
import Wallet from '../../gamma-engine/slots/model/Wallet';
import { getFromLocalStorage, saveToLocalStorage } from "../model/LocalStorageUtils";
import { SettingsType } from "../model/SettingsType";
import { TransactionType } from '../model/TransactionType';
import { LoginResponse, TransactResponse } from './Responses';
import { GameServiceEvent } from './event/GameServiceEvent';
import { currencyCode } from './text-json-files/DataSource';
import ICommonGameService from '../../gamma-engine/common/services/ICommonGameService';
import History from '../../gamma-engine/common/model/History';

@singleton()
export default class GameService extends EventEmitter implements ICommonGameService{

    // token will refresh if less than X seconds left to expiry
    private tokenRefreshThreshold: number = 300;

    private gameCode: string;
    private jwtToken: string;
    private ax: AxiosInstance;
    private hx:AxiosInstance;
    private lobbyUrl: string;

    private featureBuy: {
        RoundType: number,
        Rate: number,
        Total: number
    }

    private _doubleChanceEnabled: boolean = false;
    private _settings: SettingsType;

    constructor(baseUrl: string, jwtToken: string, gameCode: string, lobbyUrl: string = '') {
        super();
        this.jwtToken = jwtToken;
        this.gameCode = gameCode;
        this.lobbyUrl = lobbyUrl;
        this.ax = axios.create({
            baseURL: baseUrl,
            headers: {
                'Authorization': `Bearer ${this.jwtToken}`
            }
        });

        this.ax.interceptors.request.use(async config => {
            if (config.url != 'keep-alive') {
                await this.checkAndUpdateToken();
            }
            return config;
        }, error => {
            Promise.reject(error)
        });
        this.hx = axios.create({
            baseURL: baseUrl.replace('/engine-six', ''),
            headers: {
                'Authorization': `Bearer ${this.jwtToken}`
            }
        });


        this._settings = getFromLocalStorage('settings') ??{
            quickSpin: false,
            batterySaver: false,
            ambientMusic: true,
            soundFx: true,
            introScreen: true,
        };
    }

    // PUBLIC API
    public async initialize(): Promise<[Wallet, SlotMachine]> {
        let data: LoginResponse;
        try {
            data = await this.login();
        } catch(e) {
            Logger.error(e);
            this.emit(GameServiceEvent.ERROR);
            throw(e);
        }

        const denomination: number = 1;
        const wallet: Wallet = new Wallet(denomination, {
            isoCode: currencyCode[data.Player.Currency],
            precision: 2
        }, [1]);

        const description: SlotMachineDescription = {
            rtp: 'unknown',
            coinRate:data.Player.CoinRate,
            type: SlotMachineType.COMBINATIONS,
            betLimits: data.GameInfo.LineBet,
            betMaxQuantity: 10,
            totalWinMultipliers: [
                1, 2, 3, 4, 5
            ],
            combinations:20,
            bigWinMultiplierLevels: [10, 20, 30, 40],
            symbols: [25, 104, 103, 102, 101, 203, 202, 201],
            reels: {
                regular: {
                    cascading: true,
                    reels: [
                        {
                            numRows: 7,
                            availableSymbols: [25, 104, 103, 102, 101, 203, 202, 201],
                        },
                        {
                            numRows: 7,
                            availableSymbols: [25, 104, 103, 102, 101, 203, 202, 201],
                        },
                        {
                            numRows: 7,
                            availableSymbols: [25, 104, 103, 102, 101, 203, 202, 201],
                        },
                        {
                            numRows: 7,
                            availableSymbols: [25, 104, 103, 102, 101, 203, 202, 201],
                        },
                        {
                            numRows: 7,
                            availableSymbols: [25, 104, 103, 102, 101, 203, 202, 201],
                        },
                        {
                            numRows: 7,
                            availableSymbols: [25, 104, 103, 102, 101, 203, 202, 201],
                        },
                        {
                            numRows: 7,
                            availableSymbols: [25, 104, 103, 102, 101, 203, 202, 201],
                        }
                    ]
                },
                freeSpins: [
                    {
                        id: 0,
                        cascading: true,
                        reels: [
                            {
                                numRows: 7,
                                availableSymbols: [ 25, 104, 103, 102, 101, 203, 202, 201],
                            },
                            {
                                numRows: 7,
                                availableSymbols: [ 25, 104, 103, 102, 101, 203, 202, 201],
                            },
                            {
                                numRows: 7,
                                availableSymbols: [25, 104, 103, 102, 101, 203, 202, 201],
                            },
                            {
                                numRows: 7,
                                availableSymbols: [ 25, 104, 103, 102, 101, 203, 202, 201],
                            },
                            {
                                numRows: 7,
                                availableSymbols: [25, 104, 103, 102, 101, 203, 202, 201],
                            },
                            {
                                numRows: 7,
                                availableSymbols: [ 25, 104, 103, 102, 101, 203, 202, 201],
                            }
                        ]
                    },
                ]
            },
            rules: [
                {
                    id: 0,
                    pattern: {
                        symbolId: 104,
                        symbolCount: [5],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 0.2
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 104,
                        symbolCount: [6],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 0.25
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 104,
                        symbolCount: [7],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 0.3
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 104,
                        symbolCount: [8],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 0.4
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 104,
                        symbolCount: [9],
                        type: PatternType.BOTH_WAYS
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
                        symbolCount: [10],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 1
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 104,
                        symbolCount: [11],
                        type: PatternType.BOTH_WAYS
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
                        symbolId: 104,
                        symbolCount: [12],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 2.5
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 104,
                        symbolCount: [13],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 5
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 104,
                        symbolCount: [14],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 10
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 104,
                        symbolCount: [15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49],
                        type: PatternType.BOTH_WAYS
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
                        symbolId: 103,
                        symbolCount: [5],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 0.25
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 103,
                        symbolCount: [6],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 0.3
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 103,
                        symbolCount: [7],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 0.4
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 103,
                        symbolCount: [8],
                        type: PatternType.BOTH_WAYS
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
                        symbolId: 103,
                        symbolCount: [9],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 0.75
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 103,
                        symbolCount: [10],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 1.25
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 103,
                        symbolCount: [11],
                        type: PatternType.BOTH_WAYS
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
                        symbolCount: [12],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 3
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 103,
                        symbolCount: [13],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 6
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 103,
                        symbolCount: [14],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 12
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 103,
                        symbolCount: [15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49],
                        type: PatternType.BOTH_WAYS
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
                        symbolId: 102,
                        symbolCount: [5],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 0.3
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 102,
                        symbolCount: [6],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 0.4
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 102,
                        symbolCount: [7],
                        type: PatternType.BOTH_WAYS
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
                        symbolId: 102,
                        symbolCount: [8],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 0.75
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 102,
                        symbolCount: [9],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 1
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 102,
                        symbolCount: [10],
                        type: PatternType.BOTH_WAYS
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
                        symbolId: 102,
                        symbolCount: [11],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 2.5
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 102,
                        symbolCount: [12],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 3.5
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 102,
                        symbolCount: [13],
                        type: PatternType.BOTH_WAYS
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
                        symbolCount: [14],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 15
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 102,
                        symbolCount: [15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49],
                        type: PatternType.BOTH_WAYS
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
                        symbolCount: [5],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 0.4
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 101,
                        symbolCount: [6],
                        type: PatternType.BOTH_WAYS
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
                        symbolId: 101,
                        symbolCount: [7],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 0.75
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 101,
                        symbolCount: [8],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 1
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 101,
                        symbolCount: [9],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 1.25
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 101,
                        symbolCount: [10],
                        type: PatternType.BOTH_WAYS
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
                        symbolCount: [11],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 3
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 101,
                        symbolCount: [12],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 5
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 101,
                        symbolCount: [13],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 10
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 101,
                        symbolCount: [14],
                        type: PatternType.BOTH_WAYS
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
                        symbolId: 101,
                        symbolCount: [15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 40
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 201,
                        symbolCount: [5],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 1
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 201,
                        symbolCount: [6],
                        type: PatternType.BOTH_WAYS
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
                        symbolId: 201,
                        symbolCount: [7],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 1.75
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 201,
                        symbolCount: [8],
                        type: PatternType.BOTH_WAYS
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
                        symbolId: 201,
                        symbolCount: [9],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 2.5
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 201,
                        symbolCount: [10],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 5
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 201,
                        symbolCount: [11],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 7.5
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 201,
                        symbolCount: [12],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 15
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 201,
                        symbolCount: [13],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 35
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 201,
                        symbolCount: [14],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 70
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 201,
                        symbolCount: [15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49],
                        type: PatternType.BOTH_WAYS
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
                        symbolCount: [5],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 0.75
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 202,
                        symbolCount: [6],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 1
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 202,
                        symbolCount: [7],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 1.25
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 202,
                        symbolCount: [8],
                        type: PatternType.BOTH_WAYS
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
                        symbolId: 202,
                        symbolCount: [9],
                        type: PatternType.BOTH_WAYS
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
                        symbolId: 202,
                        symbolCount: [10],
                        type: PatternType.BOTH_WAYS
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
                        symbolId: 202,
                        symbolCount: [11],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 6
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 202,
                        symbolCount: [12],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 12.5
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 202,
                        symbolCount: [13],
                        type: PatternType.BOTH_WAYS
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
                        symbolId: 202,
                        symbolCount: [14],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 60
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 202,
                        symbolCount: [15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49],
                        type: PatternType.BOTH_WAYS
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
                        symbolId: 203,
                        symbolCount: [5],
                        type: PatternType.BOTH_WAYS
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
                        symbolId: 203,
                        symbolCount: [6],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 0.75
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 203,
                        symbolCount: [7],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 1
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 203,
                        symbolCount: [8],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 1.25
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 203,
                        symbolCount: [9],
                        type: PatternType.BOTH_WAYS
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
                        symbolId: 203,
                        symbolCount: [10],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 3
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 203,
                        symbolCount: [11],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 4.5
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 203,
                        symbolCount: [12],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 10
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 203,
                        symbolCount: [13],
                        type: PatternType.BOTH_WAYS
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
                        symbolId: 203,
                        symbolCount: [14],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 40
                        }
                    }
                },
                {
                    id: 0,
                    pattern: {
                        symbolId: 203,
                        symbolCount: [15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49],
                        type: PatternType.BOTH_WAYS
                    },
                    reward: {
                        line: {
                            multiplier: 60
                        }
                    }
                }
            ]
        };

        wallet.balance = data.Player.Balance;

        const slotMachine: SlotMachine = new SlotMachine(description, {
            gameSpeedLevels: 2
        });

        let roundResult: RoundResult;
        if(data.Current?.Round){
            slotMachine.currentBetValue =  this.getLineBetAmount(data.Current.Round.LineBet, data.GameInfo.LineBet) * Wallet.denomination;
        }
        else{
            data.Current = {
                TotalWin: 0,
                AccWin: 0,
                MultiplierMap: {},
                Result: {
                  R: "102,102,201,103,202,102,104|101,103,101,102,201,101,101|104,201,104,201,201,202,202|202,203,203,104,201,101,101|104,203,203,102,102,202,102|203,101,201,201,102,101,101|101,101,103,103,103,203,203",
                  clusterDetails: []
                },
                Round: {
                  RoundType: 1,
                  Bet: 4,
                  BetValue: 1,
                  Line: 20,
                  LineBet: 0.2,
                  Payout: 0
                },
                Type:1,
                FreeSpin: null,
                Bonus: null,
            }
        }

        roundResult = this.parseTransactDataToRoundResult(data);
        slotMachine.roundResult = roundResult;
        slotMachine.initialLineBet = roundResult.lineBetValue;
        slotMachine.previousRoundResult = slotMachine.getDummyRoundResult(roundResult);

        if(data.Next.Bonus) {
            slotMachine.currentSpinResult.bonus = {
                bonusGameid: data.Next.Bonus.id,
                lineBet: data.Next.Bonus.lineBet,
                expiredInMS: Math.max(new Date(data.Next.Bonus.expiredAt).getTime() - new Date().getTime(), 0),
                totalCount: data.Next.Bonus.spinCount,
                remainingCount: data.Next.Bonus.spinLeft,
                winAmount: data.Next.Bonus.totalWin,
                roundComplete: false
            }
        }

        this.featureBuy = {
            RoundType: data.GameInfo.BuyFeature ? data.GameInfo.BuyFeature[0].roundType: 1,
            Total: data.GameInfo.BuyFeature ? data.GameInfo.BuyFeature[0].Total: 15,
            Rate: data.GameInfo.BuyFeature ? data.GameInfo.BuyFeature[0].Rate: 100
        };
        slotMachine.currentGameSpeedLevel = !this._settings.quickSpin ? 0 : 1;
        return [wallet, slotMachine];
    }
    public async getHistoryResponse(page: number,perPage:number): Promise<any> {
        const historyResponse = await this.getMyBets(page,perPage);
        const history: History = container.resolve(History);
        history.currentPage = historyResponse.page;
        history.totalPages = historyResponse.totalPages
        history.entries=[];
        historyResponse.bets.forEach((historyData) => {
            history.entries.push({
                datetime: historyData.createdAt,
                balance: historyData.player.Balance,
                win: historyData.roundType === 2 ? Number(historyData.winningAmount) + Number(historyData.freeSpinWinningAmount) : historyData.winningAmount,
                totalBet: historyData.betAmount,
                betId: historyData.id
            });
        })
        return historyResponse;
    
    }
    public async getMyBets(page?: number,perPage?:number): Promise<any> {
         const res: AxiosResponse = await this.hx.get('my-bets', {
             params: {
                 page: page ? page : 1,
                 perPage:perPage
             }
         });
         return res.data.data;
     }

    getLineBetAmount(lineBet: number, linebetArray: number[]){
        if(linebetArray.includes(lineBet))
            return lineBet;
        else
            return linebetArray[0]
    }

    public get doubleUpChance(): boolean{
        return this._doubleChanceEnabled;
    }

    public set doubleUpChance(isActive: boolean){
        if(this._doubleChanceEnabled == isActive)
            return;

        this._doubleChanceEnabled = isActive;
        this.emit(GameServiceEvent.DOUBLE_CHANCE_CHANGED);
    }

    public async spin(): Promise<RoundResult> {
        const sm: SlotMachine = container.resolve(SlotMachine);
        const wallet: Wallet = container.resolve(Wallet);

        const totalBet: number = (sm.totalBet  * wallet.coinValue);
        const singleBet: number = totalBet/sm.combinations;
        return this.getFullRoundResultFromTransact(1, singleBet);
    }

    public async buyFeature(): Promise<RoundResult> {
        const sm: SlotMachine = container.resolve(SlotMachine);
        const wallet: Wallet = container.resolve(Wallet);

        const totalBet: number = (sm.totalBet  * wallet.coinValue);
        const singleBet: number = totalBet/sm.combinations;
        return this.getFullRoundResultFromTransact(2, singleBet);
    }

    public async login(): Promise<LoginResponse> {
        Logger.debug('GameService.login');

        const res: AxiosResponse = await this.ax.post('preload', {
            GameCode: this.gameCode
        });

        return res.data.data;
    }

    public async keepAlive(): Promise<void> {
        Logger.debug('GameService.keepAlive');

        const res: AxiosResponse = await this.ax.post('keep-alive', {
            GameCode: this.gameCode
        })
        this.jwtToken = res.data.data.Jwt;
        this.ax.defaults.headers.Authorisation = `Bearer ${this.jwtToken}`;
    }

    //Round type: 1 - base game, 2 - feature buy
    public async transact(lineBet: number, numLines: number, type: number, roundType: number = 1, bonusId: string = null): Promise<TransactResponse> {
        const res: AxiosResponse = await this.ax.post('transact', {
            bonusId: bonusId,
            Type: type ?? 1,
            BetValue: 1,
            Line:numLines,
            LineBet: lineBet,
            RoundType:this.doubleUpChance?3:roundType,
        });
        Logger.debug(res.data.data)
        return res.data.data;
    }

    public lobby():void{
        Logger.debug('GameService.lobby');
        if(typeof this.lobbyUrl!='undefined' && this.lobbyUrl)
            window.open(this.lobbyUrl, '_self');
        else
            history.back();
    }

    public get featureBuyConfig(){
        return this.featureBuy;
    }

    public saveSettings(){
        saveToLocalStorage('settings', this._settings);
        this.emit(GameServiceEvent.SETTINGS_CHANGED, this);
    }

    public get settings(){
        return this._settings;
    }

    // PRIVATE API
    private async checkAndUpdateToken(): Promise<void> {
        const expirationTimestamp: number = jwtDecode(this.jwtToken)['exp'] * 1000;
        const timeLeftSeconds: number = (expirationTimestamp - Date.now()) / 1000;

        if (timeLeftSeconds < this.tokenRefreshThreshold) {
            await this.keepAlive();
        }
    }

    protected async getFullRoundResultFromTransact(roundType: number = 1, bet: number): Promise<RoundResult>{
        const sm: SlotMachine = container.resolve(SlotMachine);
        const wallet: Wallet = container.resolve(Wallet);
        let data: TransactResponse = null;
        const lastRound: SpinResult = sm.previousRoundResult.spins[sm.previousRoundResult.spins.length - 1];
        const totalBet: number = (sm.totalBet  * wallet.coinValue);
        const singleBet: number = totalBet/sm.combinations;

        try {
            data = await this.transact(bet, sm.combinations,sm.previousRoundResult.nextType, roundType, lastRound.bonus?.bonusGameid ?? null);
            sm.isTransact = true;
        } catch(e) {
            Logger.error(e);
            this.emit(GameServiceEvent.ERROR);
            throw(e);
        }

        let roundResult: RoundResult = this.parseTransactDataToRoundResult(data);
        const previousSpins: SpinResult[] = roundResult.spins;

        //get cascade spins till its finished
        while(roundResult.nextType && (roundResult.nextType === TransactionType.RESPIN || roundResult.nextType === TransactionType.RESPIN_IN_FREESPIN)){
            try {
                data = await this.transact(singleBet/ Wallet.denomination, sm.combinations, roundResult.nextType, 1, lastRound.bonus?.bonusGameid ?? null);
                sm.isTransact = true;
            }
            catch(e){
                Logger.error(e);
                this.emit(GameServiceEvent.ERROR);
                throw(e);
            }

            const newResult: RoundResult = this.parseTransactDataToRoundResult(data);

            newResult.spins.forEach((spinResult)=>{
                previousSpins.push(spinResult);
            });

            roundResult = newResult;
            roundResult.spins = previousSpins;
        }

        return roundResult;
    }

    private parseTransactDataToRoundResult(data:TransactResponse | LoginResponse, fullParse: boolean = true):RoundResult{
        const reelsOutput: number[][] = this.parseReelsOutput(data.Current.Result.R)
        const roundResult: RoundResult = {
            complete: false,
            id: uuidv4(),
            lineBetValue: data.Current.Round.LineBet * Wallet.denomination,
            betLines: data.Current.Round.Line,
            totalBet: data.Current.Round.Bet,
            totalWinValue: data.Current.Round.Payout,
            roundType: data.Current.Round.RoundType,
            type:data.Current.Type,
            spinIndex: 0,
            details:data.Details ? {
                betId:data.Details.betId,
                gameId:data.Details.gameId,
                userId:data.Details.userId
            }: null,
            nextType: data.Next.Type,
            spins: [
                {
                    result: reelsOutput,
                    multipliers: this.parseMultipliersOutput(data.Current.MultiplierMap, reelsOutput.length),
                    winValue: data.Current.TotalWin,
                    currentTotalWinValue: data.Current.AccWin,
                    win: ((data.Current.Result.clusterDetails && data.Current.Result.clusterDetails.length > 0) || data.Current.Result.scatter) ? {
                        multiWinShown: data.Current.Result?.scatter ? true : false,
                        scatterWinShown: data.Current.Result?.scatter ? false : true,
                        winningPattern: data.Current.Result?.scatter ? this.parseScatterWins(data.Current.Result.scatter, reelsOutput.length) : this.parseWaysWins(data.Current.Result.clusterDetails, reelsOutput.length)
                    }:null,
                    freespins: (data.Next.FreeSpin || data.Current.FreeSpin) ? {
                        freespinId: data.Current.FreeSpin ? data.Current.FreeSpin.Current : 0,
                        moreAwarded: data.Next.FreeSpin?.MoreAwarded ? data.Next.FreeSpin.MoreAwarded : null,
                        totalCount: data.Next.FreeSpin ? data.Next.FreeSpin.Total : data.Current.FreeSpin.Total,
                        remainingCount: data.Next.FreeSpin? data.Next.FreeSpin.Total - (data.Next.FreeSpin.Next-1):data.Current.FreeSpin? data.Current.FreeSpin.Total - data.Current.FreeSpin.Current: 0,// (data.Current.FreeSpin ? data.Current.FreeSpin.Total - (data.Current.FreeSpin.Current+1) :(data.Next.FreeSpin?data.Next.FreeSpin.Total:0)),
                        roundStarted: (data.Current.FreeSpin && data.Current.FreeSpin.Current>0),
                        roundComplete: false,
                    }:null,
                    bonus: (data.Current.Bonus || data.Next.Bonus) ? {
                        bonusGameid: data.Current.Bonus?.id ?? data.Next.Bonus.id,
                        lineBet: data.Current.Bonus?.lineBet ?? data.Next.Bonus.lineBet,
                        expiredInMS: Math.max(new Date(data.Current.Bonus?.expiredAt ?? data.Next.Bonus.expiredAt).getTime() - new Date().getTime(), 0),
                        totalCount: data.Current.Bonus?.spinCount ?? data.Next.Bonus.spinCount,
                        remainingCount: data.Current.Bonus?.spinLeft ?? data.Next.Bonus.spinLeft,
                        winAmount: data.Current.Bonus?.totalWin ?? data.Next.Bonus.totalWin,
                        roundComplete: false
                    } : null,
                    nextBonus: (data.Next.Bonus && data.Current.Bonus?.spinLeft === 0) ? {
                        bonusGameid: data.Next.Bonus.id,
                        lineBet: data.Next.Bonus.lineBet,
                        expiredInMS: Math.max(new Date(data.Next.Bonus.expiredAt).getTime() - new Date().getTime(), 0),
                        totalCount: data.Next.Bonus.spinCount,
                        remainingCount: data.Next.Bonus.spinLeft,
                        winAmount: data.Next.Bonus.totalWin,
                        roundComplete: false
                    } : null
                }
            ]
        };
        return roundResult;
    }

    private parseWaysWins(clusterDetails: {
        symbol: number | string,
        positions: string[],
        payout: number,
        multiplier?: number | string,
        multiplierPositions?: string[],
    }[], reelsLength: number): Map<number, clusterData[]>{

        const winningSymbols: Map<number, clusterData[]> = new Map<number, clusterData[]>();

        clusterDetails.forEach((cluster) => {
            let symbolCount: number = 0;
            let pattern: number[][] = Array.from({ length: reelsLength }, () => Array(reelsLength).fill(0));
            let payout: number = 0;
            let multiplier: number = 0;
            let multipliersPosition: number[][] = Array.from({ length: reelsLength }, () => Array(reelsLength).fill(0));
            
            cluster.positions.forEach((pos) => {
                const [row, col] = pos.split(',').map(Number);
                pattern[row][col] = 1;
                symbolCount++;
            })
            payout = cluster.payout;
            multiplier = Number(cluster.multiplier);

            // If the symbol already exists, push to the existing array
            const symbolKey = Number(cluster.symbol);
            if (winningSymbols.has(symbolKey)) {
                winningSymbols.get(symbolKey)?.push({
                    symbolCount: symbolCount,
                    pattern: pattern,
                    payout: payout,
                    multiplier: multiplier,
                    multipliersPosition: multipliersPosition
                });
            } else {
                winningSymbols.set(symbolKey, [{
                    symbolCount: symbolCount,
                    pattern: pattern,
                    payout: payout,
                    multiplier: multiplier,
                    multipliersPosition: multipliersPosition
                }]);
            }
        })

        return winningSymbols;
    }

    private parseReelsOutput(data: string): number[][] {
        return data.split('|')
            .map((value: string): number[] => {
                return value.split(',')
                    .map((value: string): number => {
                        return parseInt(value);
                    })
            });
    }

    private parseMultipliersOutput(data: { [key: string]: number }, reelsLength: number): number[][] {
        const multipliers: number[][] = Array.from({ length: reelsLength }, () => Array(reelsLength).fill(0));
    
        if (data) {
            for (const key in data) {
                if (data.hasOwnProperty(key)) { 
                    const [row, col] = key.split(',').map(Number);
                    multipliers[row][col] = Number(data[key]);
                }
            }
        }
    
        return multipliers;
    }

    private parseScatterWins(scatterDetails: {
        symbol: number,
        payout: number,
        positions: string[]
    }, reelsLength: number): Map<number, clusterData[]>{

        const winningSymbols: Map<number, clusterData[]> = new Map<number, clusterData[]>();
        const scatterPattern: number[][] = Array.from({ length: reelsLength }, () => Array(reelsLength).fill(0));
        let symbolCount: number = 0;

        scatterDetails.positions.forEach((pos) => {
            const [row, col] = pos.split(',').map(Number);
            scatterPattern[row][col] = 1;
            symbolCount++;
        })

        winningSymbols.set(scatterDetails.symbol, [{
            symbolCount: symbolCount,
            pattern: scatterPattern,
            payout: scatterDetails.payout
        }])
        
        return winningSymbols;
    }
}