module.exports = function (RED) {
    function PlexServerNode(n) {
        RED.nodes.createNode(this, n);
        this.host = n.host;
        this.port = n.port;
        this.username = n.username;
        this.password = n.password;
    }

    RED.nodes.registerType("Plex server", PlexServerNode);
}