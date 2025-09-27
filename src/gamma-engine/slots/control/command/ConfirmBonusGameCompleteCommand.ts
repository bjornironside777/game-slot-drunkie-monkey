import ControlCommand from '../../../core/control/command/ControlCommand';
import ControlEvent from '../../../core/control/event/ControlEvent';
import { SlotGameEvent } from '../event/SlotGameEvent';
import SlotMachine from '../../model/SlotMachine';
import { container } from 'tsyringe';
import Wallet from '../../model/Wallet';

export default class ConfirmBonusGameCompleteCommand extends ControlCommand {

    public execute(): void {
        const sm: SlotMachine = container.resolve(SlotMachine);
        const wallet: Wallet = container.resolve(Wallet);

        wallet.balance += sm.currentSpinResult.bonus.winAmount;
        sm.currentSpinResult.bonus.roundComplete = true;
        if(sm.currentSpinResult.nextBonus) {
            sm.currentSpinResult.bonus = sm.currentSpinResult.nextBonus;
            sm.bonusGameShown = false;
            sm.bonusGameStarted = false;
        } else {
            sm.currentSpinResult.bonus = null;
        }
        sm.currentBetValue = sm.initialLineBet;

        new ControlEvent(SlotGameEvent.SPIN_RESULT_READY).dispatch();
    }
}
