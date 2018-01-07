module.exports = function (RED) {
    var PlexAPI = require("plex-api");

    var CP_lastMsg = {};

    function extractData(raw) {
        var data = [];
        if (typeof(raw.MediaContainer) === 'undefined') return {payload: data};
        if (raw.MediaContainer.size < 1) return {payload: data};

        var videoData = raw.MediaContainer.Video;
        for (var i = 0; i < raw.MediaContainer.size; i++) {
            if (typeof(videoData[i]) == 'undefined') continue;

            data.push({
                artWork: 'http://' + this.server.host + ':' + this.server.port + videoData[i].art,
                thumbNail: 'http://' + this.server.host + ':' + this.server.port + videoData[i].thumb,
                show: {
                    title: videoData[i].grandparentTitle,
                    director: videoData[i].Director,
                    writer: videoData[i].Writer
                },
                episode: {
                    title: videoData[i].title,
                    released_at: videoData[i].originallyAvailableAt,
                    summary: videoData[i].summary
                },
                state: videoData[i].Player.state
            });
        }
        return {payload: data}
    }

    function CurrentlyPlaying(config) {
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

                var msg = extractData(result);

                if (CP_lastMsg[node.id] != JSON.stringify(msg)) {
                    CP_lastMsg[node.id] = JSON.stringify(msg);
                    node.send(msg);
                }
            }, function (err) {
                node.status({fill: "red", shape: "dot", text: "disconnected"});
            });
        }, Math.max(config.pollspeed, 300), this);
    }

    RED.nodes.registerType("Currently playing", CurrentlyPlaying);
}

