import { container } from "tsyringe";
import ControlCommand from "../../../core/control/command/ControlCommand";
import ControlEvent from "../../../core/control/event/ControlEvent";
import SlotMachine from "../../model/SlotMachine";
import { SlotGameEvent } from "../event/SlotGameEvent";

export default class ConfirmBonusWinAcceptedCommand extends ControlCommand {

    public execute(): void {
        const sm: SlotMachine = container.resolve(SlotMachine);

        sm.bonusGameStarted = true;
        sm.currentBetValue = sm.currentSpinResult.bonus.lineBet;
        new ControlEvent(SlotGameEvent.SPIN_RESULT_READY).dispatch();
    }
}