import {Circle, Container, DisplayObject, loadJson, Text} from 'pixi.js';
import AssetsManager from '../../../core/assets/AssetsManager';
import LayoutElement from '../../../core/view/model/LayoutElement';
import Button from '../../../core/view/ui/Button';
import {PaytablePanelConfig} from "./PaytablePanelMobile";
import PaytableSymbolCell from "./PaytableSymbolCell";
import {SymbolData} from "../../../slots/view/SymbolData";
import SlotMachine from "../../../slots/model/SlotMachine";
import {container} from "tsyringe";
import Panel from "./Panel";
import {UpdateLayoutDescription} from "../../../core/view/UpdateLayoutDescription";
import SoundManager from '../../../core/sound/SoundManager';
import SoundList from '../../sound/SoundList';

export default class PaytablePanelDesktop extends Panel {
    private config: PaytablePanelConfig;
    private symbolCells: PaytableSymbolCell[] = [];

    private pages: Container[] = [];
    private currentPage: Container = null;
    private _currentPageIndex: number = -1;
    public symbolsContainer: Container;
    private tfMinBet: Text;
    private tfMaxBet: Text;

    // VISUALS
    private btnPreviousPage:Button
    private btnNextPage:Button
    private tfPageNumber:Text;
    constructor(configuration: PaytablePanelConfig) {
        super(AssetsManager.layouts.get('PaytablePanelDesktop'));

        const numOfPages = 6
        for (let i: number = 1; i < numOfPages+1; i++) {
            let p: Container = this["page_" + i];
            this.removeChild(p);
            this.pages.push(p);
        }
        this.currentPageIndex = 0;

        this.config = configuration;
        this.symbolsContainer = this.pages[0]['item_1'] as Container;

        this.tfMinBet = this.pages[3]['tfMinBet'];
        this.tfMaxBet = this.pages[3]['tfMaxBet'];
        this.tfMinBet.text = this.tfMinBet.text + this.config.minBet;
        this.tfMaxBet.text = this.tfMaxBet.text + this.config.maxBet;


        this.createSymbols();
        this.btnPreviousPage.on('pointerup', this.onButtonPrev, this);
        this.btnNextPage.on('pointerup', this.onButtonNext, this);
        this.config.symbolsWithDescription.forEach((desc) => {
            this.createSymbolInProperItem(desc.itemId, this.config.symbolsList.find((symbol) => symbol.id === desc.symbolId));
        });

        this.combineTextSprite()
    }

    // PRIVATE API
    public customClassElementCreate(le: LayoutElement): unknown {
        let instance: unknown = null;

        switch (le.customClass) {
            case 'Button':
                instance = new Button(le);
                const btn: Button = instance as Button;
                // const radius: number = btn.width / 2;
                // btn.hitArea = new Circle(radius, radius, radius);
                break;
        }
        return instance;
    }


    private combineTextSprite():void{
        const maxTfInPayTable:number = 8

        this.pages.forEach((p:Container):void =>{
            for (let i:number = 0; i < maxTfInPayTable ; i++) {
                const containerToFit: Container[] = []
                const spacingX: number = 10

                let sumWidth: number = 0;
                let startXPos: number;
                if(p[`tf${i}`]){
                    this.textAlign( p[`tf${i}`] as Text, 'center')
                }


                if( p[`textCombined${i}`]) {
                    p[`textCombined${i}`]['area'].alpha = 0
                    p[`textCombined${i}`]['content'].children.forEach((child): void => {
                        sumWidth += child.width
                        containerToFit.push(child)

                    })
                    // calculate the sum of all texts/icons and get the start pos
                    sumWidth = sumWidth + (p[`textCombined${i}`]['content'].children.length * spacingX)
                    startXPos = (p[`textCombined${i}`]['area'].width - sumWidth) / 2

                    for (let j: number = 0; j < containerToFit.length; j++) {
                        if (j == 0) {
                            containerToFit[j].x = startXPos
                        } else {
                            containerToFit[j].x = containerToFit[j - 1].x + containerToFit[j - 1].width + spacingX
                        }
                    }
                }
            }
        })

    }

