import { Container, Graphics, Text } from 'pixi.js';
import LayoutBuilder from '../../../core/utils/LayoutBuilder';
import AssetsManager from '../../../core/assets/AssetsManager';
import Wallet from '../../../slots/model/Wallet';
import { container } from 'tsyringe';
import { HistoryEntry } from '../../model/HistoryEntry';

export class HistoryCell extends Container {

    public area: Graphics;

    public tfDate: Text;
    public tfTotalBet: Text;
    public tfWin: Text;
    public tfBalance: Text;

    constructor(id: number, panelLayout) {
        super();

        LayoutBuilder.create(panelLayout == 'HistoryPanel'? AssetsManager.layouts.get('HistoryCell'): AssetsManager.layouts.get('HistoryCellDesktop'), this);

        this.area.alpha = 0;

        this.tfDate.style.align = 'center';
    }

    public set entry(value: HistoryEntry) {
        const wallet: Wallet = container.resolve(Wallet);

        const date = new Date(value.datetime);

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        const formattedDate: string = `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;

        this.tfDate.text = formattedDate;
        this.tfTotalBet.text = wallet.getCurrencyValue(value.totalBet);
        this.tfWin.text = wallet.getCurrencyValue(value.win);
        value.win > 0 ? this.tfWin.style.fill = '#36936F' : this.tfWin.style.fill = '#BD1717';  // different colors for loss and profit
        this.tfBalance.text = wallet.getCurrencyValue(value.balance);
    }

    public updateWidth(width: number, backgroundX: number): void {
        this.area.width = width;
        this.area.position.x = backgroundX;
    }

    public updateHeight(newHeight: number): void {
        this.area.height = newHeight;
        [this.tfBalance, this.tfDate, this.tfWin, this.tfTotalBet].forEach(value => {
            value.y = newHeight/2;
        });
    }
}
