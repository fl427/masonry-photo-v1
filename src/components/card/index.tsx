import React, {useEffect, useRef} from 'react';
import {MasonryImage} from "../../containers/masonry-page/masonry-image";

import './index.scss';

interface IProps {
    data?: {
        content: number;
        id: number;
        top: number;
    };
    image?: MasonryImage;
    itemHeight: number;
    className: string;
}
const Card: React.FC<IProps> = ({ data , itemHeight, className, image}) => {
    const ref = useRef<HTMLDivElement | null>(null);

    return (
        // <div ref={ref} id={data.id.toString()} key={data.id} className={`${className} card`}
        //     style={{
        //         height: `${itemHeight}px`,
        //         background: 'aqua',
        //         transform: `translateY(${data.top}px)`
        //     }}
        // >
        //     <h1>{data.id}</h1>
        //     {data.top}
        // </div>
        <div ref={ref} key={image?.id} className={`${className} card`}
             style={{
                 // height: `${itemHeight}px`,
                 // background: 'aqua',
                 width: `${image?.masonryWidth}px`,
                 height: `${image?.masonryHeight}px`,
                 transform: `translate(${image?.offsetX}px, ${image?.offsetY}px)`
             }}
        >
            <div className={'card-info'}>
                <h1>{image?.id}</h1>
                {image?.offsetY}
            </div>


            <img className={'card-img'} src={image?.src}/>
        </div>
    )
};

export default Card;