export const throttleAndDebounce = (func: Function, throttleLimit: number, debounceLimit: number) => {
    let inThrottle: boolean;
    let timeout: NodeJS.Timeout;

    return (...args: any[]) => {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), throttleLimit);
        }

        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), debounceLimit);
    };
};

// Usage: throttle every 1 second, debounce for 1.5 seconds
// const updateLeaderboard = throttleAndDebounce(emitLeaderboardUpdate, 1000, 1500);
