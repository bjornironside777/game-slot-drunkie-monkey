import { container } from 'tsyringe';
import History from '../../../gamma-engine/common/model/History';
import ControlCommand from '../../../gamma-engine/core/control/command/ControlCommand';
import ControlEvent from '../../../gamma-engine/core/control/event/ControlEvent';
import Wallet from '../../../gamma-engine/slots/model/Wallet';
import SlotMachine from '../../../gamma-engine/slots/model/SlotMachine';
import { SlotGameEvent } from '../../../gamma-engine/slots/control/event/SlotGameEvent';
import { SlotMachineState } from '../../../gamma-engine/slots/model/SlotMachineState';

export default class CompleteRoundCommandOverride extends ControlCommand {

    public execute(): void {
        const wallet: Wallet = container.resolve(Wallet);
        const sm: SlotMachine = container.resolve(SlotMachine);
        const history: History = container.resolve(History);

        sm.roundResult.complete = true;
        const winValue: number =  sm.roundResult.totalWinValue;
        wallet.balance += winValue;

        // history.entries.unshift({
        //     datetime: Date.now(),
        //     balance: wallet.balance,
        //     win: winValue,
        //     totalBet: sm.roundResult.roundType===2?sm.roundResult.totalBet*100:sm.roundResult.totalBet
        // });

        if(sm.autoplay.enabled && sm.autoplay.canAutoSpin(sm.roundResult, wallet.credits)) {
            if(sm.autoplay.spinsLeft>0)
                sm.autoplay.spinsLeft-=1;
            let time=0;
            if(sm.roundResult.totalWinValue>0){
                time=500;
            }

            setTimeout(() => {
                new ControlEvent(SlotGameEvent.SPIN_START).dispatch();
            }, time);
        } else {
            sm.autoplay.spinsLeft = 0;
            sm.autoplay.enabled = false;
            sm.currentState = SlotMachineState.IDLE;
        }
    }
}
