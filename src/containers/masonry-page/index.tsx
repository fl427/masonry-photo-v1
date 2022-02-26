import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// 类
import { pageMap } from "./page-map";
import { MasonryImage } from "./masonry-image";
// 组件
import Card from "../../components/card";
// 常量
import { fakeImages } from "../../constants/images";
// CSS
import './index.scss';

const xAxisGap = 4, yAxisGap = 10

const itemWidth = 235; // 每一项子元素的宽度，即图片在瀑布流中显示宽度，保证每一项等宽不等高
// 获取当前的页面宽度和计算得出的列数
const getColumnAndPageWidth = (): {
    pageWidth: number;
    pageHeight: number;
    column: number;
} => {
    const pageWidth = global.innerWidth;
    const pageHeight = global.innerHeight;
    return {
        pageWidth,
        pageHeight,
        column: Math.floor(pageWidth / (itemWidth + xAxisGap)),
    };
}

// 获取heightArr数组中最小列的索引
const getMinIndex = (array: number[]): number => {
    const min = Math.min(...array);
    return array.indexOf(min);
}

const itemHeight = 100;
const total = 10000;
let id = 0;

// 从接口获取图片src列表
const handleGetImages = (params: { start: number, end: number }): Promise<string[]> => {
    return new Promise((resolve) => {
        resolve(fakeImages.slice(params.start, params.end));
    });
};

// 并行加载，获取每一个图片的高度
const loadImgHeights = (images: string[], itemWidth: number): Promise<MasonryImage[]> => {
    return new Promise((resolve, reject) => {
        const length = images.length
        const masonryImages: MasonryImage[] = [];

        let count = 0
        const load = (index: number) => {
            const img = new Image();
            img.src = images[index];
            const checkIfFinished = () => {
                count++
                if (count === length) {
                    resolve(masonryImages)
                }
            }
            img.onload = () => {
                // 显示在瀑布流中的高度按照固定宽度以及图片比例计算
                const itemHeight = itemWidth * (img.height / img.width)
                const masonryImageIns = new MasonryImage(images[index], img, { sourceWidth: img.width, sourceHeight: img.height, masonryWidth: itemWidth, masonryHeight: itemHeight }, index + id);
                masonryImages[index] = masonryImageIns;
                checkIfFinished()
            }
            img.onerror = () => {
                masonryImages[index] = new MasonryImage('');
                checkIfFinished()
            }
            img.src = images[index]
        }
        images.forEach((img, index) => load(index));
        id += images.length;
    })
}

