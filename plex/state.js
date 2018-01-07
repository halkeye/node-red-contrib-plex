module.exports = function (RED) {
    var PlexAPI = require("plex-api");

    var STATE_lastMsg = {};

    function setData(raw) {
        var data = 0;
        if (typeof(raw.MediaContainer) === 'undefined') return {payload: 'stopped'};
        if (raw.MediaContainer.size < 1) return {payload: 'stopped'};

        var videoData = raw.MediaContainer.Video;
        for (var i = 0; i < raw.MediaContainer.size; i++) {
            if (typeof(videoData[i]) == 'undefined') continue;
            switch (videoData[i].Player.state) {
                case 'playing':
                    data = Math.max(data, 2);
                    break;
                case 'paused':
                    data = Math.max(data, 1);
                    break;
                default:
                    break;
            }
        }
        if (data === 1)
            return {payload: 'paused'};
        else if (data === 2)
            return {payload: 'playing'};
        else
            return {payload: 'stopped'};
    }

    function CurrentState(config) {
        RED.nodes.createNode(this, config);

        // Retrieve the config node
        this.server = RED.nodes.getNode(config.server);

        if (!this.server) {
            // No config node configured
            this.status({fill: "yellow", shape: "dot", text: "configuration error"});
            return this;
        }

        var client = new PlexAPI({
            hostname: this.server.host,
            port: this.server.port,
            username: this.server.username,
            password: this.server.password,
            https: this.server.https,
            timeout: Math.max(config.pollspeed, 300),
            options: {
                product: 'Node Red module by LJPc',
                deviceName: 'Node Red'
            }
        });

        if (!client) {
            this.status({fill: "yellow", shape: "dot", text: "an error occurred"});
            return this;
        }

        setInterval(function (node) {
            client.query("/status/sessions").then(function (result) {
                node.status({fill: "green", shape: "dot", text: "connected"});

                var msg = setData(result);

                if (STATE_lastMsg[node.id] != JSON.stringify(msg)) {
                    STATE_lastMsg[node.id] = JSON.stringify(msg);
                    node.send(msg);
                }
            }, function (err) {
                node.status({fill: "red", shape: "dot", text: "disconnected"});
            });
        }, Math.max(config.pollspeed, 300), this);
    }

    RED.nodes.registerType("Current state", CurrentState);
}

