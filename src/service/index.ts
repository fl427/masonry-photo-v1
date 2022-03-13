import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    Canceler,
    ResponseType
} from 'axios';

const TIME_OUT = 100000;
const BASE_URL = 'http://localhost:3000';

const createInstance = (): AxiosInstance => {
    const instance = axios.create({
        baseURL: BASE_URL,
        withCredentials: true,
        timeout: TIME_OUT,
        responseType: 'json'
    });

    /**
     * http request 拦截器
     */
    instance.interceptors.request.use(
        (config) => {
            config.data = JSON.stringify(config.data);
            config.headers = {
                "Content-Type": "application/json",
            };
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    )

    /**
     * http response 拦截器
     */
    instance.interceptors.response.use(
        (response) => {
            if (response.data.err_no) {
                throw new Error('请求出错');
            }
            return response;
        },
        (error) => {
            if (!error.response) return;
            switch (error.response.status) {
                case 401:
                    console.log('401，未登录');
                    break;
                case 403:
                    console.log('403，登录已过期');
                    break;
                case 404:
                    console.log('404，请求不存在');
                    break;
                default:
                    break;
            }
            return Promise.reject(error);
        }
    )

    return instance;
}

interface Instance extends AxiosInstance {
    (config: AxiosRequestConfig): Promise<unknown>;
}

const instance: Instance = createInstance();
export default instance;


