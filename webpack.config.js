const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    entry: './src/drunkie-monkey/DrunkieMonkey.ts',

    mode: "development",
    target: "web",

    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: './game.bundle.js',
        libraryTarget: "umd",
        library: "gammastack",
        clean: true
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        extensions: [".ts", ".tsx", ".js", ".json"],
        fallback: {
            "stream": require.resolve("stream-browserify")
        }
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            }
        ]
    },

    optimization: {
        minimize: false,
        minimizer: [
            new TerserPlugin({
                extractComments: true,
                terserOptions: {
                    format: {
                        comments: false,
                    },
                },
            }),
        ],
    },

    // externals: [
    //     {"engineTween.js": "TWEEN"},
    // ],

    plugins: [
        new webpack.WatchIgnorePlugin({ paths: [/\.*\.js/, /\.*\.js.map/]}),
        new webpack.DefinePlugin({
            VERSION: JSON.stringify(require("./package.json").version)
        })
    ],

    stats: "minimal",
    performance: {
        hints: false
    },
};
