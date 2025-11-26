import {DisplayObject} from 'pixi.js';

export interface IAnimation {
    invoke(displayObject:DisplayObject);
}