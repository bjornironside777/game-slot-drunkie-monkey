import { Container, DisplayObject, Graphics, Point } from 'pixi.js';
import { getMaxAnimationTime, PopupAnimationConfig } from './PopupAnimationConfig';
import IPopupCallbacks from './IPopupCallbacks';
import GraphicUtils from '../../../core/utils/GraphicUtils';
import SoundManager from '../../../core/sound/SoundManager';
import { PopupSoundConfig } from './PopupSoundConfig';
import Sound from '../../../core/sound/Sound';
import AdjustableLayoutContainer from '../../../core/view/AdjustableLayoutContainer';
import { UpdateLayoutDescription } from '../../../core/view/UpdateLayoutDescription';
import { ScreenOrientation } from '../../../core/view/ScreenOrientation';
import { PopupUtils } from '../../utils/PopupUtils';
import { Tweener } from '../../../core/tweener/engineTween';
import { UIPanelEvent } from '../../../common/control/event/UIPanelEvent';
import ControlEvent from '../../../core/control/event/ControlEvent';
import UIState from '../../../common/model/UIState';
import { container } from 'tsyringe';
import PopupState from '../../../common/model/PopupState';
import PopupBigWin from '../../../common/view/popup/PopupBigWin';
import PopupConnectionLost from '../../../common/view/popup/PopupConnectionLost';

export default class PopupManager extends AdjustableLayoutContainer {
    public static defaultAnimationConfiguration: PopupAnimationConfig = {
        showPopup: {
            scale: {
                value: 1,
                time: 0.3,
                transition: 'easeOutBack',
            },
            alpha: {
                value: 1,
                time: 0.2,
                transition: 'easeOutQuad',
            },
        },
        hidePopup: {
            alpha: {
                value: 0,
                time: 0.3,
                transition: 'easeInQuad',
            },
            scale: {
                value: 0,
                time: 0.3,
                transition: 'easeInBack',
            },
        },
        showOverlay: {
            alpha: {
                value: 0.6,
                time: 0.2,
                transition: 'easeOutQuad',
            },
        },
        hideOverlay: {
            alpha: {
                value: 0,
                time: 0.2,
                transition: 'easeInQuad',
            },
        },
    };

    public static jumpAnimationConfiguration: PopupAnimationConfig = {
        showPopup: {
            scale: {
                value: 1,
                time: 0.35,
                transition: 'easeOutBack',
            },
            alpha: {
                value: 1,
                time: 0,
                transition: 'easeOutQuad',
            },
        },
        hidePopup: {
            alpha: {
                value: 0,
                time: 0.2,
                transition: 'easeInQuad',
            },
            scale: {
                value: 0,
                time: 0.2,
                transition: 'easeInQuad',
            },
        },
        showOverlay: {
            alpha: {
                value: 0.6,
                time: 0.2,
                transition: 'easeOutQuad',
            },
        },
        hideOverlay: {
            alpha: {
                value: 0,
                time: 0.15,
                transition: 'easeInQuad',
            },
        },
    };

    public static slideAnimationConfiguration: PopupAnimationConfig = {
        showPopup: {
            pivotY: {
                time: 0.7,
                transition: 'easeOutSine',
            },
            alpha: {
                value: 1,
                time: 0,
                transition: 'easeOutQuad',
            },
        },
        hidePopup: {
            pivotY: {
                time: 0.7,
                transition: 'easeOutSine',
            },
            alpha: {
                value: 0,
                time: 0.2,
                transition: 'easeInQuad',
            },
        },
        showOverlay: {
            alpha: {
                value: 0.6,
                time: 0.2,
                transition: 'easeOutQuad',
            },
        },
        hideOverlay: {
            alpha: {
                value: 0,
                time: 0.15,
                transition: 'easeInQuad',
            },
        },
    };

    public static defaultSoundConfiguration: PopupSoundConfig = {};

    protected activeAnimationConfigResolver: () => PopupAnimationConfig = null;
    protected activeSoundConfig: PopupSoundConfig = null;
    protected callbacks: IPopupCallbacks = null;
    protected closeOnClick: boolean = true;

    protected showSound: Sound;

    protected horizontalPopup: DisplayObject;
    protected verticalPopup: DisplayObject;
    private currentPopupShown: boolean = false;
    private pivotMap = new Map<DisplayObject, number>();
    private scaleMap = new Map<DisplayObject, number>();

    // VISUALS
    public overlay: Container;

    constructor() {
        super(null);

        this.overlay = new Container();
        const blackRect: Graphics = GraphicUtils.createRectGraphics({
            color: 0x000000,
            alpha: 1,
            size: new Point(100, 100),
        });
        blackRect.eventMode = 'auto';
        this.overlay.addChild(blackRect);
        this.overlay.pivot.set(50, 50);
        this.overlay.eventMode = 'dynamic';

        this.overlay.on('pointerdown', this.onClick, this);
        document.body.addEventListener('keydown', (e) => this.onSpaceClick(e));
    }

