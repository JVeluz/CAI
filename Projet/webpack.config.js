const path = require('path');
module.exports = {
    devtool: 'source-map',
    entry: './ts/index.ts',
    mode: 'development',
    module: {
        rules: [
            {
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ],
    },
    optimization: {
        minimize: true
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'js'),
    },
    resolve: {
        extensions: [".ts", ".js"]
    }
};