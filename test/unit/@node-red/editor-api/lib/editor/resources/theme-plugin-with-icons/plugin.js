module.exports = function (RED) {
    RED.plugins.registerPlugin('test-theme-icons', {
        type: 'node-red-theme',
        palette: {
            theme: [
                { type: 'inject', color: '#e4d725' },
                { type: 'inject', icon: 'banana.png' },
                { type: 'sub-.*', icon: 'sub/cherry.svg' },
                { type: 'missing', icon: 'does-not-exist.png' },
                { category: '.*', color: 'red' }
            ]
        }
    })
}
