import { Container, Graphics, Text } from 'pixi.js';
import { CheckBox, Input } from '@pixi/ui';
import LayoutBuilder from '../../../core/utils/LayoutBuilder';
import AssetsManager from '../../../core/assets/AssetsManager';
import LayoutElement from '../../../core/view/model/LayoutElement';

export class CheckBoxOption extends Container {
    private layout: LayoutElement;
    // VISUALS
    public background: Graphics;
    public input: Input;
    public inputBackground: Graphics;
    public checkbox: CheckBox;
    public tfText: Text;

    constructor(label: string, activeInput: boolean = true, le: LayoutElement) {
        super();
        this.layout = le;
        LayoutBuilder.create(le, this, (le: LayoutElement) => {
            return this.customClassElementCreate(le);
        });

        this.tfText.text = label;

        if (!activeInput) {
            this.removeChild(this.input);
            this.input.destroy();
            this.input = null;

            this.removeChild(this.inputBackground);
            this.inputBackground.destroy();
            this.inputBackground = null;
        }

        if (this.input) {
            const allowedChars: string[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'];
            this.input.onChange.connect((e) => {
                if (
                    !allowedChars.includes(e[e.length - 1]) || //if the latest char is allowed
                    (e.slice(0, e.length - 1).includes('.') && e[e.length - 1] === '.') || //if the latest char isn't duplicated dot
                    (e[e.length - 1] === '.' && e.length <= 1)
                ) {
                    //if the first char isn't a dot
                    this.input.value = e.slice(0, e.length - 1);
                    this.input['stopEditing']();
                    this.input['_startEditing']();
                }
            });

            this.input.onEnter.connect(() => (this.input['placeholder'].visible = true));

            this.input.width -= 20;
        }
    }

    public hasValue(): boolean {
        if (!this.input) {
            return this.checkbox.checked;
        }

        return this.input.value !== '' && this.checkbox.checked;
    }

    public getValue(): number {
        if (this.hasValue()) return parseFloat(this.input.value);
        else return undefined;
    }

    // PRIVATE API
    private customClassElementCreate(le: LayoutElement): unknown {
        let instance: unknown = null;
        switch (le.customClass) {
            case 'CheckBox':
                instance = new CheckBox({
                    style: {
                        checked: 'Tikk box',
                        unchecked: 'untikkBox',
                    },
                });
                break;
            case 'Input':
                if (this.layout.customClass.includes('Desktop')) {
                    instance = new Input({
                        bg: this.inputBackground,
                        placeholder: '                                                                               ', //That looks weird, but the input invokes when user click on placeholder so value has to be "spaces" to detect click.                        padding: [1, 1, 1, 1],
                        padding: [0, 1, 1, 1],
                        textStyle: {
                            fill: '0xffffff',
                            fontFamily: AssetsManager.webFonts.get('InterRegular').family,
                            align: 'center',
                            fontSize: 15,
                        },
                    });
                } else {
                    instance = new Input({
                        bg: this.inputBackground,
                        placeholder: '                               ', //That looks weird, but the input invokes when user click on placeholder so value has to be "spaces" to detect click.
                        padding: [10, 1, 6, 1],
                        textStyle: {
                            fill: '0xffffff',
                            fontFamily: AssetsManager.webFonts.get('InterRegular').family,
                            align: 'center',
                            fontSize: 36,
                        },
                    });
                }

                break;
        }
        return instance;
    }
}