    private createSymbols(): void {
        const sm: SlotMachine = container.resolve(SlotMachine);
        const symbolsCopy:SymbolData[] = [...this.config.symbolsList]
        const symbolsSorted: SymbolData[] = symbolsCopy.sort((a, b) => (
            (sm?.findRule(a.id, 30)?.reward?.line?.multiplier > sm?.findRule(b.id, 30)?.reward?.line?.multiplier) && a.id) ? -1 : 1
        );
        const excludedSymbols: number[] = this.config.excludedSymbols;
        for (let i = 0; i < this.config.symbolsList.length; i++) {
            // skip excluded symbols
            if (excludedSymbols.includes(symbolsSorted[i].id)) {
                continue;
            }

            const symbolCell: PaytableSymbolCell = new PaytableSymbolCell(AssetsManager.layouts.get('PaytableSymbolCellDesktop'),symbolsSorted[i],{
                setMultipliers: true,
                maxFontSize: 15,
                maxHeight: 60,
                maxWidth: 80
            });
            this.symbolCells.push(symbolCell);
            this.symbolsContainer.addChild(symbolCell);
        }
    }
    public updateLayout(desc: UpdateLayoutDescription) {
        super.updateLayout(desc);

        this.updateSymbolsView(this.symbolCells, this['page_1']['item_1']['area'].width, [7], 30)
    }

    private updateSymbolsView(symbols:DisplayObject[], maxWidth: number, elementsInRow:number[], spacing: number): void{
        let currentId: number = 0;
        elementsInRow.forEach((elInRow, index)=>{
            const offset: number = (maxWidth - ((symbols[currentId] as PaytableSymbolCell).width * elInRow + spacing * (elInRow-1)))/2;
            for (let i = 0; i < elInRow; i++) {
                symbols[currentId].x = offset + ((symbols[currentId] as PaytableSymbolCell).width + spacing) *i;
                symbols[currentId].y = (symbols[currentId]as PaytableSymbolCell).height *index;
                currentId++;
            }
        });
    }

    public get currentPageIndex(): number {
        return this._currentPageIndex;
    }

    public set currentPageIndex(value: number) {
        if (this._currentPageIndex == value) {
            return;
        }
        this._currentPageIndex = value;

        if (this.currentPage) {
            this.removeChild(this.currentPage);
        }
        this.currentPage = this.pages[this._currentPageIndex];
        this.addChild(this.currentPage);

    }
    private createSymbolInProperItem(itemId: number, symbolData: SymbolData) {
        if (!symbolData)
            return;

        const parent: Container = this.pages[0][`item_${itemId}`];
        const symbolIcon: PaytableSymbolCell = new PaytableSymbolCell(AssetsManager.layouts.get('PaytableSymbolCellDesktop'), symbolData, {
            setMultipliers: false,
            maxFontSize: 15,
            maxHeight: 60,
            maxWidth: 120
        });
        if (parent['area']) {
            parent['area'].visible = false;
        }

        parent['iconSlot'].addChild(symbolIcon);

    }

    // USER INTERACTION
    private onButtonPrev(): void {
        if (!this.currentPageIndex) {
            this.currentPageIndex = this.pages.length - 1;
        } else {
            this.currentPageIndex--;
        }
        this.onChangePageIndex()
        SoundManager.play(SoundList.UI_BUTTON_CLICK);
    }

    private onButtonNext(): void {
        this.currentPageIndex = (this.currentPageIndex + 1) % this.pages.length;
        this.onChangePageIndex()
        SoundManager.play(SoundList.UI_BUTTON_CLICK);
    }
    private onChangePageIndex():void{
        this.tfPageNumber.text = `${this.currentPageIndex+1} / 6`
    }
}
