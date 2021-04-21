import { JQueryKeys } from './common';
import { KeyboardKeyPressedEvent, KEY_PRESSED_EVENT_NAME } from './keyboard';

export interface CrossWordConfig {
    readonly square_size: number;
    readonly target: string;
    readonly target_list?: string;
    readonly target_current?: string;
    //readonly text_size: string;
    readonly border_margin: number;
    readonly success_color: string;
    readonly failure_color: string;
    readonly neutral_color: string;
    readonly selection_color: string;
    readonly selection_size: number;
    readonly img_margin: number;
}

export enum CrossWordOrientation {
    HORIZONTAL,
    VERTICAL
}

export enum CrossWordMoveDirection {
    UP,
    DOWN,
    LEFT,
    RIGHT,
    NATURAL,
    ANTI_NATURAL
}

export interface CrossWordGridPosition {
    readonly x: number;
    readonly y: number;
}


export interface CrossWordItem {
    readonly name: string;
    readonly img_src?: string;
    readonly inplace_image?: {
        x: number,
        y: number,
        max_width?: number;
        max_height?: number;
    }
    readonly start: CrossWordGridPosition;
    readonly orientation: CrossWordOrientation;
}

export class CrossWordInputChar {
    readonly pos: CrossWordGridPosition;
    readonly char: string;
}

export interface CrossWordItemRefBox {
    readonly parent: CrossWordItem;
    readonly pos: CrossWordGridPosition;
    readonly validChar: string;
    readonly isNumber: boolean;
    readonly next?: CrossWordItemRefBox;
}

export interface CrossWordItemBox extends CrossWordItemRefBox {
    readonly currChar?: string;
}


function buildMaxPos(max_pos: CrossWordGridPosition, pos: CrossWordGridPosition): CrossWordGridPosition {
    return {
        x: max_pos.x < pos.x ? pos.x : max_pos.x,
        y: max_pos.y < pos.y ? pos.y : max_pos.y
    };
}

export class CrossWordState {

    constructor(
        public readonly pos: CrossWordGridPosition,
        public readonly chars: CrossWordInputChar[],
        public readonly lastItem: CrossWordItem
    ) { }

    public newStateWithChar(char: string): CrossWordState {
        if (!char.match(/^[a-zA-Z]$/)) {
            return this;
        }
        return new CrossWordState(
            this.pos,
            this.chars.filter(item => !(item.pos.x === this.pos.x && item.pos.y === this.pos.y))
                .concat([{ pos: this.pos, char: char.toUpperCase() }]),
            this.lastItem
        );
    }

    public moveTo(newPos: CrossWordGridPosition, applicableItems: CrossWordItem[]): CrossWordState {
        if (applicableItems.length === 0) {
            return this;
        }
        const currItemApplicable = applicableItems.filter(item => this.lastItem === item).length > 0 ? this.lastItem : applicableItems[0];

        return new CrossWordState(
            newPos,
            this.chars,
            currItemApplicable
        )
    }
}

class CrossWordGrid {
    public readonly max_pos: CrossWordGridPosition;
    private readonly initialBoxedItems: CrossWordItemRefBox[];

    constructor(items: CrossWordItem[]) {
        this.initialBoxedItems = items.map((item, index) => this.buildListOfCases(item, index)).reduce((final, list) => final.concat(list), []);
        this.max_pos = this.initialBoxedItems.map(item => item.pos)
            .reduce((max_pos, pos) => buildMaxPos(max_pos, pos), { x: 0, y: 0 });
    }

    public getItemsAtPos(pos: CrossWordGridPosition, allowNumber: boolean = false): CrossWordItem[] {
        return this.initialBoxedItems
            .filter(box => box.pos.x === pos.x && box.pos.y === pos.y)
            .filter(box => allowNumber || !box.isNumber)
            .map(box => box.parent);
    }

    public getBoxItemsAtPos(pos: CrossWordGridPosition, allowNumber: boolean = false): CrossWordItemRefBox[] {
        return this.initialBoxedItems
            .filter(box => box.pos.x === pos.x && box.pos.y === pos.y)
            .filter(box => allowNumber || !box.isNumber);
    }

    public buildListOfAllCase(state: CrossWordState): CrossWordItemBox[] {
        return this.initialBoxedItems
            .map(box => this.buildBox(box, state))
            .reduce((result, list) => result.concat(list), []);
    }

