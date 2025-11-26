import {Container, DisplayObject, Graphics} from 'pixi.js';
import LayoutElement from '../../../core/view/model/LayoutElement';
import LayoutBuilder from '../../../core/utils/LayoutBuilder';
import {CascadeHistoryCell} from './CascadeHistoryCell';
import SymbolView from '../../../slots/view/SymbolView';
import { SymbolData } from '../../../slots/view/SymbolData';
import { Tweener } from '../../../core/tweener/engineTween';


export class CascadeHistoryView extends Container{
    private background: Graphics;
    private content: Container;
    private contentMask: Graphics;

    private offset: number = 50;

    private maxElements: number = 4;

    private fallingTIme: number = 0.3;
    private layout:LayoutElement
    public cellCount:number = 0;
    constructor(le: LayoutElement) {
        super();
        this.layout = le
        LayoutBuilder.create(le, this);
        this.content.mask = this.contentMask;
    }

    public addCell(symbolId: number, count: number,win:string, multiplier: number){
        const cell: CascadeHistoryCell = new CascadeHistoryCell(
            this.layout.customClass === 'CascadeHistoryPanel'?'CascadeHistoryCell':'CascadeHistoryCellMobile',
            {symbolId: symbolId, symbolCount: count, payout:win, multiplier: multiplier});

        const previousCells: number = this.content.children.length;

        this.content.addChild(cell);
        cell.position.y = -this.background.height - this.offset;

        Tweener.addTween(cell,{
            alpha: 1,
            time: this.fallingTIme,
            transition: 'easeOutSine',
            onStart:()=>{
                cell.alpha = 0;
            },
            onComplete:()=>{
                if(this.content.children.length > this.maxElements){
                    this.cellCount = this.content.children.length - this.maxElements;
                    this.removeLastCell(()=>{this.moveLower()});
                    return;
                }

                this.moveLower();
            }
        });
    }

    public reset(): void{
        for (let i = 0; i < this.content.children.length; i++) {
            const cell = this.content.children[i];
            Tweener.removeTweens(cell);
            Tweener.addTween(cell,{
                y: cell.y +10,
                alpha:0,
                time: this.fallingTIme,
                transition:'easeOutQuint',
                onComplete: ()=>{
                    this.removeChild(cell);
                    cell.destroy({children: true});
                }
            });
        }
    }

    private removeLastCell(onComplete: ()=>void): void{
        const child: CascadeHistoryCell = this.content.children[0] as CascadeHistoryCell;
        Tweener.removeTweens(child);
        Tweener.addTween(child,{
            y: child.y +10,
            alpha:0,
            time: this.fallingTIme,
            transition:'easeOutQuint',
            onComplete: ()=>{
                for(let i=0; i<this.cellCount; i++){
                    this.content.removeChild(this.content.children[i]);
                    child.destroy({children: true});
                    //this.moveLower();
                    //this.cellCount -= 1;
                }
                if(onComplete)
                    onComplete();
            }
        });
    }

    private moveLower(): void{
        const offsetBetweenCascades: number = -10;
        this.content.children.forEach((child, index)=>{
            Tweener.removeTweens(child);
            Tweener.addTween(child,{
                y: -index * (child['background'].height + offsetBetweenCascades),
                alpha: 1,
                time: this.fallingTIme,
                transition:'easeOutSine'
            })
        });
    }
}
