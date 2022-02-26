import React, {useEffect, useRef} from 'react';

interface IProps {
    data: {
        content: number;
        id: number;
        top: number;
    };
    itemHeight: number;
    className: string;
}
const Card: React.FC<IProps> = ({ data , itemHeight, className}) => {
    const ref = useRef<HTMLDivElement | null>(null);

    return (
        <div ref={ref} id={data.id.toString()} key={data.id} className={`${className} card`}
            style={{
                height: `${itemHeight}px`,
                background: 'aqua',
                transform: `translateY(${data.top}px)`
            }}
        >
            <h1>{data.id}</h1>
            {data.top}
        </div>
    )
};

export default Card;