export interface KeyboardConfig {
    readonly target: string;
    readonly group_size: number;
}

export class KeyboardKeyPressedEvent {
    constructor(public readonly char: string) {

    }
}
const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const KEY_PRESSED_EVENT_NAME = 'KeyboardKeyPressedEvent';
export class Keyboard {

    constructor(config: KeyboardConfig, targetElement: HTMLElement) {
        const targetParent = document.getElementById(config.target);
        let group = this.createGroup(targetParent);
        let size = 0;
        for (const char of alpha.split('')) {
            if (size >= config.group_size) {
                group = this.createGroup(targetParent);
                size = 0;
            }
            const element = document.createElement('div');
            element.classList.add("keyboard-key");
            element.appendChild(document.createTextNode(char));
            group.appendChild(element);
            element.addEventListener('click', () => {
                targetElement.dispatchEvent(new CustomEvent<KeyboardKeyPressedEvent>(KEY_PRESSED_EVENT_NAME, { detail: new KeyboardKeyPressedEvent(char) }));
            });
            size++;
        }
    }

    private createGroup(targetParent: HTMLElement) {
        let group = document.createElement('div');
        group.classList.add("keyboard-group");
        targetParent.appendChild(group);
        return group;
    }
}