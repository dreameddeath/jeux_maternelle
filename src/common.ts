export enum JQueryKeys {
    ENTER = 13,
    BACKSPACE = 8,
    LEFT = 37,
    UP = 38,
    RIGHT = 39,
    DOWN = 40
}


/*export class Optional<T> {
    private static readonly EMPTY: Optional<any> = new Optional();
    private constructor(private item?: T) { }

    public static of<T>(item: T): Optional<T> {
        return new Optional(item);
    }

    public static empty<T>(): Optional<T> {
        return this.EMPTY;
    }

    public map<R>(fct: (x: T) => R): Optional<R> {
        if (!this.isPresent()) {
            return new Optional();
        }
        return new Optional(fct(this.item));
    }

    public flatMap<R>(fct: (x: T) => Optional<R>): Optional<R> {
        if (!this.isPresent()) {
            return new Optional();
        }
        return fct(this.item);
    }

    public isPresent(): boolean {
        return this.item !== undefined;
    }

    public get(): T {
        if (this.item === null) {
            throw new Error("IllegalState Optional");
        }
        return this.item;
    }

    public orElse(other: () => T | T): T {
        return this.item ?? ((typeof other === 'function') ? other() : other);
    }
}
*/

