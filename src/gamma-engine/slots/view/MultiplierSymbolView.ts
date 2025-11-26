import { Container, Sprite } from "pixi.js";
import AssetsManager from "../../core/assets/AssetsManager";
import { Tweener } from "../../core/tweener/engineTween";
import { MultiplierSymbolsList } from "../../../drunkie-monkey/view/SymbolsList";



export class MultiplierSymbolView extends Container {

    private id: number;
    private background: Sprite = new Sprite();
    private multiplier: Sprite = new Sprite();

    constructor(multiplierId: number) {
        super()

        this.id = multiplierId;
        this.addChild(this.background, this.multiplier);
        this.on('added', this.onAdded, this)
    }

    protected onAdded(): void {
        this.background.texture = AssetsManager.textures.get(MultiplierSymbolsList.find(symbol => symbol.id === (this.id === 0 ? 1 : this.id))?.backgroundTexture);
        switch(this.id) {
            case 0: 
                this.alpha = 0;
                break;
            case 1: 
                this.alpha = 0.4;
                break;
            default:
                this.alpha = 1;
                this.changeMultiplier(this.id);
        }
        this.background.anchor.set(0.5);
        this.multiplier.anchor.set(0.5);
    }

    private async changeMultiplier(multiplierId: number): Promise<void> {

        return new Promise((resolve) => {
            if (multiplierId === 1) {
                resolve();
                return;
            }

            if (this.multiplier) {
                Tweener.addTween(this.multiplier.scale, {
                    x: 0,
                    y: 0,
                    time: 0.1,
                    onComplete: () => {
                        this.multiplier.texture = AssetsManager.textures.get(MultiplierSymbolsList.find(symbol => symbol.id === multiplierId)?.textTexture);
                        Tweener.addTween(this.multiplier.scale, {
                            x: 1,
                            y: 1,
                            time: 0.2,
                            onComplete: resolve
                        })
                    }
                })
            }
        })
    }

    public async setMultiplier(multiplierId: number, delay: number = 0): Promise<void> {
        if (multiplierId === this.id || multiplierId > 128 || multiplierId < 0) return;
        this.id = multiplierId;

        if (multiplierId !== 0) {
            this.alpha = (multiplierId === 1) ? 0.4 : 1;
            if (multiplierId === 1) {
                this.multiplier.scale.set(0);
            }
        }

        return new Promise((resolve) => {
            const tweenOptions = multiplierId === 0 ? {
                x: 0,
                y: 0,
                delay: delay,
                time: 0.3,
                onComplete: resolve
            } : {
                x: 1,
                y: 1,
                time: 0.3,
                onComplete: () => {
                    this.changeMultiplier(multiplierId).then(resolve);
                }
            };

            Tweener.addTween(this.scale, tweenOptions);
        });
    }
}