    public updateLayout(desc: UpdateLayoutDescription): void {
        this.overlay.width = desc.currentWidth;
        this.overlay.height = desc.currentHeight;
        this.overlay.position.set(0, 0);
        this.horizontalPopup?.['updateLayout']?.(desc);
        this.verticalPopup?.['updateLayout']?.(desc);

        super.updateLayout(desc);

        this.currentOrientation = desc.orientation;
        this.updateView();
    }

    private updateView(): void {
        if (this.horizontalPopup)
            this.horizontalPopup.visible = this.currentOrientation == ScreenOrientation.HORIZONTAL;

        if (this.verticalPopup) this.verticalPopup.visible = this.currentOrientation == ScreenOrientation.VERTICAL;
    }

    // PUBLIC API
    public show(
        horizontalPopup: DisplayObject,
        verticalPopup: DisplayObject,
        duration: number = -1,
        closeOnClick: boolean = false,
        callbacks: IPopupCallbacks = null,
        animationConfigResolver: () => Partial<PopupAnimationConfig> = () => PopupManager.defaultAnimationConfiguration,
        soundConfig: Partial<PopupSoundConfig> = PopupManager.defaultSoundConfiguration,
        clickOnPanelToClose: boolean = false
    ): void {
        // To prevent displaying multiple popups at the same time
        // [this.horizontalPopup, this.verticalPopup].forEach((popup: DisplayObject): void => {
        //     if (popup != null) {
        //         popup.destroy({ children: true });
        //     }
        // });
        //Tweener.removeTweens(this);

        // workaround to disable onclick close panel feature on the popup
        if(!clickOnPanelToClose)    [horizontalPopup, verticalPopup].forEach(popup => popup.eventMode = 'dynamic');

        // Clean previous tweens
        Tweener.removeTweens(this);
        Tweener.removeTweens(this.overlay);
        if(this.horizontalPopup) {
            Tweener.removeTweens(this.horizontalPopup);
        }

        if(this.verticalPopup) {
            Tweener.removeTweens(this.verticalPopup);
        }

        // Cache initial state for each new popup
        const animationConfig = animationConfigResolver?.();
        if (!this.pivotMap.has(horizontalPopup)) {
            this.pivotMap.set(horizontalPopup, horizontalPopup.pivot.y);
            this.scaleMap.set(horizontalPopup, horizontalPopup.scale.x);
        }

        if (!this.pivotMap.has(verticalPopup)) {
            this.pivotMap.set(verticalPopup, verticalPopup.pivot.y);
            this.scaleMap.set(verticalPopup, verticalPopup.scale.x);
        }

        // Force animation resets
        [this.horizontalPopup, this.verticalPopup].forEach((popup) => {
            if (popup) {
                popup.alpha = 1;
                popup.scale.set(this.scaleMap.get(popup));
                popup.pivot.y = this.pivotMap.get(popup);
                this.removeChild(popup);
            }
        });

        // Cache other data
        this.callbacks = callbacks;
        this.closeOnClick = closeOnClick;
        this.cursor = closeOnClick ? 'pointer' : 'auto';

        if (animationConfigResolver) {
            this.activeAnimationConfigResolver = () => ({
                ...PopupManager.defaultAnimationConfiguration,
                ...(animationConfigResolver() ?? {}),
            });
        } else {
            this.activeAnimationConfigResolver = null;
        }

        this.activeSoundConfig = soundConfig ? soundConfig : null;

        // Show sound
        if (soundConfig?.showSound) {
            this.showSound = SoundManager.play(soundConfig?.showSound);
        }

        // Show overlay
        if (animationConfig.showOverlay) {
            this.removeChild(this.overlay);
            PopupUtils.DoAlphaFade(this.overlay, animationConfig.showOverlay?.alpha ?? null);
            PopupUtils.DoScale(this.overlay, animationConfig?.showOverlay?.scale ?? null, 0);
        }

        if (!this.overlay.parent) {
            this.addChild(this.overlay);
        }

        if (horizontalPopup) {
            this.horizontalPopup = horizontalPopup;
            this.addChild(horizontalPopup);
            horizontalPopup.pivot.y = this.pivotMap.get(horizontalPopup);
            horizontalPopup.scale.set(this.scaleMap.get(horizontalPopup));
        }
        if (verticalPopup) {
            this.verticalPopup = verticalPopup;
            this.addChild(verticalPopup);
            verticalPopup.pivot.y = this.pivotMap.get(verticalPopup);
            verticalPopup.scale.set(this.scaleMap.get(verticalPopup));
        }

        if (!animationConfig) {
            this.updateView();
            return;
        }

        if (animationConfig?.showPopup) {
            this.updateView();
            [horizontalPopup, verticalPopup].forEach((popup: DisplayObject): void => {
                PopupUtils.DoAlphaFade(popup, animationConfig.showPopup.alpha, null, () => {
                    popup.filters = [];
                });
                PopupUtils.DoScale(popup, animationConfig.showPopup.scale, 0, null, () => {
                    setTimeout(() => this.currentPopupShown = true, 150);
                    if (callbacks && callbacks.onPopupShown && this.visible) {
                        callbacks.onPopupShown();
                    }

                    if (duration != -1 && this.visible) {
                        Tweener.addCaller(this, {
                            count: 1,
                            time: duration,
                            onComplete: () => {
                                this.hide(false);
                            },
                        });
                    }
                });

                PopupUtils.DoChangePivotY(
                    popup,
                    animationConfig.showPopup.pivotY,
                    0,
                    this.pivotMap.get(popup),
                    null,
                    () => {
                        setTimeout(() => this.currentPopupShown = true, 150);
                        if (callbacks && callbacks.onPopupShown && this.visible) {
                            callbacks.onPopupShown();
                        }

                        if (duration != -1 && this.visible) {
                            Tweener.addCaller(this, {
                                count: 1,
                                time: duration,
                                onComplete: () => {
                                    this.hide(false);
                                },
                            });
                        }
                    }
                );
            });
        }
    }

