export function CustomEventSetup() {

    if (typeof window.CustomEvent === "function") return false;

    function CustomEvent(event: any, params: any) {
        params = params || { bubbles: false, cancelable: false, detail: null };
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    }

    (window as any).CustomEvent = CustomEvent as unknown as CustomEvent<any>;
};