    private buildBox(box: CrossWordItemBox, state: CrossWordState): CrossWordItemBox {
        const char = state.chars.filter(inputChar => box.pos.x === inputChar.pos.x && box.pos.y === inputChar.pos.y);
        if (char.length > 0) {
            return { ...box, currChar: char[0].char };
        }
        return box;
    }

    public buildListOfCases(item: CrossWordItem, index: number | undefined): CrossWordItemRefBox[] {
        const result: CrossWordItemBox[] = [];
        const isHorizontal = item.orientation === CrossWordOrientation.HORIZONTAL;
        const correctionOffset = this.calcCorrectionOffset(item);
        const xOffset = item.start.x + correctionOffset.x;
        const yOffset = item.start.y + correctionOffset.y;
        const firstPos = index === undefined ? 1 : 0;
        let lastItem: CrossWordItemBox | undefined = undefined;
        let pos = item.name.length;
        while (pos >= firstPos) {
            const finalPos = {
                x: isHorizontal ? xOffset + pos : xOffset,
                y: !isHorizontal ? yOffset + pos : yOffset
            };
            const newItem: CrossWordItemRefBox = {
                parent: item,
                pos: finalPos,
                validChar: pos === 0 ? index.toString() : item.name.substr(pos - 1, 1).toUpperCase(),
                isNumber: pos === 0,
                next: lastItem
            };
            result.push(newItem);
            lastItem = newItem;
            --pos;
        }
        return result.reverse();
    }

    public calcCorrectionOffset(item: CrossWordItem): { x: number, y: number } {
        const isHorizontal = item.orientation === CrossWordOrientation.HORIZONTAL;

        return {
            x: 1 + (isHorizontal ? -1 : 0),
            y: 1 + (isHorizontal ? 0 : -1)
        }
    }

    private calcEffectiveDirection(state: CrossWordState, direction: CrossWordMoveDirection): CrossWordMoveDirection {
        if (direction === CrossWordMoveDirection.NATURAL) {
            return state.lastItem.orientation === CrossWordOrientation.HORIZONTAL ? CrossWordMoveDirection.RIGHT : CrossWordMoveDirection.DOWN;
        }
        if (direction === CrossWordMoveDirection.ANTI_NATURAL) {
            return state.lastItem.orientation === CrossWordOrientation.HORIZONTAL ? CrossWordMoveDirection.LEFT : CrossWordMoveDirection.UP;
        }
        return direction;
    }

    public move(state: CrossWordState, direction: CrossWordMoveDirection): CrossWordState {
        const applicableDirection = this.calcEffectiveDirection(state, direction);
        let currPos = this.nextPosition(state.pos, applicableDirection);
        while (this.isWithinGrid(currPos)) {
            const items = this.getItemsAtPos(currPos);
            if (this.getItemsAtPos(currPos).length > 0) {
                return state.moveTo(currPos, items);
            }
            currPos = this.nextPosition(currPos, applicableDirection);
        }
        return state;
    }

    public nextPosition(pos: CrossWordGridPosition, direction: CrossWordMoveDirection): CrossWordGridPosition {
        switch (direction) {
            case CrossWordMoveDirection.DOWN: return { x: pos.x, y: pos.y + 1 };
            case CrossWordMoveDirection.UP: return { x: pos.x, y: pos.y - 1 };
            case CrossWordMoveDirection.LEFT: return { x: pos.x - 1, y: pos.y };
            case CrossWordMoveDirection.RIGHT: return { x: pos.x + 1, y: pos.y };
        }
        return pos;
    }

    public isWithinGrid(pos: CrossWordGridPosition): boolean {
        return (pos.x >= 0 && pos.x <= this.max_pos.x)
            && (pos.y >= 0 && pos.y <= this.max_pos.y);
    }

    public getPosOfItem(item: CrossWordItem, pos: number): CrossWordGridPosition {
        const founds = this.buildListOfCases(item, pos).filter(box => !box.isNumber);
        if (founds.length > 0) {
            return founds[0].pos;
        }
        return { x: 0, y: 0 };
    }
}

class CrossWordImage {
    private readonly image: HTMLImageElement;
    private readonly startAbsolutePos: { x: number, y: number };
    private size: { x: number, y: number } | undefined;