const MasonryPage: React.FC = () => {
    const ref = useRef<HTMLDivElement | null>(null);

    // 存储当前容器内的高度
    const [heights, setHeights] = useState<number[]>([]);
    // 当前是第几页
    const [pageIdx, setPageIdx] = useState<number>(0);

    // 可视区域高度
    const containerHeight = document.body.clientHeight;
    // 可显示的列表项数
    const visibleCount = Math.floor(containerHeight / itemHeight);

    // 所有的数据
    const [listData, setListData] = useState<{ id: number; content: number; top: number }[]>([]);
    const [images, setImages] = useState<MasonryImage[]>([]);
    // 偏移量
    const [startOffset, setStartOffset] = useState(0);
    // 起始索引
    const [start, setStart] = useState(0);
    // 结束索引
    const [end, setEnd] = useState(0);
    // 获取真实显示列表数据
    const visibleData = useMemo(() => {
        console.log('数据变化', start);
        // 前后设置缓冲区域
        const visibleStart = Math.max(0, start - visibleCount);
        const visibleEnd = Math.min(listData.length, end + visibleCount * 2);
        return listData.slice(visibleStart, visibleEnd);
    }, [listData, start, end, visibleCount]);

    // 产生随机数据
    const genTenListData = useCallback((offset = 0) => {
        if (listData.length >= total) {
            return [];
        }
        let currHeights = [...heights];

        const dataArr = new Array(10).fill({}).map((_, idx) => {
            currHeights[0] += itemHeight;
            return {
                id: id++,
                content: Math.random() * 1000,
                top: idx * itemHeight + offset,
            }
        });
        setHeights(currHeights);
        return dataArr;
    }, [heights, listData.length]);

    // 获取图片
    const genTenListImages = useCallback(async () => {
        const imagesFromApi = await handleGetImages({start: id, end: id + 10});
        const masonryImages = await loadImgHeights(imagesFromApi, itemWidth);

        const { pageWidth, column } = getColumnAndPageWidth();

        // 当前的高度列表
        let heightArr = [...heights];
        if (heights.length === 0) {
            heightArr = Array(column).fill(0); // 如果heights.length === 0，意味着我们没有初始的heights数组，需要初始化
        }
        // 修改masonryImages的属性，按照heights数据修改每一个元素的宽高和位置 --> masonry重点
        for (let i = 0; i < masonryImages.length; i++) {
            const masonryImageInstance = masonryImages[i];
            const minIndex = getMinIndex(heightArr);
            // 定位这张图片的top
            const imgTop = heightArr[minIndex] + yAxisGap;
            masonryImageInstance && masonryImageInstance.setAttributes('offsetY', imgTop);
            // 定位这张图片的left
            const leftOffset = (pageWidth - (column * (itemWidth + xAxisGap) - xAxisGap)) / 2; // 左边padding，确保内容居中
            const imgLeft = leftOffset + minIndex * (itemWidth + xAxisGap);
            masonryImageInstance && masonryImageInstance.setAttributes('offsetX', imgLeft);

            heightArr[minIndex] = imgTop + (masonryImageInstance.masonryHeight || 0);
        };
        setHeights(heightArr);
        // 将新产生的image放入状态数组中
        const prevImages = images;
        prevImages.concat(masonryImages);
        setImages(masonryImages);
    }, [heights, images]);

    useEffect(() => {
        const data = genTenListData();
        setListData(data);
    }, []);

    const handleScroll = useCallback(() => {
        const dom = ref.current;
        if (dom) {
            const scrollTop = dom.scrollTop;
            const listTotalHeight = dom.scrollHeight;

            // 判断当前pageIdx
            const currPageIdx = Math.floor(scrollTop / containerHeight)
            setPageIdx(currPageIdx);
            console.log('info', currPageIdx, pageMap.getInfo(currPageIdx));

            if (pageMap.has(currPageIdx)) {
                // 存在记录时直接取到start和end，不要再计算
                const storedCurrStartIdx = pageMap.getInfo(currPageIdx)?.startIdx!;
                const storedCurrEndIdx = pageMap.getInfo(currPageIdx)?.endIdx!;
                console.log('已经有了', storedCurrStartIdx, storedCurrEndIdx)
                setStart(storedCurrStartIdx);
                setEnd(storedCurrEndIdx);
            } else {
                // 不存在记录，需要找到当前页的start和end并存储
                // 由于我们由上至下滚动，当滚动到currPageIdx时，我们一定存储过currPageIdx - 1的信息，不存在就意味着这是第一页
                let tempStartIdx = pageMap.getInfo(currPageIdx - 1)?.endIdx ?? 0;
                let tempEndIdx = pageMap.getInfo(currPageIdx - 1)?.endIdx ?? 0;
                for (let i = tempStartIdx + 1; i < listData.length; i++) {
                    if (listData[i].top <= containerHeight * (currPageIdx + 1)) {
                        tempEndIdx = i;
                    }
                }
                pageMap.setInfo(currPageIdx, {startIdx: tempStartIdx, endIdx: tempEndIdx});
                setStart(tempStartIdx);
                setEnd(tempEndIdx);
                console.log('添加有几次判断+++再次', listData.length - tempStartIdx - 1, tempStartIdx, tempEndIdx)
            }

            if (listTotalHeight - scrollTop <= 1.5 * containerHeight) {
                // 滚动到页面的一半程度，家在新的数据，使得用户无感知
                console.log('继续加载', listTotalHeight, scrollTop)
                const data = listData.concat(genTenListData(listData.length * itemHeight));
                setListData(data);
            }

            // 这里利用React的状态更新机制，相当于不断将上一轮的状态进行赋值，由于scroll是连续的事件，就可以在滚到需要的位置之前将容器高度撑开到正确的值。
            // 但实际上我们使用了绝对定位，将容器高度设置为0也是一样的效果，只是为了在DOM结构上显示更好，还是设置了一个高度值
            setStartOffset(listTotalHeight);
        }

    }, [containerHeight, genTenListData, listData, visibleCount]);

    useEffect(() => {
        const dom = ref.current;
        if (dom) {
            dom.addEventListener('scroll', handleScroll);
        }
        return () => {
            if (dom) {
                dom.removeEventListener('scroll', handleScroll);
            }
        }
    }, [handleScroll]);

    return (
        <div className="masonry-page" ref={ref} >
            <div className={'masonry'}
                 style={{
                     height: `${startOffset}px`
                 }}
            >
                <div className={'masonry-list'}>
                    {visibleData.map((data) => (
                        <Card className={'masonry-list-item'} key={data.id} data={data} itemHeight={itemHeight} />
                    ))}
                </div>
            </div>
        </div>
    )
};

export default MasonryPage;