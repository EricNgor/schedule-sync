let app = {};

let init = app => {
    app.data = {
        status: false,
        // 0: Left click; 2: Right Click
        mousedown: -1,
        extended: false,
        timeslots: [],
        cells: [],
    };

    // If click was started in empty cell, 
    // dragging mouse to other empty cells selects them
    // Else if click was started in selected cell, 
    // dragging mouse to other selected cells deselects them
    app.schedule_add = function(arg) {
        // Replaceable test functionality
        console.log('arg, mousedown:', arg, app.vue.mousedown)
        if (arg + app.vue.mousedown >= 0) {
        this.status = !this.status;
        }
    };

    app.schedule_delete = function() {

    }

    app.toggle_extended = function() {
        app.vue.timeslots = app.vue.extended ? 
                            [...Array(24).keys()] : 
                            ([...Array(14).keys()].map(i=>i+8));
    }

    app.methods = {
        schedule_add: app.schedule_add,
        schedule_delete: app.schedule_delete,
        toggle_extended: app.toggle_extended,
    };

    app.vue = new Vue({
        el: "#schedule",
        data: app.data,
        methods: app.methods
    });

    app.init = () => {
        addEventListener("selectstart", e => {
            const el = e.path[1].localName;
            if (el=='th' || el=='td' || el=="tr") {
                e.preventDefault();
            }
        });
        addEventListener("mousedown", e => {
            app.vue.mousedown = e.button;

            console.log('check state:', app.vue.extended);

        });

        addEventListener("mouseup", e => {
            app.vue.mousedown = -1;
        });

        // range(8, 21)
        app.vue.timeslots = ([...Array(14).keys()].map(i=>i+8));
    };

    app.init();
}

init(app);