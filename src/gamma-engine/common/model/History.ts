import { HistoryEntry } from './HistoryEntry';

export default class History {
    public entries: HistoryEntry[] = [];
    public totalPages:number;
    public currentPage:number;
}
