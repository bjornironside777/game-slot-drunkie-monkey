import {container} from 'tsyringe';
import ControlCommand from "../../../gamma-engine/core/control/command/ControlCommand";
import ControlEvent from "../../../gamma-engine/core/control/event/ControlEvent";
import SlotMachine from "../../../gamma-engine/slots/model/SlotMachine";
import {UIEventExtension} from "../event/UIEventExtension";


export default class AdjustBetQuantityCommand extends ControlCommand {

    public execute(event: ControlEvent): void {
        const sm: SlotMachine = container.resolve(SlotMachine);
        const betLimits: number[] = sm.description.betLimits;
        switch (event.type) {
            case UIEventExtension.BET_QUANTITY_UP:
                if (betLimits.indexOf(sm.currentBetValue) < betLimits.length - 1) {
                    sm.currentBetValue = betLimits[betLimits.indexOf(sm.currentBetValue) + 1];
                }
                break;
            case UIEventExtension.BET_QUANTITY_DOWN:
                if (betLimits.indexOf(sm.currentBetValue) != 0) {
                    sm.currentBetValue = betLimits[betLimits.indexOf(sm.currentBetValue) - 1];
                }
                break;
            case UIEventExtension.BET_QUANTITY_MAX:
                sm.currentBetValue=betLimits[betLimits.length-1]
                break;
        }
    }
}