    constructor(private readonly ctxt: CanvasRenderingContext2D,
        private readonly item: CrossWordItem,
        private readonly grid: CrossWordGrid,
        private readonly parent: CrossWordCanvas,
        private readonly config: CrossWordConfig) {

        this.image = new Image();
        const correctionOffset = this.grid.calcCorrectionOffset(this.item);
        this.startAbsolutePos = this.parent.buildRectPos({ x: this.item.inplace_image.x + correctionOffset.x, y: this.item.inplace_image.y + correctionOffset.y });
        this.image.onload = () => this.drawImage();
        const self = this;
        setTimeout(() => self.image.src = item.img_src, 0);
    }


    public drawImage(): void {
        this.size = this.calcSize();
        this.ctxt.drawImage(this.image,
            this.startAbsolutePos.x + this.config.img_margin,
            this.startAbsolutePos.y + this.config.img_margin,
            this.size.x,
            this.size.y
        );
    }

    private calcSize(): { x: number, y: number } {
        const height = this.image.height;
        const width = this.image.width;
        const ratio_width = this.calcRatio(width, this.item.inplace_image?.max_width);
        const ratio_height = this.calcRatio(height, this.item.inplace_image?.max_height);
        const ratio = this.calcMinRatio(ratio_width, ratio_height);
        return {
            x: this.image.width * ratio,
            y: this.image.height * ratio
        }
    }

    private calcRatio(size: number, maxSquare?: number): number | undefined {
        if (maxSquare === undefined) {
            return undefined;
        }
        return (maxSquare * this.parent.getSquareSize() - 2 * this.config.img_margin) * 1.0 / size;
    }

    private calcMinRatio(...ratios: (number | undefined)[]) {
        let min = undefined;
        for (const ratio of ratios) {
            if (ratio !== undefined) {
                min = min !== undefined ? (Math.min(min, ratio)) : ratio;
            }
        }
        return min ?? 1.0;
    }

    private drawImageArrow(ctxt: CanvasRenderingContext2D, item: CrossWordItem) {
        const correctionOffset = this.grid.calcCorrectionOffset(item);
        const imgRectPos = this.parent.buildRectPos({ x: item.inplace_image.x + correctionOffset.x, y: item.inplace_image.y });
        const numberRectPos = this.parent.buildRectPos({ x: item.start.x + correctionOffset.x, y: item.start.y + correctionOffset.y });

    }

    private drawArrow(ctxt: CanvasRenderingContext2D, from: { x: number, y: number }, to: { x: number, y: number }): void {
        const headlen = 10; // length of head in pixels
        const d: { x: number, y: number } = { x: to.x - from.x, y: to.y - from.y };
        var angle = Math.atan2(d.y, d.x);
        ctxt.moveTo(from.x, from.y);
        ctxt.lineTo(to.x, to.y);
        ctxt.lineTo(to.x - headlen * Math.cos(angle - Math.PI / 6), to.y - headlen * Math.sin(angle - Math.PI / 6));
        ctxt.moveTo(to.x, to.y);
        ctxt.lineTo(to.x - headlen * Math.cos(angle + Math.PI / 6), to.y - headlen * Math.sin(angle + Math.PI / 6));
    }

    public isMatching(pos: { x: number; y: number; }): boolean {
        if (this.size === undefined) {
            return false;
        }
        return (pos.x >= this.startAbsolutePos.x && pos.x <= (this.startAbsolutePos.x + this.size.x))
            && (pos.y >= this.startAbsolutePos.y && pos.y <= (this.startAbsolutePos.y + this.size.y))
    }

    public getItem(): CrossWordItem {
        return this.item;
    }
}


class CrossWordStateManager {
    private state: CrossWordState;
    private listeners: ((newState: CrossWordState) => void)[] = [];
    private validItems: { [name: string]: true } = {};
    private itemsListener: ((item: CrossWordItem, valid: boolean) => void)[] = [];
    private allValidListeners: ((allValid: boolean) => void)[] = [];

    constructor(private readonly grid: CrossWordGrid, private readonly items: CrossWordItem[]) {
        const firstItem = items[0];
        this.state = new CrossWordState(
            this.grid.getPosOfItem(firstItem, 0),
            [],
            firstItem
        );
    }

