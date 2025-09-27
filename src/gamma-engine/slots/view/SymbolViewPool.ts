import { SymbolsList } from "../../../drunkie-monkey/view/SymbolsList";
import { SymbolData } from "./SymbolData";
import SymbolView from "./SymbolView";

export default class SymbolViewPool {
    private pool: Map<number, SymbolView[]>;
    private maxPoolSize: Map<number, number>;

    constructor(cappingInfo: Map<number, number> = new Map()) {
        this.pool = new Map();
        this.maxPoolSize = cappingInfo;
    }

    // Will return the symbol with given id from the pool if exist otherwise create a new one
    public get(symbolId: number): SymbolView {
        if (!this.pool.has(symbolId) || this.pool.get(symbolId)!.length === 0) {
            // If no symbols are available, create a new one
            return new SymbolView(this.getSymbolById(symbolId));
        }

        // Retrieve and return a symbol from the pool
        return this.pool.get(symbolId)!.pop()!;
    }

    // Return a symbol to the pool
    public release(symbol: SymbolView): void {
        const symbolId = symbol.data.id;

        // Reset the symbol state (this is optional)
        // symbol.reset();

        // Add the symbol back to the pool if within the cap
        if (!this.pool.has(symbolId)) {
            this.pool.set(symbolId, []);
        }

        const poolSize = this.pool.get(symbolId)!.length;
        const maxSize = this.maxPoolSize.get(symbolId) ?? Infinity; // Default to no limit

        if (poolSize < maxSize) {
            this.pool.get(symbolId)!.push(symbol);
        }
    }

    // It will return the current pool size for a symbol with given id.
    public getPoolSize(symbolId: number): number {
        return this.pool.get(symbolId)?.length ?? 0;
    }

    private getSymbolById(id: number): SymbolData {
        return SymbolsList.find(symbol => symbol.id === id)!;
    }
}
