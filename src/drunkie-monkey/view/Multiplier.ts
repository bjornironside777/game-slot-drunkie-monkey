import { Container, DisplayObject, Point, Text, TextStyle } from "pixi.js";
import SymbolView from "../../gamma-engine/slots/view/SymbolView";
import ReelsView from "../../gamma-engine/slots/view/ReelsView";
import SlotMachine from "../../gamma-engine/slots/model/SlotMachine";
import { container } from "tsyringe";
import { MultiplierEvent } from "../model/MultiplierEvent";
import AssetsManager from "../../gamma-engine/core/assets/AssetsManager";
import { autoscaleText } from "../../gamma-engine/core/utils/Utils";
import MultiplierFrame from "../../gamma-engine/common/view/MultiplierFrame";
import { Tweener } from "../../gamma-engine/core/tweener/engineTween";

export default class Multiplier extends Container {
    public symbolArr: SymbolView[]

    private style: TextStyle;
    private reels: ReelsView

    private currentMultipliers: Text[] = [];

    private multiplierFrame: MultiplierFrame;

    private _currentWinValue: number = 0;


    constructor(reels: ReelsView, multiplierFrame: MultiplierFrame) {
        super();
        this.reels = reels
        this.multiplierFrame = multiplierFrame;
        this.style = new TextStyle({
            fontFamily: AssetsManager.webFonts.get('InterRegular').family,
            fill: [
                '#FFB200',
                '#FFFF00'
            ],
            fontSize: 40,
            lineJoin: 'round',
            stroke: '#FFD911',
            strokeThickness: 4,
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowAlpha: 40,
            dropShadowAngle: 0.2,
            dropShadowDistance: 8
        })
    }

    public get currentWinValue(): number {
        return this._currentWinValue;
    }

    public set currentWinValue(value: number) {
        this._currentWinValue = value;
    }

    public initializeMultiplierSymbols(output:number[][], clearMultipliersOnStart:boolean = false):void{
        const sm:SlotMachine = container.resolve(SlotMachine)

        if (clearMultipliersOnStart)
            this.currentMultipliers.splice(0, this.currentMultipliers.length);
        for (let i = 0; i < output.length; i++) {
            for (let j = 0; j < output[i].length; j++) {
                const symbolMultiplierDescription = sm.description.wildcards.find((multiplierSymbolDesc) => {
                    return multiplierSymbolDesc.symbolId === output[i][j];
                });
                if (!symbolMultiplierDescription)
                    continue;
                const multiplierSymbolView = this.reels.getReelViews()[i].getVisibleSymbols()[j];
                //if symbol has multiplier than skip it
                if (multiplierSymbolView.children.find((object) => object.name == 'multiplier'))
                    continue;
                 if (multiplierSymbolView.children.find((object) => object.name == 'multipliern')){
                    multiplierSymbolView.removeChild(multiplierSymbolView.getChildByName('multipliern'))
                }
                const multiplier = this.createMultiplier(symbolMultiplierDescription.multiplier);
                multiplierSymbolView.addChild(multiplier);
                this.currentMultipliers.push(multiplier);
            }
        }
        //If there is no multipliers just send event
        if (this.currentMultipliers.length <= 0) {
            this.emit(MultiplierEvent.ON_INITIALIZED_MULTIPLIER_SYMBOLS);
            return;
        }
        //If there are multipliers then show them with animation
        const promises = [];
        // for (let i = 0; i < this.currentMultipliers.length; i++) {
        //     promises.push(this.animateInitializeMultiplier(this.currentMultipliers[i], 0.6));
        // }
        //Promise.all(promises).then(() => {
            this.emit(MultiplierEvent.ON_INITIALIZED_MULTIPLIER_SYMBOLS);
        //});
    }

    public animateMultipliers(destination: Point): Promise<void> {
        if (this.currentMultipliers.length <= 0) {
            this.emit(MultiplierEvent.ON_ALL_MULTIPLIER_ANIMATION_END);
            return;
        }

        // if(this.multiplierFrame.value>1){
        //     const totalMultiplier:Text = this.createMultiplier(this.multiplierFrame.value);
        //     this.multiplierFrame.addChild(totalMultiplier);
        //     totalMultiplier.position = this.multiplierFrame['totalMultiplierValue'].position;
        //     this.currentMultipliers.unshift(totalMultiplier);
        //
        //
        //     this.animateInitializeMultiplier(totalMultiplier,0.6);
        // }

        const moveAnimations: Promise<void>[] = [];
        this.currentMultipliers.forEach((multiplier: Text, index: number) => {
            moveAnimations.push(this.moveMultipler(multiplier, destination, 0.4 * index, MultiplierEvent.ON_MULTIPLIER_ANIMATION_END));
        });

        Promise.all(moveAnimations).then(() => {
            this.emit(MultiplierEvent.ON_ALL_MULTIPLIER_ANIMATION_END);
        });
    }

    public getMultipliersLength(): number {
        return this.currentMultipliers.length;
    }

    public animateTotalWinMultiplier(destination: Point, position: Point, totalMultiplierValue: number): void {
        if (totalMultiplierValue <= 0 || this.currentMultipliers.length == 0) {
            this.emit(MultiplierEvent.ON_TOTAL_MULTIPLIER_ANIMATION_END);
            return;
        }

        const totalMultiplier: Text = this.createMultiplier(totalMultiplierValue);
        totalMultiplier.position = position;
        this.animateInitializeMultiplier(totalMultiplier, 0.6);
        this.moveMultipler(totalMultiplier, destination, 0, MultiplierEvent.ON_TOTAL_MULTIPLIER_ANIMATION_END);
    }

    public async moveMultipler(multiplier: Text, point: Point, delay: number = 0, eventName: MultiplierEvent): Promise<void> {
        await new Promise<void>((resolve) => {

            const multiplierOldPos: Point = multiplier.getGlobalPosition();
            multiplier.setParent(this);
            multiplier.position = this.toLocal(multiplierOldPos);

            const time: number = 0.85;

            Tweener.addTween(multiplier, {
                x: this.toLocal(point).x,
                time: time,
                delay: delay,
                transition: 'linear'
            })

            Tweener.addTween(multiplier, {
                y: this.toLocal(point).y,
                time: time,
                delay: delay,
                transition: 'easeOutSine',
                onComplete: () => {
                    this.emit(eventName, (multiplier as Text).text.slice(0, (multiplier as Text).text.length - 1));
                    multiplier.destroy();
                    resolve();
                }
            })
        });
    }

    private async animateInitializeMultiplier(multiplier: DisplayObject, time: number, delay: number = 0): Promise<void> {
        await new Promise<void>((resolve) => {
            Tweener.addTween(multiplier.scale, {
                time: time,
                x: 1.4,
                y: 1.4,
                transition: 'easeOutBack',
                delay: delay,
                onComplete: () => {
                    Tweener.addTween(multiplier.scale, {
                        time: time,
                        x: 1,
                        y: 1,
                        transition: 'easeOutBack',
                        delay: delay,
                        onComplete: () => {
                            resolve();
                        }
                    })
                }
            })
        });
    }

    private createMultiplier(value: number): Text {
        const multiplier: Text = new Text(`${value}x`, this.style);
        multiplier.name = 'multiplier';
        autoscaleText(multiplier, 40, 150, 65);
        multiplier.anchor.set(0.5, 0.5);
        multiplier.scale.set(1, 1);
        multiplier.y += 20;
        return multiplier;
    }
}