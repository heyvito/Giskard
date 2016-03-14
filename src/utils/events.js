var i = 0,
    events = {},
    makeEvent = function(name) {
        events[name] = `GISK_EVENT_${name.toString().toUpperCase()}_${i++}`;
    };

makeEvent('adapterReady');

module.exports = events;