    public hide(destroy: boolean = false): void {
        if (this.horizontalPopup instanceof PopupConnectionLost && this.verticalPopup instanceof PopupConnectionLost)   return;
        // Clean previous state
        const animationConfig: PopupAnimationConfig = this.activeAnimationConfigResolver?.();
        const soundConfig: PopupSoundConfig = this.activeSoundConfig;
        const callbacks: IPopupCallbacks = this.callbacks;
        const horizontalPopup = this.horizontalPopup;
        const verticalPopup = this.verticalPopup;

        this.cursor = 'auto';

        this.activeAnimationConfigResolver = null;
        this.activeSoundConfig = null;
        this.callbacks = null;
        this.currentPopupShown = false;
        if (this.showSound) {
            this.showSound.stop();
        }

        if (soundConfig?.hideSound) {
            SoundManager.play(soundConfig?.hideSound);
        }

        if (!animationConfig) {
            this.removeChild(this.horizontalPopup);
            this.removeChild(this.verticalPopup);
            return;
        }

        if (callbacks && callbacks.onPopupBeforeHide) {
            callbacks.onPopupBeforeHide();
        }

        if (animationConfig?.hidePopup) {
            [horizontalPopup, verticalPopup].forEach((popup: DisplayObject): void => {
                PopupUtils.DoAlphaFade(popup, animationConfig.hidePopup.alpha, null, () => {
                    popup.filters = [];
                });
                PopupUtils.DoScale(popup, animationConfig.hidePopup.scale, popup.scale.x, null, null);
                PopupUtils.DoChangePivotY(
                    popup,
                    animationConfig.hidePopup.pivotY,
                    this.pivotMap.get(popup),
                    0,
                    null,
                    null
                );
            });
        }

        if (animationConfig.hideOverlay) {
            PopupUtils.DoScale(this.overlay, animationConfig?.hideOverlay?.scale ?? null, this.overlay.scale.x);
            PopupUtils.DoAlphaFade(this.overlay, animationConfig.hideOverlay?.alpha ?? null, () => {
                if (callbacks && callbacks.onPopupHidden) {
                    callbacks.onPopupHidden();
                }
                // Destroy popups after all animations complete (otherwise popups are destroyed with the animations)
                const animationsMaxTime = getMaxAnimationTime(animationConfig);

                Tweener.addCaller(this, {
                    count: 1,
                    time: animationsMaxTime,
                    onComplete: () => {
                        [horizontalPopup, verticalPopup].forEach((popup: DisplayObject): void => {
                            if (popup) {
                                this.removeChild(popup);
                                popup.alpha = 1;
                                popup.scale.set(1);
                                popup.pivot.y = this.pivotMap.get(popup);
                                if (destroy) {
                                    popup.destroy();
                                }
                            }
                        });
                        if(this.children.length === 1) this.removeChild(this.overlay);  // do not remove if there's another popup already opened
                    },
                });
            });
        }
    }

    // USER INTERACTION
    private onClick(): void {
        if(!this.currentPopupShown) return;
        const uiState: UIState = container.resolve(UIState);
        const popupState: PopupState = container.resolve(PopupState);

        if (this.verticalPopup && this.horizontalPopup && this.closeOnClick) {
            new ControlEvent(UIPanelEvent.CLOSE_PANEL).dispatch();
            if(uiState.activePanel) {
                new ControlEvent(UIPanelEvent.CLOSE_PANEL).dispatch();
            }
            
            if(popupState.activePopup) {
                if(this.verticalPopup instanceof PopupBigWin && this.horizontalPopup instanceof PopupBigWin){
                    this.verticalPopup.skipCounter();
                    this.horizontalPopup.skipCounter();
                    setTimeout(() => {
                        new ControlEvent(UIPanelEvent.HIDE_POPUP).dispatch();
                        this.hide(false);
                    },1000)
                }else{
                    new ControlEvent(UIPanelEvent.HIDE_POPUP).dispatch();
                    this.hide(false);
                }
            }
        }
    }

    private onSpaceClick(event : KeyboardEvent){
        const uiState: UIState = container.resolve(UIState);
        if(uiState.activePanel) return;
        if (event.code === 'Space') {
            this.onClick();

        }
    }
}