    public updateCharAtCurrentPos(char: string): boolean {
        return this.swap(this.state.newStateWithChar(char));
    }

    public move(direction: CrossWordMoveDirection): boolean {
        return this.swap(this.grid.move(this.state, direction));
    }

    public moveTo(newPos: CrossWordGridPosition, items: CrossWordItem[]) {
        return this.swap(this.state.moveTo(newPos, items));
    }

    public getListOfAllCase(): CrossWordItemBox[] {
        return this.grid.buildListOfAllCase(this.state);
    }

    public getCurrentPos(): CrossWordGridPosition {
        return this.state.pos;
    }

    private swap(state: CrossWordState): boolean {
        const oldState = this.state;
        this.state = state;
        if (this.state === oldState) {
            return false;
        }
        this.listeners.forEach(listener => listener(this.state));
        const invalidItems = this.getListOfAllCase()
            .filter(box => !box.isNumber)
            .filter(box => box.currChar !== box.validChar).map(box => box.parent).reduce(
                (map, item) => { map[item.name] = true; return map; }, {} as { [key: string]: true });


        for (const item of this.items) {
            const isValidItem = invalidItems[item.name] !== true;
            const isPreviouslyValid = this.validItems[item.name];
            if (isValidItem !== isPreviouslyValid) {
                this.itemsListener.forEach(listener => listener(item, isValidItem));
                if (!isValidItem) {
                    delete this.validItems[item.name];
                }
                else {
                    this.validItems[item.name] = true;
                }
            }
        }
        //if (Object.keys(invalidItems).length === 0) {
        this.allValidListeners.forEach(listener => listener(Object.keys(invalidItems).length === 0));
        //}
        return true;
    }

    public addStateChangeListener(listener: (newState: CrossWordState) => void, autoSubmit: boolean = true) {
        this.listeners.push(listener);
        if (autoSubmit) {
            listener(this.state);
        }
    }

    public addItemValidityChangeListener(listener: (item: CrossWordItem, valid: boolean) => void) {
        this.itemsListener.push(listener);
    }

    public addAllItemValidListener(listener: (allValid: boolean) => void): void {
        this.allValidListeners.push(listener);
    }
}

class CrossWordCanvas {
    private readonly target: HTMLCanvasElement;
    private readonly images: CrossWordImage[] = [];
    private requestRefresh: boolean = false;


    constructor(items: CrossWordItem[], private readonly grid: CrossWordGrid, private readonly config: CrossWordConfig, private readonly state: CrossWordStateManager) {
        this.target = document.getElementById(config.target) as HTMLCanvasElement;
        this.target.addEventListener(KEY_PRESSED_EVENT_NAME, event => this.manageKeyPressed(event as CustomEvent<KeyboardKeyPressedEvent>));
        this.target.addEventListener("keydown", (event) => this.manageKeyPress(event));
        this.target.addEventListener("click", (event) => this.manageClick(event));
        this.target.focus();
        const ctx = this.target.getContext("2d");
        const absoluteMaxPos = this.buildRectPos({ x: this.grid.max_pos.x + 2, y: this.grid.max_pos.y + 1 });
        ctx.font = this.target.style.font;
        this.target.width = absoluteMaxPos.x + this.config.border_margin;
        this.target.height = absoluteMaxPos.y + this.config.border_margin;
        const self = this;
        ctx.font = this.target.style.font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';

        this.images = items.filter(item => item.img_src && item.inplace_image).map(item => new CrossWordImage(ctx, item, grid, this, config));
        this.state.addStateChangeListener(() => self.planRedraw());
        this.state.addAllItemValidListener((valid) => {
            if (valid) {
                self.target.classList.add("finished")
            }
            else {
                self.target.classList.remove("finished")
            }
        });
    }

    private planRedraw(): void {
        if (this.requestRefresh) {
            return;
        }
        this.requestRefresh = true;
        const self = this;
        window.requestAnimationFrame(() => self.drawIfNeeded());
    }

    private manageKeyPressed(event: CustomEvent<KeyboardKeyPressedEvent>) {
        if (!this.state.updateCharAtCurrentPos(event.detail.char)) {
            return;
        }
        this.state.move(CrossWordMoveDirection.NATURAL);
    }

