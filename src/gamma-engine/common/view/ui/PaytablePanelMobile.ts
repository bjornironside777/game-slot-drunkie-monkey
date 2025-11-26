import {Container, Text} from 'pixi.js';
import AssetsManager from '../../../core/assets/AssetsManager';
import SlotMachine from '../../../slots/model/SlotMachine';
import { container } from 'tsyringe';
import PaytableSymbolCell from './PaytableSymbolCell';
import { SymbolData } from '../../../slots/view/SymbolData';
import Panel from './Panel';
import { UpdateLayoutDescription } from '../../../core/view/UpdateLayoutDescription';
import PaytableContent from "./PaytableContent";
import Button from "../../../core/view/ui/Button";
import MetricsView from "./MetricsView";
import SwitchView from "./SwitchView";

export default class PaytablePanelMobile extends Panel {
    private config: PaytablePanelConfig;

    private symbolCells: PaytableSymbolCell[] = [];
    private pages: Container[] = [];

    // VISUALS
    public scrollBox: PaytableContent;
    public content: Container;
    public symbolsContainer: Container;
    private tfMinBet: Text;
    private tfMaxBet: Text;

    constructor(configuration: PaytablePanelConfig) {
        super(AssetsManager.layouts.get('PaytablePanelMobile'));
        this.btnClose.scale.set(1.4);
        // LayoutBuilder.create(this.layout, this, (le)=>{
        //     return this.customClassElementCreate(le);
        // });
        this.config = configuration;

        this.content = this.scrollBox['content'];

        const numOfPages = 6
        for (let i: number = 1; i < numOfPages+1; i++) {
            let p: Container = this.content['page_' + i];
            this.removeChild(p);
            this.pages.push(p);
        }
        this.symbolsContainer = this.pages[0]['item_1'] as Container;

        this.tfMinBet = this.pages[3]['tfMinBet'];
        this.tfMaxBet = this.pages[3]['tfMaxBet'];
        this.tfMinBet.text = this.tfMinBet.text + this.config.minBet;
        this.tfMaxBet.text = this.tfMaxBet.text + this.config.maxBet;

        this.createSymbols();

        this.scrollBox['area'].visible = this.symbolsContainer['area'].visible = false;

        this.config.symbolsWithDescription.forEach((desc) => {
            this.createSymbolInProperItem(desc.itemId, this.config.symbolsList.find((symbol) => symbol.id === desc.symbolId));
        });

     this.combineTextSprite()
    }

    // PUBLIC API
    public updateLayout(desc: UpdateLayoutDescription) {
        super.updateLayout(desc);

        // const arr = this.pages.flatMap(page => page.children);
        // reposition paytable cells
        const xOffset = 100
        this.updateItemsGrid(this.symbolCells, desc.currentWidth - xOffset - (desc.currentWidth - desc.baseWidth), 21, 150);
        //
        // this.symbolsContainer.x = this.symbolsContainer.pivot.x = (desc.currentWidth - xOffset) / 2;


        const spacing: number = 40;
        this.pages.forEach((page)=>{
            for (let i = 0; i < page.children.length; i++) {
                if(i==0)
                    page.children[i].position.y = 100;
                else {
                    if((page.children[i] as Text).text !== '') // do not add spacing if the Text is empty
                        page.children[i].position.y = page.children[i - 1].position.y + (page.children[i - 1] as Container).height + spacing;
                    else {
                        page.children[i].position.y = page.children[i - 1].position.y + (page.children[i - 1] as Container).height
                    }
                }
            }
        })

        this.updateItemsVertically(this.pages, 100);

        this.symbolsContainer.pivot.x = this.symbolsContainer.width/2 + xOffset/2
        this.symbolsContainer.x = 500
        this.y = 0;

        this.content['spacerBottom'].y = this.pages[this.pages.length-1].y +this.pages[this.pages.length-1].height+100;
        const offsetXToMaskBorders: number = 10
        
        // this.background.width = desc.currentWidth + offsetXToMaskBorders;
        // this.background.pivot.x = this.background.width/2

    }

    // PRIVATE API
    public customClassElementCreate(le){
        let instance: unknown = null ;

        switch (le.customClass) {
            case 'PaytableContent':
                instance = new PaytableContent(le);
                break;
            case 'Button':
                instance = new Button(le);
                break;
            case 'MetricsView':
                instance = new MetricsView(le);
                break;
            case 'SwitchView':
                instance= new SwitchView(le);
                break
        }

        return instance;
    }
    private combineTextSprite():void{
        const maxTfInPayTable:number = 8

        this.pages.forEach((p) =>{
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
                    if(p[`textCombined${i}`][`tfUnder`]){
                        this.textAlign( p[`textCombined${i}`][`tfUnder`] as Text, 'center')
                        p[`textCombined${i}`][`tfUnder`].y = p[`textCombined${i}`]['content'].y +
                            p[`textCombined${i}`]['content'].height

                    }
                   if(p[`textCombined${i}`][`tfAbove`]){
                       this.textAlign( p[`textCombined${i}`][`tfAbove`] as Text, 'center')
                        p[`textCombined${i}`][`tfAbove`].y = p[`textCombined${i}`]['content'].y -
                            p[`textCombined${i}`][`tfAbove`].height
                       p[`textCombined${i}`].pivot.y = p[`textCombined${i}`][`tfAbove`].y
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

            const symbolCell: PaytableSymbolCell = new PaytableSymbolCell(AssetsManager.layouts.get('PaytableSymbolCellMobile'),symbolsSorted[i],{
                setMultipliers: true,
                maxFontSize: 20,
                maxHeight: 60,
                maxWidth: 120
            });
            this.symbolCells.push(symbolCell);
            this.symbolsContainer.addChild(symbolCell);
        }
    }

    private createSymbolInProperItem(itemId: number, symbolData: SymbolData) {
        if (!symbolData)
            return;
        const parent: Container = this.pages[0][`item_${itemId}`];
        const symbolIcon: PaytableSymbolCell = new PaytableSymbolCell(AssetsManager.layouts.get('PaytableSymbolCellMobile'),symbolData, {
            setMultipliers: false,
            maxFontSize: 20,
            maxHeight: 60,
            maxWidth: 120
        });

        if (parent['area']) {
            parent['area'].visible = false;
        }
        parent['iconSlot'].addChild(symbolIcon);
    }
}

export type PaytablePanelConfig = {
    symbolsList: SymbolData[],
    excludedSymbols: number[],
    symbolsWithDescription: SymbolDescription[],
    minBet: string,
    maxBet: string
}

export type SymbolDescription = {
    itemId: number, //In which content id it has to appear
    symbolId: number
}
