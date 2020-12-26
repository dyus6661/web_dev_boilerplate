module.exports = {
    plugins: [
        require('cssnano')({
            preset: [
                'advanced',
                {
                    normalizeWhitespace: false,
                    autoprefixer: {
                        add: true,
                    },
                    discardComments: {
                        removeAll: true,
                    },
                }
            ]
        }),
    ]
};