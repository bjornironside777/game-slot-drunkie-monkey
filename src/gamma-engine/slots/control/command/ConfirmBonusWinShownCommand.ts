import { container } from "tsyringe";
import ControlCommand from "../../../core/control/command/ControlCommand";
import ControlEvent from "../../../core/control/event/ControlEvent";
import SlotMachine from "../../model/SlotMachine";
import { SlotGameEvent } from "../event/SlotGameEvent";

export default class ConfirmBonusWinShownCommand extends ControlCommand {

    public execute(): void {
        const sm: SlotMachine = container.resolve(SlotMachine);

        sm.bonusGameShown = true;
        new ControlEvent(SlotGameEvent.SPIN_RESULT_READY).dispatch();
    }
}