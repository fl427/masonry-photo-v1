type MasonryImageAttrs = 'sourceWidth' | 'sourceHeight' | 'masonryWidth' | 'masonryHeight' | 'offsetY' | 'offsetX';
// 管理每一个内部图片实例
export class MasonryImage {
    src: string;             // 图片src
    sourceWidth?: number;    // 原始图片宽度
    sourceHeight?: number;   // 原始图片高度
    masonryWidth?: number;   // 瀑布流中显示宽度
    masonryHeight?: number;  // 瀑布流中显示高度
    offsetY?: number; // 距离顶部距离 top
    offsetX?: number; // 距离左侧距离 left
    id?: number;

    constructor(source: string, imageHtmlIns?: HTMLImageElement, info?: { sourceWidth?: number, sourceHeight?: number, masonryWidth?: number, masonryHeight?: number }, id?: number) {
        this.src = source;
        this.sourceWidth = info?.sourceWidth;
        this.sourceHeight = info?.sourceHeight;
        this.masonryWidth = info?.masonryWidth;
        this.masonryHeight = info?.masonryHeight;
        this.id = id;
    }

    public setAttributes(attr: MasonryImageAttrs, value: number) {
        this[attr] = value;
    }
}