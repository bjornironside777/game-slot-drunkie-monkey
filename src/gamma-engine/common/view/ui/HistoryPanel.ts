import { Container, Graphics, Text } from 'pixi.js';
import { HistoryCell } from './HistoryCell';
import Button from '../../../core/view/ui/Button';
import SoundManager from '../../../core/sound/SoundManager';
import { container } from 'tsyringe';
import Panel from './Panel';
import { HistoryEntry } from '../../model/HistoryEntry';
import History from '../../model/History';
import SoundList from '../../sound/SoundList';
import { UpdateLayoutDescription } from '../../../core/view/UpdateLayoutDescription';
import { ScreenOrientation } from '../../../core/view/ScreenOrientation';
import AssetsManager from '../../../core/assets/AssetsManager';
// import Translation from '../../../core/translations/Translation';
import GameService from '../../../../drunkie-monkey/services/GameService';
import { CircularProgressBar } from './CircularProgressBar';

export default class HistoryPanel extends Panel {
    private cells: HistoryCell[] = [];
    private _currentPage: number = 0;
    private cellsPerPage: number;
    private history: History;

    // VISUALS
    public btnPrevious: Button;
    public btnNext: Button;
    public tfPages: Text;
    public cellsContainer: Container;
    public tableHeader:Container;
    public tableHeaderBackground:Graphics
    public footer:Graphics;
    private gameService: GameService
    private loader: CircularProgressBar;

    constructor(layout) {
        super(AssetsManager.layouts.get(layout));
        this.cellsContainer['area'].visible = false;

        this.footer.alpha = 0
        this.btnPrevious.on('pointerup', this.onBtnPrevious, this);
        this.btnNext.on('pointerup', this.onBtnNext, this);
        this.gameService = container.resolve<GameService>('GameService');
        this.tableHeaderBackground = this.tableHeader['background'];
        // create cells
        for (let i = 0; i < 10; i++) {
            const cell: HistoryCell = new HistoryCell(i, layout);
            if(layout=='HistoryPanel')
                cell.scale.set(0.5)
            this.cellsContainer.addChild(cell);
            cell.position.set(0, cell.height * i);
            this.cells.push(cell);
        }
        this.tfPages.visible=false;
        let historyCellHeight: number = this.cells[0].height;
        this.cellsPerPage = Math.floor(this.cellsAreaHeight / historyCellHeight);
        this.history = container.resolve(History);

        // Test code only
        // for (let i = 0; i < 25; i++) {
        //     const demoItem: HistoryEntry = {
        //         datetime: Date.now(),
        //         totalBet: Math.floor(Math.random() * 1000),
        //         win: Math.floor(Math.random() * 1000),
        //         balance: Math.floor(Math.random() * 1000)
        //     };
        //     this.entries.push(demoItem);
        // }
        this.currentPage = 0;
        // this.on('added', this.onAdded, this);
    }
    private onAdded(){
        if(this.tableHeader['area'])    this.tableHeader['area'].alpha = 0;
        this.currentPage = 0;
    }

    // PUBLIC API
    public override updateLayout(desc: UpdateLayoutDescription) {
        super.updateLayout(desc);
        if(desc.orientation === ScreenOrientation.VERTICAL) this.cells.forEach(cell => cell.scale.set(0.5));
        else this.cells.forEach(cell => cell.scale.set(1));

       if(this.tableHeader['area'])    this.tableHeader['area'].alpha = 0;
        let historyCellHeight: number = this.cells[0].height;
        this.cellsPerPage = Math.floor(this.cellsAreaHeight / historyCellHeight);
        this.updateItemsVertically(this.cells, 0);

        if(desc.orientation === ScreenOrientation.VERTICAL) {
            this.scale.set(2);
            this.btnClose.scale.set(1.4);
            this.position.set(0, desc.baseHeight + (desc.currentHeight - desc.baseHeight) / 2);
            this.pivot.set(244, 1190);
        }else{
            this.scale.set(1)
            this.position.set(0,0);
            this.pivot.set(507.5, 386);
        }

    }
    public get cellsAreaHeight(): number {
        return this.footer.y - (this.tableHeader.y + this.tableHeader.height) ;
    }

    public get pagesTotal(): number {
        return this.history.totalPages
    }

    public get currentPage(): number {
        return this._currentPage;
    }



    public set currentPage(value: number) {
        this.cellsContainer.visible = false;
        this.loader.visible = true;
        this._currentPage = value;
        this.gameService.getHistoryResponse(value+1,this.cellsPerPage).then((res) => {
            this.cellsContainer.visible = true;
            this.loader.visible = false;
            this.tfPages.visible=true;
            this.updateButtons();
            const startPos: number = this._currentPage * this.cellsPerPage;
            const data: HistoryEntry[] = this.history.entries
            for (let i = 0; i < this.cells.length; i++) {
                const cell: HistoryCell = this.cells[i];
                // cell.updateHeight(Math.ceil(this.cellsAreaHeight / this.cellsPerPage));
                cell.visible = data[i] !== undefined;
                if (data[i]) {
                    cell.entry = data[i];
                }
            }
            this.updateItemsVertically(this.cells, 0);
            if (!this.history.entries.length) {
                this.btnNext.visible = false;
                this.btnPrevious.visible = false;
                this.tfPages.text = AssetsManager.translations.get('history.nohistoryentries');
            } else {
                this.btnNext.visible = true;
                this.btnPrevious.visible = true;
                this.tfPages.text = `${this.currentPage + 1} / ${this.pagesTotal}`;
            }
        })
    }

    // PRIVATE API
    protected updateLayoutElements(width: number, backgroundX: number) {
        super.updateLayoutElements(width, backgroundX);


    }

    // USER INTERACTION
    private onBtnNext(): void {
        SoundManager.play(SoundList.UI_BUTTON_CLICK);
        this.currentPage = this.currentPage < this.pagesTotal ? this.currentPage + 1 : this.currentPage
        this.updateButtons();
    }

    private onBtnPrevious(): void {
        SoundManager.play(SoundList.UI_BUTTON_CLICK);
        this.currentPage = this.currentPage <= 0 ? this.currentPage : this.currentPage - 1;
        this.updateButtons();
    }
    protected updateButtons() {
        if (this.currentPage <= 0) {
            this.btnPrevious.enabled = false
        } else {
            this.btnPrevious.enabled = true
        }

        if (this.currentPage >= this.pagesTotal - 1) {
            this.btnNext.enabled = false
        } else {
            this.btnNext.enabled = true
        }
    }
    protected onBtnClose(): void {
        super.onBtnClose();
        this.btnPrevious.off('pointerup', this.onBtnPrevious, this);
        this.btnNext.off('pointerup', this.onBtnNext, this);
        this.history.entries = [];
        this.history.currentPage = 0;
        this.history.totalPages = 0;
    }
}