    public getSquareSize() {
        const fontSize = getComputedStyle(this.target).fontSize;
        return Math.floor(this.config.square_size * (parseInt(fontSize, 10)));
    }

    private manageClick(event: MouseEvent) {
        const newPos = this.getCellPos(event.offsetX, event.offsetY);
        const list = this.grid.getBoxItemsAtPos(newPos, true).map(itemBox => itemBox.isNumber ? itemBox.next : itemBox);
        if (list.length > 0) {
            this.state.moveTo(list[0].pos, list.map(item => item.parent));
        }
        else {
            const images = this.images.filter(image => image.isMatching(this.getEffectivePos(event.offsetX, event.offsetY)));
            if (images.length > 0) {
                this.manageClickOnListItem(images[0].getItem());
            }
        }
    }

    public manageClickOnListItem(item: CrossWordItem) {
        this.state.moveTo(this.grid.getPosOfItem(item, 0), [item]);
        this.target.focus();
    }

    private manageKeyPress(event: KeyboardEvent) {
        switch (event.which) {
            case JQueryKeys.DOWN: this.state.move(CrossWordMoveDirection.DOWN); break;
            case JQueryKeys.UP: this.state.move(CrossWordMoveDirection.UP); break;
            case JQueryKeys.LEFT: this.state.move(CrossWordMoveDirection.LEFT); break;
            case JQueryKeys.RIGHT: this.state.move(CrossWordMoveDirection.RIGHT); break;
            case JQueryKeys.ENTER: this.state.move(CrossWordMoveDirection.NATURAL); break;
            case JQueryKeys.BACKSPACE: this.state.move(CrossWordMoveDirection.ANTI_NATURAL); break;
            default:
                if (this.state.updateCharAtCurrentPos(event.key)) {
                    this.state.move(CrossWordMoveDirection.NATURAL);
                }
        }
        event.preventDefault();
    }

    private drawIfNeeded() {
        if (!this.requestRefresh) {
            return;
        }
        this.requestRefresh = false;
        const ctx = this.target.getContext("2d");
        ctx.font = this.target.style.font;
        const square_size = this.getSquareSize();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';

        this.state.getListOfAllCase().forEach(element => this.drawGridCase(ctx, element, square_size));
        this.drawCurrentSelection(ctx, square_size);
        this.moveToCurrentSelection(square_size);
    }

    private moveToCurrentSelection(square_size: number) {
        const { x, y } = this.buildRectPos(this.state.getCurrentPos());
        const boudingRect = this.target.getBoundingClientRect();
        const offset = boudingRect.y + y;
        const min_offset = Math.floor(this.getWindowHeight() / 2) - Math.floor(square_size * 1.5);
        const max_offset = Math.floor(this.getWindowHeight() / 2) + Math.floor(square_size * 1.5);
        if (offset > max_offset) {
            window.scrollBy(0, offset - (max_offset - square_size));
        }
        else if (offset < min_offset) {
            window.scrollBy(0, offset - (min_offset + square_size));
        }
    }

    private drawCurrentSelection(ctx: CanvasRenderingContext2D, square_size: number) {
        ctx.beginPath();
        const rectPost = this.buildRectPos(this.state.getCurrentPos());
        ctx.rect(rectPost.x + ctx.lineWidth / 2, rectPost.y + ctx.lineWidth / 2, square_size - ctx.lineWidth, square_size - ctx.lineWidth);
        ctx.strokeStyle = this.config.selection_color;
        ctx.lineWidth = this.config.selection_size;
        ctx.stroke();
        ctx.closePath();
    }

    private drawGridCase(ctx: CanvasRenderingContext2D, element: CrossWordItemBox, square_size: number) {
        ctx.beginPath();
        const { x, y } = this.buildRect(element.pos, ctx);

        if (element.currChar) {
            ctx.fillStyle = element.currChar === element.validChar ? this.config.success_color : this.config.failure_color;
        }
        else {
            ctx.fillStyle = this.config.neutral_color;
        }
        if (!element.isNumber) {
            ctx.fill();
            ctx.stroke();
        }
        const char = element.isNumber ? element.validChar : element.currChar;
        if (char) {
            ctx.fillStyle = 'black';
            ctx.fillText(char, x + square_size / 2, y + square_size / 2);
        }
        ctx.closePath();
    }

