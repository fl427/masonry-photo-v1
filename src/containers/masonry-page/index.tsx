import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from '../../service';

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
let id = 0;

// 从接口获取图片src列表
const handleGetImages = (params: { start: number, end: number }): Promise<string[]> => {
    return new Promise((resolve) => {
        if (params.start < fakeImages.length) {
            resolve(fakeImages.slice(params.start, params.end));
        } else {
            resolve(fakeImages.slice(params.start % fakeImages.length, params.start % fakeImages.length + 10));
        }

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

    })
}

const MasonryPage: React.FC = () => {

    useEffect(() => {
        const result = axios.get('/', {});
        console.log('result', result);
    }, []);
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
    // const [listData, setListData] = useState<{ id: number; content: number; top: number }[]>([]);
    const [images, setImages] = useState<MasonryImage[]>([]);
    // 偏移量
    const [startOffset, setStartOffset] = useState(0);
    // 起始索引
    const [start, setStart] = useState(0);
    // 结束索引
    const [end, setEnd] = useState(0);
    // 获取真实显示列表数据
    const visibleData = useMemo(() => {
        console.log('数据变化', start, end, images);
        // 前后设置缓冲区域
        const visibleStart = Math.max(0, start - visibleCount);
        const visibleEnd = Math.min(images.length, end + visibleCount * 2);
        return images.slice(visibleStart, visibleEnd);
    }, [start, visibleCount, images, end]);

    // 获取图片
    const genTenListImages = useCallback(async () => {
        isAdding.current = true;
        const imagesFromApi = await handleGetImages({ start: images.length, end: images.length + 10 });

        const masonryImages = await loadImgHeights(imagesFromApi, itemWidth);
        id += masonryImages.length;

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
        }
        setHeights(heightArr);
        // 将新产生的image放入状态数组中
        setImages((prev) => ([...prev, ...masonryImages]));
        isAdding.current = false;
    }, [heights, images]);

    useEffect(() => {
        genTenListImages().then();
    }, []);

    const isAdding = useRef(false);

    const handleScroll = useCallback(async () => {

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
                for (let i = tempStartIdx + 1; i < images.length; i++) {
                    if ((images[i].offsetY || Infinity) <= containerHeight * (currPageIdx + 1)) {
                        tempEndIdx = i;
                    }
                }
                pageMap.setInfo(currPageIdx, { startIdx: tempStartIdx, endIdx: tempEndIdx });
                setStart(tempStartIdx);
                setEnd(tempEndIdx);
            }
            console.log('继续加载scroll', images.length, listTotalHeight - scrollTop, 1.5 * containerHeight)
            // 问题在于这里，我们必须要让高度被及时撑开，否则会多次请求数据，之后就全乱了
            if (listTotalHeight - scrollTop <= 1.5 * containerHeight) {
                // 这里我们先手动阻断（之后再想想有没有更好的办法）
                // 由于瀑布流布局需要时间，当新的内容还在布局的过程中时，它们还未被添加到DOM结构中，因此listTotalHeight没有更新
                // 此时if判断成立，genTenListImages被持续触发，就出错了。因此在添加时手动加一个判断条件，直到当前的新元素添加完成才能继续添加
                // 这样带来的问题就是用户滚动的速度超过元素添加的速度，那么更新就不及时。
                // TODO 优化：1. 从后端直接返回图片高度可以省去图片预加载的步骤，直接完成布局，图片加载慢慢来
                // 2. 以及更加早得加载新的数据，以让用户无感知
                // 3. 添加'加载中'的过渡样式，以让用户有心理预期
                if (isAdding.current) {
                    console.log('继续加载scroll正在添加');
                    return;
                }
                // 滚动到页面的一半程度，家在新的数据，使得用户无感知
                console.log('继续加载-1', listTotalHeight - scrollTop, 1.5 * containerHeight, Math.max(...heights));
                await genTenListImages();
            }

            // 这里利用React的状态更新机制，相当于不断将上一轮的状态进行赋值，由于scroll是连续的事件，就可以在滚到需要的位置之前将容器高度撑开到正确的值。
            // 但实际上我们使用了绝对定位，将容器高度设置为0也是一样的效果，只是为了在DOM结构上显示更好，还是设置了一个高度值
            setStartOffset(listTotalHeight);
        }

    }, [containerHeight, genTenListImages, heights, images]);

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
        <div className="masonry-page" ref={ref}>
            <div className={'masonry'}
                style={{
                    height: `${startOffset}px`
                }}
            >
                <div className={'masonry-list'}>
                    {visibleData.map((data) => (
                        <Card className={'masonry-list-item'} key={data.id} image={data} itemHeight={itemHeight} />
                    ))}
                </div>
            </div>
        </div>
    )
};

export default MasonryPage;