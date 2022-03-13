const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
    // 让Webpack知道以哪个模块为入口，进行依赖收集
    entry: './src/index.tsx',
    // 告诉Webpack打包好的文件放在哪里，以及如何命名
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].[contenthash:8].js'
    },
    resolve: {
        extensions: [".js", ".json", ".jsx", ".ts", ".tsx"]
    },
    optimization: {
        runtimeChunk: true,
        splitChunks: {
            chunks: "all"
        }
    },
    module: {
        // 使用babel编译es678和jsx语法
        // 这里没有配置preset，在.babelrc文件中配置
        // rules: [
        //     {
        //         test: /\.(js|jsx)$/,
        //         exclude: /node_modules/,
        //         use: {
        //             loader: 'babel-loader'
        //         }
        //     }
        // ],
        rules: [
            {
                test: /\.(js|jsx|ts|tsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                }
            },
            {
                test: /\.(css)$/,
                use: [
                    'style-loader',
                    'css-loader',
                ]
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    // 将 JS 字符串生成为 style 节点
                    'style-loader',
                    // 将 CSS 转化成 CommonJS 模块
                    'css-loader',
                    // 将 Sass 编译成 CSS
                    'sass-loader',
                ],
            },
            {
                test: /\.(less)$/,
                use: [
                    'style-loader',
                    'css-loader',
                    {
                        loader: 'less-loader',
                        options: {
                            lessOptions: {
                                modifyVars: {
                                    'parmary-color': '#006AFF',
                                    'border-radius-base': '4px',
                                    'btn-border-radius': '4px',
                                    'btn-font-weight': '500',
                                }
                            }
                        }
                    }
                ]
            },
            {
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        limit: 50000,
                        name: 'img/[name].[ext]'
                    }
                }]
            },
            {
                test: /\.woff|woff2|eot|ttf|otf$/,
                use: [{
                    loader: "url-loader",
                    options: {
                        name: '[name].[hash:6].[ext]',
                        limit: 50000,
                        esModule: false
                    }
                }]
            }
        ]
    },
    plugins: [
        // 这里我们指定自己的html文件模板，也可以指定生成的html文件名
        // 如果不传参数，会有一个默认的模板文件
        new HtmlWebpackPlugin({
            template: "./public/index.html"
        })
    ],
    devServer: {
        host: 'localhost',
        hot: true,
        port: 3000,
        historyApiFallback: true,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        proxy: {
            '/api': {
                target: "http://localhost:4000",
                changeOrigin: true,
            }
        }
    }
}