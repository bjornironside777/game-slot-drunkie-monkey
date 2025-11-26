import { Container, Graphics, Sprite, Text } from 'pixi.js';
import LayoutBuilder from '../../../core/utils/LayoutBuilder';
import AssetsManager from '../../../core/assets/AssetsManager';
import SymbolView from '../../../slots/view/SymbolView';
import { SymbolData } from '../../../slots/view/SymbolData';
import { autoscaleText } from '../../../core/utils/Utils';
import { SymbolsList } from '../../../../drunkie-monkey/view/SymbolsList';

export class CascadeHistoryCell extends Container {
    private background: Graphics;
    private tfCount: Text;
    private tfWin: Text;
    private tfMultiplier: Text;

    private symbolSlot: Container;
    private winTfSlot: Container;
    private multiplierTfslot: Container;

    constructor(layout, config: {
        symbolId: number,
        symbolCount: number,
        payout: string,
        multiplier: number
    }) {
        super();

        LayoutBuilder.create(AssetsManager.layouts.get(layout), this);

        this.tfCount.text = config.symbolCount;

        this.tfWin = this.winTfSlot['tfWin'];
        this.tfMultiplier = this.multiplierTfslot['tfMultiplier'];
        this.tfWin.text = config.payout;
        config.multiplier >= 2 ? this.tfMultiplier.text = `X${config.multiplier}` : this.tfMultiplier.text = ''
        this.createSymbolInSlot(config.symbolId);
        this.scaleWinText();
        this.scaleMultiplierText();
    }

    private createSymbolInSlot(symbolId: number): void {
        const symbolArea = this.symbolSlot['area'];
        symbolArea.visible = false;

        const symbol: Sprite = new Sprite(SymbolsList.find((symbol)=>symbol.id == symbolId).staticIcon.texture);
        symbol.anchor.set(0.5);
        symbol.width = symbolArea.width;
        symbol.height = symbolArea.height;
        symbol.scale.set(0.25);     // workaround to handle whitespace issue in the symbol's static icon texture (remove this when spine spine is fixed)

        this.symbolSlot.addChild(symbol);
    }


    private scaleWinText() {
        const area = this.winTfSlot['area'];
        area['visible'] = false;
        const width = area['width'];
        const height = area['height'];
        autoscaleText(this.tfWin, 20, width, height);
    }
    private scaleMultiplierText() {
        const area = this.multiplierTfslot['area'];
        area['visible'] = false;
        const width = area['width'];
        const height = area['height'];
        autoscaleText(this.tfMultiplier, 20, width, height);
    }
}
