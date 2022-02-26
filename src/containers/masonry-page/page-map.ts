export interface Info {
    startIdx: number;
    endIdx: number;
}

class PageMap {
    map = new Map<number, Info>();

    getInfo(idx: number): Info | undefined {
        return this.map.get(idx);
    }

    setInfo(idx: number, info: Info): void {
        this.map.set(idx, info);
    }

    has(idx: number): boolean {
        return this.map.get(idx) !== undefined;
    }
}

export const pageMap = new PageMap();