    public buildRectPos(pos: CrossWordGridPosition): CrossWordGridPosition {
        const x = pos.x * this.getSquareSize() + this.config.border_margin;
        const y = pos.y * this.getSquareSize() + this.config.border_margin;
        return { x, y };
    }

    private buildRect(pos: CrossWordGridPosition, ctx: CanvasRenderingContext2D): CrossWordGridPosition {
        const globalPos = this.buildRectPos(pos);
        ctx.rect(globalPos.x, globalPos.y, this.getSquareSize(), this.getSquareSize());
        return globalPos;
    }

    private getCellPos(origX: number, origY: number): CrossWordGridPosition {
        const { x, y } = this.getEffectivePos(origX, origY);
        return {
            x: Math.floor(x / this.getSquareSize()),
            y: Math.floor(y / this.getSquareSize()),
        };
    }

    private getEffectivePos(x: number, y: number): { x: number, y: number } {
        return {
            x: x - this.config.border_margin,
            y: y - this.config.border_margin
        };
    }

    private getWindowHeight(): number {
        const body = document.body;
        const docEl = document.documentElement;
        return window.innerHeight ||
            (docEl && docEl.clientHeight) ||
            (body && body.clientHeight) ||
            0;
    }
}

class CrossWordList {
    private target_list: HTMLElement;
    private map: { [key: string]: HTMLLIElement } = {};
    constructor(items: CrossWordItem[], private readonly config: CrossWordConfig, private readonly canvas: CrossWordCanvas, state: CrossWordStateManager) {
        this.target_list = document.getElementById(this.config.target_list);
        items.forEach((item, index) => this.setupListItem(index, item));
        const self = this;
        state.addItemValidityChangeListener((item, validity) => self.onStateChange(item, validity));
    }

    private setupListItem(index: number, item: CrossWordItem) {
        const newItem = document.createElement("li");
        this.map[item.name] = newItem;
        newItem.dataset["name"] = item.name;
        newItem.appendChild(document.createTextNode(index + "\u00a0-\u00a0" + item.name.toLocaleUpperCase()));
        this.target_list.appendChild(newItem);
        newItem.addEventListener("click", () => this.canvas.manageClickOnListItem(item));
    }

    private onStateChange(item: CrossWordItem, validity: boolean) {
        if (validity) {
            this.map[item.name].classList.add("valid");
        }
        else {
            this.map[item.name].classList.remove("valid");
        }

    }
}

class CrossWordCurrent {
    private readonly targetcurrent: HTMLElement;

    constructor(config: CrossWordConfig, state: CrossWordStateManager) {
        this.targetcurrent = document.getElementById(config.target_current);
        const self = this;
        state.addStateChangeListener((newState) => self.updateCurrent(newState));
    }

    private updateCurrent(newState: CrossWordState): void {
        const name = newState.lastItem.name.toLocaleUpperCase();
        if (this.targetcurrent.dataset['name'] === name) {
            return;
        }
        this.targetcurrent.dataset['name'] = name;
        while (this.targetcurrent.firstChild) this.targetcurrent.removeChild(this.targetcurrent.firstChild);
        this.targetcurrent.appendChild(document.createTextNode(name));
        if (newState.lastItem.img_src) {
            //this.targetcurrent.appendChild(document.createElement("br"));
            const img = document.createElement("img");
            img.src = newState.lastItem.img_src;
            img.style.maxWidth = "10rem";
            this.targetcurrent.appendChild(img);
        }
    }
}

export class CrossWord {
    private readonly canvas: CrossWordCanvas;
    private readonly state: CrossWordStateManager;
    private readonly list: CrossWordList;
    private readonly current: CrossWordCurrent;
    private readonly grid: CrossWordGrid;

    constructor(items: CrossWordItem[], private readonly config: CrossWordConfig) {
        this.grid = new CrossWordGrid(items);
        this.state = new CrossWordStateManager(this.grid, items);
        this.canvas = new CrossWordCanvas(items, this.grid, this.config, this.state);
        if (config.target_list) {
            this.list = new CrossWordList(items, config, this.canvas, this.state);
        }
        if (config.target_current) {
            this.current = new CrossWordCurrent(config, this.state);
        }
    }
}